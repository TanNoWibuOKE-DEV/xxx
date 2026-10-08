import { createContext, useContext, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowDown, ArrowRight, ArrowUpRight, Bell, Check, ChevronDown, Clock3, Code2,
  CreditCard, FileText, Heart, LayoutDashboard, LockKeyhole, Menu, MessageCircle,
  Search, Send, ShieldCheck, Sparkles, Star, X, Copy, Download, ExternalLink,
  Printer, QrCode, Tag, Upload, UserCheck, UserX, CheckCircle2, AlertCircle,
  Building, Phone, Mail, HelpCircle, Layers
} from 'lucide-react';
import { api, date, dateTime, money, statusLabel, paymentMethodLabel, generateVietQrUrl } from './api';

// ==========================================
// TYPES & CONTEXT
// ==========================================

export type User = {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  phone?: string | null;
  company?: string | null;
  suspended?: number;
};

export type Package = {
  id: string;
  name: string;
  tier: 'basic' | 'standard' | 'premium';
  price: number;
  delivery_days: number;
  revisions: number;
  features: string[];
  popular: number;
};

export type Service = {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  description: string;
  starting_price: number;
  delivery_days: number;
  stack: string[];
  includes?: string[];
  excludes?: string[];
  faqs?: { q: string; a: string }[];
  featured: number;
  published?: number;
  review_count?: number;
  rating?: number;
  packages?: Package[];
  addons?: { id: string; title: string; description: string; price: number; delivery_days: number }[];
  reviews?: any[];
  related?: Service[];
};

export type Order = {
  id: string;
  order_number: string;
  project_name: string;
  description: string;
  subtotal: number;
  discount_amount: number;
  coupon_code: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_status: string;
  payment_method: string;
  payment_reference?: string | null;
  created_at: string;
  requirements: any;
  addons: any;
  service_title: string;
  service_slug: string;
  service_category?: string;
  package_name: string;
  package_tier?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_company?: string;
  files?: any[];
  review?: any;
};

type AppContextType = {
  user: User | null;
  setUser: (u: User | null) => void;
  settings: Record<string, string>;
  flash: (s: string) => void;
  ready: boolean;
  openVietQr: (orderNumber: string, amount: number) => void;
  openInvoice: (order: Order) => void;
};

const AppContext = createContext<AppContextType>({
  user: null,
  setUser: () => {},
  settings: {},
  flash: () => {},
  ready: false,
  openVietQr: () => {},
  openInvoice: () => {}
});

export const useApp = () => useContext(AppContext);

const categories = [
  'Tất cả',
  'Web Development',
  'Mobile Development',
  'Software Development',
  'UI/UX',
  'Maintenance'
];

const categoryName: Record<string, string> = {
  'Web Development': 'Phát triển web',
  'Mobile Development': 'Ứng dụng di động',
  'Software Development': 'Phần mềm tùy chỉnh',
  'UI/UX': 'Thiết kế UI/UX',
  'Maintenance': 'Bảo trì & tối ưu'
};

// ==========================================
// MAIN APP COMPONENT
// ==========================================

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const [vietQrData, setVietQrData] = useState<{ orderNumber: string; amount: number } | null>(null);
  const [invoiceData, setInvoiceData] = useState<Order | null>(null);

  useEffect(() => {
    api<User>('/api/auth/me')
      .then(setUser)
      .catch(() => {})
      .finally(() => setReady(true));

    api<Record<string, string>>('/api/settings')
      .then(setSettings)
      .catch(() => {});
  }, []);

  const flash = (s: string) => {
    setNotice(s);
    window.setTimeout(() => setNotice(''), 3800);
  };

  const openVietQr = (orderNumber: string, amount: number) => {
    setVietQrData({ orderNumber, amount });
  };

  const openInvoice = (order: Order) => {
    setInvoiceData(order);
  };

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        window.dispatchEvent(new Event('open-command'));
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        settings,
        flash,
        ready,
        openVietQr,
        openInvoice
      }}
    >
      <div className="app-shell">
        <AnnouncementBar text={settings.announcement} />
        <Header ready={ready} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:slug" element={<ServiceDetail />} />
          <Route path="/book/:slug" element={<Booking />} />
          <Route path="/custom-project" element={<Estimator />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/about" element={<About />} />
          <Route path="/technologies" element={<Technologies />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Legal title="Điều khoản dịch vụ & Sử dụng mã nguồn" />} />
          <Route path="/privacy" element={<Legal title="Chính sách quyền riêng tư & Bảo mật dữ liệu" />} />
          <Route path="/refund-policy" element={<Legal title="Chính sách hoàn tiền & Hủy dự án" />} />
          <Route path="/payment-policy" element={<Legal title="Chính sách thanh toán & VietQR" />} />
          <Route path="/service-policy" element={<Legal title="Chính sách bàn giao & Bảo hành kỹ thuật" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
        <CommandPalette />
        {vietQrData && (
          <VietQrModal
            orderNumber={vietQrData.orderNumber}
            amount={vietQrData.amount}
            onClose={() => setVietQrData(null)}
          />
        )}
        {invoiceData && <InvoiceModal order={invoiceData} onClose={() => setInvoiceData(null)} />}
        {notice && (
          <div className="toast" role="status">
            <CheckCircle2 size={16} style={{ color: '#5bd7de', flex: 'none' }} />
            <span>{notice}</span>
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
}

function AnnouncementBar({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <div className="announcement-bar">
      <span>{text}</span>
      <Link to="/custom-project">
        Nhận báo giá ngay <ArrowUpRight size={13} />
      </Link>
    </div>
  );
}

function Header({ ready }: { ready: boolean }) {
  const { user } = useApp();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <header className="site-header">
      <div className="nav-wrap">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <Code2 size={17} />
          </span>
          <span>
            VanTanThe<span className="brand-accent">DEV</span>
          </span>
        </Link>
        <nav className={`main-nav ${open ? 'is-open' : ''}`}>
          <NavLink to="/services">Dịch vụ</NavLink>
          <NavLink to="/custom-project">Dự án riêng</NavLink>
          <NavLink to="/portfolio">Sản phẩm</NavLink>
          <NavLink to="/technologies">Công nghệ</NavLink>
          <NavLink to="/about">Về tôi</NavLink>
          <NavLink to="/faq">Hỏi đáp</NavLink>
          <NavLink to="/contact">Liên hệ</NavLink>
        </nav>
        <div className="nav-actions">
          <button
            className="search-shortcut"
            onClick={() => window.dispatchEvent(new Event('open-command'))}
            aria-label="Tìm kiếm nhanh"
          >
            <Search size={15} />
            <span>Tìm kiếm</span>
            <kbd>⌘ K</kbd>
          </button>
          {ready && user ? (
            <Link
              to={user.role === 'admin' ? '/admin' : '/dashboard'}
              className="nav-profile"
            >
              <span className="account-initial" style={{ width: 22, height: 22, fontSize: 10 }}>
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <span>{user.name.split(' ').slice(-1)[0]}</span>
              {user.role === 'admin' && (
                <span className="badge-tag badge-active" style={{ fontSize: 8 }}>ADMIN</span>
              )}
              <ArrowUpRight size={13} />
            </Link>
          ) : (
            <Link to="/login" className="nav-login">
              Đăng nhập
            </Link>
          )}
          <Link to="/custom-project" className="button button-small button-bright">
            Bắt đầu dự án <ArrowUpRight size={15} />
          </Link>
        </div>
        <button
          aria-label={open ? 'Đóng menu' : 'Mở menu'}
          className="mobile-toggle"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}

function Footer() {
  const { settings } = useApp();
  return (
    <footer className="footer">
      <div className="footer-main">
        <div>
          <Link to="/" className="brand">
            <span className="brand-mark">
              <Code2 size={17} />
            </span>
            <span>
              VanTanThe<span className="brand-accent">DEV</span>
            </span>
          </Link>
          <p>
            Giải pháp phần mềm hiện đại cho cá nhân, startup và doanh nghiệp.
            <br />
            Thiết kế & phát triển trực tiếp bởi Nguyễn Văn Tấn.
          </p>
          <div style={{ marginTop: 12, display: 'flex', gap: 14, fontSize: 11, color: '#94a3b8' }}>
            <span><Mail size={13} style={{ verticalAlign: -2 }} /> {settings.contact_email || 'contact@vantanthedev.com'}</span>
            <span><Phone size={13} style={{ verticalAlign: -2 }} /> {settings.contact_phone || '+84 901 234 567'}</span>
          </div>
        </div>
        <div>
          <span className="footer-label">Dịch Vụ Nổi Bật</span>
          <Link to="/services/website-doanh-nghiep">Website Doanh Nghiệp</Link>
          <Link to="/services/website-thuong-mai-dien-tu">E-commerce VietQR</Link>
          <Link to="/services/san-pham-saas">Phát Triển SaaS MVP</Link>
          <Link to="/services/admin-dashboard">Custom Admin Dashboard</Link>
          <Link to="/services/ung-dung-di-dong">Ứng Dụng Di Động</Link>
        </div>
        <div>
          <span className="footer-label">Điều Hướng & Hỗ Trợ</span>
          <Link to="/custom-project">Ước Tính Dự Án Riêng</Link>
          <Link to="/portfolio">Sản Phẩm & Case Studies</Link>
          <Link to="/technologies">Stack Công Nghệ</Link>
          <Link to="/faq">Câu Hỏi Thường Gặp (FAQ)</Link>
          <Link to="/contact">Liên Hệ Trực Tiếp</Link>
        </div>
        <div className="footer-cta">
          <span className="eyebrow">CÓ MỘT BÀI TOÁN?</span>
          <Link to="/custom-project">
            Cùng trao đổi nhé <ArrowUpRight size={16} />
          </Link>
          <small>Rõ phạm vi · Báo giá minh bạch · Bàn giao mã nguồn</small>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} VanTanTheDEV · Nguyễn Văn Tấn. Toàn quyền bảo lưu.
        </span>
        <div>
          <Link to="/terms">Điều khoản</Link>
          <Link to="/privacy">Quyền riêng tư</Link>
          <Link to="/payment-policy">Thanh toán VietQR</Link>
          <Link to="/refund-policy">Hoàn tiền</Link>
          <span className="availability">
            <i /> Nhận 02 dự án trong quý này
          </span>
        </div>
      </div>
    </footer>
  );
}

// ==========================================
// HOME PAGE
// ==========================================

function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    api<Service[]>('/api/services').then(setServices).catch(() => {});
    api<any[]>('/api/reviews').then(setReviews).catch(() => {});
  }, []);

  return (
    <main>
      <section className="hero">
        <div className="hero-grid" />
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="availability-dot" /> STUDIO PHÁT TRIỂN PHẦN MỀM · VIỆT NAM
            </div>
            <h1>
              Sản phẩm số<br />
              được xây <span className="text-gradient">đúng cách.</span>
            </h1>
            <p className="hero-lede">
              Website, ứng dụng di động và phần mềm tùy chỉnh — được thiết kế và lập trình
              trực tiếp quanh nhu cầu thực tế của doanh nghiệp bạn.
            </p>
            <div className="hero-actions">
              <Link to="/custom-project" className="button button-bright">
                Bắt đầu dự án <ArrowUpRight size={16} />
              </Link>
              <Link to="/services" className="button button-quiet">
                Khám phá dịch vụ <ArrowRight size={16} />
              </Link>
            </div>
            <div className="hero-proof">
              <div className="proof-line" />
              <span>Rõ phạm vi</span>
              <span>100% Mã nguồn của bạn</span>
              <span>Bảo hành sau bàn giao</span>
              <span>Thanh toán theo mốc</span>
            </div>
          </div>
          <div className="hero-art">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="terminal-card">
              <div className="terminal-top">
                <div className="window-dots">
                  <i />
                  <i />
                  <i />
                </div>
                <span>vantanthedev-engine.ts</span>
                <span className="terminal-live">
                  <i /> LIVE PIPELINE
                </span>
              </div>
              <div className="terminal-content">
                <div className="terminal-kicker">ENGINEERING / 2026</div>
                <div className="terminal-heading">
                  Nền tảng sản phẩm<br />
                  <span>vận hành thực tế.</span>
                </div>
                <div className="terminal-progress">
                  <div>
                    <span>Tiến độ hoàn thiện quy trình</span>
                    <b>85%</b>
                  </div>
                  <div className="progress-track">
                    <i />
                  </div>
                </div>
                <div className="terminal-checks">
                  <span>
                    <b>01</b> Phân tích yêu cầu & Báo giá rõ <Check size={14} />
                  </span>
                  <span>
                    <b>02</b> Kiến trúc phần mềm & Thiết kế UI <Check size={14} />
                  </span>
                  <span className="terminal-current">
                    <b>03</b> Phát triển & Tối ưu hiệu năng <i />
                  </span>
                  <span className="terminal-muted">
                    <b>04</b> Bàn giao source code & Triển khai <i />
                  </span>
                </div>
              </div>
              <div className="terminal-foot">
                <span>
                  <span className="signal-dot" /> Trực tiếp làm việc cùng Nguyễn Văn Tấn
                </span>
                <span>VN · REMOTE</span>
              </div>
            </div>
            <div className="float-note">
              <span className="float-spark">✳</span>
              <div>
                <b>100% Quyền sở hữu mã nguồn</b>
                <small>Bàn giao toàn bộ Git & Tài liệu</small>
              </div>
              <ArrowUpRight size={15} />
            </div>
            <div className="hero-coordinate">
              10°46' N  106°41' E<br />
              INDEPENDENT COMMERCIAL SOFTWARE STUDIO
            </div>
          </div>
        </div>
        <div className="hero-bottom">
          <span>01 — COMMERCIAL SOFTWARE DEVELOPMENT · VAN TAN THE DEV</span>
          <a href="#services">
            CUỘN ĐỂ KHÁM PHÁ <ArrowDown size={13} />
          </a>
          <span>HCMC · VIETNAM</span>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="trust-strip">
        <div>
          <span className="eyebrow">TRIẾT LÝ LÀM VIỆC</span>
          <p>
            Bạn không cần qua trung gian agency cồng kềnh để có một sản phẩm chất lượng cao.<br />
            <b>Làm việc trực tiếp với kỹ sư phần mềm phụ trách toàn bộ dự án.</b>
          </p>
        </div>
        <div className="trust-points">
          <span><Check /> Thống nhất phạm vi & chi phí trước khi làm</span>
          <span><Check /> Bạn sở hữu toàn quyền mã nguồn bàn giao</span>
          <span><Check /> Tối ưu tốc độ tải trang Lighthouse 95+</span>
          <span><Check /> Hỗ trợ bảo hành kỹ thuật 30 - 60 ngày</span>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section services-section" id="services">
        <SectionHead
          index="01"
          kicker="DỊCH VỤ PHÁT TRIỂN"
          title={
            <>
              Từ ý tưởng bài toán<br />
              <span className="muted-heading">đến sản phẩm thương mại.</span>
            </>
          }
          text="Chọn gói dịch vụ có phạm vi rõ ràng, hoặc cùng thiết kế phương án tùy chỉnh theo bài toán của bạn."
          link="Xem tất cả 08 dịch vụ"
          to="/services"
        />
        <div className="service-grid">
          {services.slice(0, 6).map((s, i) => (
            <ServiceCard key={s.id} service={s} index={i + 1} />
          ))}
        </div>
      </section>

      {/* Process Section */}
      <section className="section process-section">
        <SectionHead
          index="02"
          kicker="QUY TRÌNH HỢP TÁC"
          title={
            <>
              Từng bước sáng rõ.<br />
              <span className="muted-heading">Không có bất ngờ về sau.</span>
            </>
          }
          text="Bạn luôn biết việc gì đang diễn ra, bước tiếp theo là gì và khoản đầu tư của mình đi đâu."
        />
        <div className="process-grid">
          <Process
            n="01"
            title="Trao đổi bài toán"
            text="Chia sẻ mục tiêu kinh doanh, đối tượng người dùng và những yêu cầu chức năng cốt lõi bạn muốn giải quyết."
          />
          <Process
            n="02"
            title="Chốt phạm vi & Chi phí"
            text="Nhận đề xuất bằng văn bản: rõ đầu việc, sản phẩm bàn giao, mốc thời gian và chi phí trọn gói minh bạch."
          />
          <Process
            n="03"
            title="Cùng phát triển & Kiểm thử"
            text="Theo dõi tiến độ trực quan trong Client Space. Phản hồi và điều chỉnh trong phạm vi đã thống nhất."
          />
          <Process
            n="04"
            title="Bàn giao & Đồng hành"
            text="Bàn giao toàn bộ mã nguồn Git, tài liệu vận hành và bảo hành sửa lỗi kỹ thuật trong 30-60 ngày."
          />
        </div>
      </section>

      {/* Split Feature */}
      <section className="split-feature">
        <div className="feature-visual">
          <div className="blueprint">
            <div className="blueprint-caption">ENGINEERING WITH INTENT</div>
            <div className="blueprint-lines">
              <span />
              <span />
              <span />
              <span />
              <i />
              <b />
            </div>
            <div className="blueprint-code">
              <span>01</span>
              <span>const <b>vantanProduct</b> = {'{'}</span>
              <span>02</span>
              <span>&nbsp;&nbsp;clearScope: <em>true</em>,</span>
              <span>03</span>
              <span>&nbsp;&nbsp;cleanArchitecture: <em>true</em>,</span>
              <span>04</span>
              <span>&nbsp;&nbsp;sourceCodeOwnership: <em>"yours"</em></span>
              <span>05</span>
              <span>{'}'}</span>
            </div>
            <div className="blueprint-stamp">
              VT<span>·</span>DEV
            </div>
          </div>
        </div>
        <div className="feature-copy">
          <span className="eyebrow">LÀM VIỆC TRỰC TIẾP</span>
          <h2>
            Một người phụ trách.<br />
            <span className="muted-heading">Một cuộc trò chuyện liền mạch.</span>
          </h2>
          <p>
            Làm việc trực tiếp cùng Nguyễn Văn Tấn, Full-Stack Developer sáng lập VanTanTheDEV.
            Mọi quyết định kỹ thuật được giải thích bằng ngôn ngữ bạn hiểu, gắn liền với hiệu quả kinh doanh
            thay vì những thuật ngữ phức tạp không cần thiết.
          </p>
          <Link to="/about" className="text-link">
            Tìm hiểu triết lý và kinh nghiệm kỹ thuật <ArrowRight size={16} />
          </Link>
          <div className="feature-stats">
            <div>
              <b>01</b>
              <span>Đầu mối kỹ thuật xuyên suốt</span>
            </div>
            <div>
              <b>100%</b>
              <span>Bàn giao mã nguồn</span>
            </div>
            <div>
              <b>Lighthouse 95+</b>
              <span>Tiêu chuẩn tối ưu tốc độ</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials & Reviews */}
      {reviews.length > 0 && (
        <section className="section" style={{ borderBottom: '1px solid var(--border)' }}>
          <SectionHead
            index="03"
            kicker="ĐÁNH GIÁ TỪ KHÁCH HÀNG"
            title={
              <>
                Trải nghiệm thực tế<br />
                <span className="muted-heading">từ các dự án đã bàn giao.</span>
              </>
            }
            text="Đánh giá được gửi từ khách hàng sau khi hoàn tất nghiệm thu và bàn giao dự án."
          />
          <div className="review-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {reviews.slice(0, 3).map((r, i) => (
              <div key={i} className="dash-panel" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 3, color: '#e5bb70' }}>
                    {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                  </div>
                  <span className="badge-tag badge-active" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Check size={11} /> Khách hàng xác thực
                  </span>
                </div>
                <p style={{ fontSize: 11, color: '#cbd5e1', lineHeight: 1.8, margin: '0 0 14px' }}>
                  "{r.body}"
                </p>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                  <b style={{ color: '#f1f5f9' }}>{r.name} {r.company && <small style={{ color: '#64748b', fontWeight: 400 }}>· {r.company}</small>}</b>
                  <span style={{ color: '#94a3b8' }}>{r.service_title}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQ Teaser */}
      <section className="faq-teaser">
        <div>
          <span className="eyebrow">CÂU HỎI THƯỜNG GẶP</span>
          <h2>
            Có vài điều<br />
            <span className="muted-heading">nên biết trước khi bắt đầu.</span>
          </h2>
          <p style={{ marginTop: 14, color: '#94a3b8', fontSize: 11, lineHeight: 1.8 }}>
            Minh bạch ngay từ đầu là nền tảng cho một sản phẩm thành công.
          </p>
          <Link to="/faq" className="text-link" style={{ marginTop: 18 }}>
            Xem toàn bộ câu hỏi thường gặp <ArrowRight size={15} />
          </Link>
        </div>
        <div>
          <FaqItem
            q="Tôi chưa có bản đặc tả kỹ thuật chi tiết thì sao?"
            a="Không sao cả. Bạn chỉ cần bắt đầu từ mục tiêu kinh doanh và những vấn đề bạn muốn giải quyết. Phần làm rõ phạm vi kỹ thuật, sơ đồ dữ liệu và lộ trình sẽ được thực hiện trong giai đoạn tư vấn ban đầu."
          />
          <FaqItem
            q="Giá hiển thị trên website đã là giá cuối cùng chưa?"
            a="Giá trên website là giá mẫu theo phạm vi tiêu chuẩn của từng gói. Với các yêu cầu tùy biến hoặc tích hợp đặc thù, tôi sẽ cung cấp bảng báo giá chi tiết từng hạng mục để bạn xác nhận trước khi bắt đầu."
          />
          <FaqItem
            q="Tôi có được nhận toàn bộ mã nguồn (source code) không?"
            a="Có, 100%. Toàn bộ mã nguồn, tài liệu hướng dẫn và quyền sở hữu kho lưu trữ Git sẽ được bàn giao đầy đủ cho bạn sau khi nghiệm thu dự án."
          />
          <FaqItem
            q="Có hỗ trợ bảo hành và bảo trì sau khi bàn giao không?"
            a="Mỗi gói dịch vụ đều đi kèm thời gian bảo hành kỹ thuật 30 - 60 ngày để theo dõi và khắc phục bất kỳ lỗi phát sinh trong phạm vi đã bàn giao hoàn toàn miễn phí."
          />
        </div>
      </section>

      {/* CTA Band */}
      <section className="cta-band">
        <div>
          <span className="eyebrow">BẠN KHÔNG CẦN MỘT BẢN ĐẶC TẢ HOÀN HẢO</span>
          <h2>
            Chỉ cần bắt đầu<br />
            từ bài toán bạn cần giải quyết.
          </h2>
          <p>Mô tả ý tưởng theo cách của bạn. Tôi sẽ cùng bạn kiến trúc giải pháp tối ưu.</p>
          <Link className="button button-bright" to="/custom-project">
            Ước tính & Bắt đầu dự án <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="cta-watermark">
          VT<span>·</span>D
        </div>
      </section>
    </main>
  );
}

