import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { z } from 'zod';
import { createHash, randomBytes, scryptSync, timingSafeEqual, randomUUID } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db, transaction } from './db.js';

type User = {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  phone?: string | null;
  company?: string | null;
  suspended: number;
};

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const app = express();
const production = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT || 3001);
const here = path.dirname(fileURLToPath(import.meta.url));
const cookieName = 'vttd_session';
const DAY = 86400000;

app.disable('x-powered-by');
app.use(
  helmet({
    contentSecurityPolicy: production ? undefined : false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);
app.use(express.json({ limit: '5mb', type: 'application/json' }));

// Mutating browser requests must be JSON and same-site.
app.use('/api', (req, res, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  if (!req.is('application/json')) {
    return res.status(415).json({
      success: false,
      error: { code: 'JSON_REQUIRED', message: 'Yêu cầu cần được gửi ở định dạng JSON.' }
    });
  }
  const origin = req.get('origin');
  const allowed = new Set([
    `${req.protocol}://${req.get('host')}`,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
  ]);
  if (origin && !allowed.has(origin)) {
    return res.status(403).json({
      success: false,
      error: { code: 'ORIGIN_REJECTED', message: 'Nguồn yêu cầu không hợp lệ.' }
    });
  }
  next();
});

const attempts = new Map<string, { count: number; reset: number }>();
function rateLimit(max: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const entry = attempts.get(key);
    if (!entry || entry.reset < now) {
      attempts.set(key, { count: 1, reset: now + windowMs });
    } else if (++entry.count > max) {
      return res.status(429).json({
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.' }
      });
    }
    next();
  };
}
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of attempts) {
    if (value.reset < now) attempts.delete(key);
  }
}, 60000).unref();

const sha = (s: string) => createHash('sha256').update(s).digest('hex');

function issueSession(res: Response, userId: string) {
  const token = randomBytes(32).toString('base64url');
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(
    sha(token),
    userId,
    new Date(Date.now() + 14 * DAY).toISOString()
  );
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: production,
    sameSite: 'lax',
    path: '/',
    maxAge: 14 * DAY
  });
}

function auth(req: Request, res: Response, next: NextFunction) {
  const token = (req as any).cookies?.[cookieName] as string | undefined;
  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_REQUIRED', message: 'Vui lòng đăng nhập để tiếp tục.' }
    });
  }
  const session = db
    .prepare(
      `SELECT u.id, u.email, u.name, u.role, u.phone, u.company, u.suspended 
       FROM sessions s 
       JOIN users u ON u.id = s.user_id 
       WHERE s.token_hash = ? AND s.expires_at > ?`
    )
    .get(sha(token), new Date().toISOString()) as User | undefined;

  if (!session || session.suspended) {
    res.clearCookie(cookieName, { path: '/' });
    return res.status(401).json({
      success: false,
      error: {
        code: 'SESSION_INVALID',
        message: 'Phiên đăng nhập đã hết hạn hoặc tài khoản đang bị tạm khóa.'
      }
    });
  }
  req.user = session;
  next();
}

function admin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này.' }
    });
  }
  next();
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split(':');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

const cookieParser = (req: Request, _res: Response, next: NextFunction) => {
  const raw = req.headers.cookie || '';
  const item = raw
    .split(';')
    .map(x => x.trim())
    .find(x => x.startsWith(`${cookieName}=`));
  (req as any).cookies = {
    ...(req as any).cookies,
    [cookieName]: item ? decodeURIComponent(item.slice(cookieName.length + 1)) : undefined
  };
  next();
};
app.use(cookieParser);

const serviceView = `
  SELECT s.*, 
    COALESCE((SELECT MIN(p.price) FROM packages p WHERE p.service_id = s.id), s.starting_price) AS starting_price,
    (SELECT COUNT(*) FROM reviews r WHERE r.service_id = s.id AND r.approved = 1) AS review_count,
    COALESCE((SELECT AVG(r.rating) FROM reviews r WHERE r.service_id = s.id AND r.approved = 1), 5.0) AS rating
  FROM services s
`;

const jsonService = (row: any) => ({
  ...row,
  stack: JSON.parse(row.stack_json || '[]'),
  includes: JSON.parse(row.includes_json || '[]'),
  excludes: JSON.parse(row.excludes_json || '[]'),
  faqs: JSON.parse(row.faqs_json || '[]'),
  stack_json: undefined,
  includes_json: undefined,
  excludes_json: undefined,
  faqs_json: undefined,
  starting_price: Number(row.starting_price),
  rating: Number(Number(row.rating || 5).toFixed(1))
});

function audit(actor: string | undefined, action: string, targetType: string, targetId?: string, ip?: string) {
  try {
    db.prepare('INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, ip_address) VALUES (?, ?, ?, ?, ?, ?)')
      .run(randomUUID(), actor || null, action, targetType, targetId || null, ip || null);
  } catch (e) {
    console.error('Audit log error:', e);
  }
}

const pass = (res: Response, data: any, message = '') => res.json({ success: true, data, message });
const fail = (res: Response, status: number, code: string, message: string) =>
  res.status(status).json({ success: false, error: { code, message } });

// ==========================================
// PUBLIC & SETTINGS APIS
// ==========================================

app.get('/api/health', (_req, res) => pass(res, { status: 'ok', brand: 'VanTanTheDEV', time: new Date().toISOString() }));

app.get('/api/settings', (_req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all() as any[];
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  pass(res, map);
});

app.get('/api/services', (req, res) => {
  const rows = db.prepare(`${serviceView} WHERE s.published = 1 ORDER BY s.featured DESC, s.starting_price ASC`).all() as any[];
  const q = String(req.query.q || '').trim().toLowerCase();
  const category = String(req.query.category || '');
  const data = rows
    .map(jsonService)
    .filter(x => {
      const matchQ = !q || `${x.title} ${x.summary} ${x.category} ${x.stack.join(' ')}`.toLowerCase().includes(q);
      const matchCat = !category || category === 'Tất cả' || x.category === category;
      return matchQ && matchCat;
    });
  pass(res, data);
});

