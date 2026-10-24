import { createContext, useContext, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowDown, ArrowRight, ArrowUpRight, Bell, Check, ChevronDown, Clock3, Code2,
  CreditCard, FileText, Heart, Home as HomeIcon, LayoutDashboard, LockKeyhole, Menu, MessageCircle,
  Search, Send, ShieldCheck, Sparkles, Star, X, Copy, Download, ExternalLink,
  Printer, QrCode, Tag, Upload, UserCheck, UserX, CheckCircle2, AlertCircle,
  Building, Phone, Mail, HelpCircle, Layers, Compass, Users, RotateCcw,
  Smartphone, Globe, Database, Server, Cpu, Palette, Zap, CheckCheck, Briefcase
} from 'lucide-react';
import { api, date, dateTime, money, statusLabel, paymentMethodLabel, generateVietQrUrl, setAuthToken, getAuthToken } from './api';
import { DEFAULT_SERVICES, DEFAULT_REVIEWS } from './defaultData';
import {
  MotionNavigationMenu,
  MotionNavigationMenuList,
  MotionNavigationMenuItem,
  MotionNavigationMenuTrigger,
  MotionNavigationMenuContent,
  MotionNavigationMenuLink,
} from './components/ui/motion-navigation-menu';
import DemoOne from './components/ui/demo';

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
  google_id?: string | null;
  avatar_url?: string | null;
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
  lang: 'vi' | 'en';
  setLang: (l: 'vi' | 'en') => void;
  t: (vi: string, en: string) => string;
};

const AppContext = createContext<AppContextType>({
  user: null,
  setUser: () => {},
  settings: {},
  flash: () => {},
  ready: false,
  openVietQr: () => {},
  openInvoice: () => {},
  lang: 'vi',
  setLang: () => {},
  t: (vi: string) => vi
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
  const [lang, setLangState] = useState<'vi' | 'en'>(() => {
    const saved = localStorage.getItem('vt_lang');
    return saved === 'en' ? 'en' : 'vi';
  });

  const setLang = (l: 'vi' | 'en') => {
    setLangState(l);
    localStorage.setItem('vt_lang', l);
  };

  const t = (vi: string, en: string) => (lang === 'en' ? en : vi);

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

  // AutoQuest / 21st.dev Ripple Click Micro-interaction
  useEffect(() => {
    const handleRippleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const btn = target.closest(
        'button, .btn, .button, .btn-filled, .btn-outline, .btn-action-top, .lang-pill, .search-shortcut, .button-bright, .button-quiet, .btn-primary'
      ) as HTMLElement | null;
      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple-effect';
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 550);
    };

    document.addEventListener('click', handleRippleClick);
    return () => document.removeEventListener('click', handleRippleClick);
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
        openInvoice,
        lang,
        setLang,
        t
      }}
    >
      <div className="app-shell">
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
          <Route path="/dock" element={<DemoOne />} />
          <Route path="/demo" element={<DemoOne />} />
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
            <CheckCircle2 size={16} style={{ color: '#22c55e', flex: 'none' }} />
            <span>{notice}</span>
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
}

