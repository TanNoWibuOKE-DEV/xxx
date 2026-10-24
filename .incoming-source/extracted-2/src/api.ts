export class ApiError extends Error {
  status: number;
  code: string;
  constructor(message: string, status: number, code: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const TOKEN_KEY = 'vttd_token';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
}

export async function api<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers
  });
  const body = await response.json().catch(() => ({
    success: false,
    error: { message: 'Không thể đọc phản hồi từ máy chủ.' }
  }));
  if (!response.ok || body.success === false) {
    if (response.status === 401 && (body.error?.code === 'SESSION_INVALID' || body.error?.code === 'AUTH_REQUIRED')) {
      setAuthToken(null);
    }
    throw new ApiError(body.error?.message || 'Yêu cầu chưa thành công.', response.status, body.error?.code || 'ERROR');
  }
  return body.data as T;
}

export const money = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);

export const date = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value));

export const dateTime = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

export const statusLabel: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  in_progress: 'Đang phát triển',
  waiting_customer: 'Chờ bạn phản hồi',
  revision: 'Đang chỉnh sửa',
  completed: 'Hoàn tất & bàn giao',
  cancelled: 'Đã hủy',
  unpaid: 'Chưa thanh toán',
  pending_payment: 'Chờ đối soát',
  paid: 'Đã thanh toán',
  failed: 'Thanh toán lỗi',
  refunded: 'Đã hoàn tiền'
};

export const paymentMethodLabel: Record<string, string> = {
  vietqr: 'Quét mã VietQR (Ngân hàng)',
  bank_transfer: 'Chuyển khoản ngân hàng',
  vnpay: 'Cổng thanh toán VNPAY',
  momo: 'Ví điện tử MoMo',
  stripe: 'Thẻ quốc tế (Stripe)'
};

/**
 * Generate standard VietQR image URL for instant mobile banking scanning
 * Uses bankId: MB (MB Bank) or customizable
 */
export function generateVietQrUrl(
  bankId = 'MB',
  accountNo = '0987654321',
  amount = 0,
  orderNumber = '',
  accountName = 'NGUYEN VAN TAN'
): string {
  const cleanBank = bankId.split(' ')[0] || 'MB';
  const memo = orderNumber ? `${orderNumber}` : 'THANH TOAN VANTANTHEDEV';
  return `https://img.vietqr.io/image/${cleanBank}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
    memo
  )}&accountName=${encodeURIComponent(accountName)}`;
}