function SectionHead({
  index,
  kicker,
  title,
  text,
  link,
  to
}: {
  index: string;
  kicker: string;
  title: ReactNode;
  text: string;
  link?: string;
  to?: string;
}) {
  return (
    <div className="section-head">
      <div className="head-index">
        {index}
        <span />
      </div>
      <div className="head-main">
        <span className="eyebrow">{kicker}</span>
        <h2>{title}</h2>
      </div>
      <div className="head-aside">
        <p>{text}</p>
        {link && (
          <Link className="text-link" to={to || '/'}>
            {link} <ArrowRight size={15} />
          </Link>
        )}
      </div>
    </div>
  );
}

function Process({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <article className="process-item">
      <div className="process-n">
        {n}
        <span> / 04</span>
      </div>
      <div className="process-rule" />
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function ServiceCard({ service, index }: { service: Service; index: number }) {
  return (
    <Link to={`/services/${service.slug}`} className="service-card">
      <div className="card-top">
        <span className="card-index">
          0{index} / {categoryName[service.category] || service.category}
        </span>
        <span className="card-arrow">
          <ArrowUpRight size={16} />
        </span>
      </div>
      <div className={`card-visual cv-${(index % 3) + 1}`}>
        <div className="visual-browser">
          <div className="visual-browser-top">
            <i />
            <i />
            <i />
            <span>{service.slug}.vantanthedev</span>
          </div>
          {index % 3 === 1 ? (
            <div className="visual-layout">
              <div className="layout-side" />
              <div className="layout-main">
                <i />
                <i />
                <b />
                <b />
                <i />
              </div>
            </div>
          ) : index % 3 === 2 ? (
            <div className="visual-api">
              <span>POST</span>
              <b>/api/{service.slug}</b>
              <i>201 created</i>
              <div>{'{ status: "production-ready" }'}</div>
            </div>
          ) : (
            <div className="visual-window">
              <span>01</span>
              <b>const stack =</b>
              <i>optimizedBuild()</i>
              <small>✓ shipped with care</small>
            </div>
          )}
        </div>
        <span className="visual-orb" />
      </div>
      <h3>{service.title}</h3>
      <p>{service.summary}</p>
      <div className="card-bottom">
        <span>
          Từ <b>{money(service.starting_price)}</b>
        </span>
        <span>
          {service.delivery_days} ngày <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}

// ==========================================
// SERVICES CATALOG PAGE
// ==========================================

function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const [sort, setSort] = useState('recommended');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Service[]>('/api/services')
      .then(setServices)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return services
      .filter(
        s =>
          (category === 'Tất cả' || category === s.category) &&
          `${s.title} ${s.summary} ${s.category} ${s.stack.join(' ')}`
            .toLowerCase()
            .includes(query.toLowerCase())
      )
      .sort((a, b) => {
        if (sort === 'price-asc') return a.starting_price - b.starting_price;
        if (sort === 'price-desc') return b.starting_price - a.starting_price;
        if (sort === 'time') return a.delivery_days - b.delivery_days;
        return b.featured - a.featured;
      });
  }, [services, category, query, sort]);

  return (
    <main className="page-main">
      <div className="page-hero compact">
        <span className="eyebrow">DANH MỤC DỊCH VỤ / 08 GÓI DỰ ÁN</span>
        <h1>
          Xây dựng điều bạn cần.<br />
          <span className="muted-heading">Với phạm vi & chi phí rõ ràng.</span>
        </h1>
        <p>
          Các gói dưới đây được chuẩn hóa theo thực tế triển khai. Mỗi dự án đều được
          xác nhận phạm vi và cam kết bàn giao bằng văn bản.
        </p>
      </div>

      <div className="service-discovery">
        <div className="discover-controls">
          <label className="discover-search">
            <Search size={17} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Tìm theo website, mobile, API, SaaS..."
            />
            <kbd>⌘ K</kbd>
          </label>
          <label className="sort-select">
            Sắp xếp{' '}
            <select value={sort} onChange={e => setSort(e.target.value)}>
              <option value="recommended">Đề xuất ưu tiên</option>
              <option value="price-asc">Giá: Thấp đến cao</option>
              <option value="price-desc">Giá: Cao đến thấp</option>
              <option value="time">Thời gian bàn giao</option>
            </select>
            <ChevronDown size={14} />
          </label>
        </div>

        <div className="filter-row">
          {categories.map(c => (
            <button
              key={c}
              className={`filter-chip ${c === category ? 'active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {categoryName[c] || c}
            </button>
          ))}
          <span className="result-count">{filtered.length} dịch vụ khả dụng</span>
        </div>

        {loading ? (
          <div className="loading-grid">
            {[1, 2, 3].map(x => (
              <div key={x} className="skeleton-card" />
            ))}
          </div>
        ) : filtered.length ? (
          <div className="service-grid">
            {filtered.map((s, i) => (
              <ServiceCard service={s} index={i + 1} key={s.id} />
            ))}
          </div>
        ) : (
          <Empty
            title="Chưa tìm thấy dịch vụ phù hợp"
            text="Thử tìm với từ khóa khác hoặc sử dụng công cụ ước tính dự án riêng."
            action="Mô tả dự án riêng"
            to="/custom-project"
          />
        )}
      </div>

      <div className="custom-banner">
        <div>
          <span className="eyebrow">YÊU CẦU DỰ ÁN TÙY BIẾN</span>
          <h2>Chưa thấy gói dịch vụ khớp 100% với bài toán?</h2>
          <p>
            Sử dụng công cụ ước tính dự án riêng để tính toán chi phí linh hoạt theo số màn hình,
            tính năng đặc thù và nền tảng bạn mong muốn.
          </p>
        </div>
        <Link className="button button-bright" to="/custom-project">
          Ước tính dự án riêng <ArrowRight size={16} />
        </Link>
      </div>
    </main>
  );
}

// ==========================================
// SERVICE DETAIL & PACKAGE COMPARISON MATRIX
// ==========================================

function ServiceDetail() {
  const { slug = '' } = useParams();
  const [service, setService] = useState<Service | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api<Service>(`/api/services/${slug}`)
      .then(setService)
      .catch(e => setErr(e.message));
  }, [slug]);

  if (err) {
    return (
      <main className="page-main">
        <Empty title="Không tìm thấy dịch vụ" text={err} action="Xem tất cả dịch vụ" to="/services" />
      </main>
    );
  }
  if (!service) {
    return (
      <main className="page-main">
        <div className="skeleton-hero" />
      </main>
    );
  }

  const packages = service.packages || [];
  const includes = service.includes || [];
  const excludes = service.excludes || [];
  const faqs = service.faqs || [];

  return (
    <main className="page-main">
      <div className="breadcrumbs">
        <Link to="/services">Dịch vụ</Link>
        <span>/</span>
        <span>{service.title}</span>
      </div>

      <div className="detail-hero">
        <div>
          <div className="eyebrow">
            {categoryName[service.category] || service.category}{' '}
            <span className="eyebrow-sep">/</span> {service.delivery_days}+ NGÀY BÀN GIAO
          </div>
          <h1>
            {service.title}<br />
            <span className="muted-heading">chuẩn hóa & vững chắc.</span>
          </h1>
          <p>{service.summary}</p>
          <div className="detail-actions">
            <Link to={`/book/${service.slug}`} className="button button-bright">
              Chọn gói & Đặt dự án <ArrowUpRight size={15} />
            </Link>
            <span>
              Giá khởi điểm từ <b>{money(service.starting_price)}</b>
            </span>
          </div>
          <div className="stack-list">
            {service.stack.map(t => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>

        <div className="detail-visual">
          <div className="detail-code-header">
            <span>DELIVERY SPECIFICATION / {service.slug.toUpperCase()}</span>
            <span className="signal-dot" />
          </div>
          <div className="detail-code">
            <span>01</span>
            <b>scope</b>
            <i>→</i>
            <em>clear</em>
            <span>02</span>
            <b>architecture</b>
            <i>→</i>
            <em>production</em>
            <span>03</span>
            <b>sourceCode</b>
            <i>→</i>
            <em>yours</em>
            <span>04</span>
            <b>support</b>
            <i>→</i>
            <em>guaranteed</em>
          </div>
          <div className="detail-visual-foot">
            <ShieldCheck size={15} /> Thống nhất phạm vi & hợp đồng trước khi thực hiện
          </div>
        </div>
      </div>

      {/* Scope: Included vs Excluded */}
      <section className="detail-body">
        <div className="detail-copy">
          <span className="eyebrow">PHẠM VI TIÊU CHUẨN</span>
          <h2>
            Minh bạch những gì bạn nhận được<br />
            <span className="muted-heading">và những gì không nằm trong gói.</span>
          </h2>
          <p>{service.description}</p>

          <div className="scope-comparison-grid">
            <div className="scope-card included">
              <div className="scope-card-head">
                <Check size={16} /> ĐÃ BAO GỒM TRONG GÓI
              </div>
              <ul className="scope-list">
                {includes.map((item, idx) => (
                  <li key={idx}>
                    <Check size={14} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="scope-card excluded">
              <div className="scope-card-head">
                <X size={16} /> KHÔNG BAO GỒM (BÁO GIÁ RIÊNG)
              </div>
              <ul className="scope-list">
                {excludes.map((item, idx) => (
                  <li key={idx}>
                    <X size={14} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="scope-note">
            <span>YÊU CẦU NGOÀI PHẠM VI</span>
            <p>
              Nếu dự án của bạn có các tính năng đặc thù ngoài gói mẫu, tôi sẽ phân tích và
              báo giá bổ sung bằng văn bản trước khi bắt đầu. Không bao giờ có chi phí ẩn phát sinh.
            </p>
          </div>
        </div>

        {/* Aside Mini Packages */}
        <aside className="package-aside">
          <div className="aside-top">
            <span className="eyebrow">CHỌN GÓI DỰ ÁN</span>
            <span>03 GÓI PHẠM VI</span>
          </div>
          <h3>
            Đầu tư theo<br />
            quy mô của bạn.
          </h3>
          {packages.map(p => (
            <div
              className={`package-mini ${p.popular ? 'is-popular' : ''}`}
              key={p.id}
            >
              <div className="package-mini-head">
                <b>{p.name}</b>
                {p.popular ? <span>PHỔ BIẾN NHẤT</span> : null}
              </div>
              <strong>{money(p.price)}</strong>
              <small>
                {p.delivery_days} ngày bàn giao · {p.revisions} vòng chỉnh sửa
              </small>
              <Link to={`/book/${service.slug}?package=${p.id}`}>
                Chọn gói này <ArrowRight size={14} />
              </Link>
            </div>
          ))}
          <p className="aside-foot">
            Giá minh bạch trọn gói. Bàn giao đầy đủ mã nguồn và tài liệu vận hành.
          </p>
        </aside>
      </section>

      {/* Package Comparison Matrix */}
      <section className="comparison-matrix-section">
        <div className="comparison-matrix-head">
          <span className="eyebrow">SO SÁNH CHI TIẾT 03 GÓI</span>
          <h2>Bảng So Sánh Các Gói Dịch Vụ</h2>
          <p style={{ color: '#94a3b8', fontSize: 11 }}>
            Dễ dàng đối chiếu tính năng và mức độ đầu tư để chọn giải pháp phù hợp nhất.
          </p>
        </div>

        <div className="comparison-table-wrap">
          <table className="comparison-table">
            <thead>
              <tr>
                <th style={{ width: '32%' }}>Hạng mục so sánh</th>
                {packages.map(p => (
                  <th
                    key={p.id}
                    className={p.popular ? 'is-popular' : ''}
                    style={{ width: `${68 / packages.length}%` }}
                  >
                    <div>
                      {p.name}{' '}
                      {p.popular ? (
                        <span className="badge-tag badge-active" style={{ marginLeft: 6 }}>
                          KHUYÊN DÙNG
                        </span>
                      ) : null}
                    </div>
                    <div style={{ fontSize: 16, marginTop: 4, color: '#f1f5f9' }}>
                      {money(p.price)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="feature-name">Thời gian bàn giao ước tính</td>
                {packages.map(p => (
                  <td key={p.id} style={{ fontFamily: 'var(--mono)' }}>
                    {p.delivery_days} ngày làm việc
                  </td>
                ))}
              </tr>
              <tr>
                <td className="feature-name">Số vòng chỉnh sửa miễn phí</td>
                {packages.map(p => (
                  <td key={p.id}>{p.revisions} vòng theo thỏa thuận</td>
                ))}
              </tr>
              <tr>
                <td className="feature-name">Bàn giao toàn bộ mã nguồn Git</td>
                {packages.map(p => (
                  <td key={p.id}>
                    <span className="feature-check">
                      <Check size={14} /> Có (100% sở hữu)
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="feature-name">Tối ưu chuẩn Core Web Vitals</td>
                {packages.map(p => (
                  <td key={p.id}>
                    <span className="feature-check">
                      <Check size={14} /> Lighthouse 90+
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="feature-name">Các tính năng bao gồm</td>
                {packages.map(p => (
                  <td key={p.id}>
                    <ul style={{ margin: 0, paddingLeft: 14, lineHeight: 1.7, fontSize: 10, color: '#94a3b8' }}>
                      {p.features.map((f, fi) => (
                        <li key={fi}>{f}</li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="feature-name">Hành động</td>
                {packages.map(p => (
                  <td key={p.id}>
                    <Link
                      to={`/book/${service.slug}?package=${p.id}`}
                      className={`button button-small ${p.popular ? 'button-bright' : 'button-quiet'}`}
                      style={{ width: '100%' }}
                    >
                      Đặt gói {p.name} <ArrowRight size={13} />
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Service FAQs */}
      {faqs.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="section-head">
            <div className="head-index">04<span /></div>
            <div className="head-main">
              <span className="eyebrow">HỎI ĐÁP DỊCH VỤ</span>
              <h2>Câu hỏi thường gặp về dịch vụ này</h2>
            </div>
            <div className="head-aside">
              <p>Mọi thắc mắc kỹ thuật đều được giải đáp trực tiếp.</p>
            </div>
          </div>
          <div>
            {faqs.map((f, fi) => (
              <FaqItem key={fi} q={f.q} a={f.a} />
            ))}
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <div className="detail-bottom">
        <span className="eyebrow">BẮT ĐẦU DỰ ÁN</span>
        <h2>
          Sẵn sàng đưa sản phẩm vào phát triển?<br />
          <span className="muted-heading">Bắt đầu từ một mô tả bài toán.</span>
        </h2>
        <Link to={`/book/${service.slug}`} className="button button-bright">
          Đặt dịch vụ {service.title} <ArrowUpRight size={15} />
        </Link>
      </div>
    </main>
  );
}

// ==========================================
// SMART MULTI-STEP BOOKING FLOW
// ==========================================

function Booking() {
  const { slug = '' } = useParams();
  const { user, flash, openVietQr } = useApp();
  const nav = useNavigate();
  const location = useLocation();

  const [service, setService] = useState<Service | null>(null);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponStatus, setCouponStatus] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'vietqr' | 'bank_transfer' | 'vnpay' | 'momo' | 'stripe'>('vietqr');

  const [form, setForm] = useState({
    projectName: '',
    description: '',
    targetAudience: '',
    features: '',
    technology: '',
    references: '',
    deadline: '',
    budget: ''
  });

  useEffect(() => {
    api<Service>(`/api/services/${slug}`)
      .then(s => {
        setService(s);
        const preferred = new URLSearchParams(location.search).get('package');
        const found =
          s.packages?.find(p => p.id === preferred)?.id ||
          s.packages?.find(p => p.popular)?.id ||
          s.packages?.[0]?.id ||
          '';
        setSelectedPackageId(found);
      })
      .catch(e => setError(e.message));
  }, [slug, location.search]);

  if (!service) {
    return (
      <main className="page-main">
        {error ? (
          <Empty
            title="Không thể mở quy trình đặt dịch vụ"
            text={error}
            action="Quay lại danh mục"
            to="/services"
          />
        ) : (
          <div className="skeleton-hero" />
        )}
      </main>
    );
  }

  const pack = service.packages?.find(p => p.id === selectedPackageId);
  const addons = service.addons || [];
  const chosenAddons = addons.filter(a => addonIds.includes(a.id));

  const subtotal = (pack?.price || 0) + chosenAddons.reduce((sum, a) => sum + a.price, 0);
  const finalAmount = Math.max(0, subtotal - discountAmount);
  const totalDays = (pack?.delivery_days || 0) + chosenAddons.reduce((sum, a) => sum + a.delivery_days, 0);

  const change = (key: string, value: string) => setForm({ ...form, [key]: value });

  // Apply Coupon
  const verifyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      setError('');
      const res = await api<{ discountAmount: number; code: string }>('/api/coupons/verify', {
        method: 'POST',
        body: JSON.stringify({ code: couponCode, subtotal })
      });
      setDiscountAmount(res.discountAmount);
      setCouponStatus(`Áp dụng mã ${res.code}: Giảm ${money(res.discountAmount)}`);
      flash(`Đã áp dụng mã giảm giá ${res.code}!`);
    } catch (e: any) {
      setDiscountAmount(0);
      setCouponStatus(null);
      setError(e.message);
    }
  };

  const forward = () => {
    setError('');
    if (step === 1 && !selectedPackageId) {
      setError('Vui lòng chọn một gói dịch vụ để tiếp tục.');
      return;
    }
    if (step === 2) {
      if (form.projectName.trim().length < 2) {
        setError('Vui lòng nhập tên dự án (tối thiểu 2 ký tự).');
        return;
      }
      if (form.description.trim().length < 20) {
        setError('Vui lòng mô tả yêu cầu dự án tối thiểu 20 ký tự để Nguyễn Văn Tấn có đủ dữ liệu ước tính.');
        return;
      }
    }
    if (step < 5) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  const submit = async () => {
    if (!user) {
      nav('/login', { state: { from: `/book/${slug}` } });
      return;
    }
    setBusy(true);
    setError('');
    try {
      const order = await api<{ id: string; orderNumber: string; amount: number }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: service.id,
          packageId: selectedPackageId,
          ...form,
          addons: addonIds,
          couponCode: discountAmount > 0 ? couponCode : undefined,
          paymentMethod
        })
      });

      flash(`Đã tạo đơn hàng ${order.orderNumber} thành công!`);

      // If VietQR is chosen, prompt quick VietQR modal
      if (paymentMethod === 'vietqr') {
        openVietQr(order.orderNumber, order.amount);
      }

      nav(`/dashboard/orders/${order.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page-main booking-page">
      <div className="breadcrumbs">
        <Link to="/services">Dịch vụ</Link>
        <span>/</span>
        <Link to={`/services/${slug}`}>{service.title}</Link>
        <span>/</span>
        <span>Đặt dịch vụ</span>
      </div>

      <div className="booking-intro">
        <span className="eyebrow">QUY TRÌNH ĐẶT DỊCH VỤ / {service.title.toUpperCase()}</span>
        <h1>
          Cùng lên kế hoạch<br />
          <span className="muted-heading">cho dự án của bạn.</span>
        </h1>
        <p>
          Không thu phí trước ở bước này. Bạn sẽ nhận được bản xác nhận phạm vi và lịch trình
          chi tiết từ Nguyễn Văn Tấn trước khi khởi động.
        </p>
      </div>

      <div className="booking-layout">
        <section className="booking-form-panel">
          {/* Stepper */}
          <div className="stepper">
            {[
              'Gói dịch vụ',
              'Yêu cầu dự án',
              'Tiện ích mở rộng',
              'Thanh toán & Ưu đãi',
              'Xác nhận'
            ].map((s, i) => (
              <button
                key={s}
                onClick={() => i + 1 < step && setStep(i + 1)}
                className={`stepper-step ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'done' : ''}`}
              >
                <span>{step > i + 1 ? <Check size={14} /> : `0${i + 1}`}</span>
                <b>{s}</b>
              </button>
            ))}
          </div>

          {/* Step 1: Package Selection */}
          {step === 1 && (
            <div className="booking-step">
              <span className="eyebrow">BƯỚC 01 / GÓI DỊCH VỤ</span>
              <h2>Chọn gói phạm vi phù hợp với bạn.</h2>
              <div className="booking-package-list">
                {service.packages?.map(p => (
                  <button
                    type="button"
                    onClick={() => setSelectedPackageId(p.id)}
                    className={`booking-package ${selectedPackageId === p.id ? 'selected' : ''}`}
                    key={p.id}
                  >
                    <span className="radio-dot" />
                    <div className="booking-package-name">
                      <b>{p.name}</b>
                      {p.popular === 1 && <span>PHỔ BIẾN NHẤT</span>}
                      <small>
                        {p.delivery_days} ngày bàn giao · {p.revisions} vòng chỉnh sửa
                      </small>
                    </div>
                    <strong>{money(p.price)}</strong>
                  </button>
                ))}
              </div>
              {pack && (
                <div className="package-features" style={{ marginTop: 16 }}>
                  {pack.features.map(f => (
                    <span key={f}>
                      <Check size={14} /> {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Project Requirements */}
          {step === 2 && (
            <div className="booking-step">
              <span className="eyebrow">BƯỚC 02 / YÊU CẦU DỰ ÁN</span>
              <h2>Mô tả bài toán bạn muốn giải quyết.</h2>
              <div className="form-grid">
                <Field label="Tên dự án" required>
                  <input
                    value={form.projectName}
                    onChange={e => change('projectName', e.target.value)}
                    placeholder="Ví dụ: Nền tảng bán hàng Gốm Sứ Việt"
                  />
                </Field>
                <Field label="Đối tượng khách hàng mục tiêu">
                  <input
                    value={form.targetAudience}
                    onChange={e => change('targetAudience', e.target.value)}
                    placeholder="Ví dụ: Khách hàng B2B, Startup, Người tiêu dùng cá nhân"
                  />
                </Field>
                <Field label="Mô tả bài toán & Mong muốn cốt lõi" required wide>
                  <textarea
                    rows={5}
                    value={form.description}
                    onChange={e => change('description', e.target.value)}
                    placeholder="Bạn muốn giải quyết vấn đề gì? Mục tiêu quan trọng nhất để coi dự án này thành công là gì?"
                  />
                </Field>
                <Field label="Tính năng ưu tiên mong muốn">
                  <textarea
                    rows={3}
                    value={form.features}
                    onChange={e => change('features', e.target.value)}
                    placeholder="Liệt kê các tính năng bạn đã nghĩ tới (Đăng nhập, Giỏ hàng, Quét mã VietQR...)"
                  />
                </Field>
                <Field label="Công nghệ mong muốn (nếu có)">
                  <input
                    value={form.technology}
                    onChange={e => change('technology', e.target.value)}
                    placeholder="Ví dụ: Next.js, Flutter, Node.js (để trống nếu cần tư vấn)"
                  />
                </Field>
                <Field label="Liên kết tham khảo (Figma, Website mẫu)">
                  <input
                    value={form.references}
                    onChange={e => change('references', e.target.value)}
                    placeholder="Link Figma, Google Drive hoặc website bạn thấy thích"
                  />
                </Field>
                <Field label="Thời hạn mong muốn hoàn thành">
                  <input
                    value={form.deadline}
                    onChange={e => change('deadline', e.target.value)}
                    placeholder="Ví dụ: Cuối tháng này / Trong vòng 3 tuần"
                  />
                </Field>
                <Field label="Ngân sách dự kiến">
                  <input
                    value={form.budget}
                    onChange={e => change('budget', e.target.value)}
                    placeholder="Ví dụ: 15.000.000đ - 25.000.000đ"
                  />
                </Field>
              </div>
            </div>
          )}

          {/* Step 3: Add-ons */}
          {step === 3 && (
            <div className="booking-step">
              <span className="eyebrow">BƯỚC 03 / TIỆN ÍCH MỞ RỘNG</span>
              <h2>Chọn thêm các module bạn cần.</h2>
              <p className="step-description">
                Chỉ chọn phần thực sự cần thiết. Bạn hoàn toàn có thể thảo luận và điều chỉnh
                trước khi chốt thỏa thuận.
              </p>
              <div className="addon-list">
                {addons.map(a => (
                  <label
                    className={`addon-option ${addonIds.includes(a.id) ? 'selected' : ''}`}
                    key={a.id}
                  >
                    <input
                      type="checkbox"
                      checked={addonIds.includes(a.id)}
                      onChange={() =>
                        setAddonIds(
                          addonIds.includes(a.id)
                            ? addonIds.filter(x => x !== a.id)
                            : [...addonIds, a.id]
                        )
                      }
                    />
                    <span className="custom-check">
                      <Check size={13} />
                    </span>
                    <span className="addon-copy">
                      <b>{a.title}</b>
                      <small>{a.description}</small>
                    </span>
                    <span className="addon-price">+ {money(a.price)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Coupons & Payment Method */}
          {step === 4 && (
            <div className="booking-step">
              <span className="eyebrow">BƯỚC 04 / ƯU ĐÃI & PHƯƠNG THỨC</span>
              <h2>Mã ưu đãi & Phương thức thanh toán.</h2>

              <div className="coupon-box">
                <span className="eyebrow" style={{ color: '#b7a9ff', marginBottom: 6, display: 'block' }}>
                  <Tag size={13} style={{ verticalAlign: -2 }} /> MÃ GIẢM GIÁ (COUPON)
                </span>
                <div className="coupon-input-group">
                  <input
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Ví dụ: VANTAN10, WELCOME500"
                  />
                  <button type="button" className="button button-quiet" onClick={verifyCoupon}>
                    Áp dụng
                  </button>
                </div>
                {couponStatus && (
                  <div className="coupon-applied-badge">
                    <Check size={12} /> {couponStatus}
                  </div>
                )}
                <small style={{ color: '#64748b', fontSize: 9, display: 'block', marginTop: 8 }}>
                  Mẹo: Nhập <b>VANTAN10</b> (Giảm 10% đơn từ 5tr) hoặc <b>WELCOME500</b> (Giảm 500k cho khách mới).
                </small>
              </div>

              <div style={{ marginTop: 24 }}>
                <span className="eyebrow" style={{ display: 'block', marginBottom: 8 }}>
                  <CreditCard size={13} style={{ verticalAlign: -2 }} /> CHỌN PHƯƠNG THỨC THANH TOÁN
                </span>
                <div className="payment-methods-grid">
                  {[
                    { id: 'vietqr', title: 'Quét mã VietQR', sub: 'Tự động & nhanh chóng qua mọi App Ngân hàng' },
                    { id: 'bank_transfer', title: 'Chuyển khoản thủ công', sub: 'Ủy nhiệm chi / Internet Banking truyền thống' },
                    { id: 'vnpay', title: 'Cổng VNPAY', sub: 'Thẻ ATM nội địa & Quét QR VNPAY' },
                    { id: 'momo', title: 'Ví điện tử MoMo', sub: 'Quét mã thanh toán qua ứng dụng MoMo' },
                    { id: 'stripe', title: 'Thẻ Quốc Tế (Stripe)', sub: 'Visa / MasterCard / AMEX quốc tế' }
                  ].map(m => (
                    <div
                      key={m.id}
                      className={`pay-method-card ${paymentMethod === m.id ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod(m.id as any)}
                    >
                      <span className="radio-dot" style={{ border: paymentMethod === m.id ? '4px solid #a793ff' : undefined }} />
                      <div>
                        <b>{m.title}</b>
                        <small>{m.sub}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review & Confirm */}
          {step === 5 && (
            <div className="booking-step">
              <span className="eyebrow">BƯỚC 05 / XÁC NHẬN</span>
              <h2>Kiểm tra thông tin trước khi gửi.</h2>

              <div className="review-summary">
                <div>
                  <span>DỊCH VỤ</span>
                  <b>{service.title}</b>
                </div>
                <div>
                  <span>GÓI ĐÃ CHỌN</span>
                  <b>
                    {pack?.name} · {pack?.delivery_days} ngày bàn giao
                  </b>
                </div>
                <div>
                  <span>TÊN DỰ ÁN</span>
                  <b>{form.projectName}</b>
                </div>
                <div>
                  <span>MÔ TẢ YÊU CẦU</span>
                  <p>{form.description}</p>
                </div>
                <div>
                  <span>TIỆN ÍCH MỞ RỘNG</span>
                  <b>
                    {chosenAddons.map(a => a.title).join(', ') || 'Không chọn'}
                  </b>
                </div>
                <div>
                  <span>PHƯƠNG THỨC THANH TOÁN</span>
                  <b>{paymentMethodLabel[paymentMethod]}</b>
                </div>
                <div className="review-total">
                  <span>TỔNG ĐẦU TƯ DỰ KIẾN</span>
                  <div>
                    {discountAmount > 0 && (
                      <span style={{ fontSize: 12, color: '#f87171', textDecoration: 'line-through', marginRight: 10 }}>
                        {money(subtotal)}
                      </span>
                    )}
                    <strong>{money(finalAmount)}</strong>
                  </div>
                  <small>
                    Dự kiến khoảng {totalDays} ngày làm việc · Chưa thu tiền ở bước gửi yêu cầu
                  </small>
                </div>
                <div className="payment-note">
                  <LockKeyhole size={15} />
                  <span>
                    Chưa thu tiền ở bước này. Bạn sẽ nhận được văn bản xác nhận phạm vi chi tiết.
                    Sau khi hai bên đồng ý, bạn có thể thanh toán đợt 1 qua VietQR để khởi động dự án.
                  </span>
                </div>
              </div>

              {!user && (
                <div className="signin-note">
                  Để gửi yêu cầu và theo dõi tiến độ, bạn cần{' '}
                  <Link to="/login" state={{ from: `/book/${slug}` }}>
                    đăng nhập hoặc tạo tài khoản
                  </Link>
                  .
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="form-error" role="alert" style={{ marginTop: 14 }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="booking-actions">
            {step > 1 && (
              <button className="button button-quiet" onClick={() => setStep(step - 1)}>
                Quay lại
              </button>
            )}
            <button
              className="button button-bright"
              disabled={busy}
              onClick={step === 5 ? submit : forward}
            >
              {busy
                ? 'Đang gửi...'
                : step === 5
                ? 'Gửi yêu cầu dự án'
                : 'Tiếp tục'}{' '}
              <ArrowRight size={15} />
            </button>
          </div>
        </section>

        {/* Summary Sidebar */}
        <aside className="booking-summary">
          <span className="eyebrow">TÓM TẮT DỰ ÁN</span>
          <h3>{service.title}</h3>
          <div className="summary-line">
            <span>Gói dịch vụ</span>
            <b>{pack?.name || 'Chưa chọn'}</b>
          </div>
          <div className="summary-line">
            <span>Thời gian bàn giao</span>
            <b>{totalDays || '—'} ngày</b>
          </div>
          {chosenAddons.map(a => (
            <div className="summary-line" key={a.id}>
              <span>{a.title}</span>
              <b>+{money(a.price)}</b>
            </div>
          ))}
          {discountAmount > 0 && (
            <div className="summary-line" style={{ color: '#4ade80' }}>
              <span>Mã giảm giá ({couponCode})</span>
              <b>-{money(discountAmount)}</b>
            </div>
          )}
          <div className="summary-total">
            <span>Tổng đầu tư dự kiến</span>
            <b>{money(finalAmount)}</b>
          </div>
          <p>
            Đây là khoản đầu tư theo phạm vi lựa chọn ban đầu. Toàn bộ mã nguồn bàn giao
            thuộc 100% quyền sở hữu của bạn.
          </p>
          <div className="summary-help">
            <MessageCircle size={15} />
            <span>
              Cần giải đáp trước? <Link to="/contact">Nhắn tin trực tiếp</Link>
            </span>
          </div>
        </aside>
      </div>
    </main>
  );
}

// ==========================================
// CUSTOM PROJECT ESTIMATOR PAGE
// ==========================================

function Estimator() {
  const [type, setType] = useState('Website / Web application');
  const [features, setFeatures] = useState<string[]>([]);
  const [pages, setPages] = useState(5);
  const [maintenance, setMaintenance] = useState(false);

  const base =
    type === 'Mobile app'
      ? 18000000
      : type === 'SaaS / Nền tảng số'
      ? 22000000
      : type === 'API / Backend'
      ? 8500000
      : type === 'UI/UX Design System'
      ? 7000000
      : 6500000;

  const featureCosts: Record<string, number> = {
    'Tài khoản & Phân quyền (RBAC)': 2200000,
    'Thanh toán Quét mã VietQR tự động': 3200000,
    'Custom Admin Dashboard': 4500000,
    'Tích hợp API hệ thống bên thứ 3': 2000000,
    'Cơ sở dữ liệu riêng (PostgreSQL)': 2500000,
    'AI / Tự động hóa quy trình': 6000000,
    'Triển khai Production & Docker CI/CD': 1800000,
    'SEO Kỹ thuật & Tối ưu Lighthouse 95+': 1200000
  };

  const total =
    base +
    Math.max(0, pages - 5) * 850000 +
    features.reduce((n, f) => n + (featureCosts[f] || 0), 0) +
    (maintenance ? 2800000 : 0);

  return (
    <main className="page-main">
      <div className="page-hero compact">
        <span className="eyebrow">ƯỚC TÍNH DỰ ÁN TÙY BIẾN / PROJECT ESTIMATOR</span>
        <h1>
          Ý tưởng của bạn,<br />
          <span className="muted-heading">một con số tham khảo rõ ràng.</span>
        </h1>
        <p>
          Chọn các tiêu chí bên dưới để ước tính khoảng đầu tư ban đầu cho phần mềm của bạn.
          Sau đó, tôi sẽ cùng bạn phân tích kiến trúc chi tiết.
        </p>
      </div>

      <div className="estimator-layout">
        <section className="estimate-controls">
          <div className="estimate-section">
            <span className="estimate-number">01</span>
            <div>
              <label>Loại sản phẩm cần xây dựng</label>
              <div className="choice-row">
                {[
                  'Website / Web application',
                  'Mobile app',
                  'SaaS / Nền tảng số',
                  'API / Backend',
                  'UI/UX Design System'
                ].map(x => (
                  <button
                    key={x}
                    className={type === x ? 'selected' : ''}
                    onClick={() => setType(x)}
                  >
                    {x}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="estimate-section">
            <span className="estimate-number">02</span>
            <div>
              <label>Tính năng & Module dự kiến</label>
              <div className="feature-check-grid">
                {Object.keys(featureCosts).map(x => (
                  <label key={x}>
                    <input
                      type="checkbox"
                      checked={features.includes(x)}
                      onChange={() =>
                        setFeatures(
                          features.includes(x)
                            ? features.filter(f => f !== x)
                            : [...features, x]
                        )
                      }
                    />
                    <span className="custom-check">
                      <Check size={13} />
                    </span>
                    <span>{x}</span>
                    <small>+{money(featureCosts[x])}</small>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="estimate-section">
            <span className="estimate-number">03</span>
            <div className="page-count">
              <label htmlFor="pagecount">Số lượng trang / màn hình dự kiến: <b>{pages}</b></label>
              <div>
                <input
                  id="pagecount"
                  type="range"
                  min="3"
                  max="30"
                  value={pages}
                  onChange={e => setPages(+e.target.value)}
                />
              </div>
              <small>Ước tính theo các màn hình hoặc view chức năng chính.</small>
            </div>
          </div>

          <div className="estimate-section">
            <span className="estimate-number">04</span>
            <div>
              <label className="maintenance-choice">
                <span>Gói bảo hành & đồng hành mở rộng (60 ngày)</span>
                <input
                  type="checkbox"
                  checked={maintenance}
                  onChange={e => setMaintenance(e.target.checked)}
                />
                <span className="custom-check">
                  <Check size={13} />
                </span>
              </label>
              <small>Hỗ trợ theo dõi máy chủ, tối ưu hiệu năng và sửa lỗi kỹ thuật định kỳ.</small>
            </div>
          </div>
        </section>

        <aside className="estimate-result">
          <div className="estimate-result-top">
            <span className="eyebrow">KHOẢNG ĐẦU TƯ THAM KHẢO</span>
            <span className="signal-dot" />
          </div>
          <span className="estimate-type">
            {type} · ~{pages} màn hình chức năng
          </span>
          <strong>
            {money(total)} <i>—</i>
            <br />
            {money(Math.round(total * 1.35))}
          </strong>
          <span className="estimate-range">Khoảng ước tính dựa trên độ phức tạp của module</span>

          <div className="estimate-divider" />

          <div className="estimate-breakdown">
            <span>
              Phần mềm nền tảng <b>{money(base)}</b>
            </span>
            <span>
              {pages} màn hình / trang <b>{money(Math.max(0, pages - 5) * 850000)}</b>
            </span>
            <span>
              {features.length} module nâng cao{' '}
              <b>{money(features.reduce((n, f) => n + featureCosts[f], 0))}</b>
            </span>
            {maintenance && (
              <span>
                Bảo hành mở rộng 60 ngày <b>{money(2800000)}</b>
              </span>
            )}
          </div>

          <div className="estimate-warning">
            <span>ⓘ</span>
            <p>
              Đây là giá ước tính tham khảo, chưa phải báo giá cuối cùng.
              Chi phí chính xác sẽ được chốt sau khi tôi phân tích đặc tả yêu cầu cùng bạn.
            </p>
          </div>

          <Link
            to={`/contact?type=${encodeURIComponent(type)}&pages=${pages}&budget=${encodeURIComponent(
              `${money(total)} - ${money(Math.round(total * 1.35))}`
            )}`}
            className="button button-bright button-full"
          >
            Yêu cầu báo giá chi tiết <ArrowUpRight size={15} />
          </Link>
          <small className="estimate-foot">
            Không tạo ràng buộc hợp đồng hay thu phí ở bước ước tính.
          </small>
        </aside>
      </div>
    </main>
  );
}

// ==========================================
// AUTHENTICATION PAGES & QUICK DEMO LOGINS
// ==========================================

function AuthPage({ mode }: { mode: 'login' | 'register' | 'forgot' }) {
  const { setUser, flash } = useApp();
  const nav = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || '/dashboard';

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [terms, setTerms] = useState(false);

  const register = mode === 'register';
  const forgot = mode === 'forgot';

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (forgot) {
      setBusy(true);
      try {
        const res = await api<{ sent: boolean; demoToken?: string }>('/api/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email })
        });
        setSuccessMsg(
          res.demoToken
            ? `Mã đặt lại mật khẩu thử nghiệm: ${res.demoToken} (Đã gửi xử lý)`
            : 'Đã gửi hướng dẫn đặt lại mật khẩu vào email của bạn.'
        );
      } catch (err: any) {
        setError(err.message);
      } finally {
        setBusy(false);
      }
      return;
    }

    if (register && password !== confirm) {
      setError('Mật khẩu nhập lại chưa khớp.');
      return;
    }

    setBusy(true);
    try {
      const data = await api<User>(`/api/auth/${register ? 'register' : 'login'}`, {
        method: 'POST',
        body: JSON.stringify(
          register
            ? { name, email, password, phone, company, terms }
            : { email, password }
        )
      });
      setUser(data);
      flash(register ? 'Chào mừng bạn! Tài khoản đã được kích hoạt.' : 'Đăng nhập thành công.');
      nav(data.role === 'admin' ? '/admin' : from, { replace: true });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  // Quick login helper for demo reviewer
  const quickLogin = async (demoEmail: string, demoPass: string) => {
    setBusy(true);
    setError('');
    try {
      const data = await api<User>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: demoEmail, password: demoPass })
      });
      setUser(data);
      flash(`Đăng nhập thành công với vai trò ${data.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}!`);
      nav(data.role === 'admin' ? '/admin' : from, { replace: true });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-art">
        <div className="auth-pattern" />
        <span className="eyebrow">VANTANTHEDEV / CLIENT WORKSPACE</span>
        <div className="auth-art-copy">
          <div className="auth-mark">
            VT<span>·</span>DEV
          </div>
          <h2>
            Không gian để dự án<br />
            của bạn <span>tiến lên.</span>
          </h2>
          <p>
            Theo dõi tiến độ theo thời gian thực, trao đổi trực tiếp cùng Nguyễn Văn Tấn
            và quản lý mọi tài liệu, hóa đơn dự án ở cùng một nơi.
          </p>
          <div className="auth-value">
            <Check /> Lộ trình dự án 06 mốc minh bạch
          </div>
          <div className="auth-value">
            <Check /> Trao đổi & duyệt file bàn giao trực tiếp
          </div>
          <div className="auth-value">
            <Check /> Hóa đơn điện tử & thanh toán VietQR an toàn
          </div>
        </div>
        <span className="auth-art-foot">
          INDEPENDENT COMMERCIAL STUDIO · NGUYỄN VĂN TẤN
        </span>
      </div>

      <div className="auth-form-side">
        <div className="auth-mobile-brand">
          <span className="brand-mark">
            <Code2 size={16} />
          </span>{' '}
          VanTanThe<span className="brand-accent">DEV</span>
        </div>
        <div className="auth-form-wrap">
          <span className="eyebrow">
            {forgot
              ? 'KHÔI PHỤC TÀI KHOẢN'
              : register
              ? 'TẠO TÀI KHOẢN KHÁCH HÀNG'
              : 'CHÀO MỪNG TRỞ LẠI'}
          </span>
          <h1>
            {forgot
              ? 'Đặt lại mật khẩu.'
              : register
              ? 'Bắt đầu dự án mới.'
              : 'Đăng nhập.'}
          </h1>
          <p>
            {forgot
              ? 'Nhập email đã đăng ký để nhận mã khôi phục mật khẩu.'
              : register
              ? 'Tạo tài khoản để gửi yêu cầu và theo dõi tiến độ dự án.'
              : 'Mở không gian dự án của bạn tại VanTanTheDEV.'}
          </p>

          <form onSubmit={submit} className="auth-form">
            {register && (
              <>
                <Field label="Họ và tên của bạn" required>
                  <input
                    autoComplete="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Nguyễn Văn An"
                    minLength={2}
                    required
                  />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Field label="Số điện thoại">
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="0901234567"
                    />
                  </Field>
                  <Field label="Công ty / Doanh nghiệp">
                    <input
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                      placeholder="Công ty TNHH ABC"
                    />
                  </Field>
                </div>
              </>
            )}

            <Field label="Địa chỉ Email" required>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ban@doanhnghiep.com"
                required
              />
            </Field>

            {!forgot && (
              <Field label="Mật khẩu" required>
                <input
                  type="password"
                  autoComplete={register ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={register ? 'Tối thiểu 8 ký tự bảo mật' : '••••••••••'}
                  minLength={8}
                  required
                />
              </Field>
            )}

            {register && (
              <>
                <Field label="Nhập lại mật khẩu" required>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    required
                  />
                </Field>
                <label className="terms-check">
                  <input
                    type="checkbox"
                    checked={terms}
                    onChange={e => setTerms(e.target.checked)}
                    required
                  />
                  <span className="custom-check">
                    <Check size={12} />
                  </span>
                  <span>
                    Tôi đồng ý với <Link to="/terms">Điều khoản dịch vụ</Link> và{' '}
                    <Link to="/privacy">Chính sách quyền riêng tư</Link>.
                  </span>
                </label>
              </>
            )}

            {!register && !forgot && (
              <div style={{ textAlign: 'right', marginTop: -6 }}>
                <Link to="/forgot-password" style={{ color: '#94a3b8', fontSize: 10 }}>
                  Quên mật khẩu?
                </Link>
              </div>
            )}

            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
            {successMsg && (
              <div style={{ padding: 10, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 4, color: '#86efac', fontSize: 11 }}>
                {successMsg}
              </div>
            )}

            <button
              className="button button-bright button-full"
              disabled={busy || (register && !terms)}
            >
              {busy
                ? 'Đang xử lý...'
                : forgot
                ? 'Gửi mã khôi phục'
                : register
                ? 'Tạo tài khoản'
                : 'Đăng nhập'}{' '}
              <ArrowRight size={15} />
            </button>
          </form>

          {/* Quick Demo Logins for Reviewer */}
          {!register && !forgot && (
            <div className="demo-accounts-box">
              <p>⚡ TRẢI NGHIỆM NHANH (TÀI KHOẢN MẪU CÓ SẴN DỮ LIỆU):</p>
              <div className="demo-buttons-row">
                <button
                  type="button"
                  className="demo-pill-btn"
                  onClick={() => quickLogin('admin@vantanthedev.com', 'Admin@2026!')}
                >
                  <b>Quản trị viên (Admin)</b>
                  <small>Nguyễn Văn Tấn</small>
                </button>
                <button
                  type="button"
                  className="demo-pill-btn"
                  onClick={() => quickLogin('khachhang@example.com', 'Customer@2026!')}
                >
                  <b>Khách hàng (Customer)</b>
                  <small>Lê Hoàng Nam (TechViet)</small>
                </button>
              </div>
            </div>
          )}

          <div className="auth-switch">
            {register ? (
              <>
                Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
              </>
            ) : forgot ? (
              <>
                Nhớ mật khẩu? <Link to="/login">Quay lại đăng nhập</Link>
              </>
            ) : (
              <>
                Chưa có tài khoản? <Link to="/register">Tạo tài khoản mới</Link>
              </>
            )}
          </div>

          <div className="auth-security">
            <LockKeyhole size={14} />
            <span>Mật khẩu mã hóa bảo mật scrypt · Phiên đăng nhập HTTP-only an toàn.</span>
          </div>
        </div>

        <div className="auth-bottom">
          <Link to="/">← Quay lại trang chủ</Link>
          <span>HỖ TRỢ TRỰC TIẾP · VANTANTHEDEV</span>
        </div>
      </div>
    </main>
  );
}

// ==========================================
// CUSTOMER DASHBOARD
// ==========================================

function RequireUser({
  children,
  adminOnly = false
}: {
  children: ReactNode;
  adminOnly?: boolean;
}) {
  const { user, ready } = useApp();
  const loc = useLocation();

  if (!ready) {
    return (
      <main className="page-main">
        <div className="loading-row">Đang xác thực phiên làm việc…</div>
      </main>
    );
  }
  if (!user) return <NavigateToLogin from={loc.pathname} />;
  if (adminOnly && user.role !== 'admin') {
    return (
      <main className="page-main">
        <Empty
          title="Khu vực dành riêng cho Quản trị viên"
          text="Tài khoản hiện tại không có quyền truy cập hệ thống quản trị VanTanTheDEV."
          action="Về trang tổng quan"
          to="/dashboard"
        />
      </main>
    );
  }
  return <>{children}</>;
}

function NavigateToLogin({ from }: { from: string }) {
  const nav = useNavigate();
  useEffect(() => {
    nav('/login', { replace: true, state: { from } });
  }, [nav, from]);
  return (
    <main className="page-main">
      <div className="loading-row">Đang chuyển hướng đến đăng nhập…</div>
    </main>
  );
}

function Dashboard() {
  return (
    <RequireUser>
      <div className="workspace">
        <DashboardNav />
        <div className="workspace-main">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="messages" element={<OrdersPage messages />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="*" element={<DashboardHome />} />
          </Routes>
        </div>
      </div>
    </RequireUser>
  );
}

function DashboardNav() {
  const { user, setUser, flash } = useApp();
  const nav = useNavigate();

  const links = [
    ['', 'Tổng quan', LayoutDashboard],
    ['orders', 'Đơn hàng & Dự án', Layers],
    ['messages', 'Trao đổi dự án', MessageCircle],
    ['favorites', 'Dịch vụ đã lưu', Heart],
    ['invoices', 'Thanh toán & Hóa đơn', CreditCard],
    ['notifications', 'Thông báo', Bell],
    ['profile', 'Hồ sơ & Bảo mật', ShieldCheck]
  ];

  async function logout() {
    await api('/api/auth/logout', { method: 'POST', body: '{}' }).catch(() => {});
    setUser(null);
    flash('Đã đăng xuất an toàn.');
    nav('/');
  }

  return (
    <aside className="workspace-nav">
      <Link className="workspace-brand" to="/dashboard">
        <span className="brand-mark">
          <Code2 size={15} />
        </span>
        CLIENT SPACE
      </Link>
      <span className="workspace-nav-label">QUẢN TRỊ DỰ ÁN CỦA BẠN</span>
      {links.map(([path, label, Icon]: any) => (
        <NavLink
          key={path}
          end={path === ''}
          to={`/dashboard${path ? `/${path}` : ''}`}
          className={({ isActive }) => `workspace-link ${isActive ? 'active' : ''}`}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Icon size={14} style={{ color: 'inherit' }} />
            {label}
          </span>
          <span>{path === 'orders' ? '↗' : ''}</span>
        </NavLink>
      ))}

      {user?.role === 'admin' && (
        <Link
          to="/admin"
          className="workspace-link"
          style={{ marginTop: 8, background: 'rgba(124,92,255,0.1)', color: '#c4b5fd' }}
        >
          <span>⚡ Bảng Quản Trị Studio</span>
          <ArrowUpRight size={13} />
        </Link>
      )}

      <div className="workspace-account">
        <div className="account-initial">{user?.name.slice(0, 1).toUpperCase()}</div>
        <div>
          <b>{user?.name}</b>
          <small>{user?.email}</small>
        </div>
        <button title="Đăng xuất" onClick={logout}>
          ↗
        </button>
      </div>
    </aside>
  );
}

function DashboardHome() {
  const { user } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    api<Order[]>('/api/me/orders').then(setOrders).catch(() => {});
    api<any[]>('/api/me/notifications').then(setNotifications).catch(() => {});
  }, []);

  const active = orders.filter(o => !['completed', 'cancelled'].includes(o.status));

  return (
    <div className="dashboard-content">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">CLIENT WORKSPACE / TỔNG QUAN</span>
          <h1>Chào {user?.name.split(' ').slice(-1)[0]}.</h1>
          <p>Không gian quản lý tiến độ, trao đổi trực tiếp và thanh toán dự án phần mềm.</p>
        </div>
        <Link to="/custom-project" className="button button-bright">
          Tạo yêu cầu mới <ArrowUpRight size={15} />
        </Link>
      </div>

      <div className="dash-metrics">
        <Metric label="Đang triển khai" value={active.length} note="dự án đang trong tiến độ" />
        <Metric
          label="Chờ xác nhận"
          value={orders.filter(o => o.status === 'pending').length}
          note="yêu cầu mới gửi"
        />
        <Metric
          label="Hoàn tất bàn giao"
          value={orders.filter(o => o.status === 'completed').length}
          note="dự án đã hoàn thành"
        />
        <Metric
          label="Thông báo mới"
          value={notifications.filter(n => !n.read_at).length}
          note="chưa đọc"
        />
      </div>

      <div className="dash-columns">
        <section className="dash-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">DỰ ÁN GẦN ĐÂY</span>
              <h2>Tiến độ công việc</h2>
            </div>
            <Link to="/dashboard/orders">
              Tất cả ({orders.length}) <ArrowRight size={14} />
            </Link>
          </div>
          {orders.length ? (
            orders.slice(0, 4).map(o => <OrderRow key={o.id} order={o} />)
          ) : (
            <Empty
              title="Chưa có dự án nào"
              text="Khi bạn gửi yêu cầu, lộ trình và tiến độ chi tiết sẽ hiển thị tại đây."
              action="Khám phá dịch vụ"
              to="/services"
              compact
            />
          )}
        </section>

        <section className="dash-panel update-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">CẬP NHẬT HỆ THỐNG</span>
              <h2>Thông báo mới</h2>
            </div>
            <Bell size={16} />
          </div>
          {notifications.length ? (
            notifications.slice(0, 4).map(n => (
              <div className="notification-row" key={n.id}>
                <i className={n.read_at ? 'read' : ''} />
                <div>
                  <b>{n.title}</b>
                  <p>{n.body}</p>
                  <small>{date(n.created_at)}</small>
                </div>
              </div>
            ))
          ) : (
            <div className="quiet-empty">
              <span className="quiet-mark">·</span>
              <p>Mọi cập nhật tiến độ sẽ xuất hiện ở đây.</p>
            </div>
          )}
        </section>
      </div>

      <div className="dashboard-next">
        <div>
          <span className="eyebrow">CẦN XÂY DỰNG TÍNH NĂNG MỚI?</span>
          <b>Biến một bài toán thành sản phẩm thực tế.</b>
        </div>
        <Link to="/services">
          Xem các gói dịch vụ <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  note
}: {
  label: string;
  value: number | string;
  note: string;
}) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <b>{value}</b>
      <small>{note}</small>
    </div>
  );
}

function OrderRow({ order }: { order: Order }) {
  return (
    <Link className="order-row" to={`/dashboard/orders/${order.id}`}>
      <span className="order-avatar">
        {order.project_name?.slice(0, 1).toUpperCase()}
      </span>
      <span className="order-description">
        <b>{order.project_name}</b>
        <small>
          {order.service_title} · Mã: {order.order_number}
        </small>
      </span>
      <Status value={order.status} />
      <b className="order-amount">{money(order.amount)}</b>
      <ArrowRight size={15} />
    </Link>
  );
}

function OrdersPage({ messages = false }: { messages?: boolean }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Order[]>('/api/me/orders')
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-content">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">
            CLIENT SPACE / {messages ? 'TRAO ĐỔI DỰ ÁN' : 'DANH SÁCH DỰ ÁN'}
          </span>
          <h1>{messages ? 'Trao đổi & Phản hồi' : 'Đơn hàng & Dự án'}</h1>
          <p>
            {messages
              ? 'Mọi cuộc trò chuyện gắn liền với từng đơn hàng cụ thể.'
              : 'Theo dõi lộ trình, trạng thái thanh toán và sản phẩm bàn giao.'}
          </p>
        </div>
        <Link to="/services" className="button button-bright">
          Thêm dự án mới <ArrowUpRight size={15} />
        </Link>
      </div>

      {loading ? (
        <div className="loading-row">Đang tải danh sách dự án…</div>
      ) : orders.length ? (
        <div className="orders-list">
          {orders.map(o => (
            <Link to={`/dashboard/orders/${o.id}`} className="order-large" key={o.id}>
              <div className="order-large-top">
                <span>{o.order_number}</span>
                <span>Ngày tạo: {date(o.created_at)}</span>
              </div>
              <h3>{o.project_name}</h3>
              <p>
                {o.service_title} <i>/</i> Gói {o.package_name}
              </p>
              <div className="order-large-bottom">
                <Status value={o.status} />
                <span className="pay-tag" style={{ marginLeft: 8 }}>
                  Thanh toán: <b>{statusLabel[o.payment_status] || o.payment_status}</b>
                </span>
                <b>{money(o.amount)}</b>
                <ArrowRight size={15} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Empty
          title="Bạn chưa có dự án nào"
          text="Chọn một dịch vụ tiêu chuẩn hoặc yêu cầu dự án tùy biến để bắt đầu."
          action="Khám phá dịch vụ"
          to="/services"
        />
      )}
    </div>
  );
}

const journey = [
  ['pending', 'Yêu cầu mới'],
  ['confirmed', 'Đã xác nhận'],
  ['in_progress', 'Đang phát triển'],
  ['waiting_customer', 'Chờ phản hồi'],
  ['revision', 'Chỉnh sửa'],
  ['completed', 'Hoàn tất & Bàn giao']
];

function OrderDetail() {
  const { id = '' } = useParams();
  const { openVietQr, openInvoice, flash } = useApp();

  const [order, setOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [body, setBody] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [chatErr, setChatErr] = useState('');

  // Payment proof form
  const [paymentRef, setPaymentRef] = useState('');
  const [proofBusy, setProofBusy] = useState(false);
  const [proofMsg, setProofMsg] = useState('');

  // File upload form
  const [uploadName, setUploadName] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadBusy, setUploadBusy] = useState(false);

  // Review
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState('');
  const [reviewMsg, setReviewMsg] = useState('');

  const loadOrder = async () => {
    try {
      const data = await api<Order>(`/api/me/orders/${id}`);
      setOrder(data);
    } catch {}
  };

  const loadMessages = async () => {
    try {
      const msgs = await api<any[]>(`/api/me/orders/${id}/messages`);
      setMessages(msgs);
    } catch {}
  };

  useEffect(() => {
    loadOrder();
    loadMessages();
  }, [id]);

  const sendMsg = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setChatErr('');
    try {
      await api(`/api/me/orders/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body, attachmentUrl: attachmentUrl.trim() || undefined })
      });
      setBody('');
      setAttachmentUrl('');
      loadMessages();
    } catch (err: any) {
      setChatErr(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitProof = async (e: FormEvent) => {
    e.preventDefault();
    if (!paymentRef.trim()) return;
    setProofBusy(true);
    setProofMsg('');
    try {
      await api(`/api/me/orders/${id}/payment-proof`, {
        method: 'POST',
        body: JSON.stringify({ reference: paymentRef })
      });
      setProofMsg('Đã gửi thông tin đối soát. Quản trị viên sẽ kiểm tra và kích hoạt dự án.');
      flash('Đã gửi thông tin chuyển khoản đối soát!');
      loadOrder();
      loadMessages();
    } catch (err: any) {
      setProofMsg(`Lỗi: ${err.message}`);
    } finally {
      setProofBusy(false);
    }
  };

  const uploadFile = async (e: FormEvent) => {
    e.preventDefault();
    if (!uploadName.trim() || !uploadUrl.trim()) return;
    setUploadBusy(true);
    try {
      await api(`/api/me/orders/${id}/files`, {
        method: 'POST',
        body: JSON.stringify({
          fileName: uploadName,
          fileUrl: uploadUrl,
          fileType: 'document',
          isDeliverable: false
        })
      });
      setUploadName('');
      setUploadUrl('');
      flash('Đã thêm tệp tài liệu vào dự án!');
      loadOrder();
    } catch (err: any) {
      flash(err.message);
    } finally {
      setUploadBusy(false);
    }
  };

  const submitReview = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api(`/api/me/orders/${id}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, body: reviewBody })
      });
      setReviewMsg('Đánh giá của bạn đã được gửi và đang chờ duyệt!');
      flash('Cảm ơn bạn đã đánh giá dự án!');
      loadOrder();
    } catch (err: any) {
      setReviewMsg(err.message);
    }
  };

  if (!order) {
    return (
      <div className="dashboard-content">
        <div className="loading-row">Đang tải thông tin chi tiết dự án…</div>
      </div>
    );
  }

  const stage =
    order.status === 'pending'
      ? 1
      : order.status === 'confirmed'
      ? 2
      : order.status === 'in_progress'
      ? 3
      : order.status === 'waiting_customer'
      ? 4
      : order.status === 'revision'
      ? 5
      : order.status === 'completed'
      ? 6
      : -1;

  return (
    <div className="dashboard-content">
      <div className="breadcrumbs">
        <Link to="/dashboard/orders">Đơn hàng & Dự án</Link>
        <span>/</span>
        <span>{order.order_number}</span>
      </div>

      <div className="order-detail-head">
        <div>
          <span className="eyebrow">DỰ ÁN / MÃ {order.order_number}</span>
          <h1>{order.project_name}</h1>
          <p>
            {order.service_title} · Gói {order.package_name} · Tạo ngày {date(order.created_at)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="button button-small button-quiet"
            onClick={() => openInvoice(order)}
            title="Xem hóa đơn điện tử"
          >
            <Printer size={14} /> Hóa đơn
          </button>
          {order.payment_status !== 'paid' && (
            <button
              className="button button-small button-bright"
              onClick={() => openVietQr(order.order_number, order.amount)}
            >
              <QrCode size={14} /> Thanh toán VietQR
            </button>
          )}
          <Status value={order.status} />
        </div>
      </div>

      {/* Project Timeline Track */}
      <div className="project-timeline">
        <div className="timeline-head">
          <div>
            <span className="eyebrow">LỘ TRÌNH TRIỂN KHAI</span>
            <h2>
              {stage === 1
                ? 'Đang phân tích yêu cầu ban đầu'
                : stage === 6
                ? 'Dự án đã hoàn tất & nghiệm thu bàn giao'
                : 'Mỗi mốc, một bước tiến vững chắc.'}
            </h2>
          </div>
          <span>
            {stage < 0
              ? 'ĐƠN ĐÃ HỦY'
              : `${Math.min(stage, 6)} / 06 MỐC TIẾN ĐỘ`}
          </span>
        </div>

        <div className="timeline-track">
          {journey.map(([key, label], i) => (
            <div
              className={`timeline-step ${stage > i + 1 ? 'complete' : ''} ${stage === i + 1 ? 'current' : ''}`}
              key={key}
            >
              <span>{stage > i + 1 ? <Check size={12} /> : `0${i + 1}`}</span>
              <b>{label}</b>
            </div>
          ))}
        </div>
        <p className="timeline-note">
          Tiến độ được cập nhật trực tiếp bởi Nguyễn Văn Tấn theo từng mốc bàn giao thực tế.
        </p>
      </div>

      {/* VietQR Quick Payment Box if unpaid */}
      {order.payment_status !== 'paid' && (
        <div
          className="dash-panel"
          style={{
            marginTop: 14,
            borderColor: 'rgba(124, 92, 255, 0.4)',
            background: 'linear-gradient(145deg, rgba(124, 92, 255, 0.05), #101319)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <span className="eyebrow" style={{ color: '#b7a9ff' }}>
                THANH TOÁN DỰ ÁN QUA VIETQR
              </span>
              <h3 style={{ margin: '4px 0 0', font: '600 15px var(--display)' }}>
                Quét mã QR Ngân Hàng hoặc Chuyển khoản
              </h3>
            </div>
            <button
              className="button button-small button-bright"
              onClick={() => openVietQr(order.order_number, order.amount)}
            >
              <QrCode size={14} /> Mở mã VietQR lớn
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr', gap: 20, alignItems: 'center' }}>
            <div
              style={{
                background: '#fff',
                padding: 6,
                borderRadius: 8,
                textAlign: 'center',
                cursor: 'pointer'
              }}
              onClick={() => openVietQr(order.order_number, order.amount)}
            >
              <img
                src={generateVietQrUrl('MB', '0987654321', order.amount, order.order_number)}
                alt="VietQR Code"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
              <span style={{ fontSize: 9, color: '#111', fontWeight: 600 }}>Bấm để phóng to</span>
            </div>

            <div className="vietqr-bank-details" style={{ margin: 0 }}>
              <div className="bank-row">
                <span>Ngân hàng:</span>
                <b>MB Bank (Quân Đội)</b>
              </div>
              <div className="bank-row">
                <span>Số tài khoản:</span>
                <div>
                  <b>0987654321</b>
                  <button
                    className="copy-pill"
                    onClick={() => {
                      navigator.clipboard.writeText('0987654321');
                      flash('Đã sao chép STK!');
                    }}
                  >
                    Sao chép
                  </button>
                </div>
              </div>
              <div className="bank-row">
                <span>Chủ tài khoản:</span>
                <b>NGUYEN VAN TAN</b>
              </div>
              <div className="bank-row">
                <span>Số tiền:</span>
                <div>
                  <b style={{ color: '#60d3a2' }}>{money(order.amount)}</b>
                  <button
                    className="copy-pill"
                    onClick={() => {
                      navigator.clipboard.writeText(String(order.amount));
                      flash('Đã sao chép số tiền!');
                    }}
                  >
                    Sao chép
                  </button>
                </div>
              </div>
              <div className="bank-row">
                <span>Nội dung CK:</span>
                <div>
                  <b style={{ color: '#a08cff' }}>{order.order_number}</b>
                  <button
                    className="copy-pill"
                    onClick={() => {
                      navigator.clipboard.writeText(order.order_number);
                      flash('Đã sao chép nội dung!');
                    }}
                  >
                    Sao chép
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={submitProof} style={{ background: '#0d1017', padding: 14, borderRadius: 6, border: '1px solid var(--border)' }}>
              <span className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>
                XÁC NHẬN ĐÃ CHUYỂN KHOẢN
              </span>
              <Field label="Mã giao dịch ngân hàng / FT" required>
                <input
                  value={paymentRef}
                  onChange={e => setPaymentRef(e.target.value)}
                  placeholder="Ví dụ: FT2608123456"
                  required
                />
              </Field>
              <button
                className="button button-small button-bright button-full"
                disabled={proofBusy}
                style={{ marginTop: 10 }}
              >
                {proofBusy ? 'Đang gửi...' : 'Gửi mã đối soát'} <ArrowRight size={13} />
              </button>
              {proofMsg && (
                <small style={{ color: '#86efac', display: 'block', marginTop: 6, fontSize: 8 }}>
                  {proofMsg}
                </small>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Grid: Requirements & Conversation */}
      <div className="order-detail-grid">
        <section className="dash-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">YÊU CẦU DỰ ÁN</span>
              <h2>Phạm vi đã thỏa thuận</h2>
            </div>
          </div>
          <p className="detail-description">{order.description}</p>

          <div className="requirements-grid">
            <div>
              <span>ĐỐI TƯỢNG NGƯỜI DÙNG</span>
              <b>{order.requirements?.targetAudience || 'Khách hàng mục tiêu'}</b>
            </div>
            <div>
              <span>THỜI HẠN MONG MUỐN</span>
              <b>{order.requirements?.deadline || 'Theo tiến độ gói'}</b>
            </div>
            <div>
              <span>CÔNG NGHỆ ƯU TIÊN</span>
              <b>{order.requirements?.technology || 'Nguyễn Văn Tấn đề xuất'}</b>
            </div>
            <div>
              <span>TIỆN ÍCH ĐÃ CHỌN</span>
              <b>{(order.addons || []).map((a: any) => a.title).join(', ') || 'Không có'}</b>
            </div>
          </div>

          <div className="payment-breakdown">
            <div>
              <span>Tạm tính (Gói & Tiện ích):</span>
              <b>{money(order.subtotal || order.amount)}</b>
            </div>
            {order.discount_amount > 0 && (
              <div style={{ color: '#4ade80' }}>
                <span>Ưu đãi ({order.coupon_code || 'Coupon'}):</span>
                <b>-{money(order.discount_amount)}</b>
              </div>
            )}
            <div>
              <span>Tổng thanh toán:</span>
              <b style={{ fontSize: 13, color: '#f1f5f9' }}>{money(order.amount)}</b>
            </div>
            <div>
              <span>Trạng thái thanh toán:</span>
              <Status value={order.payment_status} />
            </div>
            {order.payment_reference && (
              <div>
                <span>Mã giao dịch đối soát:</span>
                <span style={{ fontFamily: 'var(--mono)', color: '#a08cff', fontSize: 10 }}>
                  {order.payment_reference}
                </span>
              </div>
            )}
          </div>

          {/* Project Files & Deliverables Section */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span className="eyebrow">
                <FileText size={13} style={{ verticalAlign: -2 }} /> TÀI LIỆU & SẢN PHẨM BÀN GIAO ({order.files?.length || 0})
              </span>
            </div>

            <div className="files-panel">
              {order.files && order.files.length > 0 ? (
                order.files.map((f: any) => (
                  <div className="file-row" key={f.id}>
                    <div className="file-info">
                      <FileText size={15} style={{ color: f.is_deliverable ? '#50d9e8' : '#a08cff' }} />
                      <div>
                        <b>{f.file_name}</b>
                        <small style={{ display: 'block', color: '#64748b' }}>
                          {date(f.created_at)}
                        </small>
                      </div>
                      {f.is_deliverable ? (
                        <span className="deliverable-tag">SẢN PHẨM BÀN GIAO</span>
                      ) : null}
                    </div>
                    <a
                      href={f.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-button"
                      style={{ color: '#5bd7de' }}
                    >
                      <Download size={13} /> Mở tệp
                    </a>
                  </div>
                ))
              ) : (
                <div className="quiet-empty" style={{ minHeight: 70 }}>
                  <p>Chưa có tệp đính kèm nào được tải lên.</p>
                </div>
              )}
            </div>

            {/* Upload File Form */}
            <form onSubmit={uploadFile} style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8 }}>
              <input
                value={uploadName}
                onChange={e => setUploadName(e.target.value)}
                placeholder="Tên tệp (ví dụ: Logo_Brand.zip)"
                style={{ height: 32, padding: '0 8px', fontSize: 9, background: '#0d1017', border: '1px solid var(--border)', borderRadius: 4, color: '#fff' }}
              />
              <input
                value={uploadUrl}
                onChange={e => setUploadUrl(e.target.value)}
                placeholder="Link tài liệu (Drive / Figma / Dropbox)"
                style={{ height: 32, padding: '0 8px', fontSize: 9, background: '#0d1017', border: '1px solid var(--border)', borderRadius: 4, color: '#fff' }}
              />
              <button className="button button-small button-quiet" disabled={uploadBusy}>
                <Upload size={12} /> {uploadBusy ? '...' : 'Thêm tệp'}
              </button>
            </form>
          </div>

          {/* Review form if completed */}
          {order.status === 'completed' && !order.review && (
            <div className="review-form">
              <span className="eyebrow">CHIA SẺ TRẢI NGHIỆM</span>
              <h3>Đánh giá nghiệm thu dự án</h3>
              <div className="rating-pick">
                {[1, 2, 3, 4, 5].map(x => (
                  <button
                    key={x}
                    type="button"
                    onClick={() => setRating(x)}
                    aria-label={`${x} sao`}
                    className={x <= rating ? 'active' : ''}
                  >
                    <Star size={18} fill="currentColor" />
                  </button>
                ))}
              </div>
              <textarea
                rows={3}
                value={reviewBody}
                onChange={e => setReviewBody(e.target.value)}
                placeholder="Chất lượng mã nguồn, độ phản hồi và sự hài lòng của bạn về sản phẩm bàn giao..."
              />
              <button className="button button-bright" onClick={submitReview}>
                Gửi đánh giá <ArrowRight size={15} />
              </button>
              {reviewMsg && <small>{reviewMsg}</small>}
            </div>
          )}
        </section>

        {/* Conversation Box */}
        <section className="dash-panel conversation">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">PROJECT ROOM / TRAO ĐỔI TRỰC TIẾP</span>
              <h2>Hộp thoại với Nguyễn Văn Tấn</h2>
            </div>
            <MessageCircle size={16} />
          </div>

          <div className="messages-list">
            {messages.length ? (
              messages.map((m: any) => (
                <div className={`message-bubble ${m.system ? 'system' : ''}`} key={m.id}>
                  <span>{m.system ? 'THÔNG BÁO HỆ THỐNG' : m.sender_name}</span>
                  <p>{m.body}</p>
                  {m.attachment_url && (
                    <a
                      href={m.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#5bd7de', fontSize: 9, marginTop: 4 }}
                    >
                      <ExternalLink size={11} /> Xem tệp đính kèm
                    </a>
                  )}
                  <small>{dateTime(m.created_at)}</small>
                </div>
              ))
            ) : (
              <div className="quiet-empty">
                <p>Cuộc trò chuyện của dự án sẽ xuất hiện tại đây.</p>
              </div>
            )}
          </div>

          <form className="message-compose" onSubmit={sendMsg}>
            <input
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Nhập nội dung trao đổi..."
              aria-label="Tin nhắn"
            />
            <input
              value={attachmentUrl}
              onChange={e => setAttachmentUrl(e.target.value)}
              placeholder="Link tệp (tùy chọn)..."
              style={{ maxWidth: 140 }}
              aria-label="Link đính kèm"
            />
            <button className="send-button" disabled={busy || !body.trim()} aria-label="Gửi tin nhắn">
              <Send size={15} />
            </button>
          </form>
          {chatErr && <small className="inline-error">{chatErr}</small>}
        </section>
      </div>
    </div>
  );
}

function Status({ value }: { value: string }) {
  return <span className={`status status-${value}`}>{statusLabel[value] || value}</span>;
}

function InvoicesPage() {
  const { openInvoice } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    api<Order[]>('/api/me/orders').then(setOrders).catch(() => {});
  }, []);

  return (
    <div className="dashboard-content">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">CLIENT WORKSPACE / BILLING</span>
          <h1>Thanh toán & Hóa đơn</h1>
          <p>Danh sách hóa đơn điện tử và trạng thái đối soát của từng dự án.</p>
        </div>
      </div>

      <div className="billing-notice">
        <LockKeyhole size={16} />
        <span>
          Hóa đơn điện tử được thiết lập theo từng mã đơn hàng chính thức.
          Bạn có thể mở và in hóa đơn phục vụ đối soát kế toán doanh nghiệp bất kỳ lúc nào.
        </span>
      </div>

      {orders.length ? (
        <div className="orders-list">
          {orders.map(o => (
            <div className="invoice-row" key={o.id}>
              <div>
                <span className="eyebrow">INV-{o.order_number}</span>
                <b>{o.project_name}</b>
                <small>
                  {o.service_title} · Tạo ngày {date(o.created_at)}
                </small>
              </div>
              <b>{money(o.amount)}</b>
              <Status value={o.payment_status} />
              <button className="text-button" onClick={() => openInvoice(o)}>
                Xem & In hóa đơn <FileText size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          title="Chưa có hóa đơn nào"
          text="Khi bạn tạo đơn hàng, thông tin hóa đơn sẽ hiển thị tại đây."
          action="Xem danh mục dịch vụ"
          to="/services"
        />
      )}
    </div>
  );
}

function FavoritesPage() {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    api<Service[]>('/api/me/favorites')
      .then(setServices => setItems(setServices))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    await api(`/api/me/favorites/${id}`, { method: 'DELETE' });
    setItems(items.filter(x => x.id !== id));
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">CLIENT WORKSPACE / SAVED</span>
          <h1>Dịch vụ đã lưu</h1>
          <p>Các gói giải pháp bạn muốn lưu lại để xem xét sau.</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-row">Đang tải danh sách đã lưu…</div>
      ) : items.length ? (
        <div className="saved-list">
          {items.map(s => (
            <div className="saved-service" key={s.id}>
              <div>
                <span className="eyebrow">{categoryName[s.category] || s.category}</span>
                <h3>{s.title}</h3>
                <p>{s.summary}</p>
              </div>
              <span>Từ {money(s.starting_price)}</span>
              <Link to={`/services/${s.slug}`}>
                Xem chi tiết <ArrowRight size={14} />
              </Link>
              <button title="Bỏ lưu" onClick={() => remove(s.id)}>
                <Heart size={16} fill="currentColor" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          title="Chưa có dịch vụ nào được lưu"
          text="Lưu lại các gói dịch vụ bạn quan tâm để dễ dàng so sánh."
          action="Khám phá dịch vụ"
          to="/services"
        />
      )}
    </div>
  );
}

function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [err, setErr] = useState('');

  async function load() {
    api<any[]>('/api/me/notifications')
      .then(setItems)
      .catch(e => setErr(e.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function read(id: string) {
    await api(`/api/me/notifications/${id}/read`, { method: 'PATCH', body: '{}' });
    setItems(items.map(n => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
  }

  async function readAll() {
    await api('/api/me/notifications/read-all', { method: 'POST', body: '{}' });
    setItems(items.map(n => ({ ...n, read_at: new Date().toISOString() })));
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">CLIENT WORKSPACE / NOTIFICATIONS</span>
          <h1>Thông báo & Cập nhật</h1>
          <p>Các mốc tiến độ, trao đổi và xác nhận thanh toán.</p>
        </div>
        {items.some(n => !n.read_at) && (
          <button className="button button-small button-quiet" onClick={readAll}>
            Đánh dấu tất cả là đã đọc
          </button>
        )}
      </div>

      {err && <div className="form-error">{err}</div>}

      {items.length ? (
        items.map(n => (
          <div className={`notification-full ${n.read_at ? 'read' : ''}`} key={n.id}>
            <span className="notify-rail" />
            <div>
              <div>
                <b>{n.title}</b>
                <small>{dateTime(n.created_at)}</small>
              </div>
              <p>{n.body}</p>
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                {n.link && (
                  <Link to={n.link} className="text-link" style={{ fontSize: 9 }}>
                    Xem chi tiết <ArrowRight size={11} />
                  </Link>
                )}
                {!n.read_at && (
                  <button className="text-button" onClick={() => read(n.id)}>
                    Đánh dấu đã đọc
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      ) : (
        <Empty
          title="Bạn đã đọc hết mọi thông báo"
          text="Khi có cập nhật tiến độ dự án, thông báo sẽ hiển thị ở đây."
          action="Về trang tổng quan"
          to="/dashboard"
        />
      )}
    </div>
  );
}

function ProfilePage() {
  const { user, setUser, flash } = useApp();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [company, setCompany] = useState(user?.company || '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  // Password change
  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passBusy, setPassBusy] = useState(false);
  const [passMsg, setPassMsg] = useState('');

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      const u = await api<User>('/api/me/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name, phone, company })
      });
      setUser(u);
      flash('Hồ sơ đã được lưu thành công.');
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setPassBusy(true);
    setPassMsg('');
    try {
      await api('/api/me/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: curPass, newPassword: newPass })
      });
      setCurPass('');
      setNewPass('');
      setPassMsg('Đổi mật khẩu thành công!');
      flash('Đã cập nhật mật khẩu mới!');
    } catch (e: any) {
      setPassMsg(`Lỗi: ${e.message}`);
    } finally {
      setPassBusy(false);
    }
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">CLIENT WORKSPACE / HỒ SƠ</span>
          <h1>Hồ sơ & Bảo mật</h1>
          <p>Thông tin dùng để đối soát hợp đồng, hóa đơn và liên lạc dự án.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
        {/* Profile Info */}
        <form className="profile-form dash-panel" onSubmit={saveProfile}>
          <span className="eyebrow" style={{ display: 'block', marginBottom: 10 }}>
            THÔNG TIN DOANH NGHIỆP / CÁ NHÂN
          </span>
          <Field label="Họ và tên" required>
            <input value={name} onChange={e => setName(e.target.value)} minLength={2} required />
          </Field>
          <Field label="Địa chỉ Email đăng nhập">
            <input value={user?.email || ''} disabled />
            <small>Email tài khoản không thể tự đổi.</small>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Số điện thoại liên hệ">
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0901234567" />
            </Field>
            <Field label="Tên công ty / Tổ chức">
              <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Công ty ABC" />
            </Field>
          </div>
          {msg && <div className="form-error">{msg}</div>}
          <button className="button button-bright" disabled={busy} style={{ marginTop: 10 }}>
            {busy ? 'Đang lưu…' : 'Lưu hồ sơ'} <ArrowRight size={15} />
          </button>
        </form>

        {/* Password Change */}
        <form className="profile-form dash-panel" onSubmit={changePassword}>
          <span className="eyebrow" style={{ display: 'block', marginBottom: 10 }}>
            ĐỔI MẬT KHẨU BẢO MẬT
          </span>
          <Field label="Mật khẩu hiện tại" required>
            <input
              type="password"
              value={curPass}
              onChange={e => setCurPass(e.target.value)}
              required
            />
          </Field>
          <Field label="Mật khẩu mới (tối thiểu 8 ký tự)" required>
            <input
              type="password"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              minLength={8}
              required
            />
          </Field>
          {passMsg && (
            <div style={{ fontSize: 9, color: passMsg.startsWith('Lỗi') ? '#fca5a5' : '#86efac' }}>
              {passMsg}
            </div>
          )}
          <button className="button button-quiet" disabled={passBusy} style={{ marginTop: 10 }}>
            {passBusy ? 'Đang cập nhật…' : 'Đổi mật khẩu'} <LockKeyhole size={14} />
          </button>
        </form>
      </div>

      <div className="security-note">
        <LockKeyhole size={16} />
        <div>
          <b>Bảo mật cấp độ doanh nghiệp</b>
          <p>
            Mật khẩu được băm và lưu trữ bằng thuật toán scrypt với salt độc quyền.
            Mọi phiên đăng nhập sử dụng cookie HttpOnly cùng cờ SameSite ngăn ngừa các cuộc tấn công CSRF & XSS.
          </p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// ADMIN CONTROL PANEL
// ==========================================

function Admin() {
  return (
    <RequireUser adminOnly>
      <div className="workspace admin-workspace">
        <AdminNav />
        <div className="workspace-main">
          <Routes>
            <Route index element={<AdminHome />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="inquiries" element={<AdminInquiries />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="audit" element={<AdminAudit />} />
            <Route path="*" element={<AdminHome />} />
          </Routes>
        </div>
      </div>
    </RequireUser>
  );
}

function AdminNav() {
  const { user, setUser } = useApp();
  const nav = useNavigate();

  const links = [
    ['', 'Overview', LayoutDashboard],
    ['orders', 'Orders', Layers],
    ['services', 'Services', Code2],
    ['customers', 'Customers', UserCheck],
    ['coupons', 'Coupons', Tag],
    ['reviews', 'Reviews', Star],
    ['inquiries', 'Inquiries', Mail],
    ['settings', 'CMS Settings', Sparkles],
    ['audit', 'Audit Logs', ShieldCheck]
  ];

  async function logout() {
    await api('/api/auth/logout', { method: 'POST', body: '{}' }).catch(() => {});
    setUser(null);
    nav('/');
  }

  return (
    <aside className="workspace-nav admin-nav">
      <Link className="workspace-brand" to="/admin">
        <span className="brand-mark">
          <Code2 size={15} />
        </span>
        STUDIO ADMIN
      </Link>
      <span className="workspace-nav-label">VANTANTHEDEV MANAGEMENT</span>
      {links.map(([path, label, Icon]: any) => (
        <NavLink
          key={path}
          end={path === ''}
          to={`/admin${path ? `/${path}` : ''}`}
          className={({ isActive }) => `workspace-link ${isActive ? 'active' : ''}`}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Icon size={14} style={{ color: 'inherit' }} />
            {label}
          </span>
          <span>{path === 'orders' ? '↗' : ''}</span>
        </NavLink>
      ))}

      <Link className="workspace-link admin-back" to="/">
        ← Mở trang chủ
      </Link>

      <div className="workspace-account">
        <div className="account-initial">{user?.name.slice(0, 1)}</div>
        <div>
          <b>{user?.name}</b>
          <small>Chủ sở hữu studio</small>
        </div>
        <button onClick={logout} title="Đăng xuất">
          ↗
        </button>
      </div>
    </aside>
  );
}

function AdminHome() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/admin/summary')
      .then(setData)
      .catch(e => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="dashboard-content">
        <Empty title="Không thể tải dữ liệu quản trị" text={error} action="Về website" to="/" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="dashboard-content">
        <div className="loading-row">Đang tổng hợp chỉ số studio…</div>
      </div>
    );
  }

  const m = data.metrics;
  const max = Math.max(1, ...data.popular.map((x: any) => x.count));

  return (
    <div className="dashboard-content">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">STUDIO OPERATIONS / OVERVIEW</span>
          <h1>Bảng điều khiển kinh doanh</h1>
          <p>Dữ liệu hợp nhất từ các đơn hàng, khách hàng và luồng thanh toán thực tế.</p>
        </div>
        <Link to="/admin/orders" className="button button-bright">
          Quản lý đơn hàng <ArrowUpRight size={15} />
        </Link>
      </div>

      <div className="dash-metrics admin-metrics" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <Metric
          label="Doanh thu thực nhận"
          value={money(m.revenue)}
          note="các đơn đã đối soát thanh toán"
        />
        <Metric label="Tổng đơn hàng" value={m.orders} note="tất cả yêu cầu đã tạo" />
        <Metric label="Khách hàng" value={m.customers} note="tài khoản đã đăng ký" />
        <Metric label="Dự án đang mở" value={m.activeProjects} note="đang trong tiến độ" />
        <Metric
          label="Chờ thanh toán"
          value={m.pendingPayments}
          note="cần đối soát hoặc nhắc lịch"
        />
        <Metric label="Đã hoàn tất" value={m.completed} note="dự án nghiệm thu bàn giao" />
        <Metric
          label="Giá trị trung bình đơn"
          value={money(m.averageOrder)}
          note="AOV trên toàn hệ thống"
        />
        <Metric
          label="Yêu cầu liên hệ mới"
          value={m.newInquiries}
          note="từ form liên hệ / contact"
        />
      </div>

      <div className="admin-analytics">
        <section className="dash-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">DỊCH VỤ PHỔ BIẾN NHẤT</span>
              <h2>Nhu cầu theo danh mục</h2>
            </div>
            <Link to="/admin/services">
              Quản lý dịch vụ <ArrowRight size={14} />
            </Link>
          </div>
          {data.popular.map((x: any) => (
            <div className="bar-row" key={x.title}>
              <span>{x.title}</span>
              <div>
                <i style={{ width: `${Math.max(8, (100 * x.count) / max)}%` }} />
              </div>
              <b>{x.count} đơn</b>
            </div>
          ))}
        </section>

        <section className="dash-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">LỘ TRÌNH ĐƠN HÀNG</span>
              <h2>Phân bổ trạng thái</h2>
            </div>
          </div>
          {data.statuses.length ? (
            data.statuses.map((x: any) => (
              <div className="pipeline-row" key={x.status}>
                <Status value={x.status} />
                <b>{x.count}</b>
              </div>
            ))
          ) : (
            <div className="quiet-empty">
              <p>Chưa có dữ liệu.</p>
            </div>
          )}
        </section>
      </div>

      <div className="admin-footnote">
        <ShieldCheck size={15} />
        Hệ thống tích hợp đối soát thanh toán chuẩn phía máy chủ. Mọi thao tác cập nhật trạng
        thái và thanh toán đều được lưu vào Audit Log có địa chỉ IP và dấu thời gian.
      </div>
    </div>
  );
}

function AdminOrders() {
  const { flash } = useApp();
  const [orders, setOrders] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  async function load() {
    api<any[]>(`/api/admin/orders?status=${statusFilter}&q=${encodeURIComponent(search)}`)
      .then(setOrders)
      .catch(e => setError(e.message));
  }

  useEffect(() => {
    load();
  }, [statusFilter, search]);

  async function updateStatus(id: string, status: string) {
    try {
      await api(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      flash(`Đã cập nhật trạng thái đơn sang ${status}!`);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function confirmPayment(id: string) {
    try {
      await api(`/api/admin/orders/${id}/confirm-payment`, {
        method: 'POST',
        body: '{}'
      });
      flash('Đã xác nhận thanh toán thành công và kích hoạt dự án!');
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">OPERATIONS / ORDERS MANAGEMENT</span>
          <h1>Quản lý đơn hàng & dự án</h1>
          <p>Kiểm tra yêu cầu, xác nhận thanh toán VietQR và cập nhật tiến độ cho khách.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm theo mã đơn, tên dự án, khách hàng, email..."
          style={{
            flex: 1,
            height: 38,
            padding: '0 12px',
            background: '#101319',
            border: '1px solid var(--border)',
            borderRadius: 5,
            color: '#fff',
            fontSize: 11
          }}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            height: 38,
            padding: '0 12px',
            background: '#101319',
            border: '1px solid var(--border)',
            borderRadius: 5,
            color: '#fff',
            fontSize: 11
          }}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Chờ xác nhận</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="in_progress">Đang phát triển</option>
          <option value="waiting_customer">Chờ khách phản hồi</option>
          <option value="revision">Đang chỉnh sửa</option>
          <option value="completed">Đã hoàn thành</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="admin-orders-list">
        {orders.map(o => (
          <div
            className="admin-order-row"
            key={o.id}
            style={{ gridTemplateColumns: '1.2fr auto auto 140px 30px' }}
          >
            <div className="admin-order-main">
              <span>{o.order_number}</span>
              <b>{o.project_name}</b>
              <small>
                {o.customer_name} ({o.customer_email}) · {o.service_title} / {o.package_name}
              </small>
            </div>

            <div className="admin-order-money">
              <b>{money(o.amount)}</b>
              <small>
                {o.payment_method.toUpperCase()} · {statusLabel[o.payment_status]}
              </small>
            </div>

            <div>
              {o.payment_status !== 'paid' ? (
                <button
                  type="button"
                  className="action-btn-success"
                  onClick={() => confirmPayment(o.id)}
                  title="Xác nhận đã nhận chuyển khoản"
                >
                  ✓ Duyệt thanh toán
                </button>
              ) : (
                <span className="badge-tag badge-active">ĐÃ THANH TOÁN</span>
              )}
            </div>

            <select
              aria-label={`Trạng thái đơn ${o.order_number}`}
              value={o.status}
              onChange={e => updateStatus(o.id, e.target.value)}
            >
              {[
                ['pending', 'Chờ xác nhận'],
                ['confirmed', 'Đã xác nhận'],
                ['in_progress', 'Đang phát triển'],
                ['waiting_customer', 'Chờ khách hàng'],
                ['revision', 'Chỉnh sửa'],
                ['completed', 'Hoàn thành'],
                ['cancelled', 'Đã hủy']
              ].map(([v, l]) => (
                <option value={v} key={v}>
                  {l}
                </option>
              ))}
            </select>

            <Link
              to={`/dashboard/orders/${o.id}`}
              title="Mở chi tiết & chat với khách"
              className="icon-link"
            >
              <ArrowUpRight size={16} />
            </Link>
          </div>
        ))}
        {!orders.length && !error && (
          <Empty title="Chưa có đơn hàng nào khớp bộ lọc" text="Các đơn hàng mới sẽ xuất hiện ở đây." />
        )}
      </div>
    </div>
  );
}

function AdminCustomers() {
  const { flash } = useApp();
  const [customers, setCustomers] = useState<any[]>([]);
  const [err, setErr] = useState('');

  const load = () => {
    api<any[]>('/api/admin/customers')
      .then(setCustomers)
      .catch(e => setErr(e.message));
  };

  useEffect(() => {
    load();
  }, []);

  const toggleSuspend = async (id: string, currentSuspended: number) => {
    try {
      await api(`/api/admin/customers/${id}/suspend`, { method: 'PATCH', body: '{}' });
      flash(currentSuspended ? 'Đã mở khóa tài khoản khách hàng.' : 'Đã tạm khóa tài khoản.');
      load();
    } catch (e: any) {
      setErr(e.message);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">OPERATIONS / CUSTOMER MANAGEMENT</span>
          <h1>Quản lý khách hàng ({customers.length})</h1>
          <p>Danh sách các đối tác, công ty và khách hàng đã tạo tài khoản.</p>
        </div>
      </div>

      {err && <div className="form-error">{err}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Khách hàng</th>
              <th>Công ty & SĐT</th>
              <th>Số đơn đã đặt</th>
              <th>Tổng chi tiêu</th>
              <th>Ngày tham gia</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id}>
                <td>
                  <div className="admin-customer-info">
                    <b>{c.name}</b>
                    <small>{c.email}</small>
                  </div>
                </td>
                <td>
                  <div>{c.company || 'Cá nhân'}</div>
                  <small style={{ color: '#64748b' }}>{c.phone || 'Chưa cung cấp'}</small>
                </td>
                <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{c.total_orders} đơn</td>
                <td style={{ fontFamily: 'var(--mono)', color: '#4ade80', fontWeight: 600 }}>
                  {money(c.total_spent)}
                </td>
                <td style={{ color: '#94a3b8' }}>{date(c.created_at)}</td>
                <td>
                  {c.suspended ? (
                    <span className="badge-tag badge-suspended">TẠM KHÓA</span>
                  ) : (
                    <span className="badge-tag badge-active">HOẠT ĐỘNG</span>
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    className={c.suspended ? 'action-btn-success' : 'action-btn-danger'}
                    onClick={() => toggleSuspend(c.id, c.suspended)}
                  >
                    {c.suspended ? 'Mở khóa' : 'Khóa'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminCoupons() {
  const { flash } = useApp();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [err, setErr] = useState('');

  // New coupon form
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(10);
  const [minOrder, setMinOrder] = useState(5000000);
  const [maxDiscount, setMaxDiscount] = useState(2000000);
  const [usageLimit, setUsageLimit] = useState(50);
  const [busy, setBusy] = useState(false);

  const load = () => {
    api<any[]>('/api/admin/coupons')
      .then(setCoupons)
      .catch(e => setErr(e.message));
  };

  useEffect(() => {
    load();
  }, []);

  const createCoupon = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await api('/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code,
          discountType,
          discountValue: Number(discountValue),
          minOrderAmount: Number(minOrder),
          maxDiscount: Number(maxDiscount),
          usageLimit: Number(usageLimit)
        })
      });
      setCode('');
      flash('Đã tạo mã giảm giá mới!');
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleCoupon = async (id: string, active: boolean) => {
    await api(`/api/admin/coupons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: !active })
    });
    load();
  };

  const deleteCoupon = async (id: string) => {
    if (!window.confirm('Xác nhận xóa mã giảm giá này?')) return;
    await api(`/api/admin/coupons/${id}`, { method: 'DELETE' });
    flash('Đã xóa mã giảm giá.');
    load();
  };

  return (
    <div className="dashboard-content">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">MARKETING & PROMOTION / COUPONS</span>
          <h1>Quản lý mã giảm giá</h1>
          <p>Tạo và kiểm soát các chương trình chiết khấu cho khách hàng.</p>
        </div>
      </div>

      {err && <div className="form-error">{err}</div>}

      <div className="coupon-create-panel">
        <h3>+ Tạo mã giảm giá mới</h3>
        <form onSubmit={createCoupon} className="coupon-create-form">
          <Field label="Mã Coupon" required>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="VD: SUMMER2026"
              required
            />
          </Field>
          <Field label="Loại giảm">
            <select
              value={discountType}
              onChange={e => setDiscountType(e.target.value as any)}
            >
              <option value="percentage">Phần trăm (%)</option>
              <option value="fixed">Số tiền cố định (VNĐ)</option>
            </select>
          </Field>
          <Field label="Giá trị giảm" required>
            <input
              type="number"
              value={discountValue}
              onChange={e => setDiscountValue(+e.target.value)}
              required
            />
          </Field>
          <Field label="Đơn tối thiểu (VNĐ)">
            <input
              type="number"
              value={minOrder}
              onChange={e => setMinOrder(+e.target.value)}
            />
          </Field>
          <Field label="Giảm tối đa (VNĐ, 0 = ko giới hạn)">
            <input
              type="number"
              value={maxDiscount}
              onChange={e => setMaxDiscount(+e.target.value)}
            />
          </Field>
          <Field label="Lượt dùng tối đa">
            <input
              type="number"
              value={usageLimit}
              onChange={e => setUsageLimit(+e.target.value)}
            />
          </Field>
          <button className="button button-bright" disabled={busy} style={{ minHeight: 38 }}>
            {busy ? 'Đang tạo...' : 'Tạo mã'}
          </button>
        </form>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã Code</th>
              <th>Loại & Mức giảm</th>
              <th>Đơn tối thiểu</th>
              <th>Giảm tối đa</th>
              <th>Đã dùng / Giới hạn</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(c => (
              <tr key={c.id}>
                <td>
                  <b style={{ color: '#b7a9ff', fontFamily: 'var(--mono)', fontSize: 12 }}>
                    {c.code}
                  </b>
                </td>
                <td>
                  {c.discount_type === 'percentage'
                    ? `${c.discount_value}%`
                    : money(c.discount_value)}
                </td>
                <td>{money(c.min_order_amount)}</td>
                <td>{c.max_discount ? money(c.max_discount) : 'Không giới hạn'}</td>
                <td style={{ fontFamily: 'var(--mono)' }}>
                  {c.times_used} / {c.usage_limit}
                </td>
                <td>
                  <button
                    type="button"
                    className={`badge-tag ${c.active ? 'badge-active' : 'badge-suspended'}`}
                    onClick={() => toggleCoupon(c.id, c.active)}
                    style={{ cursor: 'pointer', border: 'none' }}
                  >
                    {c.active ? 'ĐANG BẬT' : 'ĐÃ TẮT'}
                  </button>
                </td>
                <td>
                  <button
                    type="button"
                    className="action-btn-danger"
                    onClick={() => deleteCoupon(c.id)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminServices() {
  const { flash } = useApp();
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState('');

  async function load() {
    api<Service[]>('/api/admin/services')
      .then(setServices)
      .catch(e => setError(e.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(s: Service, key: 'published' | 'featured') {
    try {
      await api(`/api/admin/services/${s.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ [key]: !s[key] })
      });
      flash(`Đã cập nhật ${key} cho ${s.title}!`);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function editPrice(s: Service) {
    const next = window.prompt(`Cập nhật giá khởi điểm cho "${s.title}" (VNĐ):`, String(s.starting_price));
    if (!next || isNaN(+next)) return;
    try {
      await api(`/api/admin/services/${s.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ starting_price: Number(next) })
      });
      flash('Đã cập nhật giá dịch vụ.');
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">OPERATIONS / SERVICES CATALOG</span>
          <h1>Quản lý danh mục dịch vụ ({services.length})</h1>
          <p>Bật/tắt hiển thị, đánh dấu nổi bật và điều chỉnh mức đầu tư khởi điểm.</p>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="admin-service-list">
        {services.map(s => (
          <div className="admin-service-row" key={s.id}>
            <div>
              <span className="eyebrow">{categoryName[s.category] || s.category}</span>
              <h3>{s.title}</h3>
              <small>
                {s.slug} · Giá khởi điểm: <b>{money(s.starting_price)}</b>
              </small>
            </div>

            <button
              type="button"
              className="text-button"
              onClick={() => editPrice(s)}
              style={{ fontSize: 9, color: '#5bd7de' }}
            >
              Sửa giá
            </button>

            <label className="toggle-label">
              <input
                type="checkbox"
                checked={!!s.published}
                onChange={() => toggle(s, 'published')}
              />
              <span>{s.published ? 'Công khai' : 'Đã ẩn'}</span>
            </label>

            <label className="toggle-label">
              <input
                type="checkbox"
                checked={!!s.featured}
                onChange={() => toggle(s, 'featured')}
              />
              <span>{s.featured ? 'Nổi bật' : 'Bình thường'}</span>
            </label>

            <Link to={`/services/${s.slug}`} className="icon-link" title="Xem trang dịch vụ">
              <ArrowUpRight size={16} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminReviews() {
  const { flash } = useApp();
  const [items, setItems] = useState<any[]>([]);
  const [err, setErr] = useState('');

  async function load() {
    api<any[]>('/api/admin/reviews')
      .then(setItems)
      .catch(e => setErr(e.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string, approved: boolean) {
    try {
      await api(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ approved })
      });
      flash(approved ? 'Đã duyệt công khai đánh giá!' : 'Đã ẩn đánh giá.');
      load();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">TRUST & SOCIAL PROOF / REVIEWS</span>
          <h1>Kiểm duyệt đánh giá</h1>
          <p>Chỉ những đánh giá được duyệt mới hiển thị trên website chính thức.</p>
        </div>
      </div>

      {err && <div className="form-error">{err}</div>}

      {items.map(r => (
        <article className="review-admin-card" key={r.id}>
          <div>
            <span className="eyebrow">
              {r.service_title} · {r.customer_name} {r.company && `(${r.company})`}
            </span>
            <div className="review-stars">
              {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
            </div>
            <p>{r.body}</p>
            <small style={{ color: '#64748b', fontSize: 9 }}>Gửi ngày: {date(r.created_at)}</small>
          </div>

          <div className="review-admin-actions">
            <Status value={r.approved ? 'completed' : 'pending'} />
            {!r.approved ? (
              <button
                className="button button-small button-bright"
                onClick={() => approve(r.id, true)}
              >
                Duyệt hiển thị
              </button>
            ) : (
              <button
                className="button button-small button-quiet"
                onClick={() => approve(r.id, false)}
              >
                Ẩn đánh giá
              </button>
            )}
          </div>
        </article>
      ))}

      {!items.length && !err && (
        <Empty title="Chưa có đánh giá nào" text="Đánh giá từ khách hàng sau khi hoàn tất dự án sẽ hiển thị tại đây." />
      )}
    </div>
  );
}

function AdminInquiries() {
  const { flash } = useApp();
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');

  async function load() {
    api<any[]>('/api/admin/inquiries')
      .then(setItems)
      .catch(e => setError(e.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function status(id: string, value: string) {
    try {
      await api(`/api/admin/inquiries/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: value })
      });
      flash('Đã cập nhật trạng thái yêu cầu liên hệ.');
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="dashboard-content">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">INTAKE / PROJECT INQUIRIES</span>
          <h1>Yêu cầu liên hệ dự án ({items.length})</h1>
          <p>Các yêu cầu gửi từ biểu mẫu liên hệ trên trang web.</p>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      {items.map(i => (
        <article className="inquiry-card" key={i.id}>
          <div className="inquiry-head">
            <div>
              <span className="eyebrow">
                {i.project_type} · Ngày: {date(i.created_at)}
              </span>
              <h3>{i.name}</h3>
              <a href={`mailto:${encodeURIComponent(i.email)}`}>{i.email}</a>
              {i.phone && <span> · SĐT: {i.phone}</span>}
            </div>
            <select value={i.status} onChange={e => status(i.id, e.target.value)}>
              <option value="new">Mới nhận</option>
              <option value="reviewing">Đang xem xét</option>
              <option value="replied">Đã phản hồi</option>
              <option value="closed">Đã đóng</option>
            </select>
          </div>
          <p>{i.message}</p>
          <small>Ngân sách ước tính của khách: <b>{i.budget || 'Chưa cung cấp'}</b></small>
        </article>
      ))}

      {!items.length && !error && (
        <Empty title="Chưa có yêu cầu liên hệ mới" text="Form liên hệ sẽ lưu các lead vào đây." />
      )}
    </div>
  );
}

function AdminSettings() {
  const { flash } = useApp();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api<any[]>('/api/admin/settings').then(rows => {
      const map: Record<string, string> = {};
      for (const r of rows) map[r.key] = r.value;
      setSettings(map);
    }).catch(() => {});
  }, []);

  const change = (k: string, v: string) => setSettings({ ...settings, [k]: v });

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      await api('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(settings)
      });
      flash('Đã lưu cấu hình website thành công!');
      setMsg('Đã lưu cài đặt website.');
    } catch (e: any) {
      setMsg(`Lỗi: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">CONTENT & SYSTEM / SETTINGS</span>
          <h1>Cấu hình Website & Thanh toán</h1>
          <p>Quản lý dòng thông báo, thông tin liên hệ và tài khoản nhận thanh toán VietQR.</p>
        </div>
      </div>

      <form onSubmit={save}>
        <div className="settings-grid">
          <div className="settings-section">
            <h3>Nội Dung & Banner</h3>
            <Field label="Dòng thông báo đầu trang (Announcement)">
              <input
                value={settings.announcement || ''}
                onChange={e => change('announcement', e.target.value)}
                placeholder="Nhận 02 dự án mới..."
              />
            </Field>
            <Field label="Tiêu đề Hero chính">
              <input
                value={settings.hero_headline || ''}
                onChange={e => change('hero_headline', e.target.value)}
              />
            </Field>
            <Field label="Phụ đề Hero">
              <textarea
                rows={3}
                value={settings.hero_subtitle || ''}
                onChange={e => change('hero_subtitle', e.target.value)}
              />
            </Field>
          </div>

          <div className="settings-section">
            <h3>Tài Khoản Nhận Thanh Toán VietQR</h3>
            <Field label="Tên Ngân Hàng">
              <input
                value={settings.vietqr_bank || ''}
                onChange={e => change('vietqr_bank', e.target.value)}
                placeholder="MB Bank"
              />
            </Field>
            <Field label="Số Tài Khoản">
              <input
                value={settings.vietqr_account || ''}
                onChange={e => change('vietqr_account', e.target.value)}
                placeholder="0987654321"
              />
            </Field>
            <Field label="Tên Chủ Tài Khoản (Không dấu)">
              <input
                value={settings.vietqr_name || ''}
                onChange={e => change('vietqr_name', e.target.value)}
                placeholder="NGUYEN VAN TAN"
              />
            </Field>
            <div style={{ marginTop: 14 }}>
              <Field label="Hotline / SĐT Hỗ trợ">
                <input
                  value={settings.contact_phone || ''}
                  onChange={e => change('contact_phone', e.target.value)}
                />
              </Field>
              <Field label="Email Liên Hệ">
                <input
                  value={settings.contact_email || ''}
                  onChange={e => change('contact_email', e.target.value)}
                />
              </Field>
            </div>
          </div>
        </div>

        {msg && <div style={{ marginTop: 14, fontSize: 11, color: msg.startsWith('Lỗi') ? '#fca5a5' : '#86efac' }}>{msg}</div>}

        <button className="button button-bright" disabled={busy} style={{ marginTop: 18 }}>
          {busy ? 'Đang lưu…' : 'Lưu tất cả thay đổi'} <ArrowRight size={15} />
        </button>
      </form>
    </div>
  );
}

function AdminAudit() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    api<any[]>('/api/admin/audit').then(setLogs).catch(() => {});
  }, []);

  return (
    <div className="dashboard-content">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">SECURITY & COMPLIANCE / AUDIT TRAIL</span>
          <h1>Nhật ký kiểm toán ({logs.length})</h1>
          <p>Ghi nhận mọi thao tác quản trị, đăng nhập, duyệt thanh toán và cập nhật trạng thái.</p>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Người thực hiện</th>
              <th>Hành động</th>
              <th>Đối tượng</th>
              <th>Mã ID đối tượng</th>
              <th>Địa chỉ IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l, idx) => (
              <tr key={idx}>
                <td style={{ color: '#94a3b8' }}>{dateTime(l.created_at)}</td>
                <td>
                  <b>{l.actor_name || 'Khách / Hệ thống'}</b>
                </td>
                <td>
                  <span className="badge-tag badge-active">{l.action}</span>
                </td>
                <td style={{ textTransform: 'capitalize' }}>{l.target_type}</td>
                <td style={{ fontFamily: 'var(--mono)', fontSize: 9 }}>{l.target_id || '—'}</td>
                <td style={{ fontFamily: 'var(--mono)', color: '#64748b' }}>{l.ip_address || '::1'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// OTHER PUBLIC PAGES (PORTFOLIO, ABOUT, ETC.)
// ==========================================

function Portfolio() {
  return (
    <main className="page-main">
      <div className="page-hero compact">
        <span className="eyebrow">PORTFOLIO / CASE STUDIES & LAB NOTES</span>
        <h1>
          Thiết kế & Lập trình<br />
          <span className="muted-heading">xoay quanh bài toán thực tế.</span>
        </h1>
        <p>
          Các case study dưới đây minh họa cách tiếp cận kiến trúc, hiệu năng và trải nghiệm
          sản phẩm của Nguyễn Văn Tấn tại VanTanTheDEV.
        </p>
      </div>

      <div className="portfolio-grid">
        <article className="portfolio-card">
          <div className="portfolio-visual pv-commerce">
            <div className="pv-top">
              <span>CASE STUDY / 01</span>
              <span>COMMERCE & VIETQR</span>
            </div>
            <div className="pv-body">
              <div className="pv-copy">
                <small>VIETNAMESE CRAFT CERAMICS</small>
                <b>
                  Gốm Sứ Việt:<br />
                  Bán lẻ & Xuất khẩu.
                </b>
                <span>Xem kiến trúc ↗</span>
              </div>
              <div className="pv-object">
                <i />
                <b />
                <span />
              </div>
            </div>
          </div>
          <div className="portfolio-meta">
            <span>E-COMMERCE & THANH TOÁN TỰ ĐỘNG</span>
            <h3>Cửa hàng trực tuyến tối ưu chuyển đổi di động</h3>
            <p>
              Tích hợp thanh toán quét mã VietQR tự động, quản lý kho theo biến thể men và tối ưu
              tốc độ tải trang dưới 1.1s trên mạng di động 4G.
            </p>
            <div>
              <span>React</span>
              <span>Node.js</span>
              <span>PostgreSQL</span>
              <span>VietQR API</span>
            </div>
          </div>
        </article>

        <article className="portfolio-card">
          <div className="portfolio-visual pv-saas">
            <div className="pv-top">
              <span>CASE STUDY / 02</span>
              <span>B2B SAAS PLATFORM</span>
            </div>
            <div className="pv-saas-main">
              <div className="pv-saas-side">
                <b>
                  flow<span>.</span>
                </b>
                <i />
                <i />
                <i />
              </div>
              <div className="pv-saas-panel">
                <small>WORKFLOW AUTOMATION ENGINE</small>
                <b>Quy trình phê duyệt thông suốt.</b>
                <div className="pv-task">
                  <i /> Kiểm toán dữ liệu tự động <span>HOÀN TẤT</span>
                </div>
                <div className="pv-task">
                  <i /> Phân quyền RBAC đa chi nhánh <span>ĐANG CHẠY</span>
                </div>
                <div className="pv-task">
                  <i /> Xuất báo cáo tài chính PDF <span>SẴN SÀNG</span>
                </div>
              </div>
            </div>
          </div>
          <div className="portfolio-meta">
            <span>SẢN PHẨM SAAS QUẢN TRỊ NỘI BỘ</span>
            <h3>Hệ thống điều phối nghiệp vụ doanh nghiệp</h3>
            <p>
              Kiến trúc Multi-tenant bảo mật, phân quyền nhiều cấp và xử lý hàng đợi tác vụ nền
              với Redis BullMQ.
            </p>
            <div>
              <span>Next.js 15</span>
              <span>NestJS</span>
              <span>PostgreSQL</span>
              <span>Docker</span>
            </div>
          </div>
        </article>

        <article className="portfolio-card">
          <div className="portfolio-visual pv-mobile">
            <div className="pv-top">
              <span>CASE STUDY / 03</span>
              <span>CROSS-PLATFORM MOBILE</span>
            </div>
            <div className="phone-concept">
              <div className="phone-top">
                <span>9:41</span>
                <i />
              </div>
              <small>OUTDOOR EXPLORATION</small>
              <b>
                Track your<br />
                expedition.
              </b>
              <div className="phone-map">
                <i />
                <i />
                <span />
              </div>
              <div className="phone-action">
                Khám phá lộ trình <ArrowUpRight size={12} />
              </div>
            </div>
          </div>
          <div className="portfolio-meta">
            <span>ỨNG DỤNG DI ĐỘNG FLUTTER</span>
            <h3>Trải nghiệm hành trình dã ngoại ngoại ô</h3>
            <p>
              Hỗ trợ bản đồ ngoại tuyến, đồng bộ GPS thời gian thực và quản lý tài nguyên pin tối ưu
              trên cả iOS và Android.
            </p>
            <div>
              <span>Flutter</span>
              <span>SQLite</span>
              <span>REST API</span>
              <span>Mobile UX</span>
            </div>
          </div>
        </article>

        <article className="portfolio-card">
          <div className="portfolio-visual pv-saas" style={{ background: 'radial-gradient(ellipse at 70% 45%, #1e3a47, #132228 54%, #0d1417)' }}>
            <div className="pv-top">
              <span>CASE STUDY / 04</span>
              <span>REAL-TIME ANALYTICS</span>
            </div>
            <div className="pv-saas-main">
              <div className="pv-saas-panel" style={{ width: '100%' }}>
                <small>FINANCIAL METRICS STREAM</small>
                <b>Chỉ số KPI thời gian thực.</b>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
                  <div style={{ background: '#121e24', padding: 8, borderRadius: 4 }}>
                    <small style={{ fontSize: 7, color: '#688997' }}>GIAO DỊCH / GIÂY</small>
                    <b style={{ fontSize: 13, color: '#5bd7de' }}>1,420 TPS</b>
                  </div>
                  <div style={{ background: '#121e24', padding: 8, borderRadius: 4 }}>
                    <small style={{ fontSize: 7, color: '#688997' }}>ĐỘ TRỄ TRUNG BÌNH</small>
                    <b style={{ fontSize: 13, color: '#60d3a2' }}>42ms</b>
                  </div>
                  <div style={{ background: '#121e24', padding: 8, borderRadius: 4 }}>
                    <small style={{ fontSize: 7, color: '#688997' }}>UPTIME SLA</small>
                    <b style={{ fontSize: 13, color: '#a08cff' }}>99.98%</b>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="portfolio-meta">
            <span>DASHBOARD DỮ LIỆU LỚN</span>
            <h3>Bảng điều khiển giám sát giao dịch trực tiếp</h3>
            <p>
              Tối ưu hóa render bảng số liệu hàng trăm nghìn dòng bằng kỹ thuật Virtual Scrolling
              và WebSocket streaming.
            </p>
            <div>
              <span>React</span>
              <span>TypeScript</span>
              <span>Tailwind CSS</span>
              <span>Recharts</span>
            </div>
          </div>
        </article>
      </div>

      <div className="portfolio-caveat">
        <ShieldCheck size={17} />
        <span>
          Mọi dự án bàn giao đều tuân thủ thỏa thuận bảo mật NDA và chuyển giao 100% bản quyền
          mã nguồn cho khách hàng.
        </span>
      </div>

      <div className="detail-bottom">
        <span className="eyebrow">BẠN CÓ MỘT BÀI TOÁN TƯƠNG TỰ?</span>
        <h2>
          Hãy kể tôi nghe<br />
          <span className="muted-heading">về giải pháp bạn đang tìm kiếm.</span>
        </h2>
        <Link to="/custom-project" className="button button-bright">
          Mô tả dự án ngay <ArrowUpRight size={15} />
        </Link>
      </div>
    </main>
  );
}

function About() {
  return (
    <main className="page-main">
      <div className="about-hero">
        <div>
          <span className="eyebrow">NGƯỜI ĐỨNG SAU SẢN PHẨM</span>
          <h1>
            Xin chào,<br />
            tôi là <span className="text-gradient">Nguyễn Văn Tấn.</span>
          </h1>
          <p className="about-lede">
            Full-Stack Developer & Nhà sáng lập VanTanTheDEV. Tôi xây dựng nền tảng này để mang
            dịch vụ kỹ thuật phần mềm chất lượng cao, minh bạch phạm vi và chi phí đến các cá nhân,
            startup và doanh nghiệp.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to="/custom-project" className="button button-bright">
              Kể tôi nghe về dự án của bạn <ArrowUpRight size={15} />
            </Link>
            <Link to="/contact" className="button button-quiet">
              Liên hệ trực tiếp <Mail size={14} />
            </Link>
          </div>
        </div>
        <div className="about-monogram">
          <span>VT</span>
          <i>·</i>
          <span>DEV</span>
          <small>
            DESIGN WITH INTENT<br />
            ENGINEER FOR REAL PRODUCTION
          </small>
        </div>
      </div>

      <section className="about-values">
        <div>
          <span className="eyebrow">TRIẾT LÝ KỸ THUẬT</span>
          <h2>
            Sản phẩm tốt không phải là<br />
            <span className="muted-heading">nhồi nhét nhiều tính năng thừa.</span>
          </h2>
        </div>
        <div className="values-copy">
          <p>
            Phần mềm tốt là hiểu đúng điểm nghẽn của người dùng, chọn kiến trúc phù hợp và xây dựng
            nó một cách vững chắc. Tôi ưu tiên trao đổi thẳng thắn về tính khả thi, lựa chọn công nghệ
            bền vững thay vì chạy theo xu hướng nhất thời, và bàn giao để bạn toàn quyền làm chủ sản phẩm.
          </p>
          <div className="value-list">
            <div>
              <b>01</b>
              <span>
                <strong>Hiểu bài toán trước khi gõ phím</strong>
                <small>Mục tiêu kinh doanh và người dùng cuối định hướng mọi quyết định kiến trúc.</small>
              </span>
            </div>
            <div>
              <b>02</b>
              <span>
                <strong>Chia nhỏ các mốc để kiểm chứng</strong>
                <small>Các mốc tiến độ rõ ràng giúp điều chỉnh sớm, không có bất ngờ phút chót.</small>
              </span>
            </div>
            <div>
              <b>03</b>
              <span>
                <strong>Bàn giao để bạn tự chủ 100%</strong>
                <small>Mã nguồn sạch, có tài liệu và hướng dẫn vận hành chi tiết đi kèm.</small>
              </span>
            </div>
            <div>
              <b>04</b>
              <span>
                <strong>Bảo mật & Tối ưu hiệu năng từ gốc</strong>
                <small>Áp dụng nguyên tắc OWASP và chuẩn Core Web Vitals ngay từ ngày đầu tiên.</small>
              </span>
            </div>
          </div>
          <span className="eyebrow about-owner">
            NGUYỄN VĂN TẤN · FULL-STACK DEVELOPER · VANTANTHEDEV
          </span>
        </div>
      </section>

      <div className="about-stack">
        <span className="eyebrow">CÁC MẢNG NĂNG LỰC CỐT LÕI</span>
        <div>
          {[
            ['01', 'Web Applications & E-Commerce'],
            ['02', 'High-Performance APIs & Microservices'],
            ['03', 'Cross-Platform Mobile (iOS/Android)'],
            ['04', 'Cloud Infrastructure, Docker & DevOps']
          ].map(([n, title]) => (
            <span key={title}>
              <b>{n}</b>
              {title}
            </span>
          ))}
        </div>
        <Link to="/technologies" className="text-link">
          Xem chi tiết stack công nghệ <ArrowRight size={15} />
        </Link>
      </div>
    </main>
  );
}

function Technologies() {
  const groups = [
    [
      'GIAO DIỆN & FRONTEND',
      'React 19',
      'Next.js 15 (App Router)',
      'TypeScript',
      'Tailwind CSS',
      'Framer Motion',
      'Responsive Systems'
    ],
    [
      'BACKEND & HỆ THỐNG API',
      'Node.js',
      'NestJS',
      'Express',
      'Java & Spring Boot',
      'RESTful API',
      'OpenAPI / Swagger'
    ],
    [
      'CƠ SỞ DỮ LIỆU & CACHING',
      'PostgreSQL',
      'MySQL',
      'MongoDB',
      'Redis',
      'Prisma ORM',
      'Drizzle ORM'
    ],
    [
      'ỨNG DỤNG DI ĐỘNG',
      'Flutter (Dart)',
      'React Native',
      'iOS & Android native build',
      'Firebase Cloud Messaging'
    ],
    [
      'VẬN HÀNH & CLOUD DEVOPS',
      'Docker & Compose',
      'Linux Server Hardening',
      'CI/CD Pipelines (GitHub Actions)',
      'Cloudflare & Nginx'
    ],
    [
      'AN TOÀN BẢO MẬT & KIỂM TRA',
      'OWASP Top 10 hardening',
      'JWT / Secure Sessions',
      'RBAC Authorization',
      'Audit Trail Logs'
    ]
  ];

  return (
    <main className="page-main">
      <div className="page-hero compact">
        <span className="eyebrow">TECHNOLOGY STACK / CHỌN ĐÚNG CÔNG CỤ</span>
        <h1>
          Công nghệ phục vụ<br />
          <span className="muted-heading">mục tiêu của sản phẩm.</span>
        </h1>
        <p>
          Không có một công nghệ thần thánh cho mọi bài toán. Lựa chọn kỹ thuật luôn dựa trên
          yêu cầu tốc độ, quy mô người dùng và khả năng bảo trì lâu dài của doanh nghiệp bạn.
        </p>
      </div>

      <div className="technology-grid">
        {groups.map((g, i) => (
          <section className="technology-card" key={g[0]}>
            <div>
              <span>0{i + 1}</span>
              <span>STACK / MODULE</span>
            </div>
            <h2>{g[0]}</h2>
            <p>
              {[
                'Trải nghiệm người dùng mượt mà, tải nhanh và dễ bảo trì.',
                'Kiến trúc module tách biệt, validation chặt chẽ và dễ mở rộng.',
                'Mô hình dữ liệu chuẩn hóa, đánh index tối ưu và cache tốc độ cao.',
                'Trải nghiệm bản địa 60fps trên cả hai hệ điều hành iOS và Android.',
                'Quy trình triển khai tự động, giảm thiểu rủi ro gián đoạn dịch vụ.',
                'Bảo vệ dữ liệu người dùng và phòng ngừa các lỗ hổng bảo mật phổ biến.'
              ][i]}
            </p>
            <div className="tech-tags">
              {g.slice(1).map(t => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="technology-note">
        <Code2 />
        <p>
          <b>Công nghệ là phương tiện, giá trị thực tế của sản phẩm mới là đích đến.</b>
          <br />
          Tôi sẽ cùng bạn lựa chọn bộ công cụ phù hợp nhất sau khi hiểu rõ hạ tầng và nguồn lực vận hành của bạn.
        </p>
        <Link to="/contact">
          Thảo luận kỹ thuật cùng Nguyễn Văn Tấn <ArrowRight size={15} />
        </Link>
      </div>
    </main>
  );
}

function FAQ() {
  const topics = [
    [
      'CHI PHÍ & PHẠM VI',
      [
        [
          'Giá các gói dịch vụ trên website đã là giá cuối cùng chưa?',
          'Giá hiển thị là mức đầu tư trọn gói cho phạm vi tính năng tiêu chuẩn được liệt kê. Sau khi bạn gửi yêu cầu cụ thể, tôi sẽ rà soát và gửi bản xác nhận phạm vi chi tiết. Nếu không phát sinh tính năng ngoài gói, chi phí cam kết sẽ không đổi.'
        ],
        [
          'Có những khoản chi phí nào phát sinh thêm không?',
          'Tuyệt đối không có chi phí ẩn. Chỉ khi bạn yêu cầu bổ sung các tính năng ngoài thỏa thuận ban đầu, phần phát sinh mới được báo giá và bạn đồng ý trước khi tôi thực hiện.'
        ],
        [
          'Tôi chưa biết nên chọn gói dịch vụ nào?',
          'Bạn chỉ cần chọn gói gần nhất hoặc sử dụng trang "Ước tính dự án riêng" / gửi tin nhắn tại trang Liên hệ. Tôi sẽ tư vấn phương án tiết kiệm và hiệu quả nhất cho bạn.'
        ]
      ]
    ],
    [
      'QUY TRÌNH & THỜI GIAN',
      [
        [
          'Thời gian bắt đầu dự án được tính từ khi nào?',
          'Thời gian bàn giao được tính từ ngày hai bên chốt phạm vi công việc, nhận đủ tài nguyên ban đầu (nếu có) và hoàn tất xác nhận thanh toán đợt 1.'
        ],
        [
          'Tôi có thể theo dõi tiến độ như thế nào?',
          'Bạn có một không gian làm việc Client Space riêng trên website để theo dõi lộ trình 06 mốc tiến độ, xem demo trực tiếp, trao đổi và duyệt các tệp tài liệu.'
        ],
        [
          'Quy định về số vòng chỉnh sửa (revisions) ra sao?',
          'Mỗi gói bao gồm từ 2 đến 5 vòng chỉnh sửa miễn phí. Một vòng chỉnh sửa là tập hợp toàn bộ các góp ý của bạn sau khi xem xét bản demo của mốc đó.'
        ]
      ]
    ],
    [
      'THANH TOÁN & BÀN GIAO',
      [
        [
          'Các phương thức thanh toán nào được chấp nhận?',
          'Hệ thống hỗ trợ quét mã VietQR tự động (tương thích mọi App Ngân hàng Việt Nam), chuyển khoản ngân hàng truyền thống, cổng thanh toán và thẻ quốc tế.'
        ],
        [
          'Mã nguồn và bản quyền sản phẩm thuộc về ai?',
          'Toàn bộ mã nguồn, cơ sở dữ liệu và tài sản trí tuệ trong phạm vi dự án thuộc 100% quyền sở hữu của bạn sau khi hoàn tất nghĩa vụ thanh toán.'
        ],
        [
          'Chính sách bảo hành sau bàn giao như thế nào?',
          'Mỗi dự án đều có thời gian bảo hành kỹ thuật 30 - 60 ngày. Trong thời gian này, mọi lỗi kỹ thuật phát sinh trong phạm vi đã bàn giao đều được tôi sửa chữa miễn phí.'
        ]
      ]
    ],
    [
      'BẢO MẬT & HẠ TẦNG',
      [
        [
          'Ai có quyền truy cập vào dữ liệu dự án của tôi?',
          'Dữ liệu dự án được lưu trữ bảo mật và chỉ có bạn cùng người phụ trách (Nguyễn Văn Tấn) có quyền truy cập thông qua phiên làm việc đã xác thực.'
        ],
        [
          'Bạn có hỗ trợ thiết lập hosting, tên miền và server không?',
          'Có. Tôi hỗ trợ cấu hình trọn gói máy chủ VPS, Cloudflare, SSL HTTPS và quy trình triển khai tự động Docker theo hạ tầng của bạn.'
        ]
      ]
    ]
  ];

  return (
    <main className="page-main">
      <div className="page-hero compact">
        <span className="eyebrow">CÂU HỎI THƯỜNG GẶP / FAQ</span>
        <h1>
          Rõ ràng & Minh bạch<br />
          <span className="muted-heading">từ trước khi bạn quyết định.</span>
        </h1>
        <p>
          Dưới đây là những câu hỏi phổ biến nhất về cách thức làm việc, thanh toán và bảo hành
          tại VanTanTheDEV.
        </p>
      </div>

      <div className="faq-page-layout">
        <aside>
          <span className="eyebrow">DANH MỤC CÂU HỎI</span>
          {topics.map(([name]) => (
            <a key={name as string} href={`#${slugify(name as string)}`}>
              {name as string}
            </a>
          ))}
        </aside>
        <div>
          {topics.map(([name, questions]) => (
            <section className="faq-group" key={name as string} id={slugify(name as string)}>
              <span className="eyebrow">{name as string}</span>
              {(questions as string[][]).map(([q, a]) => (
                <FaqItem key={q} q={q} a={a} />
              ))}
            </section>
          ))}
          <div className="faq-contact">
            <b>Bạn có câu hỏi chưa được giải đáp tại đây?</b>
            <p>Hãy gửi tin nhắn trực tiếp, tôi sẽ phản hồi trong vòng 2 - 4 giờ làm việc.</p>
            <Link to="/contact" className="text-link">
              Liên hệ trực tiếp với Nguyễn Văn Tấn <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function Contact() {
  const { settings, flash } = useApp();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    projectType: searchParams.get('type') || 'Website / Web application',
    budget: searchParams.get('budget') || '',
    message: '',
    consent: false
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  function set(k: string, v: any) {
    setForm({ ...form, [k]: v });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/api/contact', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setSent(true);
      flash('Đã gửi yêu cầu thành công!');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page-main">
      <div className="contact-layout">
        <div className="contact-intro">
          <span className="eyebrow">CONTACT / BẮT ĐẦU DỰ ÁN</span>
          <h1>
            Mọi sản phẩm tốt<br />
            bắt đầu từ<br />
            <span className="text-gradient">một cuộc trò chuyện.</span>
          </h1>
          <p>
            Chưa cần bạn phải có bản đặc tả kỹ thuật chi tiết. Hãy chia sẻ về vấn đề bạn đang
            muốn giải quyết và mục tiêu bạn muốn đạt được.
          </p>
          <div className="contact-meta">
            <div>
              <span>KỸ SƯ PHỤ TRÁCH</span>
              <b>Nguyễn Văn Tấn</b>
            </div>
            <div>
              <span>EMAIL TRỰC TIẾP</span>
              <b>{settings.contact_email || 'contact@vantanthedev.com'}</b>
            </div>
            <div>
              <span>HOTLINE / ZALO</span>
              <b>{settings.contact_phone || '+84 901 234 567'}</b>
            </div>
            <div>
              <span>THỜI GIAN PHẢN HỒI</span>
              <b>Trong vòng 2 - 4 giờ làm việc</b>
            </div>
          </div>
          <div className="contact-privacy">
            <ShieldCheck size={16} />
            <span>
              Thông tin của bạn được bảo mật tuyệt đối và chỉ dùng để trao đổi về dự án này.
              Cam kết không gửi thư rác hay tiết lộ cho bên thứ ba.
            </span>
          </div>
        </div>

        <section className="contact-form-panel">
          {sent ? (
            <div className="contact-success">
              <span className="success-mark">
                <Check />
              </span>
              <span className="eyebrow">YÊU CẦU ĐÃ ĐƯỢC TIẾP NHẬN</span>
              <h2>Cảm ơn bạn đã gửi thông tin.</h2>
              <p>
                Nguyễn Văn Tấn đã nhận được yêu cầu của bạn và sẽ phản hồi chi tiết qua địa chỉ
                email hoặc số điện thoại bạn đã cung cấp.
              </p>
              <Link to="/" className="text-link" style={{ marginTop: 14 }}>
                Quay lại trang chủ <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <>
              <span className="eyebrow">GỬI YÊU CẦU DỰ ÁN / TƯ VẤN MIỄN PHÍ</span>
              <form className="contact-form" onSubmit={submit}>
                <div className="form-grid">
                  <Field label="Họ và tên của bạn" required>
                    <input
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      minLength={2}
                      required
                      placeholder="Nguyễn Văn An"
                    />
                  </Field>
                  <Field label="Địa chỉ Email" required>
                    <input
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      type="email"
                      required
                      placeholder="ban@email.com"
                    />
                  </Field>
                  <Field label="Số điện thoại / Zalo">
                    <input
                      value={form.phone}
                      onChange={e => set('phone', e.target.value)}
                      placeholder="0901234567 (tùy chọn)"
                    />
                  </Field>
                  <Field label="Loại dự án mong muốn" required>
                    <select
                      value={form.projectType}
                      onChange={e => set('projectType', e.target.value)}
                    >
                      <option>Website / Web application</option>
                      <option>Website Thương mại điện tử (VietQR)</option>
                      <option>SaaS / Nền tảng số</option>
                      <option>Mobile application (iOS/Android)</option>
                      <option>Custom Admin Dashboard</option>
                      <option>API / Backend System</option>
                      <option>UI/UX Design System</option>
                      <option>Khác / Chưa xác định</option>
                    </select>
                  </Field>
                  <Field label="Ngân sách dự kiến">
                    <input
                      value={form.budget}
                      onChange={e => set('budget', e.target.value)}
                      placeholder="Ví dụ: 15.000.000đ - 25.000.000đ"
                    />
                  </Field>
                  <Field label="Mô tả bài toán của bạn" required wide>
                    <textarea
                      rows={5}
                      value={form.message}
                      onChange={e => set('message', e.target.value)}
                      minLength={20}
                      required
                      placeholder="Bạn muốn làm gì? Ai sẽ sử dụng sản phẩm này và thời hạn mong muốn của bạn là khi nào?"
                    />
                  </Field>
                </div>
                <label className="terms-check">
                  <input
                    type="checkbox"
                    checked={form.consent}
                    onChange={e => set('consent', e.target.checked)}
                    required
                  />
                  <span className="custom-check">
                    <Check size={12} />
                  </span>
                  <span>
                    Tôi đồng ý để VanTanTheDEV sử dụng thông tin này nhằm phản hồi và tư vấn theo{' '}
                    <Link to="/privacy">Chính sách quyền riêng tư</Link>.
                  </span>
                </label>
                {error && <div className="form-error">{error}</div>}
                <button
                  className="button button-bright button-full"
                  disabled={busy || !form.consent}
                >
                  {busy ? 'Đang gửi thông tin…' : 'Gửi yêu cầu dự án'} <ArrowUpRight size={15} />
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function Legal({ title }: { title: string }) {
  const refund = title.includes('hoàn tiền');
  const payment = title.includes('thanh toán');
  const privacy = title.includes('riêng tư');

  return (
    <main className="page-main legal-main">
      <div className="page-hero compact">
        <span className="eyebrow">QUY CHUẨN THƯƠNG MẠI & PHÁP LÝ / VANTANTHEDEV</span>
        <h1>{title}</h1>
        <p>Cam kết minh bạch về quyền lợi khách hàng, sở hữu trí tuệ và chính sách thanh toán.</p>
      </div>

      <article className="legal-copy">
        <small>CẬP NHẬT: 2026 · ÁP DỤNG CHO MỌI HỢP ĐỒNG DỊCH VỤ</small>
        {privacy ? (
          <>
            <h2>1. Thu thập và Xử lý dữ liệu</h2>
            <p>
              VanTanTheDEV chỉ thu thập các thông tin tối thiểu cần thiết để phục vụ trao đổi,
              xây dựng và triển khai dự án (Họ tên, Email, Số điện thoại, Tên công ty, Yêu cầu chức năng).
            </p>
            <h2>2. Bảo mật thông tin dự án (NDA)</h2>
            <p>
              Mọi ý tưởng kinh doanh, mã nguồn, dữ liệu khách hàng và tài liệu dự án được cam kết
              bảo mật 100%. VanTanTheDEV không bao giờ tiết lộ hoặc thương mại hóa tài sản của khách hàng.
            </p>
            <h2>3. Quyền của khách hàng</h2>
            <p>
              Khách hàng có toàn quyền yêu cầu trích xuất hoặc xóa bỏ vĩnh viễn dữ liệu cá nhân khỏi
              hệ thống bất kỳ lúc nào sau khi hợp đồng kết thúc.
            </p>
          </>
        ) : refund ? (
          <>
            <h2>1. Điều kiện hoàn tiền</h2>
            <p>
              Nếu trong vòng 03 ngày làm việc kể từ khi ký hợp đồng mà phía VanTanTheDEV không thể
              khởi động dự án theo đúng cam kết thời gian, khách hàng được hoàn lại 100% chi phí đặt cọc.
            </p>
            <h2>2. Tạm dừng hoặc hủy dự án</h2>
            <p>
              Trường hợp khách hàng muốn tạm dừng hoặc thay đổi kế hoạch, hai bên sẽ tiến hành đối soát
              khối lượng công việc đã hoàn thành để thanh toán hoặc hoàn lại phần tiền tương ứng một cách công bằng.
            </p>
          </>
        ) : payment ? (
          <>
            <h2>1. Lộ trình thanh toán theo mốc</h2>
            <p>
              Mỗi dự án được chia thành các đợt thanh toán rõ ràng (Ví dụ: Đợt 1 đặt cọc 40-50% khi ký thỏa thuận,
              Đợt 2 thanh toán phần còn lại sau khi nghiệm thu và nhận bàn giao mã nguồn).
            </p>
            <h2>2. Phương thức thanh toán VietQR</h2>
            <p>
              Khách hàng chuyển khoản theo đúng mã đơn hàng hiển thị trên VietQR để hệ thống tự động
              đối soát và kích hoạt dự án trong thời gian nhanh nhất.
            </p>
          </>
        ) : (
          <>
            <h2>1. Bàn giao và Quyền sở hữu mã nguồn</h2>
            <p>
              Sau khi hoàn tất nghĩa vụ thanh toán, khách hàng sở hữu 100% bản quyền mã nguồn dự án,
              bao gồm toàn bộ Git repository, tài liệu kiến trúc và quyền tự do phát triển hoặc chỉnh sửa.
            </p>
            <h2>2. Bảo hành kỹ thuật</h2>
            <p>
              Mọi dự án đều được bảo hành kỹ thuật 30 - 60 ngày miễn phí đối với mọi lỗi phát sinh trong
              phạm vi đã thống nhất.
            </p>
          </>
        )}
      </article>

      <div className="legal-foot">
        <span>VanTanTheDEV · Nguyễn Văn Tấn · Studio Phát Triển Phần Mềm</span>
        <Link to="/contact">
          Trao đổi chi tiết <ArrowRight size={14} />
        </Link>
      </div>
    </main>
  );
}

function NotFound() {
  return (
    <main className="not-found">
      <span>404 / ROUTE NOT FOUND</span>
      <h1>
        Trang này<br />
        chưa tồn tại.
      </h1>
      <p>Đường dẫn bạn tìm kiếm có thể đã thay đổi hoặc đang được bảo trì.</p>
      <Link to="/" className="button button-bright">
        Quay về trang chủ <ArrowRight size={15} />
      </Link>
    </main>
  );
}

// ==========================================
// SHARED UI COMPONENTS & MODALS
// ==========================================

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? 'open' : ''}`}>
      <button onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{q}</span>
        <span className="faq-plus">{open ? '−' : '+'}</span>
      </button>
      {open && <p>{a}</p>}
    </div>
  );
}

function Field({
  label,
  required,
  children,
  wide = false
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`field ${wide ? 'wide' : ''}`}>
      <span>
        {label}
        {required && <i> *</i>}
      </span>
      {children}
    </label>
  );
}

function Empty({
  title,
  text,
  action,
  to,
  compact = false
}: {
  title: string;
  text: string;
  action?: string;
  to?: string;
  compact?: boolean;
}) {
  return (
    <div className={`empty-state ${compact ? 'compact' : ''}`}>
      <span className="empty-mark">{action ? '—' : '·'}</span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action && to && (
        <Link className="text-link" to={to}>
          {action} <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}

function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const nav = useNavigate();

  useEffect(() => {
    function show() {
      setOpen(true);
      setQuery('');
      api<Service[]>('/api/services')
        .then(setServices)
        .catch(() => {});
    }
    function key(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('open-command', show);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('open-command', show);
      window.removeEventListener('keydown', key);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('palette-open', open);
    return () => document.body.classList.remove('palette-open');
  }, [open]);

  if (!open) return null;

  const base = [
    { name: 'Tất cả dịch vụ phần mềm', path: '/services', type: 'DANH MỤC' },
    { name: 'Ước tính dự án riêng (Estimator)', path: '/custom-project', type: 'CÔNG CỤ' },
    { name: 'Sản phẩm & Case Studies', path: '/portfolio', type: 'KHÁM PHÁ' },
    { name: 'Stack công nghệ kỹ thuật', path: '/technologies', type: 'KỸ THUẬT' },
    { name: 'Về Nguyễn Văn Tấn', path: '/about', type: 'GIỚI THIỆU' },
    { name: 'Câu hỏi thường gặp (FAQ)', path: '/faq', type: 'HỖ TRỢ' },
    { name: 'Liên hệ tư vấn trực tiếp', path: '/contact', type: 'LIÊN HỆ' },
    { name: 'Không gian khách hàng (Dashboard)', path: '/dashboard', type: 'KHÁCH HÀNG' }
  ];

  const results = [
    ...services.map(s => ({
      name: `${s.title} (${money(s.starting_price)})`,
      path: `/services/${s.slug}`,
      type: 'DỊCH VỤ'
    })),
    ...base
  ]
    .filter(x => `${x.name} ${x.type}`.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8);

  return (
    <div
      className="palette-overlay"
      onMouseDown={e => e.target === e.currentTarget && setOpen(false)}
    >
      <section
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Tìm kiếm nhanh"
      >
        <div className="palette-input">
          <Search />
          <input
            autoFocus
            placeholder="Tìm kiếm dịch vụ, công nghệ, đặt lịch..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && results[0]) {
                nav(results[0].path);
                setOpen(false);
              }
            }}
          />
          <button onClick={() => setOpen(false)}>ESC</button>
        </div>
        <span className="palette-label">GỢI Ý KẾT QUẢ / ĐIỂM ĐẾN</span>
        {results.length ? (
          results.map(r => (
            <button
              className="palette-result"
              key={r.path}
              onClick={() => {
                nav(r.path);
                setOpen(false);
              }}
            >
              <span>{r.name}</span>
              <small>{r.type}</small>
              <ArrowUpRight size={14} />
            </button>
          ))
        ) : (
          <div className="palette-none">Không tìm thấy nội dung phù hợp.</div>
        )}
        <div className="palette-foot">
          <span>ENTER MỞ</span>
          <span>ESC ĐÓNG</span>
        </div>
      </section>
    </div>
  );
}

// ==========================================
// VIETQR POPUP MODAL
// ==========================================

function VietQrModal({
  orderNumber,
  amount,
  onClose
}: {
  orderNumber: string;
  amount: number;
  onClose: () => void;
}) {
  const { flash } = useApp();
  const qrUrl = generateVietQrUrl('MB', '0987654321', amount, orderNumber, 'NGUYEN VAN TAN');

  return (
    <div className="vietqr-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="vietqr-modal" role="dialog" aria-modal="true">
        <div className="vietqr-header">
          <h3>Thanh toán nhanh VietQR</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>
        <div className="vietqr-body">
          <div className="qr-frame">
            <img src={qrUrl} alt="Mã VietQR" />
          </div>

          <div className="vietqr-bank-details">
            <div className="bank-row">
              <span>Ngân hàng:</span>
              <b>MB Bank (Quân Đội)</b>
            </div>
            <div className="bank-row">
              <span>Số tài khoản:</span>
              <div>
                <b>0987654321</b>
                <button
                  type="button"
                  className="copy-pill"
                  onClick={() => {
                    navigator.clipboard.writeText('0987654321');
                    flash('Đã sao chép STK!');
                  }}
                >
                  Sao chép
                </button>
              </div>
            </div>
            <div className="bank-row">
              <span>Chủ tài khoản:</span>
              <b>NGUYEN VAN TAN</b>
            </div>
            <div className="bank-row">
              <span>Số tiền:</span>
              <div>
                <b style={{ color: '#60d3a2' }}>{money(amount)}</b>
                <button
                  type="button"
                  className="copy-pill"
                  onClick={() => {
                    navigator.clipboard.writeText(String(amount));
                    flash('Đã sao chép số tiền!');
                  }}
                >
                  Sao chép
                </button>
              </div>
            </div>
            <div className="bank-row">
              <span>Nội dung chuyển:</span>
              <div>
                <b style={{ color: '#a08cff' }}>{orderNumber}</b>
                <button
                  type="button"
                  className="copy-pill"
                  onClick={() => {
                    navigator.clipboard.writeText(orderNumber);
                    flash('Đã sao chép nội dung!');
                  }}
                >
                  Sao chép
                </button>
              </div>
            </div>
          </div>

          <p style={{ margin: '0 0 16px', fontSize: 10, color: '#94a3b8', lineHeight: 1.6 }}>
            Mở ứng dụng ngân hàng bất kỳ (Vietcombank, MB, Techcombank, MoMo...) và quét mã QR để chuyển khoản chính xác nội dung.
          </p>

          <button className="button button-bright button-full" onClick={onClose}>
            Đã hoàn tất / Đóng cửa sổ <Check size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// PRINTABLE INVOICE MODAL
// ==========================================

function InvoiceModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const invNumber = `INV-${order.order_number}`;

  return (
    <div
      className="invoice-modal-overlay"
      onMouseDown={e => e.target === e.currentTarget && onClose()}
    >
      <div className="invoice-paper" role="dialog" aria-modal="true">
        <div className="invoice-actions-bar">
          <button
            className="button button-small button-bright"
            onClick={() => window.print()}
          >
            <Printer size={14} /> In Hóa Đơn PDF
          </button>
          <button
            className="button button-small button-quiet"
            onClick={onClose}
          >
            <X size={14} /> Đóng
          </button>
        </div>

        <div className="inv-top">
          <div>
            <div className="inv-brand">
              VanTanThe<span>DEV</span>
            </div>
            <p className="inv-seller">
              Đơn vị cung cấp: <b>Nguyễn Văn Tấn</b> (VanTanTheDEV Studio)<br />
              Email: contact@vantanthedev.com · Hotline: +84 901 234 567<br />
              Dịch vụ phần mềm thương mại & giải pháp công nghệ số
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: 20, color: '#111827' }}>HÓA ĐƠN DỊCH VỤ</h2>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#4f46e5', fontWeight: 600 }}>
              {invNumber}
            </div>
            <small style={{ color: '#6b7280', fontSize: 10, display: 'block', marginTop: 4 }}>
              Ngày lập: {date(order.created_at)}
            </small>
            <div style={{ marginTop: 6 }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  background: order.payment_status === 'paid' ? '#dcfce7' : '#fef3c7',
                  color: order.payment_status === 'paid' ? '#166534' : '#92400e'
                }}
              >
                {order.payment_status === 'paid' ? 'ĐÃ THANH TOÁN' : 'CHỜ THANH TOÁN'}
              </span>
            </div>
          </div>
        </div>

        <div className="inv-meta-grid">
          <div>
            <span style={{ fontSize: 9, color: '#6b7280', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>
              THÔNG TIN KHÁCH HÀNG / BÊN MUA:
            </span>
            <div className="inv-client">
              <b>{order.customer_name || 'Khách hàng đối tác'}</b>
              {order.customer_company && <div>Công ty: {order.customer_company}</div>}
              <div>Email: {order.customer_email || '—'}</div>
              {order.customer_phone && <div>SĐT: {order.customer_phone}</div>}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 9, color: '#6b7280', fontFamily: 'var(--mono)', display: 'block', marginBottom: 4 }}>
              THÔNG TIN DỰ ÁN & THANH TOÁN:
            </span>
            <div className="inv-client">
              <b>{order.project_name}</b>
              <div>Dịch vụ: {order.service_title}</div>
              <div>Phương thức: {paymentMethodLabel[order.payment_method] || order.payment_method}</div>
              {order.payment_reference && <div>Mã đối soát: {order.payment_reference}</div>}
            </div>
          </div>
        </div>

        <table className="inv-table">
          <thead>
            <tr>
              <th>Hạng mục dịch vụ</th>
              <th style={{ textAlign: 'center' }}>Số lượng</th>
              <th style={{ textAlign: 'right' }}>Đơn giá</th>
              <th style={{ textAlign: 'right' }}>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <b>{order.service_title} - Gói {order.package_name}</b>
                <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>
                  Bao gồm thiết kế, lập trình, tối ưu Core Web Vitals và bàn giao mã nguồn.
                </div>
              </td>
              <td style={{ textAlign: 'center' }}>01 gói</td>
              <td style={{ textAlign: 'right', fontFamily: 'var(--mono)' }}>
                {money(order.subtotal || order.amount)}
              </td>
              <td style={{ textAlign: 'right', fontFamily: 'var(--mono)', fontWeight: 600 }}>
                {money(order.subtotal || order.amount)}
              </td>
            </tr>
            {(order.addons || []).map((a: any, i: number) => (
              <tr key={i}>
                <td>
                  <b>Tiện ích: {a.title}</b>
                </td>
                <td style={{ textAlign: 'center' }}>01</td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--mono)' }}>{money(a.price)}</td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--mono)' }}>{money(a.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="inv-totals">
          <div>
            <span>Tạm tính (Subtotal):</span>
            <b style={{ fontFamily: 'var(--mono)' }}>{money(order.subtotal || order.amount)}</b>
          </div>
          {order.discount_amount > 0 && (
            <div style={{ color: '#16a34a' }}>
              <span>Chiết khấu ({order.coupon_code || 'Ưu đãi'}):</span>
              <b style={{ fontFamily: 'var(--mono)' }}>-{money(order.discount_amount)}</b>
            </div>
          )}
          <div>
            <span>Thuế GTGT (VAT 0% dịch vụ phần mềm):</span>
            <b style={{ fontFamily: 'var(--mono)' }}>0 ₫</b>
          </div>
          <div className="inv-grand">
            <span>Tổng thanh toán:</span>
            <b style={{ fontFamily: 'var(--mono)', color: '#4f46e5' }}>{money(order.amount)}</b>
          </div>
        </div>

        <div className="inv-stamp">
          <div>
            <span style={{ fontSize: 9, color: '#9ca3af' }}>ĐIỀU KHOẢN VẬN HÀNH:</span>
            <p style={{ margin: '4px 0 0', maxWidth: 400, fontSize: 9, color: '#6b7280', lineHeight: 1.6 }}>
              Mã nguồn dự án được chuyển giao đầy đủ cho khách hàng sau khi hoàn tất nghĩa vụ tài chính.
              Bảo hành kỹ thuật sửa lỗi trong thời gian thỏa thuận.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span>ĐẠI DIỆN VANTANTHEDEV:</span>
            <div style={{ marginTop: 12, color: '#4f46e5', fontWeight: 800, letterSpacing: 1, fontFamily: 'var(--display)' }}>
              [ĐÃ XÁC THỰC ĐIỆN TỬ]
            </div>
            <b>NGUYỄN VĂN TẤN</b>
          </div>
        </div>
      </div>
    </div>
  );
}

function slugify(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default App;