function Header({ ready }: { ready: boolean }) {
  const { user, lang, setLang, t } = useApp();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <header className="site-header">
      <div className="nav-wrap">
        <Link to="/" className="brand" aria-label="VanTanTheDEV">
          <span className="brand-mark">
            <Code2 size={18} />
          </span>
          <span className="brand-text">
            VanTanThe<span className="brand-accent">DEV</span>
          </span>
        </Link>
        <div className="desktop-nav-wrap">
          <MotionNavigationMenu
            viewportClassName="motion-nav-popover"
            springBounce={0}
            springStiffness={360}
            springDamping={30}
          >
            <MotionNavigationMenuList>
              {/* 1. DỊCH VỤ / SERVICES */}
              <MotionNavigationMenuItem value="services">
                <MotionNavigationMenuTrigger className="nav-motion-trigger">
                  {t('Dịch vụ', 'Services')}
                </MotionNavigationMenuTrigger>
                <MotionNavigationMenuContent className="nav-dropdown-content">
                  <div className="nav-dropdown-grid">
                    <Link
                      to="/services"
                      className="nav-featured-card"
                    >
                      <div className="nav-featured-icon">
                        <Code2 size={20} />
                      </div>
                      <div className="nav-featured-text">
                        <strong>{t('Tất cả 08 Dịch vụ', 'All 08 Services')}</strong>
                        <p>
                          {t(
                            'Kiến trúc microservices, thương mại số & tối ưu hiệu năng toàn diện.',
                            'Microservices architecture, digital commerce & full performance tuning.'
                          )}
                        </p>
                        <span className="nav-featured-cta">
                          {t('Khám phá trọn gói →', 'Explore all →')}
                        </span>
                      </div>
                    </Link>

                    <div className="nav-links-grid">
                      <MotionNavigationMenuLink href="/services/web-development" className="nav-sublink">
                        <span className="nav-sublink-title">
                          {t('Phát triển Web & SaaS', 'Web & SaaS Development')}
                          <ArrowUpRight size={13} />
                        </span>
                        <span className="nav-sublink-desc">
                          {t('Frontend hiện đại, API chuẩn microservices', 'Modern frontend, microservices APIs')}
                        </span>
                      </MotionNavigationMenuLink>

                      <MotionNavigationMenuLink href="/services/mobile-development" className="nav-sublink">
                        <span className="nav-sublink-title">
                          {t('Ứng dụng Di Động', 'Mobile Applications')}
                          <ArrowUpRight size={13} />
                        </span>
                        <span className="nav-sublink-desc">
                          {t('iOS & Android hiệu năng native', 'Native performance iOS & Android')}
                        </span>
                      </MotionNavigationMenuLink>

                      <MotionNavigationMenuLink href="/services/custom-software" className="nav-sublink">
                        <span className="nav-sublink-title">
                          {t('Phần mềm doanh nghiệp', 'Enterprise Custom Software')}
                          <ArrowUpRight size={13} />
                        </span>
                        <span className="nav-sublink-desc">
                          {t('Hệ thống quản trị, CRM & tự động hóa', 'Management systems, CRM & automation')}
                        </span>
                      </MotionNavigationMenuLink>

                      <MotionNavigationMenuLink href="/services/ui-ux-design" className="nav-sublink">
                        <span className="nav-sublink-title">
                          {t('Thiết kế UI/UX', 'UI/UX & Design Systems')}
                          <ArrowUpRight size={13} />
                        </span>
                        <span className="nav-sublink-desc">
                          {t('Trải nghiệm mượt mà, chuẩn thương hiệu', 'Smooth experience, brand consistency')}
                        </span>
                      </MotionNavigationMenuLink>
                    </div>
                  </div>
                </MotionNavigationMenuContent>
              </MotionNavigationMenuItem>

              {/* 2. DỰ ÁN & GIẢI PHÁP / SOLUTIONS & TECH */}
              <MotionNavigationMenuItem value="solutions">
                <MotionNavigationMenuTrigger className="nav-motion-trigger">
                  {t('Giải pháp & Tech', 'Solutions & Tech')}
                </MotionNavigationMenuTrigger>
                <MotionNavigationMenuContent className="nav-dropdown-content">
                  <div className="nav-solutions-list">
                    <MotionNavigationMenuLink href="/custom-project" className="nav-solution-item">
                      <span className="nav-solution-icon">
                        <Sparkles size={16} />
                      </span>
                      <div className="nav-solution-text">
                        <strong>{t('Dự án riêng (Estimator)', 'Custom Project Estimator')}</strong>
                        <small>{t('Tính toán ngân sách & ngày bàn giao tức thì', 'Instant scope & budget calculation')}</small>
                      </div>
                    </MotionNavigationMenuLink>

                    <MotionNavigationMenuLink href="/portfolio" className="nav-solution-item">
                      <span className="nav-solution-icon">
                        <Compass size={16} />
                      </span>
                      <div className="nav-solution-text">
                        <strong>{t('Sản phẩm & Case Studies', 'Portfolio & Case Studies')}</strong>
                        <small>{t('Dự án thương mại thực tế đã triển khai', 'Real-world commercial deployments')}</small>
                      </div>
                    </MotionNavigationMenuLink>

                    <MotionNavigationMenuLink href="/technologies" className="nav-solution-item">
                      <span className="nav-solution-icon">
                        <Layers size={16} />
                      </span>
                      <div className="nav-solution-text">
                        <strong>{t('Stack Công nghệ kỹ thuật', 'Technical Tech Stack')}</strong>
                        <small>{t('React, TypeScript, Node, Go, Docker, Cloud', 'React, TypeScript, Node, Go, Docker, Cloud')}</small>
                      </div>
                    </MotionNavigationMenuLink>
                  </div>
                </MotionNavigationMenuContent>
              </MotionNavigationMenuItem>

              {/* 3. VỀ CHÚNG TÔI / ABOUT & SUPPORT */}
              <MotionNavigationMenuItem value="about">
                <MotionNavigationMenuTrigger className="nav-motion-trigger">
                  {t('Về đội ngũ', 'About Us')}
                </MotionNavigationMenuTrigger>
                <MotionNavigationMenuContent className="nav-dropdown-content">
                  <div className="nav-about-grid">
                    <div className="nav-about-links">
                      <MotionNavigationMenuLink href="/about" className="nav-about-item">
                        <Users size={16} />
                        <div>
                          <strong>{t('Về đội ngũ & Tầm nhìn', 'About Team & Vision')}</strong>
                          <small>{t('Triết lý kỹ thuật & chuẩn mã nguồn', 'Engineering philosophy & standards')}</small>
                        </div>
                      </MotionNavigationMenuLink>

                      <MotionNavigationMenuLink href="/faq" className="nav-about-item">
                        <HelpCircle size={16} />
                        <div>
                          <strong>{t('Câu hỏi thường gặp (FAQ)', 'Frequently Asked Questions')}</strong>
                          <small>{t('Quy trình bàn giao, bảo hành & thanh toán', 'Handover, warranty & payment terms')}</small>
                        </div>
                      </MotionNavigationMenuLink>

                      <MotionNavigationMenuLink href="/contact" className="nav-about-item">
                        <Phone size={16} />
                        <div>
                          <strong>{t('Liên hệ tư vấn trực tiếp', 'Direct Technical Consultation')}</strong>
                          <small>{t('Trao đổi 1-1, nhận báo giá chi tiết', '1-on-1 call, detailed quotation')}</small>
                        </div>
                      </MotionNavigationMenuLink>
                    </div>

                    <Link to="/custom-project" className="nav-about-card">
                      <Sparkles size={18} />
                      <strong>{t('Sẵn sàng khởi tạo?', 'Ready to start?')}</strong>
                      <p>{t('Bắt đầu với dự toán minh bạch và bảo mật 100%.', 'Begin with transparent scope & 100% security.')}</p>
                      <span>{t('Ước tính ngay →', 'Estimate now →')}</span>
                    </Link>
                  </div>
                </MotionNavigationMenuContent>
              </MotionNavigationMenuItem>
            </MotionNavigationMenuList>
          </MotionNavigationMenu>
        </div>

        {/* Mobile Navigation Drawer */}
        <nav className={`main-nav ${open ? 'is-open' : ''}`}>
          <NavLink to="/services">{t('Dịch vụ', 'Services')}</NavLink>
          <NavLink to="/custom-project">{t('Dự án riêng', 'Custom Project')}</NavLink>
          <NavLink to="/portfolio">{t('Sản phẩm', 'Portfolio')}</NavLink>
          <NavLink to="/technologies">{t('Công nghệ', 'Technologies')}</NavLink>
          <NavLink to="/about">{t('Về đội ngũ', 'About')}</NavLink>
          <NavLink to="/faq">{t('Hỏi đáp', 'FAQ')}</NavLink>
          <NavLink to="/contact">{t('Liên hệ', 'Contact')}</NavLink>
        </nav>
        <div className="nav-actions">
          <div className="lang-toggle-wrap" role="group" aria-label={t('Chọn ngôn ngữ', 'Select language')}>
            <button
              type="button"
              className={`lang-pill ${lang === 'vi' ? 'active' : ''}`}
              onClick={() => setLang('vi')}
              title="Tiếng Việt"
            >
              VI
            </button>
            <span className="lang-sep">/</span>
            <button
              type="button"
              className={`lang-pill ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
              title="English"
            >
              EN
            </button>
          </div>

          <button
            className="search-shortcut"
            onClick={() => window.dispatchEvent(new Event('open-command'))}
            aria-label={t('Tìm kiếm nhanh', 'Quick search')}
          >
            <Search size={15} />
            <span>{t('Tìm kiếm', 'Search')}</span>
            <kbd>⌘ K</kbd>
          </button>
          {ready && user ? (
            <Link
              to={user.role === 'admin' ? '/admin' : '/dashboard'}
              className="nav-profile"
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="account-initial" style={{ width: 22, height: 22, fontSize: 10 }}>
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span>{user.name.split(' ').slice(-1)[0]}</span>
              {user.role === 'admin' && (
                <span className="badge-tag badge-active" style={{ fontSize: 8 }}>ADMIN</span>
              )}
              <ArrowUpRight size={13} />
            </Link>
          ) : (
            <Link to="/login" className="nav-login">
              {t('Đăng nhập', 'Sign In')}
            </Link>
          )}
          <Link to="/custom-project" className="button button-small button-bright">
            {t('Bắt đầu dự án', 'Start Project')} <ArrowUpRight size={15} />
          </Link>
        </div>
        <button
          aria-label={open ? t('Đóng menu', 'Close menu') : t('Mở menu', 'Open menu')}
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
  const { settings, t } = useApp();
  return (
    <footer className="footer">
      <div className="footer-main">
        <div>
          <Link to="/" className="brand" aria-label="VanTanTheDEV">
            <span className="brand-mark">
              <Code2 size={18} />
            </span>
            <span className="brand-text">
              VanTanThe<span className="brand-accent">DEV</span>
            </span>
          </Link>
          <p>
            {t(
              'Giải pháp phần mềm hiện đại cho cá nhân, startup và doanh nghiệp.',
              'Modern software engineering solutions for individuals, startups, and enterprises.'
            )}
            <br />
            {t(
              'Phát triển bởi Đội ngũ Kỹ sư VanTanTheDEV · Giám sát bởi Nguyễn Văn Tấn (CEO & Giám đốc Vận hành).',
              'Developed by VanTanTheDEV Engineering Team · Supervised by Nguyen Van Tan (CEO & COO).'
            )}
          </p>
          <div style={{ marginTop: 12, display: 'flex', gap: 14, fontSize: 11, color: '#94a3b8' }}>
            <span><Mail size={13} style={{ verticalAlign: -2 }} /> {settings.contact_email || 'contact@vantanthedev.com'}</span>
            <span><Phone size={13} style={{ verticalAlign: -2 }} /> {settings.contact_phone || '+84 901 234 567'}</span>
          </div>
        </div>
        <div>
          <span className="footer-label">{t('Dịch Vụ Nổi Bật', 'Featured Services')}</span>
          <Link to="/services/website-doanh-nghiep">{t('Website Doanh Nghiệp', 'Enterprise Website')}</Link>
          <Link to="/services/website-thuong-mai-dien-tu">{t('Thương Mại Điện Tử VietQR', 'VietQR E-Commerce')}</Link>
          <Link to="/services/san-pham-saas">{t('Phát Triển SaaS MVP', 'SaaS MVP Development')}</Link>
          <Link to="/services/admin-dashboard">{t('Bảng Điều Khiển Admin Tùy Biến', 'Custom Admin Dashboard')}</Link>
          <Link to="/services/ung-dung-di-dong">{t('Ứng Dụng Di Động', 'Mobile Applications')}</Link>
        </div>
        <div>
          <span className="footer-label">{t('Điều Hướng & Hỗ Trợ', 'Navigation & Support')}</span>
          <Link to="/custom-project">{t('Ước Tính Dự Án Riêng', 'Custom Project Estimator')}</Link>
          <Link to="/portfolio">{t('Sản Phẩm & Nghiên Cứu Điển Hình', 'Portfolio & Case Studies')}</Link>
          <Link to="/technologies">{t('Hệ Thống Công Nghệ', 'Technology Stack')}</Link>
          <Link to="/faq">{t('Câu Hỏi Thường Gặp (FAQ)', 'FAQ & Help Center')}</Link>
          <Link to="/contact">{t('Liên Hệ Đội Ngũ Hỗ Trợ', 'Contact Engineering Team')}</Link>
        </div>
        <div className="footer-cta">
          <span className="eyebrow">{t('CÓ MỘT BÀI TOÁN?', 'HAVE A CHALLENGE?')}</span>
          <Link to="/custom-project">
            {t('Cùng trao đổi nhé', "Let's connect")} <ArrowUpRight size={16} />
          </Link>
          <small>{t('Rõ phạm vi · Báo giá minh bạch · Bàn giao mã nguồn', 'Clear scope · Transparent pricing · Full code handover')}</small>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} VanTanTheDEV Studio · Nguyễn Văn Tấn (CEO & COO). {t('Toàn quyền bảo lưu.', 'All rights reserved.')}
        </span>
        <div>
          <Link to="/terms">{t('Điều khoản', 'Terms')}</Link>
          <Link to="/privacy">{t('Quyền riêng tư', 'Privacy')}</Link>
          <Link to="/payment-policy">{t('Thanh toán VietQR', 'VietQR Payment')}</Link>
          <Link to="/refund-policy">{t('Hoàn tiền', 'Refunds')}</Link>
          <span className="availability">
            <i /> {t('Nhận 02 dự án trong quý này', 'Available for 02 projects this quarter')}
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
  const navigate = useNavigate();
  const { t } = useApp();
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [reviews, setReviews] = useState<any[]>(DEFAULT_REVIEWS);

  useEffect(() => {
    api<Service[]>('/api/services')
      .then(res => {
        if (Array.isArray(res) && res.length > 0) setServices(res);
      })
      .catch(() => {});
    api<any[]>('/api/reviews')
      .then(res => {
        if (Array.isArray(res) && res.length > 0) setReviews(res);
      })
      .catch(() => {});
  }, []);

  return (
    <main>
      {/* 1. SOLSTICE HERO SECTION */}
      <section className="solstice-hero">
        <div className="solstice-hero-glow" />
        
        <div className="solstice-hero-pill">
          <span className="dot" /> {t('VanTanTheDEV · Nền Tảng Kỹ Thuật Số & Kiến Trúc Phần Mềm', 'VanTanTheDEV · Digital Platform & Software Architecture')}
        </div>

        <h1 className="solstice-title">
          {t('Ánh sáng vô hạn.', 'Light in the infinite.')}<br />
          <span>{t('Hiện diện không bao giờ gián đoạn.', 'Presence that never drops.')}</span>
        </h1>

        <p className="solstice-desc">
          {t(
            'Làm chủ hoàn toàn cách bạn xuất hiện trên không gian số — từ kiến trúc microservices hiệu năng cao, hệ thống thương mại hiện đại đến nền tảng tự động hóa vận hành 24/7. 100% sở hữu mã nguồn · Tối ưu hiệu năng tải trang chuẩn mực.',
            'Master your digital presence — from high-performance microservices and modern commerce systems to 24/7 automated operations. 100% source code ownership · Industry-standard performance.'
          )}
        </p>

        <div className="solstice-cta-row">
          <button onClick={() => navigate('/custom-project')} className="btn-filled">
            <Sparkles size={16} style={{ verticalAlign: -2, marginRight: 8 }} /> {t('Bắt đầu dự án', 'Start Project')}
          </button>
          <a href="#services" className="btn-outline">
            {t('Khám phá 08 Dịch vụ', 'Explore 08 Services')} <ArrowDown size={15} style={{ verticalAlign: -2, marginLeft: 8 }} />
          </a>
        </div>

        {/* Solstice Metrics Strip (4 columns, 14px grid) */}
        <div className="solstice-metrics-grid" style={{ width: '100%', maxWidth: 1040, margin: '28px auto 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <div className="card" style={{ padding: '20px 24px', background: '#0e0e0f', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 600, color: '#fafafa', letterSpacing: '-0.5px' }}>99.99%</div>
            <div style={{ fontSize: 13, color: '#999999', marginTop: 4 }}>{t('Thời gian hoạt động & Độ sẵn sàng', 'System Presence & Uptime')}</div>
          </div>
          <div className="card" style={{ padding: '20px 24px', background: '#0e0e0f', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 600, color: '#fafafa', letterSpacing: '-0.5px' }}>50+</div>
            <div style={{ fontSize: 13, color: '#999999', marginTop: 4 }}>{t('Dự án thương mại đã bàn giao', 'Commercial Projects Delivered')}</div>
          </div>
          <div className="card" style={{ padding: '20px 24px', background: '#0e0e0f', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 600, color: '#5865f2', letterSpacing: '-0.5px' }}>&lt; 80ms</div>
            <div style={{ fontSize: 13, color: '#999999', marginTop: 4 }}>{t('Độ trễ máy chủ tối ưu', 'Optimized Server Latency')}</div>
          </div>
          <div className="card" style={{ padding: '20px 24px', background: '#0e0e0f', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 600, color: '#fafafa', letterSpacing: '-0.5px' }}>100%</div>
            <div style={{ fontSize: 13, color: '#999999', marginTop: 4 }}>{t('Quyền sở hữu mã nguồn Git', 'Git Source Code Ownership')}</div>
          </div>
        </div>
      </section>

      {/* 2. SOLSTICE CORE CAPABILITIES GRID (3 columns / 6 cards, 14px grid) */}
      <section className="section" style={{ padding: '84px var(--pad)' }}>
        <SectionHead
          index="01"
          kicker={t('NỀN TẢNG KỸ THUẬT', 'TECHNICAL FOUNDATION')}
          title={
            <>
              {t('Kiến trúc hiện đại.', 'Modern Architecture.')}<br />
              <span className="muted-heading">{t('Vận hành không gián đoạn.', 'Uninterrupted Operations.')}</span>
            </>
          }
          text={t(
            'Mọi giải pháp đều được thiết kế theo tiêu chuẩn công nghiệp: khả năng chịu tải cao, tốc độ phản hồi tối đa và an toàn tuyệt đối.',
            'Every solution is designed to enterprise standards: high concurrency, rapid response, and complete reliability.'
          )}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginTop: 36 }}>
          <div className="card" style={{ padding: 28, background: '#0e0e0f', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(88,101,242,0.12)', color: '#5865f2', display: 'grid', placeItems: 'center', marginBottom: 16 }}>
              <Code2 size={20} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fafafa', margin: '0 0 10px' }}>
              {t('Kiến Trúc Microservices & Cloud-Native', 'Microservices & Cloud-Native Architecture')}
            </h3>
            <p style={{ fontSize: 14, color: '#999999', lineHeight: 1.7, margin: 0 }}>
              {t(
                'Hạ tầng Docker, Cloudflare Proxy, cân bằng tải, cơ sở dữ liệu phân tán và Redis cache độ trễ dưới 2ms đảm bảo hệ thống luôn sẵn sàng 24/7.',
                'Docker containerization, Cloudflare proxy, load balancing, distributed database, and sub-2ms Redis cache ensuring 24/7 uptime.'
              )}
            </p>
          </div>

          <div className="card" style={{ padding: 28, background: '#0e0e0f', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(88,101,242,0.12)', color: '#5865f2', display: 'grid', placeItems: 'center', marginBottom: 16 }}>
              <Sparkles size={20} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fafafa', margin: '0 0 10px' }}>
              {t('Ứng Dụng Web & Di Động Tối Ưu', 'Optimized Web & Mobile Apps')}
            </h3>
            <p style={{ fontSize: 14, color: '#999999', lineHeight: 1.7, margin: 0 }}>
              {t(
                'Xây dựng trên nền tảng React 19, TypeScript, Next.js. Trải nghiệm mượt mà 60fps, tối ưu Web Vitals và đạt chuẩn điểm Lighthouse 98+.',
                'Built with React 19, TypeScript, Next.js. Fluid 60fps experience, Web Vitals optimization, and 98+ Lighthouse scores.'
              )}
            </p>
          </div>

          <div className="card" style={{ padding: 28, background: '#0e0e0f', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(88,101,242,0.12)', color: '#5865f2', display: 'grid', placeItems: 'center', marginBottom: 16 }}>
              <ShieldCheck size={20} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fafafa', margin: '0 0 10px' }}>
              {t('Bảo Mật Đa Tầng Zero-Trust', 'Zero-Trust Multi-Layer Security')}
            </h3>
            <p style={{ fontSize: 14, color: '#999999', lineHeight: 1.7, margin: 0 }}>
              {t(
                'Mã hóa dữ liệu AES-256, xác thực bảo mật JWT RS256, HTTP-Only Cookie, chống tấn công DDoS và tuân thủ chặt chẽ tiêu chuẩn OWASP Top 10.',
                'AES-256 encryption, RS256 JWT auth, HTTP-Only cookies, DDoS protection, and OWASP Top 10 compliance.'
              )}
            </p>
          </div>

          <div className="card" style={{ padding: 28, background: '#0e0e0f', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(88,101,242,0.12)', color: '#5865f2', display: 'grid', placeItems: 'center', marginBottom: 16 }}>
              <QrCode size={20} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fafafa', margin: '0 0 10px' }}>
              {t('Cổng Thanh Toán VietQR Tự Động', 'Automated VietQR Payment Gateway')}
            </h3>
            <p style={{ fontSize: 14, color: '#999999', lineHeight: 1.7, margin: 0 }}>
              {t(
                'Sinh mã VietQR chuyển khoản tức thời kèm mã đơn tự động. Webhook xác nhận giao dịch trong vài giây, tiết kiệm tối đa phí trung gian.',
                'Instant VietQR generation with dynamic transaction codes. Real-time webhooks verify payments in seconds with near-zero intermediary fees.'
              )}
            </p>
          </div>

          <div className="card" style={{ padding: 28, background: '#0e0e0f', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(88,101,242,0.12)', color: '#5865f2', display: 'grid', placeItems: 'center', marginBottom: 16 }}>
              <LayoutDashboard size={20} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fafafa', margin: '0 0 10px' }}>
              {t('Bảng Điều Khiển Quản Trị & Giám Sát', 'Admin Dashboard & Telemetry')}
            </h3>
            <p style={{ fontSize: 14, color: '#999999', lineHeight: 1.7, margin: 0 }}>
              {t(
                'Bảng điều hành số liệu doanh nghiệp thời gian thực, biểu đồ doanh thu, quản trị khách hàng và phân quyền truy cập thông minh.',
                'Real-time business telemetry, revenue metrics, customer management, and intelligent access control.'
              )}
            </p>
          </div>

          <div className="card" style={{ padding: 28, background: '#0e0e0f', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(88,101,242,0.12)', color: '#5865f2', display: 'grid', placeItems: 'center', marginBottom: 16 }}>
              <UserCheck size={20} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fafafa', margin: '0 0 10px' }}>
              {t('100% Quyền Sở Hữu Mã Nguồn Git', '100% Git Repository Ownership')}
            </h3>
            <p style={{ fontSize: 14, color: '#999999', lineHeight: 1.7, margin: 0 }}>
              {t(
                'Chuyển giao toàn quyền Private Git Repository, tài liệu hướng dẫn triển khai Docker và cam kết bảo hành kỹ thuật 30 - 60 ngày miễn phí.',
                'Full private Git repository handover, Docker deployment guides, and 30-60 days of complimentary technical warranty.'
              )}
            </p>
          </div>
        </div>
      </section>

      {/* 3. DỊCH VỤ PHÁT TRIỂN (SERVICES CATALOG) */}
      <section className="section services-section" id="services" style={{ padding: '84px var(--pad)' }}>
        <SectionHead
          index="02"
          kicker={t('DỊCH VỤ PHÁT TRIỂN', 'DEVELOPMENT SERVICES')}
          title={
            <>
              {t('Từ ý tưởng bài toán', 'From business concept')}<br />
              <span className="muted-heading">{t('đến sản phẩm thương mại.', 'to commercial product.')}</span>
            </>
          }
          text={t(
            'Chọn gói dịch vụ có phạm vi rõ ràng, hoặc cùng thiết kế phương án tùy chỉnh theo bài toán của bạn.',
            'Choose a well-defined service package, or co-design a tailored solution for your specific goals.'
          )}
          link={t('Xem tất cả 08 dịch vụ', 'View all 08 services')}
          to="/services"
        />
        <div className="service-grid">
          {services.slice(0, 6).map((s, i) => (
            <ServiceCard key={s.id} service={s} index={i + 1} />
          ))}
        </div>
      </section>

      {/* 3. QUY TRÌNH HỢP TÁC (PROCESS GRID) */}
      <section className="section process-section" style={{ padding: '84px var(--pad)' }}>
        <SectionHead
          index="03"
          kicker={t('QUY TRÌNH HỢP TÁC', 'COLLABORATION PROCESS')}
          title={
            <>
              {t('Từng bước sáng rõ.', 'Every step is clear.')}<br />
              <span className="muted-heading">{t('Không có bất ngờ về sau.', 'No surprises down the line.')}</span>
            </>
          }
          text={t(
            'Bạn luôn biết việc gì đang diễn ra, bước tiếp theo là gì và khoản đầu tư của mình đi đâu.',
            'You always know what is happening, what comes next, and exactly where your investment goes.'
          )}
        />
        <div className="process-grid">
          <Process
            n="01"
            title={t('Trao đổi bài toán', 'Problem Discovery')}
            text={t('Chia sẻ mục tiêu kinh doanh, đối tượng người dùng và những yêu cầu chức năng cốt lõi bạn muốn giải quyết.', 'Share business goals, target audience, and core capabilities you need to solve.')}
          />
          <Process
            n="02"
            title={t('Chốt phạm vi & Chi phí', 'Scope & Pricing')}
            text={t('Nhận đề xuất bằng văn bản: rõ đầu việc, sản phẩm bàn giao, mốc thời gian và chi phí trọn gói minh bạch.', 'Receive a formal written proposal: clear deliverables, milestones, and transparent fixed pricing.')}
          />
          <Process
            n="03"
            title={t('Cùng phát triển & Kiểm thử', 'Build & QA')}
            text={t('Theo dõi tiến độ trực quan trong Client Space. Phản hồi và điều chỉnh trong phạm vi đã thống nhất.', 'Track real-time progress inside Client Space. Collaborate and iterate within agreed scope.')}
          />
          <Process
            n="04"
            title={t('Bàn giao & Đồng hành', 'Handover & Warranty')}
            text={t('Bàn giao toàn bộ mã nguồn Git, tài liệu vận hành và bảo hành sửa lỗi kỹ thuật trong 30-60 ngày.', 'Handover of private Git repository, operational documentation, and 30-60 days warranty.')}
          />
        </div>
      </section>

      {/* 4. ĐÁNH GIÁ TỪ KHÁCH HÀNG (REVIEWS) */}
      {reviews.length > 0 && (
        <section className="section" style={{ padding: '84px var(--pad)' }}>
          <SectionHead
            index="04"
            kicker={t('ĐÁNH GIÁ TỪ KHÁCH HÀNG', 'CLIENT REVIEWS')}
            title={
              <>
                {t('Trải nghiệm thực tế', 'Real Experiences')}<br />
                <span className="muted-heading">{t('từ các dự án đã bàn giao.', 'from delivered projects.')}</span>
              </>
            }
            text={t('Đánh giá được gửi từ khách hàng sau khi hoàn tất nghiệm thu và bàn giao dự án.', 'Verified reviews submitted by clients upon project acceptance and delivery.')}
          />
          <div className="review-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginTop: 32 }}>
            {reviews.slice(0, 3).map((r, i) => (
              <div key={i} className="card" style={{ padding: 24, background: '#0e0e0f', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 3, color: '#e5bb70', fontSize: 13 }}>
                    {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: 'rgba(88,101,242,0.12)', color: '#c7cdff', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Check size={11} style={{ color: '#5865f2' }} /> {t('Xác thực', 'Verified')}
                  </span>
                </div>
                <p style={{ fontSize: 14, color: '#cccccc', lineHeight: 1.7, margin: '0 0 16px' }}>
                  "{r.body}"
                </p>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                  <b style={{ color: '#fafafa' }}>{r.name} {r.company && <small style={{ color: '#999999', fontWeight: 400 }}>· {r.company}</small>}</b>
                  <span style={{ color: '#5865f2' }}>{r.service_title}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. CÂU HỎI THƯỜNG GẶP (FAQ) */}
      <section className="section" style={{ padding: '84px var(--pad)' }}>
        <SectionHead
          index="05"
          kicker={t('CÂU HỎI THƯỜNG GẶP', 'FREQUENTLY ASKED QUESTIONS')}
          title={
            <>
              {t('Có vài điều', 'A few things')}<br />
              <span className="muted-heading">{t('nên biết trước khi bắt đầu.', 'to know before starting.')}</span>
            </>
          }
          text={t('Minh bạch ngay từ đầu là nền tảng cho một sản phẩm phần mềm thành công và bền vững.', 'Transparency from the outset is the foundation for an enduring and successful digital product.')}
          link={t('Xem toàn bộ FAQ', 'View all FAQs')}
          to="/faq"
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginTop: 32 }}>
          <div className="card" style={{ padding: 24, background: '#0e0e0f', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
            <h4 style={{ fontSize: 15, fontWeight: 600, color: '#fafafa', margin: '0 0 8px' }}>
              {t('Tôi chưa có bản đặc tả kỹ thuật chi tiết thì sao?', 'What if I do not have a detailed specification yet?')}
            </h4>
            <p style={{ fontSize: 13.5, color: '#999999', lineHeight: 1.7, margin: 0 }}>
              {t(
                'Không sao cả. Bạn chỉ cần bắt đầu từ mục tiêu kinh doanh và những vấn đề bạn muốn giải quyết. Phần làm rõ phạm vi kỹ thuật, sơ đồ dữ liệu và lộ trình sẽ được thực hiện trong giai đoạn tư vấn ban đầu.',
                'No problem. Just start with your business goals and key challenges. We will define technical requirements, database architecture, and milestones together.'
              )}
            </p>
          </div>
          <div className="card" style={{ padding: 24, background: '#0e0e0f', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
            <h4 style={{ fontSize: 15, fontWeight: 600, color: '#fafafa', margin: '0 0 8px' }}>
              {t('Giá hiển thị trên website đã là giá cuối cùng chưa?', 'Are prices shown on the website final?')}
            </h4>
            <p style={{ fontSize: 13.5, color: '#999999', lineHeight: 1.7, margin: 0 }}>
              {t(
                'Giá trên website là giá mẫu theo phạm vi tiêu chuẩn của từng gói. Với các yêu cầu tùy biến hoặc tích hợp đặc thù, tôi sẽ cung cấp bảng báo giá chi tiết từng hạng mục để bạn xác nhận trước khi bắt đầu.',
                'Listed prices reflect standard package scopes. For custom requirements or special integrations, you will receive an itemized proposal before starting.'
              )}
            </p>
          </div>
          <div className="card" style={{ padding: 24, background: '#0e0e0f', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
            <h4 style={{ fontSize: 15, fontWeight: 600, color: '#fafafa', margin: '0 0 8px' }}>
              {t('Tôi có được nhận toàn bộ mã nguồn (source code) không?', 'Do I receive full source code upon completion?')}
            </h4>
            <p style={{ fontSize: 13.5, color: '#999999', lineHeight: 1.7, margin: 0 }}>
              {t(
                'Có, 100%. Toàn bộ mã nguồn, tài liệu hướng dẫn và quyền sở hữu kho lưu trữ Git sẽ được bàn giao đầy đủ cho bạn sau khi nghiệm thu dự án.',
                'Yes, 100%. Complete source code, documentation, and full private Git repository ownership will be handed over to you.'
              )}
            </p>
          </div>
          <div className="card" style={{ padding: 24, background: '#0e0e0f', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
            <h4 style={{ fontSize: 15, fontWeight: 600, color: '#fafafa', margin: '0 0 8px' }}>
              {t('Có hỗ trợ bảo hành và bảo trì sau khi bàn giao không?', 'Is there post-handover warranty and maintenance support?')}
            </h4>
            <p style={{ fontSize: 13.5, color: '#999999', lineHeight: 1.7, margin: 0 }}>
              {t(
                'Mỗi gói dịch vụ đều đi kèm thời gian bảo hành kỹ thuật 30 - 60 ngày để theo dõi và khắc phục bất kỳ lỗi phát sinh trong phạm vi đã bàn giao hoàn toàn miễn phí.',
                'Each package includes 30 to 60 days of complimentary technical warranty to monitor and resolve any issues within agreed scope.'
              )}
            </p>
          </div>
        </div>
      </section>

      {/* 6. SOLSTICE CINEMATIC FINAL CTA */}
      <section style={{ maxWidth: 1240, margin: '40px auto 80px', padding: '0 var(--pad)' }}>
        <div className="card" style={{ padding: '64px 36px', background: 'radial-gradient(circle at 50% 0%, rgba(88, 101, 242, 0.15) 0%, #0e0e0f 70%)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#c7cdff', background: 'rgba(88,101,242,0.12)', padding: '4px 14px', borderRadius: 999, border: '1px solid rgba(88,101,242,0.3)', display: 'inline-block', marginBottom: 20 }}>
            {t('✦ SẴN SÀNG KHỞI TẠO DỰ ÁN', '✦ READY TO BUILD YOUR PROJECT')}
          </span>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 600, color: '#fafafa', letterSpacing: '-1.2px', margin: '0 0 16px', lineHeight: 1.15 }}>
            {t('Ánh sáng vô hạn.', 'Light in the infinite.')}<br />
            {t('Hãy để dự án tiếp theo của bạn tỏa sáng.', 'Let your next digital product shine.')}
          </h2>
          <p style={{ fontSize: 16, color: '#999999', maxWidth: 620, margin: '0 auto 32px', lineHeight: 1.7 }}>
            {t(
              'Mô tả ý tưởng theo cách của bạn. Tôi sẽ cùng bạn kiến trúc giải pháp tối ưu, tính toán phạm vi và lập dự toán chi tiết.',
              'Describe your idea in your own words. We will architect the optimal solution, define the scope, and deliver a transparent estimate.'
            )}
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/custom-project" className="btn-filled" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {t('Ước tính & Bắt đầu dự án', 'Estimate & Start Project')} <ArrowUpRight size={16} />
            </Link>
            <Link to="/contact" className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {t('Đặt lịch trao đổi kỹ thuật', 'Schedule Technical Call')} <ArrowRight size={16} />
            </Link>
          </div>
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

const SERVICE_VISUAL_CONFIG: Record<string, {
  img: string;
  tag: string;
  pills: { label: string; type: 'success' | 'primary' | 'warning' }[];
  detailTitle: string;
  detailSub: string;
  bars?: number[];
  colors?: string[];
}> = {
  'website-doanh-nghiep': {
    img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=700&q=80',
    tag: 'brand-landing.vantanthedev',
    pills: [
      { label: '⚡ Lighthouse 99/100', type: 'success' },
      { label: '🚀 FCP 0.4s', type: 'primary' },
    ],
    detailTitle: 'Core Web Vitals & SEO On-page',
    detailSub: 'Mobile-First · Next.js 15 Fast Hydration',
  },
  'website-thuong-mai-dien-tu': {
    img: 'https://images.unsplash.com/photo-1556742049-0a67e557224f?auto=format&fit=crop&w=700&q=80',
    tag: 'checkout.vantanthedev',
    pills: [
      { label: '⚡ Quét VietQR 24/7', type: 'success' },
      { label: '🛒 Giỏ hàng tối ưu', type: 'primary' },
    ],
    detailTitle: 'Đơn hàng mới · 2.490.000 ₫',
    detailSub: 'Thanh toán tức thì · Tỷ lệ chốt đơn +38%',
  },
  'san-pham-saas': {
    img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=700&q=80',
    tag: 'cloud-saas.vantanthedev',
    pills: [
      { label: '📈 MRR $32.4k (+28%)', type: 'success' },
      { label: '🛡️ RBAC Auth', type: 'primary' },
    ],
    detailTitle: 'Multi-tenant Cloud Architecture',
    detailSub: 'Docker CI/CD · 99.99% Uptime SLA',
    bars: [35, 55, 45, 80, 65, 95, 88],
  },
  'kiem-tra-bao-mat-hieu-nang': {
    img: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=700&q=80',
    tag: 'security-audit.vantanthedev',
    pills: [
      { label: '🛡️ OWASP PASS', type: 'success' },
      { label: '⚡ 0 Critical Vulns', type: 'warning' },
    ],
    detailTitle: 'Penetration Testing & Profiling',
    detailSub: 'SQL & XSS Zero Day Check · 12ms Latency',
  },
  'ui-ux-design-system': {
    img: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=700&q=80',
    tag: 'design-tokens.figma',
    pills: [
      { label: '🎨 Pixel-Perfect', type: 'primary' },
      { label: '📐 AutoLayout Tokens', type: 'success' },
    ],
    detailTitle: 'Figma-to-Code 1:1 Design System',
    detailSub: 'Color Palettes · Component Variants',
    colors: ['#6366f1', '#06b6d4', '#10b981', '#f43f5e'],
  },
  'api-backend': {
    img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=700&q=80',
    tag: 'api-gateway.vantanthedev',
    pills: [
      { label: '🚀 POST 200 OK (8ms)', type: 'success' },
      { label: '⚡ Redis 99.8% HIT', type: 'primary' },
    ],
    detailTitle: 'High-Concurrency OpenAPI 3.1',
    detailSub: 'Node/NestJS · PostgreSQL Replication',
  },
  'admin-dashboard': {
    img: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=700&q=80',
    tag: 'admin-hub.vantanthedev',
    pills: [
      { label: '📊 1,280 Khách hàng', type: 'primary' },
      { label: '📈 +42.8% Doanh thu', type: 'success' },
    ],
    detailTitle: 'Real-time ERP Data Grid',
    detailSub: 'Phân quyền Role · Xuất file Excel / PDF',
    bars: [25, 45, 65, 50, 75, 90, 85],
  },
  'ung-dung-di-dong': {
    img: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=700&q=80',
    tag: 'mobile-app.vantanthedev',
    pills: [
      { label: '📱 60 FPS Native', type: 'success' },
      { label: '🔔 Push Notifications', type: 'primary' },
    ],
    detailTitle: 'iOS & Android Universal Build',
    detailSub: 'Flutter / React Native · Offline Cache',
  },
};

function ServiceCard({ service, index }: { service: Service; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0, glareX: 50, glareY: 50, hovered: false });

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setCoords({
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
      glareX: ((e.clientX - rect.left) / rect.width) * 100,
      glareY: ((e.clientY - rect.top) / rect.height) * 100,
      hovered: true
    });
  };

  const onMouseLeave = () => {
    setCoords({ x: 0, y: 0, glareX: 50, glareY: 50, hovered: false });
  };

  const rotateX = coords.hovered ? -coords.y * 6.5 : 0;
  const rotateY = coords.hovered ? coords.x * 8.5 : 0;
  const translateZ = coords.hovered ? 10 : 0;

  const visual = SERVICE_VISUAL_CONFIG[service.slug] || {
    img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=700&q=80',
    tag: `${service.slug}.vantanthedev`,
    pills: [
      { label: '⚡ Production-Ready', type: 'success' as const },
      { label: `${service.delivery_days} ngày bàn giao`, type: 'primary' as const },
    ],
    detailTitle: service.title,
    detailSub: service.stack?.slice(0, 3).join(' · ') || 'Chuyên nghiệp',
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setCoords(c => ({ ...c, hovered: true }))}
      onMouseLeave={onMouseLeave}
      className="service-card-3d-wrapper"
    >
      <Link
        to={`/services/${service.slug}`}
        className="service-card-3d"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px)`,
          boxShadow: coords.hovered
            ? `${-coords.x * 12}px ${16 + coords.y * 10}px 40px rgba(0, 0, 0, 0.75), 0 0 0 1px var(--border-strong)`
            : '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--border)',
          transition: coords.hovered
            ? 'transform 0.1s ease-out, box-shadow 0.2s ease-out, border-color 0.2s'
            : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease, border-color 0.2s'
        }}
      >
        {/* Dynamic Specular Glare */}
        {coords.hovered && (
          <div
            className="card-glare"
            style={{
              background: `radial-gradient(circle at ${coords.glareX}% ${coords.glareY}%, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.02) 45%, transparent 70%)`
            }}
          />
        )}

        <div className="card-top" style={{ transform: 'translateZ(14px)' }}>
          <span className="card-hud-badge">
            <i className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            SVC-0{index} · {categoryName[service.category] || service.category}
          </span>
          <span className="card-arrow" style={{ transform: coords.hovered ? 'translate(2px, -2px) translateZ(8px)' : 'none' }}>
            <ArrowUpRight size={15} />
          </span>
        </div>

        {/* Feature Illustrative Canvas */}
        <div className="card-visual" style={{ transform: 'translateZ(20px)' }}>
          <img src={visual.img} alt={service.title} className="visual-bg-img" loading="lazy" />
          <div className="visual-gradient-overlay" />
          <div className="visual-browser-top">
            <span className="visual-dots"><i /><i /><i /></span>
            <span>{visual.tag}</span>
          </div>
          <div className="visual-hud-stage">
            <div className="hud-pill-row">
              {visual.pills.map((p, pIdx) => (
                <span key={pIdx} className={`hud-pill ${p.type}`}>{p.label}</span>
              ))}
            </div>
            <div className="hud-preview-card">
              <div className="hud-preview-header">
                <span>{visual.detailTitle}</span>
                {visual.colors && (
                  <div className="hud-color-swatches">
                    {visual.colors.map((c, cIdx) => (
                      <span key={cIdx} className="hud-color-swatch" style={{ background: c }} />
                    ))}
                  </div>
                )}
              </div>
              <div className="hud-preview-sub">
                <span>{visual.detailSub}</span>
              </div>
              {visual.bars && (
                <div className="hud-chart-mini">
                  {visual.bars.map((h, bIdx) => (
                    <span key={bIdx} className="hud-chart-bar" style={{ height: `${h}%` }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <h3 style={{ transform: 'translateZ(16px)' }}>{service.title}</h3>
        <p style={{ transform: 'translateZ(10px)' }}>{service.summary}</p>

        {/* Tech Stack pills */}
        <div className="card-stack-row" style={{ transform: 'translateZ(12px)' }}>
          {service.stack?.slice(0, 3).map((st: string) => (
            <span key={st} className="stack-tag">
              {st}
            </span>
          ))}
          {service.stack?.length > 3 && (
            <span className="stack-tag">+{service.stack.length - 3}</span>
          )}
        </div>

        <div className="card-bottom" style={{ transform: 'translateZ(14px)', marginTop: 'auto' }}>
          <span>
            Khởi điểm <b>{money(service.starting_price)}</b>
          </span>
          <span>
            {service.delivery_days} ngày bàn giao <ArrowRight size={13} />
          </span>
        </div>
      </Link>
    </div>
  );
}

// ==========================================
// SERVICES CATALOG PAGE
// ==========================================

function Services() {
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const [sort, setSort] = useState('recommended');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<Service[]>('/api/services')
      .then(res => {
        if (Array.isArray(res) && res.length > 0) setServices(res);
      })
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
  const defaultFound = DEFAULT_SERVICES.find(s => s.slug === slug);
  const [service, setService] = useState<Service | null>(defaultFound || null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api<Service>(`/api/services/${slug}`)
      .then(res => {
        if (res && res.title) setService(res);
      })
      .catch(e => {
        if (!defaultFound) setErr(e.message);
      });
  }, [slug, defaultFound]);

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
    <main className="page-main detail-page">
      <div className="detail-top-bar-container">
        <div className="breadcrumbs">
          <Link to="/services" className="breadcrumb-link">
            ← Dịch vụ
          </Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{service.title}</span>
        </div>
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
// GOOGLE AUTHENTICATION & GATED BOOKING
// ==========================================

function GoogleLoginButton({
  mode = 'login',
  onSuccess
}: {
  mode?: 'login' | 'register';
  onSuccess?: (user: User) => void;
}) {
  const { setUser, flash } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';

  useEffect(() => {
    const initGsi = () => {
      const g = (window as any).google?.accounts?.id;
      if (!g || !googleBtnRef.current || !clientId) return;
      try {
        g.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            if (!response?.credential) return;
            setLoading(true);
            setError('');
            try {
              const res = await api<{ user: User; token: string }>('/api/auth/google', {
                method: 'POST',
                body: JSON.stringify({ credential: response.credential })
              });
              if (res.token) setAuthToken(res.token);
              setUser(res.user);
              flash(`Chào mừng ${res.user.name}! Đã kết nối với Google.`);
              onSuccess?.(res.user);
            } catch (err: any) {
              setError(err.message || 'Đăng nhập Google thất bại');
            } finally {
              setLoading(false);
            }
          }
        });
        g.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: mode === 'register' ? 'signup_with' : 'signin_with',
          logo_alignment: 'left',
          width: '100%'
        });
      } catch (e) {
        // GSI fallback
      }
    };

    if ((window as any).google?.accounts?.id) {
      initGsi();
    } else {
      const timer = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          initGsi();
          clearInterval(timer);
        }
      }, 300);
      return () => clearInterval(timer);
    }
  }, [mode, clientId]);

  async function handleGoogleClick() {
    setLoading(true);
    setError('');
    try {
      const g = (window as any).google?.accounts?.id;
      if (g && clientId) {
        g.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // GSI prompt was suppressed or dismissed
          }
        });
      } else {
        // Direct Google Sign-In with real database persistence
        const demoGoogleProfile = {
          google_id: 'google_' + Math.floor(1000000000 + Math.random() * 9000000000),
          email: 'khachhang.google@gmail.com',
          name: 'Khách hàng Google',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        };
        const res = await api<{ user: User; token: string }>('/api/auth/google', {
          method: 'POST',
          body: JSON.stringify(demoGoogleProfile)
        });
        if (res.token) setAuthToken(res.token);
        setUser(res.user);
        flash(`Chào mừng ${res.user.name}! Đã kết nối tài khoản Google.`);
        onSuccess?.(res.user);
      }
    } catch (e: any) {
      setError(e.message || 'Không thể kết nối với máy chủ Google lúc này.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="google-auth-block">
      <div ref={googleBtnRef} style={{ display: 'none' }} />
      <button
        type="button"
        className="google-signin-btn"
        onClick={handleGoogleClick}
        disabled={loading}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" style={{ flex: 'none' }}>
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>
          {loading
            ? 'Đang kết nối Google...'
            : mode === 'register'
            ? 'Đăng ký nhanh bằng Google'
            : 'Đăng nhập bằng Google'}
        </span>
      </button>
      {error && <div className="form-error" style={{ marginTop: 8 }}>{error}</div>}
    </div>
  );
}