app.get('/api/services/:slug', (req, res) => {
  const row = db.prepare(`${serviceView} WHERE s.slug = ? AND s.published = 1`).get(String(req.params.slug)) as any;
  if (!row) return fail(res, 404, 'NOT_FOUND', 'Không tìm thấy dịch vụ này.');
  const packages = db.prepare('SELECT id, name, tier, price, delivery_days, revisions, features_json, popular FROM packages WHERE service_id = ? ORDER BY price').all(row.id) as any[];
  const reviews = db.prepare(`
    SELECT r.id, r.rating, r.body, r.created_at, u.name as customer_name, u.company 
    FROM reviews r 
    JOIN users u ON u.id = r.user_id 
    WHERE r.service_id = ? AND r.approved = 1 
    ORDER BY r.created_at DESC LIMIT 6
  `).all(row.id) as any[];

  const related = db.prepare(`${serviceView} WHERE s.published = 1 AND s.id != ? ORDER BY RANDOM() LIMIT 3`).all(row.id) as any[];

  pass(res, {
    ...jsonService(row),
    packages: packages.map(p => ({ ...p, features: JSON.parse(p.features_json) })),
    addons: db.prepare('SELECT id, title, description, price, delivery_days FROM addons WHERE active = 1 ORDER BY price').all(),
    reviews,
    related: related.map(jsonService)
  });
});

app.get('/api/reviews', (_req, res) => {
  pass(
    res,
    db.prepare(`
      SELECT r.id, r.rating, r.body, r.created_at, u.name AS name, u.company, s.title AS service_title, s.slug AS service_slug
      FROM reviews r 
      JOIN users u ON u.id = r.user_id 
      JOIN services s ON s.id = r.service_id 
      WHERE r.approved = 1 
      ORDER BY r.created_at DESC LIMIT 12
    `).all()
  );
});

app.post('/api/contact', rateLimit(5, 15 * 60_000), (req, res) => {
  const p = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().email().max(254),
    phone: z.string().max(40).optional(),
    projectType: z.string().trim().min(2).max(100),
    budget: z.string().max(80).optional(),
    message: z.string().trim().min(20).max(5000),
    consent: z.literal(true)
  }).safeParse(req.body);

  if (!p.success) return fail(res, 400, 'VALIDATION_ERROR', 'Vui lòng điền đủ thông tin và xác nhận đồng ý để gửi yêu cầu.');
  const id = randomUUID();
  db.prepare('INSERT INTO inquiries (id, name, email, phone, project_type, budget, message, consent) VALUES (?, ?, ?, ?, ?, ?, ?, 1)')
    .run(id, p.data.name, p.data.email.toLowerCase(), p.data.phone || null, p.data.projectType, p.data.budget || null, p.data.message);
  
  audit(undefined, 'inquiry.create', 'inquiry', id, req.ip);
  return res.status(201).json({
    success: true,
    data: { id },
    message: 'Đã nhận yêu cầu dự án. Nguyễn Văn Tấn sẽ phản hồi trực tiếp qua email của bạn.'
  });
});

app.post('/api/coupons/verify', (req, res) => {
  const p = z.object({
    code: z.string().trim().min(1).max(30),
    subtotal: z.number().int().min(0)
  }).safeParse(req.body);

  if (!p.success) return fail(res, 400, 'VALIDATION_ERROR', 'Mã giảm giá không hợp lệ.');
  const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? COLLATE NOCASE AND active = 1').get(p.data.code) as any;
  if (!coupon) return fail(res, 404, 'COUPON_NOT_FOUND', 'Mã giảm giá không tồn tại hoặc đã hết hiệu lực.');
  if (coupon.times_used >= coupon.usage_limit) return fail(res, 400, 'COUPON_EXHAUSTED', 'Mã giảm giá này đã hết lượt sử dụng.');
  if (p.data.subtotal < coupon.min_order_amount) {
    return fail(res, 400, 'MIN_AMOUNT_NOT_MET', `Mã này chỉ áp dụng cho đơn từ ${new Intl.NumberFormat('vi-VN').format(coupon.min_order_amount)}đ trở lên.`);
  }

  let discount = 0;
  if (coupon.discount_type === 'percentage') {
    discount = Math.round((p.data.subtotal * coupon.discount_value) / 100);
    if (coupon.max_discount > 0 && discount > coupon.max_discount) {
      discount = coupon.max_discount;
    }
  } else {
    discount = Math.min(coupon.discount_value, p.data.subtotal);
  }

  pass(res, {
    code: coupon.code,
    discountAmount: discount,
    discountType: coupon.discount_type,
    discountValue: coupon.discount_value
  }, 'Áp dụng mã giảm giá thành công!');
});

// ==========================================
// AUTHENTICATION APIS
// ==========================================

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  phone: z.string().max(30).optional(),
  company: z.string().max(120).optional(),
  terms: z.literal(true)
});

app.post('/api/auth/register', rateLimit(10, 15 * 60_000), (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Vui lòng kiểm tra họ tên, email, mật khẩu (tối thiểu 8 ký tự) và xác nhận đồng ý điều khoản.');
  }
  const { name, email, password, phone, company } = parsed.data;
  const existing = db.prepare('SELECT 1 FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (existing) return fail(res, 409, 'EMAIL_EXISTS', 'Email này đã được đăng ký tài khoản.');

  const id = randomUUID();
  db.prepare('INSERT INTO users (id, email, name, password_hash, role, phone, company) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, email.trim().toLowerCase(), name, hashPassword(password), 'customer', phone || null, company || null);

  issueSession(res, id);
  audit(id, 'register', 'user', id, req.ip);
  return res.status(201).json({
    success: true,
    data: { id, email: email.toLowerCase(), name, role: 'customer', phone: phone || null, company: company || null },
    message: 'Tài khoản đã được tạo thành công.'
  });
});

app.post('/api/auth/login', rateLimit(15, 15 * 60_000), (req, res) => {
  const parsed = z.object({
    email: z.string().email(),
    password: z.string().min(1).max(128)
  }).safeParse(req.body);

  if (!parsed.success) return fail(res, 400, 'VALIDATION_ERROR', 'Email hoặc mật khẩu chưa hợp lệ.');
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(parsed.data.email.trim().toLowerCase()) as any;
  if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
    return fail(res, 401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không chính xác.');
  }
  if (user.suspended) return fail(res, 403, 'ACCOUNT_SUSPENDED', 'Tài khoản của bạn hiện đang tạm khóa.');

  issueSession(res, user.id);
  audit(user.id, 'login', 'user', user.id, req.ip);
  return pass(
    res,
    { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone, company: user.company },
    'Đăng nhập thành công.'
  );
});

app.post('/api/auth/logout', auth, (req, res) => {
  const token = (req as any).cookies[cookieName];
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha(token));
  res.clearCookie(cookieName, { httpOnly: true, secure: production, sameSite: 'lax', path: '/' });
  return pass(res, null, 'Đã đăng xuất an toàn.');
});

