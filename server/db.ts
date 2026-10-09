import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, scryptSync } from 'node:crypto';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
fs.mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(path.join(dataDir, 'vantanthedev.sqlite'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

const schemaPath = fs.existsSync(path.join(here, 'schema.sql'))
  ? path.join(here, 'schema.sql')
  : path.resolve(here, '../../server/schema.sql');
db.exec(fs.readFileSync(schemaPath, 'utf8'));

export function ensureColumns() {
  const tableCols = (table: string) => {
    try {
      const rows = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
      return new Set(rows.map(r => r.name));
    } catch {
      return new Set<string>();
    }
  };

  const orderCols = tableCols('orders');
  if (orderCols.size > 0) {
    if (!orderCols.has('subtotal')) db.exec('ALTER TABLE orders ADD COLUMN subtotal INTEGER NOT NULL DEFAULT 0');
    if (!orderCols.has('discount_amount')) db.exec('ALTER TABLE orders ADD COLUMN discount_amount INTEGER NOT NULL DEFAULT 0');
    if (!orderCols.has('coupon_code')) db.exec('ALTER TABLE orders ADD COLUMN coupon_code TEXT');
    if (!orderCols.has('payment_method')) db.exec("ALTER TABLE orders ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'vietqr'");
    if (!orderCols.has('payment_reference')) db.exec('ALTER TABLE orders ADD COLUMN payment_reference TEXT');
  }

  const userCols = tableCols('users');
  if (userCols.size > 0) {
    if (!userCols.has('phone')) db.exec('ALTER TABLE users ADD COLUMN phone TEXT');
    if (!userCols.has('company')) db.exec('ALTER TABLE users ADD COLUMN company TEXT');
  }

  const svcCols = tableCols('services');
  if (svcCols.size > 0) {
    if (!svcCols.has('includes_json')) db.exec("ALTER TABLE services ADD COLUMN includes_json TEXT NOT NULL DEFAULT '[]'");
    if (!svcCols.has('excludes_json')) db.exec("ALTER TABLE services ADD COLUMN excludes_json TEXT NOT NULL DEFAULT '[]'");
    if (!svcCols.has('faqs_json')) db.exec("ALTER TABLE services ADD COLUMN faqs_json TEXT NOT NULL DEFAULT '[]'");
  }

  const pkgCols = tableCols('packages');
  if (pkgCols.size > 0) {
    if (!pkgCols.has('tier')) db.exec("ALTER TABLE packages ADD COLUMN tier TEXT NOT NULL DEFAULT 'standard'");
  }

  const msgCols = tableCols('messages');
  if (msgCols.size > 0) {
    if (!msgCols.has('attachment_url')) db.exec('ALTER TABLE messages ADD COLUMN attachment_url TEXT');
  }

  const notifCols = tableCols('notifications');
  if (notifCols.size > 0) {
    if (!notifCols.has('link')) db.exec('ALTER TABLE notifications ADD COLUMN link TEXT');
  }
}
ensureColumns();

export function transaction<T>(work: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = work();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

export const seedServices = [
  {
    id: 'svc-web',
    slug: 'website-doanh-nghiep',
    title: 'Website Doanh Nghiệp & Brand Landing',
    category: 'Web Development',
    summary: 'Một website chỉn chu, tải nhanh dưới 1.2s và giúp khách hàng hiểu ngay giá trị cốt lõi của doanh nghiệp bạn.',
    description: 'Thiết kế và phát triển website responsive theo chuẩn nhận diện thương hiệu độc quyền, cấu trúc nội dung khoa học, tối ưu điểm chuẩn Core Web Vitals (Lighthouse 95+), chuẩn SEO on-page và dễ dàng mở rộng tính năng về sau.',
    starting_price: 6500000,
    delivery_days: 10,
    featured: 1,
    stack: ['Next.js 15', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
    includes: [
      'Thiết kế giao diện độc quyền (không dùng theme dựng sẵn)',
      'Tương thích hoàn hảo mọi thiết bị (Mobile, Tablet, Desktop)',
      'Tối ưu tốc độ tải trang Lighthouse 95+ và chuẩn SEO on-page',
      'Tích hợp form liên hệ và bảo vệ chống spam (Cloudflare / Turnstile)',
      'Bàn giao toàn bộ mã nguồn sạch, có tài liệu hướng dẫn vận hành',
      'Hỗ trợ bảo hành kỹ thuật 30 ngày sau bàn giao'
    ],
    excludes: [
      'Chi phí mua tên miền (.vn / .com) và gói hosting / cloud',
      'Soạn thảo nội dung bản quyền chuyên sâu (copywriting)',
      'Chụp ảnh và quay dựng video sản phẩm tại chỗ'
    ],
    faqs: [
      { q: 'Website có thể tự cập nhật bài viết được không?', a: 'Có. Gói Chuyên nghiệp và Mở rộng đã bao gồm CMS trực quan giúp bạn thêm sửa bài viết, dịch vụ và hình ảnh dễ dàng.' },
      { q: 'Sau khi bàn giao tôi có toàn quyền sở hữu code không?', a: 'Chính xác 100%. Bạn nhận toàn bộ kho mã nguồn Git repository và tài liệu hướng dẫn triển khai.' }
    ],
    packages: [
      { name: 'Khởi đầu', tier: 'basic', price: 6500000, days: 7, revisions: 2, popular: 0, features: ['Landing page dài đến 5 sections', 'Thiết kế Responsive Mobile First', 'Form liên hệ & thông báo email', 'Tối ưu tốc độ tải trang Lighthouse 90+', 'Bàn giao trọn gói mã nguồn'] },
      { name: 'Chuyên nghiệp', tier: 'standard', price: 12500000, days: 14, revisions: 3, popular: 1, features: ['Website đa trang (đến 8 trang)', 'CMS quản trị nội dung trực quan', 'SEO On-page & Schema Markup chuẩn', 'Hiệu ứng micro-interactions tinh tế', 'Tích hợp Google Analytics 4 & Meta Pixel', 'Bảo hành kỹ thuật 30 ngày'] },
      { name: 'Mở rộng', tier: 'premium', price: 21500000, days: 21, revisions: 5, popular: 0, features: ['Website quy mô lớn đến 15 trang', 'Đa ngôn ngữ (Tiếng Việt & Tiếng Anh)', 'CMS nâng cao + phân quyền tác giả', 'Tích hợp CRM / Email Marketing tự động', 'Tối ưu bảo mật OWASP & chống tấn công', 'Hỗ trợ kỹ thuật 60 ngày sau bàn giao'] }
    ]
  },
  {
    id: 'svc-ecommerce',
    slug: 'website-thuong-mai-dien-tu',
    title: 'Website Thương Mại Điện Tử Chuyên Nghiệp',
    category: 'Web Development',
    summary: 'Trải nghiệm mua sắm mượt mà, giỏ hàng tối ưu tỷ lệ chuyển đổi và quản lý đơn hàng toàn diện.',
    description: 'Nền tảng bán hàng trực tuyến được xây quanh hành trình khách hàng thực tế: danh mục đa cấp, bộ lọc nhanh, giỏ hàng lưu tự động, tính phí ship linh hoạt, tích hợp thanh toán VietQR / thẻ ngân hàng và trang quản trị doanh thu khoa học.',
    starting_price: 14000000,
    delivery_days: 18,
    featured: 1,
    stack: ['React', 'Node.js', 'PostgreSQL', 'Redis', 'VietQR'],
    includes: [
      'Giao diện mua sắm tối ưu chuyển đổi trên mobile',
      'Quản lý sản phẩm, biến thể (size/màu), tồn kho thời gian thực',
      'Giỏ hàng, mã giảm giá (coupon) và tính phí vận chuyển',
      'Tích hợp thanh toán quét mã VietQR tự động & chuyển khoản',
      'Dashboard quản lý đơn hàng, khách hàng và trạng thái vận chuyển',
      'Bàn giao mã nguồn và tài liệu đào tạo sử dụng'
    ],
    excludes: [
      'Phí đăng ký tài khoản cổng thanh toán doanh nghiệp (VNPay/MoMo)',
      'Phí API dịch vụ vận chuyển bên thứ ba (GHTK/GHN) theo tháng'
    ],
    faqs: [
      { q: 'Hệ thống có hỗ trợ thanh toán VietQR quét mã không?', a: 'Có. Khách mua hàng có thể quét mã VietQR ngân hàng với nội dung chuyển khoản tự động kèm mã đơn hàng.' },
      { q: 'Hệ thống chịu tải được bao nhiêu sản phẩm?', a: 'Cơ sở dữ liệu PostgreSQL chuẩn hóa đáp ứng tốt hàng chục nghìn sản phẩm và hàng nghìn truy cập đồng thời.' }
    ],
    packages: [
      { name: 'Cửa hàng Gọn', tier: 'basic', price: 14000000, days: 14, revisions: 2, popular: 0, features: ['Tối đa 100 sản phẩm & danh mục', 'Giỏ hàng & Đặt hàng COD / Chuyển khoản', 'Thông báo đơn qua Email / Telegram', 'Quản trị sản phẩm và đơn hàng cơ bản', 'Bàn giao mã nguồn'] },
      { name: 'Tăng trưởng', tier: 'standard', price: 24000000, days: 25, revisions: 3, popular: 1, features: ['Sản phẩm không giới hạn & biến thể', 'Tích hợp VietQR tự động & Cổng thanh toán', 'Hệ thống mã giảm giá (Coupons)', 'Báo cáo doanh thu & xuất file Excel', 'Tối ưu Checkout 1 bước tăng chuyển đổi', 'Bảo hành hỗ trợ 45 ngày'] },
      { name: 'Tùy chỉnh Enterprise', tier: 'premium', price: 42000000, days: 40, revisions: 5, popular: 0, features: ['Kiến trúc phân tải cao cho chiến dịch Sale', 'Đồng bộ tồn kho nhiều chi nhánh', 'Tích hợp API vận chuyển (GHTK, GHN, ViettelPost)', 'Chương trình khách hàng thân thiết & Tích điểm', 'Tối ưu SEO danh mục thương mại điện tử chuyên sâu', 'Hỗ trợ kỹ thuật ưu tiên 90 ngày'] }
    ]
  },
  {
    id: 'svc-saas',
    slug: 'san-pham-saas',
    title: 'Phát Triển Ứng Dụng SaaS & Phần Mềm Web',
    category: 'Software Development',
    summary: 'Biến quy trình kinh doanh và ý tưởng công nghệ thành một sản phẩm phần mềm SaaS hoàn chỉnh sẵn sàng thương mại hóa.',
    description: 'Đồng hành từ giai đoạn kiến trúc giải pháp MVP đến sản phẩm hoàn chỉnh: xác thực người dùng, phân quyền vai trò (RBAC), thanh toán gói thuê bao (subscription), xử lý dữ liệu nền, theo dõi lỗi và cơ sở hạ tầng có thể mở rộng hàng chục nghìn người dùng.',
    starting_price: 22000000,
    delivery_days: 28,
    featured: 1,
    stack: ['Next.js', 'NestJS', 'PostgreSQL', 'Docker', 'Stripe'],
    includes: [
      'Phân tích mô hình nghiệp vụ và thiết kế cơ sở dữ liệu chuẩn',
      'Hệ thống tài khoản, bảo mật phiên và phân quyền RBAC',
      'API RESTful / GraphQL chuẩn hóa kèm tài liệu Swagger',
      'Triển khai môi trường Staging thử nghiệm và Production',
      'Tích hợp hạ tầng Docker, CI/CD tự động',
      'Hỗ trợ kỹ thuật sau bàn giao'
    ],
    excludes: [
      'Chi phí máy chủ Cloud (AWS / DigitalOcean / Vercel)',
      'Phí dịch vụ bên thứ ba (SMS OTP, SendGrid, AI Tokens)'
    ],
    faqs: [
      { q: 'Dự án SaaS được bàn giao như thế nào?', a: 'Bàn giao kho mã nguồn Git, Docker compose, script thiết lập cơ sở dữ liệu và tài liệu hướng dẫn bảo trì.' }
    ],
    packages: [
      { name: 'MVP Nhanh', tier: 'basic', price: 22000000, days: 25, revisions: 2, popular: 0, features: ['1 luồng nghiệp vụ cốt lõi', 'Đăng ký, Đăng nhập & Quản lý profile', 'Bảng điều khiển khách hàng cơ bản', 'Triển khai Staging & Production Docker', 'Bàn giao mã nguồn & tài liệu'] },
      { name: 'SaaS Tiêu chuẩn', tier: 'standard', price: 42000000, days: 45, revisions: 3, popular: 1, features: ['Nhiều vai trò người dùng (Admin, Manager, Member)', 'Tích hợp thanh toán gói định kỳ / VietQR', 'Email giao dịch tự động qua Resend / SendGrid', 'Bảng quản trị Admin hệ thống toàn diện', 'Audit log ghi nhật ký hoạt động người dùng', 'Bảo hành 60 ngày'] },
      { name: 'Nền tảng Mở rộng', tier: 'premium', price: 75000000, days: 70, revisions: 5, popular: 0, features: ['Hệ thống Multi-tenant tách biệt dữ liệu', 'Tích hợp Webhooks và API cho bên thứ 3', 'Hàng đợi tác vụ nền Redis Queue / BullMQ', 'Giám sát lỗi Sentry & Metrics Prometheus', 'Kiểm thử đơn vị (Unit Tests) & E2E', 'Đồng hành kỹ thuật 90 ngày'] }
    ]
  },
  {
    id: 'svc-dashboard',
    slug: 'admin-dashboard',
    title: 'Custom Admin Dashboard & Quản Trị Dữ Liệu',
    category: 'Web Development',
    summary: 'Giao diện quản trị trực quan biến dữ liệu thô và quy trình nội bộ thành luồng làm việc tinh gọn, hiệu quả.',
    description: 'Thiết kế dashboard quản trị theo từng vai trò nghiệp vụ: hiển thị chỉ số KPI thời gian thực, bảng dữ liệu với bộ lọc đa điều kiện, xuất file Excel/PDF, phân quyền duyệt đơn và tích hợp trực tiếp vào hệ thống hiện có của bạn.',
    starting_price: 9500000,
    delivery_days: 14,
    featured: 0,
    stack: ['React', 'TypeScript', 'Tailwind CSS', 'Recharts', 'REST API'],
    includes: [
      'Giao diện trực quan, bảng dữ liệu phân trang & tìm kiếm thời gian thực',
      'Biểu đồ trực quan hóa dữ liệu thống kê (Doanh thu, Người dùng, Đơn hàng)',
      'Phân quyền truy cập theo vai trò (Role-Based Access Control)',
      'Chức năng xuất dữ liệu Excel, CSV và in hóa đơn PDF',
      'Đồng bộ với API backend hiện có của khách hàng'
    ],
    excludes: [
      'Xây dựng lại toàn bộ hạ tầng cơ sở dữ liệu cũ'
    ],
    faqs: [
      { q: 'Dashboard có kết nối được API backend sẵn có của tôi không?', a: 'Hoàn toàn được. Tôi sẽ làm việc trực tiếp với đội ngũ kỹ thuật của bạn hoặc tài liệu Swagger/Postman.' }
    ],
    packages: [
      { name: 'Dashboard Gọn', tier: 'basic', price: 9500000, days: 10, revisions: 2, popular: 0, features: ['Tối đa 4 màn hình quản trị', 'Bảng dữ liệu, tìm kiếm & phân trang', 'Kết nối API backend sẵn có', 'Thiết kế chuẩn Dark / Light Mode', 'Bàn giao mã nguồn'] },
      { name: 'Dashboard Toàn diện', tier: 'standard', price: 18500000, days: 20, revisions: 3, popular: 1, features: ['Tối đa 10 màn hình quản lý chuyên sâu', 'Hệ thống biểu đồ phân tích tương tác', 'Bộ lọc dữ liệu nâng cao nhiều điều kiện', 'Phân quyền Role-based Admin / Staff', 'Xuất báo cáo Excel / PDF chuyên nghiệp', 'Bảo hành 30 ngày'] },
      { name: 'Hệ thống Quản trị Quy trình', tier: 'premium', price: 32000000, days: 35, revisions: 4, popular: 0, features: ['Màn hình không giới hạn theo module', 'Luồng phê duyệt nhiều cấp (Approval Workflow)', 'Nhật ký kiểm toán Audit Trail chi tiết', 'Tích hợp thông báo thời gian thực WebSocket', 'Tối ưu tải bảng dữ liệu lớn (Virtual Scrolling)', 'Bảo hành hỗ trợ 60 ngày'] }
    ]
  },
  {
    id: 'svc-mobile',
    slug: 'ung-dung-di-dong',
    title: 'Phát Triển Ứng Dụng Di Động (iOS & Android)',
    category: 'Mobile Development',
    summary: 'Ứng dụng đa nền tảng tối ưu hiệu năng bản địa, trải nghiệm chạm vuốt tự nhiên và tích hợp API chuẩn mực.',
    description: 'Phát triển ứng dụng iOS và Android bằng Flutter hoặc React Native. Tập trung vào trải nghiệm mượt mà 60fps, tương thích offline cơ bản, thông báo đẩy (push notifications) và hỗ trợ chuẩn bị đóng gói phát hành lên App Store & Google Play.',
    starting_price: 18000000,
    delivery_days: 25,
    featured: 0,
    stack: ['Flutter', 'React Native', 'Firebase', 'REST API', 'Figma'],
    includes: [
      'Giao diện ứng dụng hoàn thiện cho cả iOS & Android',
      'Tối ưu cảm ứng, hiệu ứng chuyển động và tỷ lệ màn hình',
      'Tích hợp xác thực, thông báo đẩy (Firebase Cloud Messaging)',
      'Lưu trữ dữ liệu cục bộ hỗ trợ trải nghiệm offline',
      'Chuẩn bị file build APK / IPA sẵn sàng phát hành store'
    ],
    excludes: [
      'Phí tài khoản Apple Developer ($99/năm) và Google Play ($25)'
    ],
    faqs: [
      { q: 'Nên chọn Flutter hay React Native?', a: 'Tùy vào bài toán: Flutter tối ưu khi cần đồ họa mượt mà và đồng nhất pixel, React Native phù hợp nếu đội ngũ bạn sẵn có nền tảng web React.' }
    ],
    packages: [
      { name: 'Bản Thử nghiệm (MVP)', tier: 'basic', price: 18000000, days: 20, revisions: 2, popular: 0, features: ['Tối đa 6 màn hình chức năng', 'Xác thực tài khoản cơ bản', 'Kết nối API hiển thị dữ liệu', 'Xuất bản build Android APK & iOS TestFlight', 'Bàn giao mã nguồn'] },
      { name: 'Ứng dụng Tiêu chuẩn', tier: 'standard', price: 36000000, days: 38, revisions: 3, popular: 1, features: ['Tối đa 14 màn hình hoàn chỉnh', 'Đăng nhập Google / Apple / OTP SMS', 'Thông báo đẩy Push Notification', 'Tích hợp thanh toán trong ứng dụng / VietQR', 'Hỗ trợ nộp duyệt App Store & Google Play', 'Bảo hành 45 ngày'] },
      { name: 'Ứng dụng Doanh nghiệp', tier: 'premium', price: 65000000, days: 60, revisions: 5, popular: 0, features: ['Ứng dụng quy mô lớn không giới hạn màn hình', 'Đồng bộ dữ liệu ngầm và Offline Cache', 'Deep links & Chia sẻ mạng xã hội', 'Bảo mật mã hóa lưu trữ Keychain / Keystore', 'Tích hợp SDK bên thứ ba chuyên sâu', 'Hỗ trợ vận hành sau phát hành 90 ngày'] }
    ]
  },
  {
    id: 'svc-api',
    slug: 'api-backend',
    title: 'Thiết Kế Kiến Trúc API & Hệ Thống Backend',
    category: 'Software Development',
    summary: 'Một backend vững chãi, bảo mật cao, tài liệu API chuẩn OpenAPI và sẵn sàng chịu tải lớn.',
    description: 'Thiết kế mô hình dữ liệu chuẩn hóa, xây dựng API hiệu năng cao bằng Node.js / NestJS hoặc Go, áp dụng chuẩn RESTful / GraphQL, tối ưu câu lệnh SQL, tích hợp xác thực JWT / OAuth2 và kiểm soát an toàn bảo mật OWASP.',
    starting_price: 8500000,
    delivery_days: 12,
    featured: 0,
    stack: ['Node.js', 'NestJS', 'PostgreSQL', 'Redis', 'OpenAPI/Swagger'],
    includes: [
      'Thiết kế sơ đồ quan hệ thực thể (ERD) và migrations tự động',
      'API chuẩn hóa có xác thực dữ liệu đầu vào (Zod / Joi)',
      'Tài liệu Swagger / OpenAPI tương tác trực tiếp',
      'Ghi log tập trung và giám sát lỗi',
      'Kiểm thử API tự động đảm bảo không có lỗi hồi quy'
    ],
    excludes: [
      'Chi phí hạ tầng máy chủ và cơ sở dữ liệu cloud'
    ],
    faqs: [
      { q: 'API có tài liệu để đội ngũ mobile/frontend tích hợp không?', a: 'Có. Mỗi dự án đều đi kèm tài liệu Swagger trực quan và file Postman Collection đầy đủ ví dụ request/response.' }
    ],
    packages: [
      { name: 'Module API', tier: 'basic', price: 8500000, days: 8, revisions: 2, popular: 0, features: ['Tối đa 6 endpoints chuẩn REST', 'Validation dữ liệu nghiêm ngặt', 'Tài liệu Swagger tương tác', 'Mã nguồn sạch có comment giải thích', 'Bàn giao mã nguồn'] },
      { name: 'Hệ thống Backend', tier: 'standard', price: 18000000, days: 18, revisions: 3, popular: 1, features: ['Tối đa 20 endpoints nghiệp vụ', 'Xác thực JWT, Refresh Token & Phân quyền', 'Database migrations & Seeding dữ liệu mẫu', 'Caching tầng dữ liệu với Redis', 'Tài liệu API chi tiết & Postman Collection', 'Bảo hành 30 ngày'] },
      { name: 'Kiến trúc Phức hợp', tier: 'premium', price: 34000000, days: 30, revisions: 4, popular: 0, features: ['Hệ thống API lớn không giới hạn endpoints', 'Tích hợp hệ thống thanh toán & bên thứ 3', 'Hàng đợi xử lý bất đồng bộ Background Worker', 'Rate limiting & Chống tấn công DDoS cơ bản', 'CI/CD pipeline tự động deploy lên server', 'Bảo hành 60 ngày'] }
    ]
  },
  {
    id: 'svc-uiux',
    slug: 'ui-ux-design-system',
    title: 'Thiết Kế UI/UX & Bộ Design System Chuẩn Code',
    category: 'UI/UX',
    summary: 'Thiết kế giao diện hiện đại, tối ưu trải nghiệm người dùng và chuyển giao Figma sang Code liền mạch.',
    description: 'Nghiên cứu hành vi người dùng, xây dựng wireframe và thiết kế giao diện Figma có độ sắc nét cao (pixel-perfect). Đặc biệt: Thiết kế được xây dựng dựa trên tư duy lập trình viên, đảm bảo tính khả thi khi code và bàn giao bộ token màu sắc, typography chuẩn.',
    starting_price: 7000000,
    delivery_days: 10,
    featured: 0,
    stack: ['Figma', 'Design System', 'Tokens', 'AutoLayout', 'Prototyping'],
    includes: [
      'Thiết kế giao diện Figma đầy đủ trạng thái (Hover, Active, Error, Loading)',
      'Bộ Design System hoàn chỉnh (Color Palette, Typography, Components)',
      'Bản mẫu tương tác (Interactive Prototype) để kiểm tra trải nghiệm',
      'Xuất tài nguyên icon, hình ảnh tối ưu dung lượng SVG/WebP',
      'File bàn giao chuẩn AutoLayout cho lập trình viên lập tức chuyển thành code'
    ],
    excludes: [
      'Công việc viết mã nguồn frontend (nếu không chọn kèm gói phát triển)'
    ],
    faqs: [
      { q: 'Tôi có nhận được file Figma gốc không?', a: 'Có. Bạn nhận toàn bộ quyền chỉnh sửa file Figma bao gồm component library và biến số design tokens.' }
    ],
    packages: [
      { name: 'Giao diện Cơ bản', tier: 'basic', price: 7000000, days: 7, revisions: 2, popular: 0, features: ['Thiết kế đến 5 màn hình chính', 'Phiên bản Desktop và Mobile Responsive', 'Bản mẫu tương tác cơ bản', 'Bàn giao file Figma gốc'] },
      { name: 'Sản phẩm Toàn diện', tier: 'standard', price: 14500000, days: 15, revisions: 3, popular: 1, features: ['Thiết kế đến 12 màn hình chi tiết', 'Bộ Design System & UI Kit tái sử dụng', 'Mọi trạng thái Empty, Error, Loading, Success', 'Prototype tương tác mượt mà', 'Tài liệu hướng dẫn Hand-off cho Dev', 'Hỗ trợ giải đáp đội Dev 30 ngày'] },
      { name: 'Nền tảng Quy mô lớn', tier: 'premium', price: 26000000, days: 28, revisions: 4, popular: 0, features: ['Hệ thống trên 25 màn hình phức tạp', 'Design Tokens đồng bộ mã nguồn CSS/Tailwind', 'Trải nghiệm đa nền tảng Web & Mobile Apps', 'User Journey Map & Wireframe luồng tương tác', 'Thư viện minh họa và icon tùy biến', 'Đồng hành cùng đội Dev trong suốt dự án'] }
    ]
  },
  {
    id: 'svc-audit',
    slug: 'kiem-tra-bao-mat-hieu-nang',
    title: 'Rà Soát Bảo Mật & Tối Ưu Hiệu Năng Ứng Dụng',
    category: 'Maintenance',
    summary: 'Phát hiện lỗ hổng bảo mật, giải quyết điểm nghẽn tốc độ và nhận báo cáo khắc phục chi tiết có thể thực thi ngay.',
    description: 'Đánh giá độc lập toàn diện ứng dụng web/mobile: kiểm tra các lỗ hổng theo tiêu chuẩn OWASP Top 10, phân tích chỉ số Core Web Vitals, kiểm toán mã nguồn và dependency, tối ưu câu truy vấn cơ sở dữ liệu và cung cấp giải pháp khắc phục cụ thể.',
    starting_price: 5000000,
    delivery_days: 5,
    featured: 0,
    stack: ['OWASP ZAP', 'Lighthouse', 'Node Security', 'SQL Profiling', 'Docker Security'],
    includes: [
      'Quét và rà soát lỗ hổng theo chuẩn OWASP Top 10',
      'Đo lường chi tiết tốc độ tải trang Core Web Vitals (LCP, INP, CLS)',
      'Kiểm toán bảo mật thư viện bên thứ 3 và dependencies',
      'Báo cáo kỹ thuật chi tiết phân loại mức độ rủi ro (Nghiêm trọng, Cao, Vừa, Thấp)',
      'Đề xuất mã nguồn và giải pháp khắc phục trực tiếp cho lập trình viên',
      'Buổi họp trao đổi kỹ thuật giải thích nguyên nhân và cách xử lý'
    ],
    excludes: [
      'Cam kết loại bỏ 100% mọi rủi ro trong tương lai (không có hệ thống nào an toàn tuyệt đối)',
      'Chứng chỉ bảo mật cấp nhà nước hoặc ISO chính thức'
    ],
    faqs: [
      { q: 'Báo cáo có kèm hướng dẫn sửa code cụ thể không?', a: 'Có. Mỗi lỗi tìm thấy đều kèm ví dụ mã nguồn bị ảnh hưởng và đoạn code sửa chữa chuẩn xác.' }
    ],
    packages: [
      { name: 'Đánh giá Nhanh', tier: 'basic', price: 5000000, days: 4, revisions: 1, popular: 0, features: ['Rà soát 1 ứng dụng web hoặc API', 'Kiểm tra tốc độ Core Web Vitals', 'Quét lỗ hổng dependency tự động', 'Báo cáo tổng hợp danh sách phát hiện', 'Trao đổi giải đáp trực tuyến 60 phút'] },
      { name: 'Kiểm toán Chuyên sâu', tier: 'standard', price: 11000000, days: 8, revisions: 2, popular: 1, features: ['Rà soát bảo mật OWASP, Auth & API', 'Tối ưu hiệu năng câu truy vấn database chậm', 'Kiểm tra cấu hình máy chủ & Security Headers', 'Báo cáo kỹ thuật chi tiết kèm code mẫu khắc phục', 'Kiểm tra lại (Re-test) sau khi đội dev sửa xong', 'Hỗ trợ tư vấn 14 ngày'] },
      { name: 'Đồng hành Tối ưu', tier: 'premium', price: 22000000, days: 15, revisions: 3, popular: 0, features: ['Rà soát toàn diện hệ sinh thái (Web, App, Backend)', 'Trực tiếp tham gia sửa các lỗi bảo mật nghiêm trọng', 'Cấu hình bảo mật Cloudflare, Firewall & WAF', 'Đo lường trước và sau khi tối ưu hóa', 'Thiết lập quy trình bảo mật CI/CD tự động', 'Hỗ trợ kỹ thuật ưu tiên 30 ngày'] }
    ]
  }
];

export const seedAddons = [
  ['add-auth', 'Hệ thống Đăng nhập & Phân quyền', 'Tài khoản, bảo mật phiên, xác thực 2 bước (2FA) và phân quyền vai trò (Admin, User, Staff).', 2200000, 3],
  ['add-payment', 'Tích hợp Thanh toán Tự động', 'Tích hợp quét mã VietQR tự động hoặc cổng thanh toán thẻ (VNPay/MoMo/Stripe).', 3200000, 4],
  ['add-admin', 'Admin Dashboard Quản trị', 'Giao diện quản lý cơ sở dữ liệu, quản lý đơn hàng, người dùng và báo cáo doanh thu.', 4500000, 5],
  ['add-deploy', 'Triển khai Production & CI/CD', 'Thiết lập máy chủ VPS/Cloud, Docker, SSL HTTPS, Domain và quy trình tự động cập nhật code.', 1800000, 2],
  ['add-seo', 'SEO Kỹ thuật & Tối ưu Schema', 'Cấu trúc dữ liệu có cấu trúc Google Schema, Sitemap XML, OpenGraph mạng xã hội và thẻ canonical.', 1200000, 2],
  ['add-speed', 'Giao Hàng Nhanh Ưu Tiên (Priority)', 'Dành 100% thời gian xử lý ưu tiên hàng đầu, rút ngắn thời gian bàn giao dự án xuống 40%.', 3500000, 0],
  ['add-maintenance', 'Bảo trì Kỹ thuật 60 Ngày', 'Đồng hành theo dõi hiệu năng, cập nhật bảo mật định kỳ và hỗ trợ khắc phục sự cố kỹ thuật.', 2800000, 0]
];

export const seedCoupons = [
  ['cpn-1', 'VANTAN10', 'percentage', 10, 5000000, 2000000, 50, 4, 1],
  ['cpn-2', 'WELCOME500', 'fixed', 500000, 3000000, 500000, 100, 12, 1],
  ['cpn-3', 'STARTUP2026', 'percentage', 15, 10000000, 3500000, 30, 8, 1],
  ['cpn-4', 'PRODEV', 'fixed', 1000000, 15000000, 1000000, 25, 3, 1]
];

export function purgeFakeData() {
  transaction(() => {
    // 1. Delete messages referencing demo orders or demo sender
    db.prepare("DELETE FROM messages WHERE sender_id = 'user-customer-nam' OR order_id IN (SELECT id FROM orders WHERE user_id = 'user-customer-nam' OR id IN ('ord-demo-01', 'ord-demo-02', 'ord-demo-03'))").run();

    // 2. Delete order files referencing demo orders or demo uploader
    db.prepare("DELETE FROM order_files WHERE user_id = 'user-customer-nam' OR order_id IN (SELECT id FROM orders WHERE user_id = 'user-customer-nam' OR id IN ('ord-demo-01', 'ord-demo-02', 'ord-demo-03'))").run();

    // 3. Delete reviews referencing demo user or demo orders
    db.prepare("DELETE FROM reviews WHERE user_id = 'user-customer-nam' OR order_id IN (SELECT id FROM orders WHERE user_id = 'user-customer-nam' OR id IN ('ord-demo-01', 'ord-demo-02', 'ord-demo-03')) OR id = 'rev-demo-01'").run();

    // 4. Delete favorites for demo user
    db.prepare("DELETE FROM favorites WHERE user_id = 'user-customer-nam'").run();

    // 5. Delete notifications for demo user
    db.prepare("DELETE FROM notifications WHERE user_id = 'user-customer-nam'").run();

    // 6. Delete audit logs where actor is demo user
    db.prepare("DELETE FROM audit_logs WHERE actor_id = 'user-customer-nam'").run();

    // 7. Delete sessions & password resets for demo user
    db.prepare("DELETE FROM sessions WHERE user_id = 'user-customer-nam'").run();
    db.prepare("DELETE FROM password_resets WHERE user_id = 'user-customer-nam'").run();

    // 8. Delete orders belonging to demo user or demo order IDs
    db.prepare("DELETE FROM orders WHERE user_id = 'user-customer-nam' OR id IN ('ord-demo-01', 'ord-demo-02', 'ord-demo-03')").run();

    // 9. Now safely delete demo users
    db.prepare("DELETE FROM users WHERE id = 'user-customer-nam' OR email = 'khachhang@example.com'").run();
  });
}

export function seed() {
  purgeFakeData();

  transaction(() => {
    // 1. Seed Founder / CEO (Nguyễn Văn Tấn)
    const adminEmail = 'admin@vantanthedev.com';
    const adminCheck = db.prepare('SELECT id FROM users WHERE email=?').get(adminEmail) as any;
    if (!adminCheck) {
      db.prepare(`
        INSERT INTO users (id, email, name, password_hash, role, phone, company)
        VALUES (?, ?, ?, ?, 'admin', ?, ?)
      `).run('user-admin-vt', adminEmail, 'Nguyễn Văn Tấn (CEO & COO)', hashPassword('Admin@2026!'), '+84 901 234 567', 'VanTanTheDEV Studio');
    } else {
      db.prepare(`UPDATE users SET name = 'Nguyễn Văn Tấn (CEO & COO)', company = 'VanTanTheDEV Studio' WHERE id = ?`).run(adminCheck.id);
    }

    // 2. Seed Technical & Customer Support Team Account
    const supportEmail = 'support@vantanthedev.com';
    const supportCheck = db.prepare('SELECT id FROM users WHERE email=?').get(supportEmail) as any;
    if (!supportCheck) {
      db.prepare(`
        INSERT INTO users (id, email, name, password_hash, role, phone, company)
        VALUES (?, ?, ?, ?, 'admin', ?, ?)
      `).run('user-support-team', supportEmail, 'Đội ngũ Kỹ thuật VanTanTheDEV', hashPassword('Support@2026!'), '+84 901 234 568', 'VanTanTheDEV Engineering Team');
    }

    // 3. Seed Services & Packages
    const insertService = db.prepare(`
      INSERT INTO services 
      (id, slug, title, category, summary, description, starting_price, delivery_days, stack_json, includes_json, excludes_json, faqs_json, featured, published)
      VALUES (@id, @slug, @title, @category, @summary, @description, @starting_price, @delivery_days, @stack_json, @includes_json, @excludes_json, @faqs_json, @featured, 1)
      ON CONFLICT(id) DO UPDATE SET
        slug=excluded.slug,
        title=excluded.title,
        category=excluded.category,
        summary=excluded.summary,
        description=excluded.description,
        starting_price=excluded.starting_price,
        delivery_days=excluded.delivery_days,
        stack_json=excluded.stack_json,
        includes_json=excluded.includes_json,
        excludes_json=excluded.excludes_json,
        faqs_json=excluded.faqs_json,
        featured=excluded.featured,
        published=excluded.published
    `);

    const insertPackage = db.prepare(`
      INSERT INTO packages 
      (id, service_id, name, tier, price, delivery_days, revisions, features_json, popular)
      VALUES (@id, @service_id, @name, @tier, @price, @delivery_days, @revisions, @features_json, @popular)
      ON CONFLICT(id) DO UPDATE SET
        service_id=excluded.service_id,
        name=excluded.name,
        tier=excluded.tier,
        price=excluded.price,
        delivery_days=excluded.delivery_days,
        revisions=excluded.revisions,
        features_json=excluded.features_json,
        popular=excluded.popular
    `);

    for (const s of seedServices) {
      insertService.run({
        id: s.id,
        slug: s.slug,
        title: s.title,
        category: s.category,
        summary: s.summary,
        description: s.description,
        starting_price: s.starting_price,
        delivery_days: s.delivery_days,
        stack_json: JSON.stringify(s.stack),
        includes_json: JSON.stringify(s.includes),
        excludes_json: JSON.stringify(s.excludes),
        faqs_json: JSON.stringify(s.faqs),
        featured: s.featured
      });

      s.packages.forEach((p, idx) => {
        insertPackage.run({
          id: `${s.id}-pkg-${idx + 1}`,
          service_id: s.id,
          name: p.name,
          tier: p.tier,
          price: p.price,
          delivery_days: p.days,
          revisions: p.revisions,
          features_json: JSON.stringify(p.features),
          popular: p.popular
        });
      });
    }

    // 4. Seed Addons
    const insAddon = db.prepare(`
      INSERT INTO addons (id, title, description, price, delivery_days, active)
      VALUES (?, ?, ?, ?, ?, 1)
      ON CONFLICT(id) DO UPDATE SET
        title=excluded.title,
        description=excluded.description,
        price=excluded.price,
        delivery_days=excluded.delivery_days,
        active=excluded.active
    `);
    for (const a of seedAddons) {
      insAddon.run(...a);
    }

    // 5. Seed Coupons
    const insCoupon = db.prepare(`
      INSERT INTO coupons (id, code, discount_type, discount_value, min_order_amount, max_discount, usage_limit, times_used, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        code=excluded.code,
        discount_type=excluded.discount_type,
        discount_value=excluded.discount_value,
        min_order_amount=excluded.min_order_amount,
        max_discount=excluded.max_discount,
        usage_limit=excluded.usage_limit,
        active=excluded.active
    `);
    for (const c of seedCoupons) {
      insCoupon.run(...c);
    }

    // 6. Seed Site Settings
    const defaultSettings: [string, string][] = [
      ['announcement', 'Nhận 02 dự án mới trong quý này · Tư vấn giải pháp kỹ thuật cùng Đội ngũ Kỹ sư & Ban Điều Hành'],
      ['hero_headline', 'Sản phẩm số được xây đúng cách.'],
      ['hero_subtitle', 'Website, ứng dụng và phần mềm tùy chỉnh — được thiết kế và phát triển bởi Đội ngũ Kỹ sư VanTanTheDEV dưới sự định hướng của CEO Nguyễn Văn Tấn.'],
      ['contact_email', 'contact@vantanthedev.com'],
      ['support_email', 'support@vantanthedev.com'],
      ['contact_phone', '+84 901 234 567'],
      ['vietqr_bank', 'MB Bank (Ngân hàng TMCP Quân Đội)'],
      ['vietqr_account', '0987654321'],
      ['vietqr_name', 'NGUYEN VAN TAN']
    ];
    const insSetting = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value
    `);
    for (const [k, v] of defaultSettings) {
      insSetting.run(k, v);
    }
  });
}

seed();
