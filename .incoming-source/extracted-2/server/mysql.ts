import mysql from 'mysql2/promise';
import { randomBytes, scryptSync } from 'node:crypto';
import dotenv from 'dotenv';
dotenv.config();

export interface MySQLUser {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: 'customer' | 'admin';
  phone?: string | null;
  company?: string | null;
  google_id?: string | null;
  avatar_url?: string | null;
  suspended?: number;
  created_at?: string;
}

export interface MySQLSession {
  token_hash: string;
  user_id: string;
  expires_at: string;
  created_at?: string;
}

const host = process.env.MYSQL_HOST || 'mariadb.gameinfra.org';
const port = Number(process.env.MYSQL_PORT) || 3306;
const user = process.env.MYSQL_USER || 'u5dde4354_Wc9HP9Y6Cg';
const password = process.env.MYSQL_PASSWORD || '';
const database = process.env.MYSQL_DATABASE || 's5dde4354_dbtansv';

let pool: mysql.Pool | null = null;
let isConnected = false;

function hashPassword(passwordStr: string): string {
  const salt = randomBytes(16).toString('hex');
  return `scrypt:${salt}:${scryptSync(passwordStr, salt, 64).toString('hex')}`;
}

export async function initMySQL(): Promise<boolean> {
  if (!password) {
    console.warn(`\n[MySQL/MariaDB] ⚠️ Chưa có MYSQL_PASSWORD trong file .env!`);
    console.warn(`[MySQL/MariaDB] Đang cấu hình kết nối tới: ${host}:${port} (Database: ${database}, User: ${user})`);
    console.warn(`[MySQL/MariaDB] Vui lòng nhập mật khẩu vào .env (MYSQL_PASSWORD=...) để kết nối và lưu dữ liệu người dùng trực tiếp vào MariaDB.\n`);
    return false;
  }

  try {
    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 8000,
    });

    const conn = await pool.getConnection();
    console.log(`\n[MySQL/MariaDB] ✅ Kết nối thành công tới MariaDB server (${host}:${port}, DB: ${database})!`);

    // Create users table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(191) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(32) NOT NULL DEFAULT 'customer',
        phone VARCHAR(50),
        company VARCHAR(255),
        google_id VARCHAR(191) UNIQUE,
        avatar_url TEXT,
        suspended TINYINT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create sessions table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        expires_at VARCHAR(64) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_session_expires (expires_at),
        INDEX idx_session_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create password_resets table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        token_hash VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        expires_at VARCHAR(64) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_reset_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create audit_logs table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        actor_id VARCHAR(64),
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(100),
        target_id VARCHAR(64),
        ip_address VARCHAR(100),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure default admin user
    const [existingAdmin] = await conn.query<any[]>(
      'SELECT id FROM users WHERE email = ?',
      ['admin@vantanthedev.com']
    );

    if (!Array.isArray(existingAdmin) || existingAdmin.length === 0) {
      await conn.query(
        `INSERT INTO users (id, email, name, password_hash, role, phone, company) 
         VALUES (?, ?, ?, ?, 'admin', ?, ?)`,
        [
          'user-admin-vt',
          'admin@vantanthedev.com',
          'Nguyễn Văn Tấn (CEO & COO)',
          hashPassword('Admin@2026!'),
          '+84 901 234 567',
          'VanTanTheDEV Studio'
        ]
      );
      console.log('[MySQL/MariaDB] Đã khởi tạo tài khoản Admin mặc định (admin@vantanthedev.com) trong MariaDB.');
    }

    conn.release();
    isConnected = true;
    return true;
  } catch (err: any) {
    console.error(`[MySQL/MariaDB] ❌ Lỗi kết nối MariaDB (${host}:${port}):`, err.message);
    isConnected = false;
    return false;
  }
}

export function isMySQLConnected(): boolean {
  return isConnected && pool !== null;
}

export async function syncUserToMySQL(user: MySQLUser): Promise<void> {
  if (!isConnected || !pool) return;
  try {
    await pool.query(
      `INSERT INTO users (id, email, name, password_hash, role, phone, company, google_id, avatar_url, suspended)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         password_hash = VALUES(password_hash),
         role = VALUES(role),
         phone = VALUES(phone),
         company = VALUES(company),
         google_id = VALUES(google_id),
         avatar_url = VALUES(avatar_url),
         suspended = VALUES(suspended)`,
      [
        user.id,
        user.email.toLowerCase(),
        user.name,
        user.password_hash,
        user.role,
        user.phone || null,
        user.company || null,
        user.google_id || null,
        user.avatar_url || null,
        user.suspended || 0
      ]
    );
  } catch (err: any) {
    console.error('[MySQL] Lỗi sync user:', err.message);
  }
}

export async function syncSessionToMySQL(session: MySQLSession): Promise<void> {
  if (!isConnected || !pool) return;
  try {
    await pool.query(
      `INSERT INTO sessions (token_hash, user_id, expires_at)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at)`,
      [session.token_hash, session.user_id, session.expires_at]
    );
  } catch (err: any) {
    console.error('[MySQL] Lỗi sync session:', err.message);
  }
}

export async function deleteSessionFromMySQL(token_hash: string): Promise<void> {
  if (!isConnected || !pool) return;
  try {
    await pool.query('DELETE FROM sessions WHERE token_hash = ?', [token_hash]);
  } catch (err: any) {
    console.error('[MySQL] Lỗi delete session:', err.message);
  }
}

export async function deleteUserSessionsFromMySQL(user_id: string): Promise<void> {
  if (!isConnected || !pool) return;
  try {
    await pool.query('DELETE FROM sessions WHERE user_id = ?', [user_id]);
  } catch (err: any) {
    console.error('[MySQL] Lỗi delete user sessions:', err.message);
  }
}

export async function logAuditToMySQL(
  id: string,
  actor_id: string | null,
  action: string,
  target_type: string | null,
  target_id: string | null,
  ip_address: string | null
): Promise<void> {
  if (!isConnected || !pool) return;
  try {
    await pool.query(
      `INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, actor_id, action, target_type, target_id, ip_address]
    );
  } catch (err: any) {
    console.error('[MySQL] Lỗi ghi audit log:', err.message);
  }
}