app.get('/api/auth/me', (req, res, next) => auth(req, res, next), (req, res) => pass(res, req.user));

app.post('/api/auth/forgot-password', rateLimit(5, 15 * 60_000), (req, res) => {
  const p = z.object({ email: z.string().email() }).safeParse(req.body);
  if (!p.success) return fail(res, 400, 'VALIDATION_ERROR', 'Email không hợp lệ.');
  const user = db.prepare('SELECT id, email, name FROM users WHERE email = ?').get(p.data.email.toLowerCase()) as any;
  if (!user) {
    // Return standard success to prevent user enumeration
    return pass(res, { sent: true }, 'Nếu email này đã đăng ký, mã đặt lại mật khẩu đã được xử lý.');
  }
  const token = randomBytes(24).toString('base64url');
  db.prepare('INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .run(sha(token), user.id, new Date(Date.now() + 60 * 60_000).toISOString());
  
  audit(user.id, 'forgot_password', 'user', user.id, req.ip);
  return pass(res, { sent: true, demoToken: token }, 'Mã đặt lại mật khẩu đã được tạo (Hết hạn trong 60 phút).');
});

app.post('/api/auth/reset-password', rateLimit(5, 15 * 60_000), (req, res) => {
  const p = z.object({
    token: z.string().min(10),
    password: z.string().min(8).max(128)
  }).safeParse(req.body);

  if (!p.success) return fail(res, 400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ.');
  const reset = db.prepare('SELECT user_id, expires_at FROM password_resets WHERE token_hash = ? AND expires_at > ?')
    .get(sha(p.data.token), new Date().toISOString()) as any;
  if (!reset) return fail(res, 400, 'INVALID_TOKEN', 'Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(p.data.password), reset.user_id);
  db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(reset.user_id);
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(reset.user_id);

  audit(reset.user_id, 'reset_password', 'user', reset.user_id, req.ip);
  pass(res, null, 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.');
});

// ==========================================
// CUSTOMER PROFILE & ORDERS APIS
// ==========================================

app.get('/api/me/profile', auth, (req, res) => pass(res, req.user));

app.patch('/api/me/profile', auth, (req, res) => {
  const p = z.object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().max(30).optional(),
    company: z.string().max(120).optional()
  }).safeParse(req.body);

  if (!p.success) return fail(res, 400, 'VALIDATION_ERROR', 'Tên cần có ít nhất 2 ký tự.');
  db.prepare('UPDATE users SET name = ?, phone = ?, company = ? WHERE id = ?')
    .run(p.data.name, p.data.phone || null, p.data.company || null, req.user!.id);
  
  audit(req.user!.id, 'profile.update', 'user', req.user!.id, req.ip);
  return pass(res, { ...req.user, ...p.data }, 'Hồ sơ đã được cập nhật.');
});

app.post('/api/me/change-password', auth, (req, res) => {
  const p = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128)
  }).safeParse(req.body);

  if (!p.success) return fail(res, 400, 'VALIDATION_ERROR', 'Mật khẩu mới cần tối thiểu 8 ký tự.');
  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user!.id) as any;
  if (!verifyPassword(p.data.currentPassword, user.password_hash)) {
    return fail(res, 400, 'CURRENT_PASSWORD_WRONG', 'Mật khẩu hiện tại không chính xác.');
  }

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(p.data.newPassword), req.user!.id);
  audit(req.user!.id, 'password.change', 'user', req.user!.id, req.ip);
  pass(res, null, 'Đổi mật khẩu thành công.');
});

app.get('/api/me/orders', auth, (req, res) => {
  const rows = db.prepare(`
    SELECT o.*, 
      s.title AS service_title, s.slug AS service_slug, s.category AS service_category,
      p.name AS package_name, p.tier AS package_tier
    FROM orders o 
    JOIN services s ON s.id = o.service_id 
    JOIN packages p ON p.id = o.package_id 
    WHERE o.user_id = ? 
    ORDER BY o.created_at DESC
  `).all(req.user!.id) as any[];

  pass(res, rows.map(o => ({
    ...o,
    requirements: JSON.parse(o.requirements_json || '{}'),
    addons: JSON.parse(o.addons_json || '[]')
  })));
});

app.get('/api/me/orders/:id', auth, (req, res) => {
  const order = db.prepare(`
    SELECT o.*, 
      s.title AS service_title, s.slug AS service_slug, s.category AS service_category,
      p.name AS package_name, p.tier AS package_tier, p.delivery_days AS package_days, p.revisions AS package_revisions,
      u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone, u.company AS customer_company
    FROM orders o 
    JOIN services s ON s.id = o.service_id 
    JOIN packages p ON p.id = o.package_id 
    JOIN users u ON u.id = o.user_id
    WHERE o.id = ?
  `).get(String(req.params.id)) as any;

  if (!order) return fail(res, 404, 'NOT_FOUND', 'Không tìm thấy đơn hàng này.');
  if (order.user_id !== req.user!.id && req.user!.role !== 'admin') {
    return fail(res, 403, 'FORBIDDEN', 'Bạn không có quyền truy cập đơn hàng này.');
  }

  const files = db.prepare('SELECT * FROM order_files WHERE order_id = ? ORDER BY created_at DESC').all(order.id);
  const review = db.prepare('SELECT * FROM reviews WHERE order_id = ?').get(order.id);

  pass(res, {
    ...order,
    requirements: JSON.parse(order.requirements_json || '{}'),
    addons: JSON.parse(order.addons_json || '[]'),
    files,
    review
  });
});