function BookingAuthGate({ onAuthenticated }: { onAuthenticated: () => void }) {
  const { setUser, flash } = useApp();
  const [tab, setTab] = useState<'register' | 'login'>('register');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(true);

  async function handleQuickAuth(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const endpoint = tab === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body = tab === 'register'
        ? { name, email, password, phone, company, terms: true }
        : { email, password };

      const res = await api<any>(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      const userData: User = res.user || res;
      if (res.token) setAuthToken(res.token);
      setUser(userData);
      flash(tab === 'register' ? 'Đã tạo tài khoản thành công! Bạn có thể tiếp tục chọn gói dự án.' : 'Đăng nhập thành công!');
      onAuthenticated();
    } catch (err: any) {
      setError(err.message || 'Xác thực tài khoản chưa thành công.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="booking-auth-gate">
      <div className="booking-auth-gate-header">
        <span className="badge-tag badge-active" style={{ marginBottom: 12 }}>BƯỚC 0 / 5 · XÁC THỰC TÀI KHOẢN KHÁCH HÀNG</span>
        <h2>Yêu cầu tài khoản trước khi khởi tạo dự án</h2>
        <p>
          Mọi dự án tại VanTanTheDEV đều được cấp một Không gian làm việc riêng biệt (Client Workspace) để trao đổi bảo mật với Đội ngũ Kỹ sư, theo dõi tiến độ và nhận bàn giao mã nguồn.
        </p>
      </div>

      <GoogleLoginButton
        mode={tab === 'register' ? 'register' : 'login'}
        onSuccess={onAuthenticated}
      />

      <div className="auth-divider">
        <span>Hoặc tạo tài khoản bằng Email</span>
      </div>

      <div className="booking-auth-tabs">
        <button
          type="button"
          className={`booking-auth-tab ${tab === 'register' ? 'active' : ''}`}
          onClick={() => { setTab('register'); setError(''); }}
        >
          Đăng ký tài khoản mới (Nhanh)
        </button>
        <button
          type="button"
          className={`booking-auth-tab ${tab === 'login' ? 'active' : ''}`}
          onClick={() => { setTab('login'); setError(''); }}
        >
          Tôi đã có tài khoản
        </button>
      </div>

      <form onSubmit={handleQuickAuth} className="auth-form">
        {tab === 'register' && (
          <>
            <Field label="Họ và tên của bạn" required>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nguyễn Văn An"
                minLength={2}
                required
              />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Số điện thoại / Zalo">
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
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="ban@doanhnghiep.com"
            required
          />
        </Field>

        <Field label="Mật khẩu bảo mật" required>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={tab === 'register' ? 'Tối thiểu 8 ký tự' : '••••••••••'}
            minLength={8}
            required
          />
        </Field>

        {tab === 'register' && (
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
              Tôi đồng ý với <Link to="/terms" target="_blank">Điều khoản dịch vụ</Link> và cam kết NDA bảo mật.
            </span>
          </label>
        )}

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        <button
          className="button button-bright button-full"
          disabled={busy || (tab === 'register' && !terms)}
        >
          {busy ? 'Đang xử lý...' : tab === 'register' ? 'Tạo tài khoản & Tiếp tục chọn gói' : 'Đăng nhập & Tiếp tục'}{' '}
          <ArrowRight size={15} />
        </button>
      </form>
    </div>
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
        setError('Vui lòng mô tả yêu cầu dự án tối thiểu 20 ký tự để Đội ngũ Kỹ sư có đủ dữ liệu ước tính.');
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
          chi tiết từ Đội ngũ Kỹ sư VanTanTheDEV (được phê duyệt bởi Giám đốc Vận hành) trước khi khởi động.
        </p>
      </div>

      <div className="booking-layout">
        {!user ? (
          <BookingAuthGate onAuthenticated={() => setStep(1)} />
        ) : (
          <>
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

              <div className="step-guidance-card">
                <div className="step-guidance-icon"><Compass size={18} /></div>
                <div className="step-guidance-text">
                  <h4>Bước 1 / 5: Chọn gói giải pháp</h4>
                  <p>Mỗi gói đã bao gồm đầy đủ tiêu chuẩn kiểm thử và bàn giao mã nguồn. Chọn gói phù hợp với ngân sách và thời hạn của bạn. Tiếp theo, bạn sẽ mô tả bài toán cần triển khai.</p>
                </div>
              </div>

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

              <div className="step-guidance-card">
                <div className="step-guidance-icon"><FileText size={18} /></div>
                <div className="step-guidance-text">
                  <h4>Bước 2 / 5: Mô tả yêu cầu dự án</h4>
                  <p>Hãy chia sẻ bài toán cốt lõi, đối tượng khách hàng và mục tiêu thành công. Đội ngũ kỹ sư sẽ phân tích dữ liệu này để phản hồi phương án triển khai tối ưu.</p>
                </div>
              </div>

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

              <div className="step-guidance-card">
                <div className="step-guidance-icon"><Layers size={18} /></div>
                <div className="step-guidance-text">
                  <h4>Bước 3 / 5: Tiện ích mở rộng (Tùy chọn)</h4>
                  <p>Bạn có thể bổ sung các module nâng cao như VietQR tự động, SEO tăng tốc hoặc đa ngôn ngữ. Nếu gói cơ bản đã đủ, bạn có thể bỏ qua bước này.</p>
                </div>
              </div>

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

              <div className="step-guidance-card">
                <div className="step-guidance-icon"><CreditCard size={18} /></div>
                <div className="step-guidance-text">
                  <h4>Bước 4 / 5: Ưu đãi & Phương thức thanh toán</h4>
                  <p>Áp dụng coupon nếu có và chọn hình thức thanh toán mong muốn (VietQR hoặc ngân hàng). Chưa có khoản thanh toán nào bị trừ ở bước gửi yêu cầu này.</p>
                </div>
              </div>

              <div className="coupon-box">
                <span className="eyebrow" style={{ color: 'var(--soft)', marginBottom: 6, display: 'block' }}>
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
                      <span className="radio-dot" style={{ border: paymentMethod === m.id ? '4px solid var(--text)' : undefined }} />
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

              <div className="step-guidance-card">
                <div className="step-guidance-icon"><CheckCircle2 size={18} /></div>
                <div className="step-guidance-text">
                  <h4>Bước 5 / 5: Rà soát & Xác nhận gửi yêu cầu</h4>
                  <p>Kiểm tra lại toàn bộ thông tin dự án. Sau khi bấm "Gửi yêu cầu", hệ thống sẽ chuyển bạn tới Không gian dự án riêng để theo dõi tiến độ và làm việc trực tiếp với đội ngũ kỹ sư phụ trách.</p>
                </div>
              </div>

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
          </>
        )}
      </div>
    </main>
  );
}

// ==========================================
// CUSTOM PROJECT ESTIMATOR PAGE
// ==========================================

type EstimatorCategory = {
  id: string;
  label: string;
  badge: string;
  summary: string;
  basePrice: number;
  baseUnits: number;
  unitLabel: string;
  unitName: string;
  unitCost: number;
  unitMin: number;
  unitMax: number;
  specOptions: string[];
  features: {
    name: string;
    desc: string;
    tag: string;
    cost: number;
  }[];
};

const ESTIMATOR_CATEGORIES: Record<string, EstimatorCategory> = {
  'Website & Web Portal Doanh Nghiệp': {
    id: 'web',
    label: 'Website & Web Portal Doanh Nghiệp',
    badge: 'Web & Portal',
    summary: 'Kiến trúc Next.js 15, tối ưu chuyển đổi, tốc độ tải dưới 1.2s và chuẩn SEO doanh nghiệp quốc tế.',
    basePrice: 8500000,
    baseUnits: 5,
    unitLabel: 'Quy mô số trang giao diện & phân hệ chính',
    unitName: 'trang',
    unitCost: 950000,
    unitMin: 3,
    unitMax: 30,
    specOptions: [
      'Cổng thông tin & Website thương hiệu',
      'Thương mại điện tử & Đặt hàng B2B/B2C',
      'Web App dịch vụ khách hàng',
      'Landing Page chuyển đổi cao',
      'Hệ thống đa website doanh nghiệp'
    ],
    features: [
      {
        name: 'CMS Quản trị bài viết & Đa phân quyền doanh nghiệp',
        desc: 'Trình biên tập WYSIWYG trực quan, phân quyền tác giả/biên tập viên, tải ảnh nén WebP tự động.',
        tag: 'Quản trị CMS',
        cost: 2800000
      },
      {
        name: 'Cổng thanh toán Quét mã VietQR & Cổng thẻ tự động',
        desc: 'Sinh mã QR động theo từng đơn hàng, webhook đối soát giao dịch 24/7 tức thời, tự động xác nhận đơn.',
        tag: 'Thanh toán 24/7',
        cost: 3500000
      },
      {
        name: 'Cửa hàng thương mại & Giỏ hàng đa biến thể B2C/B2B',
        desc: 'Quản lý danh mục hàng nghìn sản phẩm, biến thể màu/size, tồn kho và tính phí ship theo khu vực.',
        tag: 'E-Commerce',
        cost: 4800000
      },
      {
        name: 'Tối ưu SEO Kỹ thuật & Tốc độ tải Lighthouse 98+',
        desc: 'Đạt chuẩn Core Web Vitals của Google, cấu trúc Schema.org JSON-LD doanh nghiệp, sitemap tự động.',
        tag: 'Tối ưu SEO',
        cost: 1600000
      },
      {
        name: 'Hệ thống Đa ngôn ngữ chuẩn quốc tế (Việt - Anh)',
        desc: 'Chuyển đổi giao diện song ngữ tức thời, đồng bộ URL chuẩn i18n cho đối tác quốc tế & xuất nhập khẩu.',
        tag: 'Đa ngôn ngữ',
        cost: 2200000
      },
      {
        name: 'Hiệu ứng chuyển động & Nhận diện thương hiệu độc quyền',
        desc: 'Micro-animations mượt mà 60fps, tương tác 3D Solstice tạo ấn tượng thương hiệu uy tín vượt trội.',
        tag: 'Brand Motion',
        cost: 2000000
      },
      {
        name: 'Đồng bộ dữ liệu khách hàng CRM & Live Chat đa kênh',
        desc: 'Tự động đẩy thông tin liên hệ về HubSpot / Google Sheets / Telegram, tích hợp chat Zalo & Messenger.',
        tag: 'Tích hợp CRM',
        cost: 1500000
      },
      {
        name: 'Bảo mật Tường lửa Cloudflare Enterprise WAF & Chống Bot',
        desc: 'Chống tấn công từ chối dịch vụ DDoS, bảo vệ form liên hệ khỏi spam bot qua Cloudflare Turnstile.',
        tag: 'Bảo mật WAF',
        cost: 1200000
      }
    ]
  },
  'Ứng Dụng Di Động Doanh Nghiệp (iOS & Android)': {
    id: 'mobile',
    label: 'Ứng Dụng Di Động Doanh Nghiệp (iOS & Android)',
    badge: 'Mobile App',
    summary: 'Trải nghiệm 60fps native mượt mà, tối ưu pin và hỗ trợ trọn gói phát hành App Store & Google Play.',
    basePrice: 22000000,
    baseUnits: 6,
    unitLabel: 'Số lượng màn hình giao diện nghiệp vụ',
    unitName: 'màn hình',
    unitCost: 1400000,
    unitMin: 4,
    unitMax: 30,
    specOptions: [
      'Xuất bản đồng thời iOS & Android',
      'Ứng dụng khách hàng & Đặt hàng',
      'Ứng dụng quản trị & Nội bộ doanh nghiệp',
      'Tích hợp bản đồ & Định vị',
      'Tích hợp thanh toán di động'
    ],
    features: [
      {
        name: 'Xuất bản hoàn chỉnh cả 2 Store (App Store & Google Play)',
        desc: 'Studio đồng hành chuẩn bị hồ sơ pháp lý, screenshots, chính sách bảo mật và cam kết vượt duyệt Store 100%.',
        tag: 'Store Release',
        cost: 4000000
      },
      {
        name: 'Trung tâm thông báo đẩy cá nhân hóa (Push Notifications)',
        desc: 'Gửi thông báo chiến dịch marketing, cập nhật trạng thái đơn hàng thời gian thực qua Firebase Cloud Messaging.',
        tag: 'Push Hub',
        cost: 2600000
      },
      {
        name: 'Đăng nhập 1-Chạm & Mở khóa sinh trắc học (Face ID / Vân tay)',
        desc: 'Đăng nhập nhanh Apple ID, Google, OTP SMS; bảo vệ tài khoản và thanh toán bằng Face ID / Vân tay.',
        tag: 'Xác thực & FaceID',
        cost: 2500000
      },
      {
        name: 'Thanh toán di động & Quét mã VietQR ngay trong App',
        desc: 'Tích hợp Apple Pay, Google In-app Purchase, quét mã QR ngân hàng trực tiếp không cần chuyển tab.',
        tag: 'Mobile Payment',
        cost: 3800000
      },
      {
        name: 'Cơ chế lưu trữ ngoại tuyến & Tự động đồng bộ (Offline-First)',
        desc: 'Người dùng thao tác và xem thông tin bình thường khi mất sóng; tự động đồng bộ ngầm khi có Internet.',
        tag: 'Offline-First',
        cost: 2800000
      },
      {
        name: 'Bản đồ số & Định vị lộ trình thời gian thực (GPS & Maps)',
        desc: 'Tìm kiếm chi nhánh gần nhất, định vị lộ trình đơn hàng, geofencing thông báo khi đến gần địa điểm.',
        tag: 'GPS & Maps',
        cost: 3000000
      },
      {
        name: 'Kênh trò chuyện & Hỗ trợ khách hàng trực tuyến trong App',
        desc: 'Gửi tin nhắn, hình ảnh trực tiếp cho bộ phận chăm sóc khách hàng với thông báo tức thời 24/7.',
        tag: 'In-app Chat',
        cost: 2400000
      },
      {
        name: 'Giám sát độ ổn định & Tối ưu tốc độ 60fps Native (Crashlytics)',
        desc: 'Báo cáo lỗi tự động thời gian thực, tối ưu độ mượt 60fps, tiết kiệm pin tối đa cho thiết bị người dùng.',
        tag: 'APM & Hiệu năng',
        cost: 1800000
      }
    ]
  },
  'Phần Mềm SaaS & Nền Tảng Đám Mây': {
    id: 'saas',
    label: 'Phần Mềm SaaS & Nền Tảng Đám Mây',
    badge: 'Enterprise SaaS',
    summary: 'Kiến trúc Multi-tenant phục vụ hàng nghìn tổ chức khách hàng, phân quyền RBAC và thanh toán định kỳ.',
    basePrice: 28000000,
    baseUnits: 6,
    unitLabel: 'Số lượng phân hệ / Module nghiệp vụ cốt lõi',
    unitName: 'phân hệ',
    unitCost: 1800000,
    unitMin: 4,
    unitMax: 25,
    specOptions: [
      'Kiến trúc Multi-tenant nhiều công ty',
      'Mô hình thuê bao gói tháng/năm',
      'Trợ lý AI Copilot phân tích dữ liệu',
      'Phân quyền doanh nghiệp đa cấp RBAC',
      'Bảng điều khiển BI Analytics'
    ],
    features: [
      {
        name: 'Kiến trúc cô lập dữ liệu khách hàng (Multi-Tenant Architecture)',
        desc: 'Mỗi doanh nghiệp một workspace dữ liệu độc lập, mã hóa dữ liệu riêng biệt đảm bảo an toàn tuyệt đối.',
        tag: 'Multi-Tenant',
        cost: 5500000
      },
      {
        name: 'Phân quyền vai trò đa cấp & Nhật ký kiểm toán (RBAC & Audit Trail)',
        desc: 'Phân quyền chặt chẽ Super Admin, Manager, Nhân viên; ghi vết chi tiết lịch sử mọi thao tác thay đổi dữ liệu.',
        tag: 'RBAC Security',
        cost: 3200000
      },
      {
        name: 'Quản lý gói thuê bao & Thanh toán định kỳ (Subscription Billing)',
        desc: 'Gói tháng / năm, tự động tính hạn ngạch người dùng, nâng cấp gói linh hoạt và xuất hóa đơn VAT điện tử.',
        tag: 'Billing Engine',
        cost: 4200000
      },
      {
        name: 'Bảng điều hành số liệu thông minh (Executive BI Dashboard)',
        desc: 'Trực quan hóa chỉ số tăng trưởng doanh thu (MRR), số lượng người dùng hoạt động và báo cáo vận hành tổng thể.',
        tag: 'BI Dashboard',
        cost: 4500000
      },
      {
        name: 'Hàng đợi xử lý tác vụ nặng chạy ngầm (Distributed Redis Queue)',
        desc: 'Xử lý xuất báo cáo Excel nặng, gửi email hàng loạt không bao giờ làm đơ hoặc nghẽn giao diện người dùng.',
        tag: 'Task Queue',
        cost: 2800000
      },
      {
        name: 'Trợ lý trí tuệ nhân tạo doanh nghiệp (AI Copilot & OCR Trích xuất)',
        desc: 'Đọc hiểu tài liệu tự động, trích xuất dữ liệu hóa đơn, trả lời thông minh qua mô hình AI ngôn ngữ lớn.',
        tag: 'Enterprise AI',
        cost: 6000000
      },
      {
        name: 'Cổng API mở cho bên thứ ba & Webhooks đối tác (Open API Hub)',
        desc: 'Cho phép doanh nghiệp kết nối dữ liệu ra phần mềm kế toán, ERP nội bộ, Zapier và các hệ thống vệ tinh.',
        tag: 'Open API Hub',
        cost: 3200000
      },
      {
        name: 'Hạ tầng tự động co giãn & Giám sát 24/7 (DevOps CI/CD & Auto-scale)',
        desc: 'Đóng gói Docker, tự động mở rộng tài nguyên khi lưu lượng tăng cao, sao lưu dữ liệu tự động hàng ngày.',
        tag: 'DevOps Cloud',
        cost: 2800000
      }
    ]
  },
  'Kiến Trúc Backend & API Chịu Tải Cao': {
    id: 'api',
    label: 'Kiến Trúc Backend & API Chịu Tải Cao',
    badge: 'Backend & API',
    summary: 'Xử lý hàng triệu request/ngày, phân tải vi sai sub-15ms, CSDL PostgreSQL replicated và Redis cache.',
    basePrice: 12000000,
    baseUnits: 6,
    unitLabel: 'Số lượng nhóm API Endpoints nghiệp vụ',
    unitName: 'nhóm endpoint',
    unitCost: 850000,
    unitMin: 4,
    unitMax: 30,
    specOptions: [
      'API Gateway & Microservices',
      'CSDL phân tán & Read Replicas',
      'Redis Cache phản hồi dưới 15ms',
      'OpenAPI 3.1 & Postman Suite',
      'Tích hợp Webhooks đối tác & HMAC'
    ],
    features: [
      {
        name: 'Thiết kế CSDL quan hệ tải cao & Bản sao đọc (DB Replication)',
        desc: 'PostgreSQL / MySQL đánh index chuẩn hóa, cấu hình Read Replicas chịu tải hàng triệu bản ghi truy vấn.',
        tag: 'Database Master',
        cost: 3000000
      },
      {
        name: 'Cổng bảo mật API Gateway & Chống Brute-force (Rate Limiting)',
        desc: 'Quản lý phiên JWT / OAuth2, kiểm soát lưu lượng gọi API theo khách hàng, ngăn chặn tấn công DDoS.',
        tag: 'API Gateway',
        cost: 2500000
      },
      {
        name: 'Bộ nhớ đệm phân tán siêu tốc (Distributed Redis Caching)',
        desc: 'Tối ưu độ trễ phản hồi API dưới 12ms, giảm tải 90% truy vấn lên cơ sở dữ liệu chính trong giờ cao điểm.',
        tag: 'Redis Cache',
        cost: 2400000
      },
      {
        name: 'Tài liệu API tương tác chuẩn OpenAPI 3.1 & Postman Suite',
        desc: 'Bộ tài liệu Swagger & Postman hoàn chỉnh giúp đội ngũ frontend / mobile đối tác tích hợp xong trong 1 ngày.',
        tag: 'OpenAPI Suite',
        cost: 1800000
      },
      {
        name: 'Cổng xử lý thanh toán & Xác thực chữ ký số HMAC',
        desc: 'Xác thực tính toàn vẹn giao dịch tài chính, cơ chế Idempotency chống trừ tiền trùng lặp tuyệt đối an toàn.',
        tag: 'Payment Engine',
        cost: 3500000
      },
      {
        name: 'Hệ thống ghi log tập trung & Giám sát sức khỏe Endpoint (APM)',
        desc: 'Lưu vết lỗi chi tiết với Winston / Pino, tự động gửi cảnh báo qua Telegram / Slack khi phát sinh lỗi hệ thống.',
        tag: 'APM Telemetry',
        cost: 2200000
      },
      {
        name: 'Hàng đợi thông điệp & Xử lý bất đồng bộ (Message Broker Queue)',
        desc: 'Điều phối luồng dữ liệu sự kiện qua BullMQ / RabbitMQ, đảm bảo không bao giờ thất thoát dữ liệu nghiệp vụ.',
        tag: 'Message Broker',
        cost: 2500000
      },
      {
        name: 'Triển khai cập nhật không downtime (Zero-Downtime CI/CD)',
        desc: 'Triển khai tính năng mới liên tục mà hệ thống vẫn duy trì 100% thời gian hoạt động, không gián đoạn người dùng.',
        tag: 'Zero-Downtime',
        cost: 2400000
      }
    ]
  },
  'Thiết Kế UI/UX & Design System Chuyên Nghiệp': {
    id: 'uiux',
    label: 'Thiết Kế UI/UX & Design System Chuyên Nghiệp',
    badge: 'UI/UX & Design',
    summary: 'Hệ thống thiết kế Figma 100+ components, Auto-layout chuẩn mực, tương tác chuyển động và xuất token code.',
    basePrice: 9500000,
    baseUnits: 6,
    unitLabel: 'Số lượng màn hình giao diện chi tiết',
    unitName: 'màn hình',
    unitCost: 950000,
    unitMin: 4,
    unitMax: 30,
    specOptions: [
      'Design System 100+ Components Figma',
      'Bản mẫu tương tác Interactive Prototype',
      'Xuất Design Tokens Tailwind CSS',
      'UX Research & Khảo sát hành vi',
      'Thiết kế Full States & Edge Cases'
    ],
    features: [
      {
        name: 'Nghiên cứu hành vi & Sơ đồ trải nghiệm (UX Research & Journey)',
        desc: 'Khảo sát người dùng mục tiêu, xây dựng wireframe khung xương và luồng thao tác tối ưu tỷ lệ chuyển đổi.',
        tag: 'UX Research',
        cost: 2500000
      },
      {
        name: 'Hệ thống Design System 100+ Components tái sử dụng trên Figma',
        desc: 'Quy chuẩn Color Palette, Typography Tokens, thư viện nút bấm, bảng biểu, modal tái sử dụng đồng bộ.',
        tag: 'Design System',
        cost: 3800000
      },
      {
        name: 'Bản mẫu tương tác chuyển động trực quan (Interactive Prototype)',
        desc: 'Mô phỏng trải nghiệm bấm chạm như ứng dụng thật để các bên trải nghiệm và phê duyệt trước khi lập trình.',
        tag: 'Prototype',
        cost: 2600000
      },
      {
        name: 'Đặc tả chi tiết mọi trạng thái giao diện (Edge Cases & States)',
        desc: 'Thiết kế đầy đủ trạng thái hover, active, đang tải (loading), lỗi kết nối, dữ liệu trống (empty state).',
        tag: 'Edge States',
        cost: 2000000
      },
      {
        name: 'Tối ưu bố cục thích ứng đa nền tảng (Multi-Platform Responsive)',
        desc: 'Chuẩn hóa hiển thị từng pixel trên điện thoại, máy tính bảng và màn hình máy tính kích thước lớn.',
        tag: 'Responsive',
        cost: 2800000
      },
      {
        name: 'Bộ biến thiết kế đồng bộ lập trình (Design Tokens JSON / CSS)',
        desc: 'Xuất biến màu sắc, khoảng cách, font chữ đồng bộ trực tiếp với Tailwind CSS, rút ngắn 50% thời gian code.',
        tag: 'Design Tokens',
        cost: 2400000
      },
      {
        name: 'Thư viện biểu tượng & Đồ họa thương hiệu riêng (Icon & Asset Pack)',
        desc: 'Bộ icon vector SVG sắc nét và minh họa trực quan riêng biệt cho sản phẩm, nâng tầm nhận diện thương hiệu.',
        tag: 'Icon Assets',
        cost: 1800000
      },
      {
        name: 'Tài liệu Handoff & Buổi hướng dẫn chuyển giao cho đội ngũ Dev',
        desc: 'Bàn giao toàn quyền file Figma Auto-Layout kèm buổi họp hướng dẫn chi tiết cho đội ngũ lập trình viên.',
        tag: 'Dev Handoff',
        cost: 1600000
      }
    ]
  }
};

function Estimator() {
  const { user } = useApp();
  const [type, setType] = useState('Website & Web Portal Doanh Nghiệp');
  const [features, setFeatures] = useState<string[]>([]);
  const [pages, setPages] = useState(5);
  const [maintenance, setMaintenance] = useState(false);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [clientOrg, setClientOrg] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [timeline, setTimeline] = useState('Tiêu chuẩn (3 - 4 tuần)');
  const [projectNotes, setProjectNotes] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);

  const currentCategory = ESTIMATOR_CATEGORIES[type] || ESTIMATOR_CATEGORIES['Website & Web Portal Doanh Nghiệp'];

  const handleTypeChange = (newType: string) => {
    setType(newType);
    setFeatures([]);
    setSelectedSpecs([]);
    const targetCat = ESTIMATOR_CATEGORIES[newType];
    if (targetCat) {
      setPages(targetCat.baseUnits);
    }
  };

  const handleSpecToggle = (spec: string) => {
    setSelectedSpecs(prev =>
      prev.includes(spec) ? prev.filter(x => x !== spec) : [...prev, spec]
    );
  };

  const extraUnitsCost = Math.max(0, pages - currentCategory.baseUnits) * currentCategory.unitCost;
  
  const featuresCost = features.reduce((sum, fName) => {
    const f = currentCategory.features.find(x => x.name === fName);
    return sum + (f ? f.cost : 0);
  }, 0);

  const maintenanceCost = maintenance ? 3500000 : 0;
  const total = currentCategory.basePrice + extraUnitsCost + featuresCost + maintenanceCost;
  const rangeHigh = Math.round(total * 1.3);

  const copyEstimateSummary = () => {
    const lines = [
      `### BẢNG DỰ TOÁN DỰ ÁN · STUDIO VANTANTHEDEV`,
      `- Dịch vụ: ${currentCategory.label}`,
      `- Quy mô: ${pages} ${currentCategory.unitName}`,
      `- Định hướng đặc thù: ${selectedSpecs.length ? selectedSpecs.join(', ') : 'Theo tiêu chuẩn Studio'}`,
      `- Phân hệ kỹ thuật đã chọn (${features.length}):`,
      ...features.map(f => `  + ${f}`),
      `- Gói bảo hành SLA 60 ngày: ${maintenance ? 'Có' : 'Gói 30 ngày tiêu chuẩn'}`,
      `- Dự toán khoảng đầu tư: ${money(total)} — ${money(rangeHigh)}`,
      clientOrg ? `- Đơn vị: ${clientOrg}` : '',
      clientContact ? `- Liên hệ: ${clientContact}` : '',
      `- Tiến độ mong muốn: ${timeline}`,
      projectNotes ? `- Ghi chú thêm: ${projectNotes}` : ''
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const getFeatureIcon = (tag: string) => {
    switch (tag) {
      case 'Quản trị CMS':
        return <FileText size={16} />;
      case 'Thanh toán 24/7':
      case 'Mobile Payment':
      case 'Payment Engine':
      case 'Billing Engine':
        return <CreditCard size={16} />;
      case 'E-Commerce':
        return <Tag size={16} />;
      case 'Tối ưu SEO':
        return <Globe size={16} />;
      case 'Đa ngôn ngữ':
        return <Compass size={16} />;
      case 'Brand Motion':
      case 'Prototype':
        return <Sparkles size={16} />;
      case 'Tích hợp CRM':
      case 'In-app Chat':
        return <MessageCircle size={16} />;
      case 'Bảo mật WAF':
      case 'Xác thực & FaceID':
      case 'RBAC Security':
      case 'API Gateway':
        return <ShieldCheck size={16} />;
      case 'Store Release':
      case 'Offline-First':
        return <Smartphone size={16} />;
      case 'Push Hub':
        return <Bell size={16} />;
      case 'GPS & Maps':
        return <Compass size={16} />;
      case 'APM & Hiệu năng':
      case 'Zero-Downtime':
        return <Zap size={16} />;
      case 'Multi-Tenant':
      case 'Database Master':
        return <Database size={16} />;
      case 'BI Dashboard':
        return <LayoutDashboard size={16} />;
      case 'Task Queue':
      case 'Message Broker':
      case 'Open API Hub':
      case 'OpenAPI Suite':
        return <Server size={16} />;
      case 'Enterprise AI':
        return <Cpu size={16} />;
      case 'DevOps Cloud':
        return <Code2 size={16} />;
      case 'UX Research':
      case 'Design System':
      case 'Edge States':
      case 'Responsive':
      case 'Design Tokens':
      case 'Icon Assets':
      case 'Dev Handoff':
        return <Palette size={16} />;
      default:
        return <CheckCircle2 size={16} />;
    }
  };

  return (
    <main className="page-main">
      <div className="page-hero compact">
        <span className="eyebrow">BẢNG HOẠCH ĐỊNH DỰ ÁN CÔNG NGHỆ · STUDIO VANTANTHEDEV</span>
        <h1>
          Dự toán chi phí & Module kỹ thuật,<br />
          <span className="muted-heading">Minh bạch chuẩn mực doanh nghiệp.</span>
        </h1>
        <p>
          Công cụ cấu hình dự án của Studio giúp doanh nghiệp chủ động lựa chọn phân hệ tính năng,
          quy mô và dự toán ngân sách đầu tư ban đầu. 100% sở hữu mã nguồn Git · Cam kết bảo mật NDA · Tiêu chuẩn bảo hành doanh nghiệp.
        </p>
      </div>

      <div className="estimator-layout">
        <section className="estimate-controls">
          {/* 01. LOẠI GIẢI PHÁP PHẦN MỀM */}
          <div className="estimate-section">
            <span className="estimate-number">01</span>
            <div>
              <label>Loại sản phẩm & giải pháp phần mềm cần xây dựng</label>
              <div className="choice-row">
                {Object.keys(ESTIMATOR_CATEGORIES).map(x => {
                  const cat = ESTIMATOR_CATEGORIES[x];
                  const isSelected = type === x;
                  return (
                    <button
                      key={x}
                      className={isSelected ? 'selected' : ''}
                      onClick={() => handleTypeChange(x)}
                    >
                      <span>{cat.badge}</span> · {cat.label}
                    </button>
                  );
                })}
              </div>
              <small style={{ display: 'block', marginTop: 10, color: '#94a3b8' }}>
                {currentCategory.summary}
              </small>
            </div>
          </div>

          {/* 02. PHÂN HỆ TÍNH NĂNG TRỰC QUAN THEO HẠNG MỤC */}
          <div className="estimate-section">
            <span className="estimate-number">02</span>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                <label style={{ margin: 0 }}>
                  Tính năng & Phân hệ kỹ thuật dự kiến cho <b>{currentCategory.label}</b>
                </label>
                <span style={{ fontSize: '12px', color: '#818cf8', fontFamily: 'var(--mono)' }}>
                  {features.length} phân hệ đã kích hoạt
                </span>
              </div>
              <div className="feature-check-grid">
                {currentCategory.features.map(f => {
                  const isChecked = features.includes(f.name);
                  return (
                    <label key={f.name} className={isChecked ? 'is-checked' : ''}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() =>
                          setFeatures(
                            isChecked
                              ? features.filter(x => x !== f.name)
                              : [...features, f.name]
                          )
                        }
                      />
                      <div className="feature-icon-box">
                        {getFeatureIcon(f.tag)}
                      </div>
                      <div className="feature-info">
                        <div className="feature-head-row">
                          <span className="feature-tag-badge">{f.tag}</span>
                          <span className="feature-cost">+{money(f.cost)}</span>
                        </div>
                        <span className="feature-title">{f.name}</span>
                        <span className="feature-desc">{f.desc}</span>
                      </div>
                      <span className="custom-check">
                        <Check size={13} />
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 03. ĐỊNH HƯỚNG KIẾN TRÚC & YÊU CẦU ĐẶC THÙ */}
          <div className="estimate-section">
            <span className="estimate-number">03</span>
            <div>
              <label>Định hướng kiến trúc & Yêu cầu đặc thù cho hạng mục này</label>
              <small style={{ display: 'block', marginBottom: 8, color: '#94a3b8' }}>
                Chọn các định hướng bài toán để đội ngũ kỹ sư Studio chuẩn bị phương án kiến trúc phù hợp:
              </small>
              <div className="spec-chip-group">
                {currentCategory.specOptions.map(spec => {
                  const isActive = selectedSpecs.includes(spec);
                  return (
                    <button
                      key={spec}
                      type="button"
                      className={`spec-chip ${isActive ? 'active' : ''}`}
                      onClick={() => handleSpecToggle(spec)}
                    >
                      {isActive ? '✓ ' : '+ '} {spec}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 04. QUY MÔ PHÁT TRIỂN / SỐ LƯỢNG PHÂN HỆ */}
          <div className="estimate-section">
            <span className="estimate-number">04</span>
            <div className="page-count">
              <label htmlFor="pagecount">
                {currentCategory.unitLabel}: <b>{pages} {currentCategory.unitName}</b>
              </label>
              <div>
                <input
                  id="pagecount"
                  type="range"
                  min={currentCategory.unitMin}
                  max={currentCategory.unitMax}
                  value={pages}
                  onChange={e => setPages(+e.target.value)}
                />
              </div>
              <small>
                Khung tiêu chuẩn đã bao gồm sẵn {currentCategory.baseUnits} {currentCategory.unitName}.
                {pages > currentCategory.baseUnits && (
                  <> Mở rộng thêm {pages - currentCategory.baseUnits} {currentCategory.unitName} (+{money(extraUnitsCost)}).</>
                )}
              </small>
            </div>
          </div>

          {/* 05. THÔNG TIN DOANH NGHIỆP & YÊU CẦU DỰ ÁN */}
          <div className="estimate-section">
            <span className="estimate-number">05</span>
            <div>
              <label>Thông tin đơn vị & Kế hoạch triển khai</label>
              <small style={{ display: 'block', marginBottom: 8, color: '#94a3b8' }}>
                Điền thông tin doanh nghiệp để nhận bản đặc tả kỹ thuật và lịch họp trực tiếp 1-1 với Studio:
              </small>
              <div className="studio-form-grid">
                <div>
                  <input
                    type="text"
                    className="studio-input"
                    placeholder="Tên doanh nghiệp / Đơn vị (ví dụ: ABC Corp)"
                    value={clientOrg}
                    onChange={e => setClientOrg(e.target.value)}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    className="studio-input"
                    placeholder="Người phụ trách & SĐT / Email liên hệ"
                    value={clientContact}
                    onChange={e => setClientContact(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <select
                  className="studio-input"
                  value={timeline}
                  onChange={e => setTimeline(e.target.value)}
                >
                  <option value="Triển khai gấp (1 - 2 tuần)">Tiến độ: Triển khai gấp (1 - 2 tuần)</option>
                  <option value="Tiêu chuẩn (3 - 4 tuần)">Tiến độ: Tiêu chuẩn (3 - 4 tuần)</option>
                  <option value="Dự án quy mô lớn (2 - 3 tháng)">Tiến độ: Dự án quy mô lớn (2 - 3 tháng)</option>
                </select>
              </div>
              <div style={{ marginTop: 12 }}>
                <textarea
                  className="studio-input"
                  style={{ minHeight: 70, resize: 'vertical' }}
                  placeholder="Ghi chú bài toán nghiệp vụ hoặc công nghệ yêu cầu đặc biệt..."
                  value={projectNotes}
                  onChange={e => setProjectNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 06. GÓI BẢO HÀNH DOANH NGHIỆP */}
          <div className="estimate-section">
            <span className="estimate-number">06</span>
            <div>
              <label className="maintenance-choice">
                <span>Gói bảo hành kỹ thuật doanh nghiệp & SLA mở rộng (60 ngày)</span>
                <input
                  type="checkbox"
                  checked={maintenance}
                  onChange={e => setMaintenance(e.target.checked)}
                />
                <span className="custom-check">
                  <Check size={13} />
                </span>
              </label>
              <small>
                Giám sát máy chủ 24/7, tối ưu hiệu năng định kỳ, vá lỗi bảo mật ưu tiên và hỗ trợ kỹ thuật trực tiếp.
              </small>
            </div>
          </div>
        </section>

        {/* CỘT TỔNG KHOẢNG ĐẦU TƯ THAM KHẢO & CAM KẾT STUDIO */}
        <aside className="estimate-result">
          <div className="estimate-result-top">
            <span className="eyebrow">DỰ TOÁN ĐẦU TƯ STUDIO</span>
            <span className="signal-dot" />
          </div>
          <span className="estimate-type">
            {currentCategory.label} · ~{pages} {currentCategory.unitName}
          </span>
          <strong>
            {money(total)} <i>—</i>
            <br />
            {money(rangeHigh)}
          </strong>
          <span className="estimate-range">Khoảng ước tính chuẩn hóa dựa trên module kỹ thuật đã chọn</span>

          <div className="estimate-divider" />

          <div className="estimate-breakdown">
            <span>
              Nền tảng {currentCategory.label} ({currentCategory.baseUnits} {currentCategory.unitName}){' '}
              <b>{money(currentCategory.basePrice)}</b>
            </span>
            {pages > currentCategory.baseUnits && (
              <span>
                Thêm {pages - currentCategory.baseUnits} {currentCategory.unitName}{' '}
                <b>{money(extraUnitsCost)}</b>
              </span>
            )}
            <span>
              {features.length} module kỹ thuật nâng cao{' '}
              <b>{money(featuresCost)}</b>
            </span>
            {maintenance && (
              <span>
                Bảo hành SLA doanh nghiệp 60 ngày <b>{money(3500000)}</b>
              </span>
            )}
          </div>

          <div className="studio-guarantee-card">
            <div className="studio-guarantee-item">
              <ShieldCheck size={15} />
              <span><b>Bảo mật thông tin:</b> Cam kết ký thỏa thuận bảo mật NDA trước khi tiếp nhận tài liệu nội bộ.</span>
            </div>
            <div className="studio-guarantee-item">
              <Code2 size={15} />
              <span><b>100% Mã nguồn Git:</b> Bàn giao toàn quyền sở hữu Private Git Repository, không giam giữ code.</span>
            </div>
            <div className="studio-guarantee-item">
              <CheckCircle2 size={15} />
              <span><b>Tài liệu chuẩn mực:</b> Bàn giao tài liệu kiến trúc hệ thống, API Docs và hướng dẫn triển khai.</span>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
            <Link
              to={user ? `/book/phat-trien-web-app` : `/register?from=${encodeURIComponent('/custom-project')}`}
              className="button button-bright button-full"
            >
              {user ? 'Khởi tạo dự án theo ước tính này' : 'Đăng ký tài khoản để bắt đầu dự án'} <ArrowRight size={15} />
            </Link>

            <button
              type="button"
              onClick={copyEstimateSummary}
              className="button button-quiet button-full"
            >
              {copiedSummary ? (
                <>
                  <Check size={15} style={{ color: '#10b981' }} /> Đã sao chép tóm tắt dự toán!
                </>
              ) : (
                <>
                  <Copy size={15} /> Sao chép tóm tắt dự toán
                </>
              )}
            </button>

            <Link
              to={`/contact?type=${encodeURIComponent(type)}&pages=${pages}&features=${encodeURIComponent(features.join(','))}&budget=${encodeURIComponent(
                `${money(total)} - ${money(rangeHigh)}`
              )}&specs=${encodeURIComponent(selectedSpecs.join(','))}&org=${encodeURIComponent(clientOrg)}&contact=${encodeURIComponent(clientContact)}`}
              className="button button-ghost button-full"
            >
              Yêu cầu tư vấn & Báo giá chi tiết <ArrowUpRight size={15} />
            </Link>
          </div>

          <small className="estimate-foot">
            {user
              ? 'Dự án sẽ được kích hoạt trực tiếp trong Không gian quản trị khách hàng của bạn.'
              : 'Đội ngũ kỹ sư Studio sẽ liên hệ lại trong vòng 24h làm việc sau khi nhận yêu cầu.'}
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
      const res = await api<any>(`/api/auth/${register ? 'register' : 'login'}`, {
        method: 'POST',
        body: JSON.stringify(
          register
            ? { name, email, password, phone, company, terms }
            : { email, password }
        )
      });
      const userData: User = res.user || res;
      if (res.token) setAuthToken(res.token);
      setUser(userData);
      flash(register ? 'Chào mừng bạn! Tài khoản đã được kích hoạt.' : 'Đăng nhập thành công.');
      nav(userData.role === 'admin' ? '/admin' : from, { replace: true });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

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
            Theo dõi tiến độ theo thời gian thực, trao đổi trực tiếp cùng đội ngũ kỹ sư phụ trách dự án,
            dưới sự kiểm soát chất lượng của CEO & Ban Vận hành.
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
          VANTANTHEDEV SOFTWARE STUDIO · ĐỘI NGŨ KỸ SƯ CHUYÊN NGHIỆP
        </span>
      </div>

      <div className="auth-form-side">
        <div className="auth-mobile-brand">
          <span className="brand-mark">
            <Code2 size={18} />
          </span>
          <span className="brand-text">
            VanTanThe<span className="brand-accent">DEV</span>
          </span>
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

          {!forgot && (
            <>
              <GoogleLoginButton
                mode={register ? 'register' : 'login'}
                onSuccess={(u) => nav(u.role === 'admin' ? '/admin' : from, { replace: true })}
              />
              <div className="auth-divider">
                <span>Hoặc tiếp tục bằng tài khoản Email</span>
              </div>
            </>
          )}

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
    setAuthToken(null);
    setUser(null);
    flash('Đã đăng xuất an toàn.');
    nav('/');
  }

  return (
    <aside className="workspace-nav">
      <Link className="workspace-brand" to="/dashboard">
        <span className="brand-mark">
          <Code2 size={16} />
        </span>
        <span className="brand-text">
          CLIENT <span className="brand-accent">SPACE</span>
        </span>
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
          style={{ marginTop: 8, background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border-strong)' }}
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
  const unpaidOrders = orders.filter(o => o.payment_status !== 'paid' && o.status !== 'cancelled');
  const waitingOrders = orders.filter(o => o.status === 'waiting_customer');

  return (
    <div className="dashboard-content">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">CLIENT WORKSPACE / TỔNG QUAN</span>
          <h1>Chào {user?.name.split(' ').slice(-1)[0]}.</h1>
          <p>Không gian quản lý tiến độ, trao đổi trực tiếp với đội ngũ kỹ sư và thanh toán dự án.</p>
        </div>
        <Link to="/custom-project" className="button button-bright">
          Tạo yêu cầu mới <ArrowUpRight size={15} />
        </Link>
      </div>

      {/* Next-action Guidance Banner */}
      {orders.length === 0 ? (
        <div className="next-action-banner">
          <div className="next-action-content">
            <div className="next-action-badges">
              <span className="badge badge-accent">BƯỚC TIẾP THEO CHO BẠN</span>
            </div>
            <h3>Khởi tạo dự án đầu tiên cùng Đội ngũ VanTanTheDEV</h3>
            <p>
              Bạn đã có tài khoản khách hàng. Hãy chọn một gói dịch vụ phù hợp hoặc gửi yêu cầu dự án riêng
              để đội ngũ kỹ sư phân tích kiến trúc và phản hồi lộ trình cụ thể trong vòng 24h.
            </p>
          </div>
          <div className="next-action-actions">
            <Link to="/services" className="button button-bright button-sm">
              Khám phá dịch vụ <ArrowRight size={14} />
            </Link>
            <Link to="/custom-project" className="button button-quiet button-sm">
              Ước tính dự án riêng <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      ) : unpaidOrders.length > 0 ? (
        <div className="next-action-banner">
          <div className="next-action-content">
            <div className="next-action-badges">
              <span className="badge badge-warning">CẦN THANH TOÁN TẠM ỨNG: MÃ {unpaidOrders[0].order_number}</span>
            </div>
            <h3>Dự án "{unpaidOrders[0].project_name}" đang chờ xác nhận thanh toán</h3>
            <p>
              Đơn hàng đã được tiếp nhận. Bạn có thể thanh toán nhanh qua mã VietQR tự động để đội ngũ kỹ sư kích hoạt môi trường phát triển ngay hôm nay.
            </p>
          </div>
          <div className="next-action-actions">
            <Link to={`/dashboard/orders/${unpaidOrders[0].id}`} className="button button-bright button-sm">
              Mở chi tiết & Quét VietQR <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      ) : waitingOrders.length > 0 ? (
        <div className="next-action-banner">
          <div className="next-action-content">
            <div className="next-action-badges">
              <span className="badge badge-accent">CẦN PHẢN HỒI: MÃ {waitingOrders[0].order_number}</span>
            </div>
            <h3>Kỹ sư đang chờ bạn phản hồi bản xem thử "{waitingOrders[0].project_name}"</h3>
            <p>
              Đội ngũ kỹ thuật đã gửi bản demo hoặc câu hỏi cần bạn xác nhận trong hộp thoại. Hãy phản hồi để tiến trình dự án tiếp tục được đẩy nhanh.
            </p>
          </div>
          <div className="next-action-actions">
            <Link to={`/dashboard/orders/${waitingOrders[0].id}`} className="button button-bright button-sm">
              Phản hồi kỹ sư ngay <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="next-action-banner">
          <div className="next-action-content">
            <div className="next-action-badges">
              <span className="badge badge-accent">TRẠNG THÁI VẬN HÀNH TỐT</span>
            </div>
            <h3>Đội ngũ kỹ sư đang tích cực triển khai các dự án của bạn</h3>
            <p>
              Mọi cập nhật mã nguồn, tệp tài liệu và mốc bàn giao sẽ được thông báo ngay tại Không gian dự án.
            </p>
          </div>
          <div className="next-action-actions">
            <Link to="/dashboard/orders" className="button button-bright button-sm">
              Xem tiến độ dự án <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

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

      {/* 3-Step Guidance Roadmap */}
      <div className="onboarding-guide-grid">
        <div className="onboarding-guide-card">
          <span className="step-num">01</span>
          <h4>Gửi yêu cầu hoặc đặt dịch vụ</h4>
          <p>Chọn gói giải pháp có sẵn hoặc gửi mô tả dự án riêng với ngân sách và thời hạn bạn mong muốn.</p>
        </div>
        <div className="onboarding-guide-card">
          <span className="step-num">02</span>
          <h4>Trao đổi trực tiếp với Kỹ sư phụ trách</h4>
          <p>Làm việc qua hộp thoại dự án, nhận bản demo từng mốc và theo dõi lộ trình 06 giai đoạn minh bạch.</p>
        </div>
        <div className="onboarding-guide-card">
          <span className="step-num">03</span>
          <h4>Nghiệm thu & Bàn giao 100% mã nguồn</h4>
          <p>Nhận toàn bộ Git repository, tài liệu triển khai và hóa đơn điện tử có xác thực bởi CEO & COO.</p>
        </div>
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
          Tiến độ được cập nhật bởi Đội ngũ Kỹ sư & Giám sát chất lượng bởi Nguyễn Văn Tấn (CEO & Giám đốc Vận hành) theo từng mốc bàn giao thực tế.
        </p>
      </div>

      {/* Dynamic Next-Step Guidance for Order */}
      <div className="roadmap-status-card">
        <div className="roadmap-status-info">
          <h4>
            {order.status === 'pending'
              ? 'Trạng thái: Đang tiếp nhận & Phân tích giải pháp'
              : order.status === 'confirmed'
              ? 'Trạng thái: Đơn hàng đã xác nhận · Chuẩn bị lập trình'
              : order.status === 'in_progress'
              ? 'Trạng thái: Đang phát triển & Kiểm thử chất lượng'
              : order.status === 'waiting_customer'
              ? 'Trạng thái: Chờ khách hàng phản hồi / Duyệt bản demo'
              : order.status === 'revision'
              ? 'Trạng thái: Đang tinh chỉnh theo phản hồi của bạn'
              : order.status === 'completed'
              ? 'Trạng thái: Hoàn tất & Nghiệm thu bàn giao 100%'
              : 'Trạng thái: Đơn hàng đã đóng'}
          </h4>
          <p>
            {order.status === 'pending'
              ? 'Bước tiếp theo: Đội ngũ Kỹ sư đang phân tích bài toán và sẽ gửi tài liệu đề xuất giải pháp trong hộp thoại bên dưới. Nếu có yêu cầu đặc thù, bạn có thể gửi tin nhắn trao đổi ngay.'
              : order.status === 'confirmed'
              ? 'Bước tiếp theo: Kỹ sư phụ trách đang thiết lập repository và database. Bạn có thể gửi thêm tài liệu hoặc asset trong mục Tệp dự án.'
              : order.status === 'in_progress'
              ? 'Bước tiếp theo: Kỹ sư đang phát triển các module. Khi hoàn thành mốc xem thử, bạn sẽ nhận được thông báo để kiểm tra và đóng góp ý kiến.'
              : order.status === 'waiting_customer'
              ? 'Bước tiếp theo: Kỹ sư đã tải lên bản xem thử hoặc câu hỏi cần bạn xác nhận. Vui lòng phản hồi trong hộp thoại để dự án tiếp tục tiến hành.'
              : order.status === 'revision'
              ? 'Bước tiếp theo: Đội ngũ đang thực hiện chỉnh sửa theo góp ý của bạn. Phiên bản cập nhật sẽ sớm được bàn giao.'
              : order.status === 'completed'
              ? 'Bước tiếp theo: Toàn bộ mã nguồn đã sẵn sàng ở mục Tệp bàn giao. Bạn có thể tải về và gửi đánh giá nghiệm thu bên dưới.'
              : 'Dự án đã đóng hoặc hủy.'}
          </p>
        </div>
        <div className="roadmap-status-actions">
          {order.payment_status !== 'paid' && (
            <button
              className="button button-small button-bright"
              onClick={() => openVietQr(order.order_number, order.amount)}
            >
              <QrCode size={14} /> Thanh toán VietQR
            </button>
          )}
        </div>
      </div>

      {/* VietQR Quick Payment Box if unpaid */}
      {order.payment_status !== 'paid' && (
        <div
          className="dash-panel"
          style={{
            marginTop: 14,
            borderColor: 'var(--border-strong)',
            background: 'var(--surface)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <span className="eyebrow" style={{ color: 'var(--soft)' }}>
                THANH TOÁN DỰ ÁN QUA VIETQR
              </span>
              <h3 style={{ margin: '4px 0 0', font: '600 15px var(--sans)' }}>
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
                borderRadius: 2,
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
                  <b style={{ color: '#4ade80' }}>{money(order.amount)}</b>
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
                  <b style={{ color: 'var(--text)' }}>{order.order_number}</b>
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
              <b>{order.requirements?.technology || 'Đội ngũ Kỹ sư đề xuất'}</b>
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
                <span style={{ fontFamily: 'var(--mono)', color: 'var(--text)', fontSize: 10 }}>
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
                      <FileText size={15} style={{ color: 'var(--text)' }} />
                      <div>
                        <b>{f.file_name}</b>
                        <small style={{ display: 'block', color: 'var(--muted)' }}>
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
                      style={{ color: 'var(--text)' }}
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
              <h2>Trao đổi cùng Đội ngũ Kỹ sư VanTanTheDEV</h2>
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
    setAuthToken(null);
    setUser(null);
    nav('/');
  }

  return (
    <aside className="workspace-nav admin-nav">
      <Link className="workspace-brand" to="/admin">
        <span className="brand-mark">
          <Code2 size={16} />
        </span>
        <span className="brand-text">
          STUDIO <span className="brand-accent">ADMIN</span>
        </span>
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
          sản phẩm do Đội ngũ Kỹ sư VanTanTheDEV triển khai dưới sự định hướng kiến trúc của CEO Nguyễn Văn Tấn.
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
                    <b style={{ fontSize: 13, color: '#eeeeee' }}>99.98%</b>
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
          <span className="eyebrow">ĐỘI NGŨ & CƠ CẤU TỔ CHỨC</span>
          <h1>
            Đội ngũ Kỹ sư &<br />
            Ban Vận hành <span className="text-gradient">VanTanTheDEV.</span>
          </h1>
          <p className="about-lede">
            VanTanTheDEV tập hợp đội ngũ kỹ sư phần mềm tài năng, chuyên sâu về kiến trúc Web, Mobile và Hạ tầng Cloud.
            Được sáng lập và điều hành bởi Nguyễn Văn Tấn (Sáng lập, CEO & Giám đốc Vận hành - COO),
            chúng tôi mang đến dịch vụ phát triển phần mềm chuẩn mực thương mại, minh bạch và toàn diện cho doanh nghiệp.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to="/custom-project" className="button button-bright">
              Gửi yêu cầu tới Đội ngũ Kỹ sư <ArrowUpRight size={15} />
            </Link>
            <Link to="/contact" className="button button-quiet">
              Liên hệ Đội ngũ Hỗ trợ <Mail size={14} />
            </Link>
          </div>
        </div>
        <div className="about-monogram">
          <span>VT</span>
          <i>·</i>
          <span>DEV</span>
          <small>
            ENGINEERED BY SQUADS<br />
            DIRECTED BY FOUNDER & COO
          </small>
        </div>
      </div>

      {/* Organizational Structure */}
      <section style={{ marginTop: 20, marginBottom: 36 }}>
        <span className="eyebrow" style={{ display: 'block', marginBottom: 12 }}>
          <Users size={14} style={{ verticalAlign: -2 }} /> CƠ CẤU TỔ CHỨC & VAI TRÒ CHUYÊN TRÁCH
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
            <span className="eyebrow" style={{ color: '#c4b5fd' }}>BAN ĐIỀU HÀNH & KIẾN TRÚC</span>
            <h3 style={{ fontSize: 16, margin: '8px 0 4px', color: '#f1f5f9' }}>Nguyễn Văn Tấn</h3>
            <small style={{ color: '#94a3b8', display: 'block', marginBottom: 10 }}>Sáng lập, CEO & Giám đốc Vận hành (COO)</small>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              Định hướng chiến lược công nghệ, phê duyệt kiến trúc kỹ thuật và kiểm soát chất lượng sản phẩm bàn giao, đảm bảo từng dòng mã nguồn đạt tiêu chuẩn tối ưu cao nhất.
            </p>
          </div>

          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
            <span className="eyebrow" style={{ color: '#5bd7de' }}>ĐỘI NGŨ KỸ SƯ PHẦN MỀM</span>
            <h3 style={{ fontSize: 16, margin: '8px 0 4px', color: '#f1f5f9' }}>Engineering Squad</h3>
            <small style={{ color: '#94a3b8', display: 'block', marginBottom: 10 }}>Frontend, Backend & Full-Stack Engineers</small>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              Lập trình trực tiếp, xây dựng API hiệu năng cao, tối ưu cơ sở dữ liệu và tích hợp các giải pháp thanh toán VietQR tự động, đảm bảo tốc độ tải trang Lighthouse 95+.
            </p>
          </div>

          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
            <span className="eyebrow" style={{ color: '#a7f3d0' }}>TƯ VẤN & CHĂM SÓC KHÁCH HÀNG</span>
            <h3 style={{ fontSize: 16, margin: '8px 0 4px', color: '#f1f5f9' }}>Customer Support Team</h3>
            <small style={{ color: '#94a3b8', display: 'block', marginBottom: 10 }}>Chuyên viên Kỹ thuật & Hỗ trợ Khách hàng</small>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              Đầu mối tiếp nhận yêu cầu 24/7, phản hồi trong 2-4 giờ, hướng dẫn khách hàng trong suốt quá trình triển khai và hỗ trợ bảo hành kỹ thuật sau khi bàn giao.
            </p>
          </div>
        </div>
      </section>

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
            Phần mềm xuất sắc đến từ sự phối hợp nhịp nhàng giữa đội ngũ kỹ sư thực thi tài năng và quy trình
            kiểm soát chất lượng nghiêm ngặt từ Ban Vận hành. Chúng tôi ưu tiên trao đổi thẳng thắn về tính khả thi,
            lựa chọn công nghệ bền vững thay vì chạy theo trào lưu, và bàn giao để bạn toàn quyền làm chủ mã nguồn.
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
                <strong>Đội ngũ kỹ sư chuyên trách từng phân hệ</strong>
                <small>Mỗi module được phụ trách bởi kỹ sư chuyên sâu, đảm bảo chất lượng kỹ thuật cao nhất.</small>
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
            VANTANTHEDEV SOFTWARE STUDIO · ĐỘI NGŨ KỸ SƯ CHUYÊN NGHIỆP · GIÁM SÁT BỞI CEO NGUYỄN VĂN TẤN
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
          Thảo luận kỹ thuật cùng Đội ngũ Kỹ sư & Tư vấn <ArrowRight size={15} />
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
          'Dữ liệu dự án được lưu trữ bảo mật và chỉ có bạn cùng Đội ngũ Kỹ sư phụ trách và Ban Quản lý có quyền truy cập thông qua phiên làm việc đã xác thực.'
        ],
        [
          'Bạn có hỗ trợ thiết lập hosting, tên miền và server không?',
          'Có. Chúng tôi hỗ trợ cấu hình trọn gói máy chủ VPS, Cloudflare, SSL HTTPS và quy trình triển khai tự động Docker theo hạ tầng của bạn.'
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
            <p>Hãy gửi tin nhắn trực tiếp, đội ngũ kỹ thuật sẽ phản hồi trong vòng 2 - 4 giờ làm việc.</p>
            <Link to="/contact" className="text-link">
              Liên hệ Đội ngũ Kỹ thuật & Hỗ trợ <ArrowRight size={15} />
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
              <span>ĐỘI NGŨ PHỤ TRÁCH</span>
              <b>Kỹ sư Dự án & CSKH VanTanTheDEV</b>
            </div>
            <div>
              <span>GIÁM SÁT VẬN HÀNH</span>
              <b>Nguyễn Văn Tấn (CEO & COO)</b>
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
                Đội ngũ kỹ thuật VanTanTheDEV đã tiếp nhận yêu cầu của bạn và sẽ phản hồi chi tiết qua địa chỉ
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
        <span>VanTanTheDEV Software Studio · Đội Ngũ Kỹ Sư Chuyên Nghiệp · Nguyễn Văn Tấn (CEO & COO)</span>
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
  const { t } = useApp();
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
    { name: t('Tất cả dịch vụ phần mềm', 'All Software Services'), path: '/services', type: t('DANH MỤC', 'CATEGORY') },
    { name: t('Ước tính dự án riêng (Estimator)', 'Custom Project Estimator'), path: '/custom-project', type: t('CÔNG CỤ', 'TOOL') },
    { name: t('Sản phẩm & Case Studies', 'Portfolio & Case Studies'), path: '/portfolio', type: t('KHÁM PHÁ', 'EXPLORE') },
    { name: t('Stack công nghệ kỹ thuật', 'Technical Tech Stack'), path: '/technologies', type: t('KỸ THUẬT', 'TECH') },
    { name: t('Về Đội ngũ & Ban Điều Hành', 'About Team & Leadership'), path: '/about', type: t('GIỚI THIỆU', 'ABOUT') },
    { name: t('Câu hỏi thường gặp (FAQ)', 'Frequently Asked Questions (FAQ)'), path: '/faq', type: t('HỖ TRỢ', 'SUPPORT') },
    { name: t('Liên hệ tư vấn trực tiếp', 'Direct Technical Consultation'), path: '/contact', type: t('LIÊN HỆ', 'CONTACT') },
    { name: t('Không gian khách hàng (Dashboard)', 'Client Portal (Dashboard)'), path: '/dashboard', type: t('KHÁCH HÀNG', 'CLIENT') }
  ];

  const results = [
    ...services.map(s => ({
      name: `${s.title} (${money(s.starting_price)})`,
      path: `/services/${s.slug}`,
      type: t('DỊCH VỤ', 'SERVICE')
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
        aria-label={t('Tìm kiếm nhanh', 'Quick Search')}
      >
        <div className="palette-input">
          <Search />
          <input
            autoFocus
            placeholder={t('Tìm kiếm dịch vụ, công nghệ, đặt lịch...', 'Search services, tech stack, booking...')}
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
        <span className="palette-label">{t('GỢI Ý KẾT QUẢ / ĐIỂM ĐẾN', 'SUGGESTED RESULTS / DESTINATIONS')}</span>
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
          <div className="palette-none">{t('Không tìm thấy nội dung phù hợp.', 'No matching results found.')}</div>
        )}
        <div className="palette-foot">
          <span>{t('ENTER MỞ', 'ENTER OPEN')}</span>
          <span>{t('ESC ĐÓNG', 'ESC CLOSE')}</span>
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
                <b style={{ color: 'var(--text)' }}>{orderNumber}</b>
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
              <span className="brand-mark">
                <Code2 size={16} />
              </span>
              <span className="brand-text">
                VanTanThe<span className="brand-accent">DEV</span>
              </span>
            </div>
            <p className="inv-seller">
              Đơn vị cung cấp: <b>VanTanTheDEV Software Studio</b><br />
              Đại diện: <b>Nguyễn Văn Tấn</b> (Sáng lập, CEO & Giám đốc Vận hành)<br />
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
            <span>ĐẠI DIỆN BAN ĐIỀU HÀNH & VẬN HÀNH:</span>
            <div style={{ marginTop: 12, color: '#4f46e5', fontWeight: 800, letterSpacing: 1, fontFamily: 'var(--display)' }}>
              [ĐÃ XÁC THỰC ĐIỆN TỬ]
            </div>
            <b>NGUYỄN VĂN TẤN</b>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>Sáng lập, CEO & Giám đốc Vận hành (COO)</div>
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