app.post('/api/orders', auth, rateLimit(8, 60_000), (req, res) => {
  const schema = z.object({
    serviceId: z.string().min(1),
    packageId: z.string().min(1),
    projectName: z.string().trim().min(2).max(150),
    description: z.string().trim().min(20).max(10000),
    targetAudience: z.string().max(500).optional(),
    features: z.string().max(3000).optional(),
    technology: z.string().max(500).optional(),
    references: z.string().max(1000).optional(),
    deadline: z.string().max(80).optional(),
    budget: z.string().max(80).optional(),
    addons: z.array(z.string()).max(12).default([]),
    couponCode: z.string().optional(),
    paymentMethod: z.enum(['vietqr', 'bank_transfer', 'vnpay', 'momo', 'stripe']).default('vietqr')
  });

  const p = schema.safeParse(req.body);
  if (!p.success) {
    return fail(res, 400, 'VALIDATION_ERROR', 'Vui lòng kiểm tra tên dự án và mô tả (tối thiểu 20 ký tự).');
  }

  const service = db.prepare('SELECT * FROM services WHERE id = ? AND published = 1').get(p.data.serviceId) as any;
  const pack = db.prepare('SELECT * FROM packages WHERE id = ? AND service_id = ?').get(p.data.packageId, p.data.serviceId) as any;
  if (!service || !pack) return fail(res, 404, 'PACKAGE_NOT_FOUND', 'Gói dịch vụ không còn khả dụng.');

  const addonRows = p.data.addons.length
    ? (db.prepare(`SELECT id, title, price, delivery_days FROM addons WHERE active = 1 AND id IN (${p.data.addons.map(() => '?').join(',')})`).all(...p.data.addons) as any[])
    : [];

  const subtotal = pack.price + addonRows.reduce((sum, a) => sum + a.price, 0);
  const deliveryDays = pack.delivery_days + addonRows.reduce((sum, a) => sum + a.delivery_days, 0);

  let discountAmount = 0;
  let appliedCoupon: any = null;
  if (p.data.couponCode) {
    const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? COLLATE NOCASE AND active = 1').get(p.data.couponCode.trim()) as any;
    if (coupon && coupon.times_used < coupon.usage_limit && subtotal >= coupon.min_order_amount) {
      if (coupon.discount_type === 'percentage') {
        discountAmount = Math.round((subtotal * coupon.discount_value) / 100);
        if (coupon.max_discount > 0 && discountAmount > coupon.max_discount) discountAmount = coupon.max_discount;
      } else {
        discountAmount = Math.min(coupon.discount_value, subtotal);
      }
      appliedCoupon = coupon;
    }
  }

  const finalAmount = Math.max(0, subtotal - discountAmount);
  const id = randomUUID();
  const yr = new Date().getFullYear();
  const count = (db.prepare("SELECT COUNT(*) AS n FROM orders WHERE strftime('%Y', created_at) = ?").get(String(yr)) as any).n;
  const suffix = String(count + 1).padStart(5, '0');
  const number = `VT-${yr}-${suffix}`;

  const requirements = {
    targetAudience: p.data.targetAudience || '',
    features: p.data.features || '',
    technology: p.data.technology || '',
    references: p.data.references || '',
    deadline: p.data.deadline || '',
    budget: p.data.budget || '',
    deliveryDays
  };

  transaction(() => {
    db.prepare(`
      INSERT INTO orders (id, order_number, user_id, service_id, package_id, project_name, description, requirements_json, addons_json, subtotal, discount_amount, coupon_code, amount, payment_method, status, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid')
    `).run(
      id, number, req.user!.id, service.id, pack.id,
      p.data.projectName, p.data.description,
      JSON.stringify(requirements), JSON.stringify(addonRows),
      subtotal, discountAmount, appliedCoupon?.code || null, finalAmount,
      p.data.paymentMethod
    );

    if (appliedCoupon) {
      db.prepare('UPDATE coupons SET times_used = times_used + 1 WHERE id = ?').run(appliedCoupon.id);
    }

    db.prepare('INSERT INTO notifications (id, user_id, title, body, link) VALUES (?, ?, ?, ?, ?)')
      .run(randomUUID(), req.user!.id, 'Yêu cầu dự án đã được tiếp nhận', `Đơn hàng ${number} đã vào danh sách chờ xác nhận phạm vi.`, `/dashboard/orders/${id}`);

    db.prepare('INSERT INTO messages (id, order_id, sender_id, body, system) VALUES (?, ?, ?, ?, 1)')
      .run(randomUUID(), id, req.user!.id, `Yêu cầu dự án ${number} (${p.data.projectName}) đã được gửi thành công. Nguyễn Văn Tấn sẽ phân tích phạm vi và phản hồi trước khi bắt đầu.`);

    audit(req.user!.id, 'order.create', 'order', id, req.ip);
  });

  return res.status(201).json({
    success: true,
    data: { id, orderNumber: number, subtotal, discountAmount, amount: finalAmount, deliveryDays, status: 'pending', paymentStatus: 'unpaid' },
    message: 'Yêu cầu dự án đã được gửi thành công!'
  });
});

app.post('/api/me/orders/:id/payment-proof', auth, rateLimit(10, 60_000), (req, res) => {
  const p = z.object({
    reference: z.string().trim().min(3).max(100),
    notes: z.string().max(500).optional()
  }).safeParse(req.body);

  if (!p.success) return fail(res, 400, 'VALIDATION_ERROR', 'Vui lòng nhập mã giao dịch hoặc nội dung chuyển khoản hợp lệ.');
  const id = String(req.params.id);
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(id, req.user!.id) as any;
  if (!order) return fail(res, 404, 'NOT_FOUND', 'Không tìm thấy đơn hàng.');

  transaction(() => {
    db.prepare('UPDATE orders SET payment_status = ?, payment_reference = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('pending', p.data.reference, id);

    db.prepare('INSERT INTO messages (id, order_id, sender_id, body, system) VALUES (?, ?, ?, ?, 1)')
      .run(randomUUID(), id, req.user!.id, `Khách hàng đã gửi thông tin đối soát chuyển khoản: Mã giao dịch "${p.data.reference}". Đang chờ đối soát.`);

    db.prepare('INSERT INTO notifications (id, user_id, title, body, link) VALUES (?, ?, ?, ?, ?)')
      .run(randomUUID(), req.user!.id, 'Đã ghi nhận thông tin thanh toán', `Mã giao dịch ${p.data.reference} cho đơn ${order.order_number} đang được đối soát.`, `/dashboard/orders/${id}`);

    audit(req.user!.id, 'order.payment_proof', 'order', id, req.ip);
  });

  pass(res, { paymentStatus: 'pending', reference: p.data.reference }, 'Đã gửi thông tin chuyển khoản. Hệ thống sẽ đối soát và kích hoạt dự án.');
});

// ==========================================
// MESSAGING & FILE ATTACHMENTS
// ==========================================

app.get('/api/me/orders/:id/messages', auth, (req, res) => {
  const id = String(req.params.id);
  const order = db.prepare('SELECT user_id FROM orders WHERE id = ?').get(id) as any;
  if (!order) return fail(res, 404, 'NOT_FOUND', 'Không tìm thấy dự án.');
  if (order.user_id !== req.user!.id && req.user!.role !== 'admin') {
    return fail(res, 403, 'FORBIDDEN', 'Bạn không có quyền xem cuộc trò chuyện này.');
  }

  pass(
    res,
    db.prepare(`
      SELECT m.id, m.body, m.attachment_url, m.system, m.created_at, u.name AS sender_name, u.role AS sender_role 
      FROM messages m 
      JOIN users u ON u.id = m.sender_id 
      WHERE m.order_id = ? 
      ORDER BY m.created_at ASC
    `).all(id)
  );
});

app.post('/api/me/orders/:id/messages', auth, rateLimit(30, 60_000), (req, res) => {
  const orderId = String(req.params.id);
  const order = db.prepare('SELECT user_id, order_number FROM orders WHERE id = ?').get(orderId) as any;
  if (!order) return fail(res, 404, 'NOT_FOUND', 'Không tìm thấy dự án.');
  if (order.user_id !== req.user!.id && req.user!.role !== 'admin') {
    return fail(res, 403, 'FORBIDDEN', 'Bạn không có quyền gửi tin nhắn trong dự án này.');
  }

  const p = z.object({
    body: z.string().trim().min(1).max(5000),
    attachmentUrl: z.string().url().max(1000).optional().or(z.literal(''))
  }).safeParse(req.body);

  if (!p.success) return fail(res, 400, 'VALIDATION_ERROR', 'Tin nhắn cần có nội dung dưới 5.000 ký tự.');
  const id = randomUUID();
  const receiverId = order.user_id === req.user!.id ? 'user-admin-vt' : order.user_id;

  transaction(() => {
    db.prepare('INSERT INTO messages (id, order_id, sender_id, body, attachment_url) VALUES (?, ?, ?, ?, ?)')
      .run(id, orderId, req.user!.id, p.data.body, p.data.attachmentUrl || null);

    db.prepare('INSERT INTO notifications (id, user_id, title, body, link) VALUES (?, ?, ?, ?, ?)')
      .run(randomUUID(), receiverId, 'Tin nhắn mới trong dự án', `${req.user!.name}: ${p.data.body.slice(0, 60)}...`, `/dashboard/orders/${orderId}`);
  });

  pass(res, { id, body: p.data.body, attachmentUrl: p.data.attachmentUrl });
});

app.get('/api/me/orders/:id/files', auth, (req, res) => {
  const id = String(req.params.id);
  const order = db.prepare('SELECT user_id FROM orders WHERE id = ?').get(id) as any;
  if (!order) return fail(res, 404, 'NOT_FOUND', 'Không tìm thấy dự án.');
  if (order.user_id !== req.user!.id && req.user!.role !== 'admin') {
    return fail(res, 403, 'FORBIDDEN', 'Bạn không có quyền xem tệp của dự án này.');
  }

  pass(res, db.prepare('SELECT * FROM order_files WHERE order_id = ? ORDER BY created_at DESC').all(id));
});

app.post('/api/me/orders/:id/files', auth, rateLimit(15, 60_000), (req, res) => {
  const orderId = String(req.params.id);
  const order = db.prepare('SELECT user_id, order_number FROM orders WHERE id = ?').get(orderId) as any;
  if (!order) return fail(res, 404, 'NOT_FOUND', 'Không tìm thấy dự án.');
  if (order.user_id !== req.user!.id && req.user!.role !== 'admin') {
    return fail(res, 403, 'FORBIDDEN', 'Bạn không có quyền tải tệp lên dự án này.');
  }

  const p = z.object({
    fileName: z.string().trim().min(2).max(200),
    fileSize: z.number().int().min(0).max(100 * 1024 * 1024).default(0),
    fileType: z.string().max(50).default('document'),
    fileUrl: z.string().trim().min(5).max(2000),
    isDeliverable: z.boolean().default(false)
  }).safeParse(req.body);

  if (!p.success) return fail(res, 400, 'VALIDATION_ERROR', 'Thông tin tệp không hợp lệ.');
  const id = randomUUID();
  const isDev = req.user!.role === 'admin' ? (p.data.isDeliverable ? 1 : 0) : 0;

  transaction(() => {
    db.prepare(`
      INSERT INTO order_files (id, order_id, user_id, file_name, file_size, file_type, file_url, is_deliverable)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, orderId, req.user!.id, p.data.fileName, p.data.fileSize, p.data.fileType, p.data.fileUrl, isDev);

    const receiverId = order.user_id === req.user!.id ? 'user-admin-vt' : order.user_id;
    db.prepare('INSERT INTO notifications (id, user_id, title, body, link) VALUES (?, ?, ?, ?, ?)')
      .run(
        randomUUID(),
        receiverId,
        isDev ? 'Bàn giao sản phẩm mới' : 'Tệp tài liệu mới',
        `${req.user!.name} đã tải lên: ${p.data.fileName}`,
        `/dashboard/orders/${orderId}`
      );
  });

  pass(res, { id, fileName: p.data.fileName, fileUrl: p.data.fileUrl }, 'Đã thêm tệp vào dự án.');
});

// ==========================================
// REVIEWS, FAVORITES & NOTIFICATIONS
// ==========================================

app.post('/api/me/orders/:id/reviews', auth, (req, res) => {
  const p = z.object({
    rating: z.number().int().min(1).max(5),
    body: z.string().trim().min(10).max(2000)
  }).safeParse(req.body);

  if (!p.success) return fail(res, 400, 'VALIDATION_ERROR', 'Đánh giá cần có số sao từ 1 đến 5 và tối thiểu 10 ký tự.');
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(String(req.params.id), req.user!.id) as any;
  if (!order) return fail(res, 404, 'NOT_FOUND', 'Không tìm thấy đơn hàng.');
  if (order.status !== 'completed') return fail(res, 409, 'ORDER_NOT_COMPLETE', 'Bạn có thể đánh giá sau khi dự án hoàn tất bàn giao.');

  try {
    db.prepare('INSERT INTO reviews (id, order_id, user_id, service_id, rating, body, approved) VALUES (?, ?, ?, ?, ?, ?, 0)')
      .run(randomUUID(), order.id, req.user!.id, order.service_id, p.data.rating, p.data.body);
    audit(req.user!.id, 'review.submit', 'review', order.id, req.ip);
  } catch {
    return fail(res, 409, 'REVIEW_EXISTS', 'Đơn hàng này đã có đánh giá.');
  }
  return res.status(201).json({ success: true, data: null, message: 'Đánh giá đã gửi và đang chờ duyệt bởi quản trị viên.' });
});

app.get('/api/me/favorites', auth, (req, res) => {
  pass(
    res,
    db.prepare(`
      ${serviceView} 
      JOIN favorites f ON f.service_id = s.id 
      WHERE f.user_id = ? AND s.published = 1 
      ORDER BY f.created_at DESC
    `).all(req.user!.id).map(jsonService)
  );
});

app.post('/api/me/favorites/:serviceId', auth, (req, res) => {
  const serviceId = String(req.params.serviceId);
  if (!db.prepare('SELECT 1 FROM services WHERE id = ? AND published = 1').get(serviceId)) {
    return fail(res, 404, 'NOT_FOUND', 'Không tìm thấy dịch vụ.');
  }
  db.prepare('INSERT OR IGNORE INTO favorites (user_id, service_id) VALUES (?, ?)').run(req.user!.id, serviceId);
  pass(res, null, 'Đã lưu vào danh sách yêu thích.');
});

app.delete('/api/me/favorites/:serviceId', auth, (req, res) => {
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND service_id = ?').run(req.user!.id, String(req.params.serviceId));
  pass(res, null, 'Đã bỏ khỏi danh sách yêu thích.');
});

app.get('/api/me/notifications', auth, (req, res) => {
  pass(res, db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.user!.id));
});

app.patch('/api/me/notifications/:id/read', auth, (req, res) => {
  db.prepare('UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?').run(String(req.params.id), req.user!.id);
  pass(res, null);
});

app.post('/api/me/notifications/read-all', auth, (req, res) => {
  db.prepare('UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND read_at IS NULL').run(req.user!.id);
  pass(res, null, 'Đã đánh dấu tất cả thông báo là đã đọc.');
});

app.get('/api/me/invoices', auth, (req, res) => {
  const rows = db.prepare(`
    SELECT o.id, o.order_number, o.project_name, o.amount, o.subtotal, o.discount_amount, o.coupon_code,
      o.currency, o.payment_status, o.payment_method, o.payment_reference, o.created_at,
      s.title AS service_title, p.name AS package_name
    FROM orders o 
    JOIN services s ON s.id = o.service_id 
    JOIN packages p ON p.id = o.package_id 
    WHERE o.user_id = ? 
    ORDER BY o.created_at DESC
  `).all(req.user!.id);
  pass(res, rows);
});

// ==========================================
// ADMIN DASHBOARD & MANAGEMENT APIS
// ==========================================

app.get('/api/admin/summary', auth, admin, (_req, res) => {
  const scalar = (sql: string) => Number((db.prepare(sql).get() as any).n || 0);

  const metrics = {
    revenue: scalar("SELECT SUM(amount) AS n FROM orders WHERE payment_status = 'paid'"),
    orders: scalar('SELECT COUNT(*) AS n FROM orders'),
    customers: scalar("SELECT COUNT(*) AS n FROM users WHERE role = 'customer'"),
    activeProjects: scalar("SELECT COUNT(*) AS n FROM orders WHERE status IN ('confirmed', 'in_progress', 'waiting_customer', 'revision')"),
    pendingPayments: scalar("SELECT COUNT(*) AS n FROM orders WHERE payment_status IN ('unpaid', 'pending')"),
    completed: scalar("SELECT COUNT(*) AS n FROM orders WHERE status = 'completed'"),
    averageOrder: scalar('SELECT AVG(amount) AS n FROM orders'),
    pendingReviews: scalar('SELECT COUNT(*) AS n FROM reviews WHERE approved = 0'),
    newInquiries: scalar("SELECT COUNT(*) AS n FROM inquiries WHERE status = 'new'")
  };

  const statuses = db.prepare('SELECT status, COUNT(*) AS count FROM orders GROUP BY status').all();
  const popular = db.prepare(`
    SELECT s.title, COUNT(o.id) AS count, COALESCE(SUM(o.amount), 0) AS total_revenue
    FROM services s 
    LEFT JOIN orders o ON o.service_id = s.id 
    GROUP BY s.id 
    ORDER BY count DESC LIMIT 6
  `).all();

  const recentOrders = db.prepare(`
    SELECT o.id, o.order_number, o.project_name, o.amount, o.status, o.payment_status, o.created_at,
      u.name AS customer_name, s.title AS service_title
    FROM orders o 
    JOIN users u ON u.id = o.user_id 
    JOIN services s ON s.id = o.service_id 
    ORDER BY o.created_at DESC LIMIT 5
  `).all();

  pass(res, { metrics, statuses, popular, recentOrders });
});

app.get('/api/admin/orders', auth, admin, (req, res) => {
  const statusFilter = String(req.query.status || '');
  const q = String(req.query.q || '').trim().toLowerCase();

  let sql = `
    SELECT o.*, 
      u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone, u.company AS customer_company,
      s.title AS service_title, p.name AS package_name 
    FROM orders o 
    JOIN users u ON u.id = o.user_id 
    JOIN services s ON s.id = o.service_id 
    JOIN packages p ON p.id = o.package_id 
  `;
  const conditions: string[] = [];
  const params: any[] = [];

  if (statusFilter && statusFilter !== 'all') {
    conditions.push('o.status = ?');
    params.push(statusFilter);
  }
  if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`;
  sql += ' ORDER BY o.created_at DESC LIMIT 200';

  const rows = db.prepare(sql).all(...params) as any[];
  const filtered = rows.filter(o =>
    !q || `${o.order_number} ${o.project_name} ${o.customer_name} ${o.customer_email} ${o.service_title}`.toLowerCase().includes(q)
  );

  pass(res, filtered.map(o => ({
    ...o,
    requirements: JSON.parse(o.requirements_json || '{}'),
    addons: JSON.parse(o.addons_json || '[]')
  })));
});

app.patch('/api/admin/orders/:id', auth, admin, (req, res) => {
  const p = z.object({
    status: z.enum(['pending', 'confirmed', 'in_progress', 'waiting_customer', 'revision', 'completed', 'cancelled'])
  }).safeParse(req.body);

  if (!p.success) return fail(res, 400, 'VALIDATION_ERROR', 'Trạng thái đơn hàng không hợp lệ.');
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(String(req.params.id)) as any;
  if (!order) return fail(res, 404, 'NOT_FOUND', 'Không tìm thấy đơn hàng.');

  transaction(() => {
    db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(p.data.status, order.id);
    db.prepare('INSERT INTO notifications (id, user_id, title, body, link) VALUES (?, ?, ?, ?, ?)')
      .run(randomUUID(), order.user_id, 'Dự án có cập nhật trạng thái', `Đơn hàng ${order.order_number} đã chuyển sang trạng thái: ${p.data.status}.`, `/dashboard/orders/${order.id}`);

    db.prepare('INSERT INTO messages (id, order_id, sender_id, body, system) VALUES (?, ?, ?, ?, 1)')
      .run(randomUUID(), order.id, req.user!.id, `Trạng thái dự án đã được cập nhật thành: ${p.data.status}.`);

    audit(req.user!.id, 'order.status.update', 'order', order.id, req.ip);
  });

  return pass(res, { status: p.data.status }, 'Đã cập nhật trạng thái đơn hàng.');
});

app.post('/api/admin/orders/:id/confirm-payment', auth, admin, (req, res) => {
  const id = String(req.params.id);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
  if (!order) return fail(res, 404, 'NOT_FOUND', 'Không tìm thấy đơn hàng.');

  transaction(() => {
    db.prepare("UPDATE orders SET payment_status = 'paid', status = CASE WHEN status = 'pending' THEN 'in_progress' ELSE status END, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(id);

    db.prepare('INSERT INTO notifications (id, user_id, title, body, link) VALUES (?, ?, ?, ?, ?)')
      .run(randomUUID(), order.user_id, 'Thanh toán đã được xác nhận', `Thanh toán cho đơn ${order.order_number} đã được đối soát thành công. Dự án đã bắt đầu triển khai!`, `/dashboard/orders/${id}`);

    db.prepare('INSERT INTO messages (id, order_id, sender_id, body, system) VALUES (?, ?, ?, ?, 1)')
      .run(randomUUID(), id, req.user!.id, 'Thanh toán đã được xác nhận thành công bởi quản trị viên. Tiến độ dự án đã chính thức bắt đầu!');

    audit(req.user!.id, 'order.payment.confirm', 'order', id, req.ip);
  });

  pass(res, { paymentStatus: 'paid' }, 'Đã xác nhận thanh toán thành công.');
});

app.patch('/api/admin/orders/:id/payment', auth, admin, (req, res) => {
  const p = z.object({
    paymentStatus: z.enum(['unpaid', 'pending', 'paid', 'failed', 'refunded'])
  }).safeParse(req.body);

  if (!p.success) return fail(res, 400, 'VALIDATION_ERROR', 'Trạng thái thanh toán không hợp lệ.');
  const id = String(req.params.id);
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
  if (!order) return fail(res, 404, 'NOT_FOUND', 'Không tìm thấy đơn hàng.');

  db.prepare('UPDATE orders SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(p.data.paymentStatus, id);
  audit(req.user!.id, 'order.payment.update', 'order', id, req.ip);
  pass(res, { paymentStatus: p.data.paymentStatus }, 'Đã cập nhật trạng thái thanh toán.');
});

app.get('/api/admin/customers', auth, admin, (_req, res) => {
  const customers = db.prepare(`
    SELECT u.id, u.email, u.name, u.phone, u.company, u.suspended, u.created_at,
      COUNT(o.id) AS total_orders,
      COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.amount ELSE 0 END), 0) AS total_spent
    FROM users u 
    LEFT JOIN orders o ON o.user_id = u.id 
    WHERE u.role = 'customer' 
    GROUP BY u.id 
    ORDER BY u.created_at DESC
  `).all();
  pass(res, customers);
});

app.patch('/api/admin/customers/:id/suspend', auth, admin, (req, res) => {
  const customerId = String(req.params.id);
  const user = db.prepare('SELECT id, suspended FROM users WHERE id = ? AND role = "customer"').get(customerId) as any;
  if (!user) return fail(res, 404, 'NOT_FOUND', 'Không tìm thấy khách hàng.');

  const nextState = user.suspended ? 0 : 1;
  db.prepare('UPDATE users SET suspended = ? WHERE id = ?').run(nextState, customerId);
  if (nextState === 1) {
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(customerId);
  }

  audit(req.user!.id, nextState ? 'customer.suspend' : 'customer.restore', 'user', customerId, req.ip);
  pass(res, { suspended: nextState }, nextState ? 'Đã tạm khóa tài khoản khách hàng.' : 'Đã mở khóa tài khoản.');
});

app.get('/api/admin/services', auth, admin, (_req, res) => {
  pass(res, db.prepare(`${serviceView} ORDER BY s.created_at DESC`).all().map(jsonService));
});

app.patch('/api/admin/services/:id', auth, admin, (req, res) => {
  const p = z.object({
    published: z.boolean().optional(),
    featured: z.boolean().optional(),
    starting_price: z.number().int().min(0).optional()
  }).refine(x => Object.keys(x).length > 0).safeParse(req.body);

  if (!p.success) return fail(res, 400, 'VALIDATION_ERROR', 'Dữ liệu cập nhật chưa hợp lệ.');
  const service = db.prepare('SELECT id FROM services WHERE id = ?').get(String(req.params.id)) as any;
  if (!service) return fail(res, 404, 'NOT_FOUND', 'Không tìm thấy dịch vụ.');

  if (p.data.published !== undefined) db.prepare('UPDATE services SET published = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(p.data.published ? 1 : 0, service.id);
  if (p.data.featured !== undefined) db.prepare('UPDATE services SET featured = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(p.data.featured ? 1 : 0, service.id);
  if (p.data.starting_price !== undefined) db.prepare('UPDATE services SET starting_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(p.data.starting_price, service.id);

  audit(req.user!.id, 'service.update', 'service', service.id, req.ip);
  pass(res, null, 'Đã cập nhật dịch vụ.');
});

app.get('/api/admin/coupons', auth, admin, (_req, res) => {
  pass(res, db.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all());
});

app.post('/api/admin/coupons', auth, admin, (req, res) => {
  const p = z.object({
    code: z.string().trim().min(3).max(30).toUpperCase(),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.number().int().min(1),
    minOrderAmount: z.number().int().min(0).default(0),
    maxDiscount: z.number().int().min(0).default(0),
    usageLimit: z.number().int().min(1).default(100)
  }).safeParse(req.body);

  if (!p.success) return fail(res, 400, 'VALIDATION_ERROR', 'Vui lòng kiểm tra mã giảm giá và giá trị.');
  const id = randomUUID();
  try {
    db.prepare(`
      INSERT INTO coupons (id, code, discount_type, discount_value, min_order_amount, max_discount, usage_limit, times_used, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1)
    `).run(id, p.data.code, p.data.discountType, p.data.discountValue, p.data.minOrderAmount, p.data.maxDiscount, p.data.usageLimit);
    audit(req.user!.id, 'coupon.create', 'coupon', id, req.ip);
    pass(res, { id, code: p.data.code }, 'Đã tạo mã giảm giá mới.');
  } catch {
    fail(res, 409, 'COUPON_EXISTS', 'Mã giảm giá này đã tồn tại.');
  }
});

app.patch('/api/admin/coupons/:id', auth, admin, (req, res) => {
  const p = z.object({ active: z.boolean() }).safeParse(req.body);
  if (!p.success) return fail(res, 400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ.');
  db.prepare('UPDATE coupons SET active = ? WHERE id = ?').run(p.data.active ? 1 : 0, String(req.params.id));
  audit(req.user!.id, 'coupon.toggle', 'coupon', String(req.params.id), req.ip);
  pass(res, null, 'Đã cập nhật trạng thái mã giảm giá.');
});

app.delete('/api/admin/coupons/:id', auth, admin, (req, res) => {
  db.prepare('DELETE FROM coupons WHERE id = ?').run(String(req.params.id));
  audit(req.user!.id, 'coupon.delete', 'coupon', String(req.params.id), req.ip);
  pass(res, null, 'Đã xóa mã giảm giá.');
});

app.get('/api/admin/reviews', auth, admin, (_req, res) => {
  pass(
    res,
    db.prepare(`
      SELECT r.*, u.name AS customer_name, u.company, s.title AS service_title 
      FROM reviews r 
      JOIN users u ON u.id = r.user_id 
      JOIN services s ON s.id = r.service_id 
      ORDER BY r.created_at DESC
    `).all()
  );
});

app.patch('/api/admin/reviews/:id', auth, admin, (req, res) => {
  const p = z.object({ approved: z.boolean() }).safeParse(req.body);
  if (!p.success) return fail(res, 400, 'VALIDATION_ERROR', 'Trạng thái duyệt không hợp lệ.');
  db.prepare('UPDATE reviews SET approved = ? WHERE id = ?').run(p.data.approved ? 1 : 0, String(req.params.id));
  audit(req.user!.id, 'review.moderate', 'review', String(req.params.id), req.ip);
  pass(res, null, 'Đã cập nhật trạng thái đánh giá.');
});

app.get('/api/admin/inquiries', auth, admin, (_req, res) => {
  pass(res, db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 200').all());
});

app.patch('/api/admin/inquiries/:id', auth, admin, (req, res) => {
  const p = z.object({ status: z.enum(['new', 'reviewing', 'replied', 'closed']) }).safeParse(req.body);
  if (!p.success) return fail(res, 400, 'VALIDATION_ERROR', 'Trạng thái yêu cầu không hợp lệ.');
  db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run(p.data.status, String(req.params.id));
  audit(req.user!.id, 'inquiry.status.update', 'inquiry', String(req.params.id), req.ip);
  pass(res, null, 'Đã cập nhật trạng thái yêu cầu.');
});

app.get('/api/admin/settings', auth, admin, (_req, res) => {
  const rows = db.prepare('SELECT key, value, updated_at FROM settings').all();
  pass(res, rows);
});

app.patch('/api/admin/settings', auth, admin, (req, res) => {
  const p = z.record(z.string(), z.string()).safeParse(req.body);
  if (!p.success) return fail(res, 400, 'VALIDATION_ERROR', 'Dữ liệu cấu hình không hợp lệ.');
  transaction(() => {
    const ins = db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
    for (const [k, v] of Object.entries(p.data)) {
      ins.run(k, v);
    }
    audit(req.user!.id, 'settings.update', 'settings', undefined, req.ip);
  });
  pass(res, null, 'Đã lưu cài đặt website.');
});

app.get('/api/admin/audit', auth, admin, (_req, res) => {
  pass(
    res,
    db.prepare(`
      SELECT a.action, a.target_type, a.target_id, a.ip_address, a.created_at, u.name AS actor_name 
      FROM audit_logs a 
      LEFT JOIN users u ON u.id = a.actor_id 
      ORDER BY a.created_at DESC LIMIT 100
    `).all()
  );
});

// Mock/Webhook endpoint for automated payment notifications
app.post('/api/payments/vietqr/webhook', (req, res) => {
  const p = z.object({
    orderNumber: z.string().min(5),
    amount: z.number().int().min(1),
    secret: z.string().optional()
  }).safeParse(req.body);

  if (!p.success) return fail(res, 400, 'VALIDATION_ERROR', 'Dữ liệu webhook không hợp lệ.');
  const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(p.data.orderNumber) as any;
  if (!order) return fail(res, 404, 'NOT_FOUND', 'Không tìm thấy đơn hàng.');

  transaction(() => {
    db.prepare("UPDATE orders SET payment_status = 'paid', status = CASE WHEN status = 'pending' THEN 'in_progress' ELSE status END, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(order.id);
    db.prepare('INSERT INTO notifications (id, user_id, title, body, link) VALUES (?, ?, ?, ?, ?)')
      .run(randomUUID(), order.user_id, 'Thanh toán thành công qua VietQR', `Hệ thống đã nhận thanh toán cho đơn hàng ${order.order_number}.`, `/dashboard/orders/${order.id}`);
    db.prepare('INSERT INTO messages (id, order_id, sender_id, body, system) VALUES (?, ?, ?, ?, 1)')
      .run(randomUUID(), order.id, 'user-admin-vt', 'Hệ thống đã nhận được thanh toán chuyển khoản qua VietQR. Dự án chính thức bắt đầu!');
    audit(undefined, 'payment.vietqr.webhook', 'order', order.id, req.ip);
  });

  pass(res, { received: true, orderNumber: order.order_number }, 'Đã xử lý thanh toán webhook.');
});

app.use('/api', (_req, res) => fail(res, 404, 'API_NOT_FOUND', 'Đường dẫn API không tồn tại.'));

const distCandidates = [
  path.resolve(process.cwd(), 'dist'),
  path.resolve(here, '../dist'),
  path.resolve(here, '../../dist')
];
const distDir = distCandidates.find((d) => fs.existsSync(d) && fs.existsSync(path.join(d, 'index.html')));

if (distDir) {
  app.use(express.static(distDir, { index: false, maxAge: '1h' }));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distDir, 'index.html'));
    }
    next();
  });
}

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof SyntaxError) return fail(res, 400, 'INVALID_JSON', 'Nội dung JSON chưa hợp lệ.');
  console.error('Unhandled request error:', err?.message || err);
  return fail(res, 500, 'INTERNAL_ERROR', 'Đã có lỗi khi xử lý yêu cầu. Vui lòng thử lại.');
});

app.listen(port, () => console.log(`VanTanTheDEV API listening on http://localhost:${port}`));
