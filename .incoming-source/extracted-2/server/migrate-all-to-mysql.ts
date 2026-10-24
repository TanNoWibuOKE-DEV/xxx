import { db } from './db.js';
import { initMySQL, syncUserToMySQL, syncSessionToMySQL } from './mysql.js';

async function migrate() {
  console.log('🔄 Bắt đầu kiểm tra và chuyển dữ liệu người dùng sang MariaDB...');
  const connected = await initMySQL();
  if (!connected) {
    console.error('❌ Không thể kết nối MariaDB. Vui lòng kiểm tra lại MYSQL_PASSWORD trong .env.');
    process.exit(1);
  }

  const users = db.prepare('SELECT * FROM users').all() as any[];
  console.log(`📦 Tìm thấy ${users.length} người dùng trong SQLite. Đang đồng bộ sang MariaDB...`);

  for (const u of users) {
    await syncUserToMySQL(u);
    console.log(`  ✓ Đã đồng bộ tài khoản: ${u.email} (${u.role})`);
  }

  const sessions = db.prepare('SELECT * FROM sessions WHERE expires_at > CURRENT_TIMESTAMP').all() as any[];
  console.log(`🔑 Đồng bộ ${sessions.length} phiên đăng nhập hoạt động...`);
  for (const s of sessions) {
    await syncSessionToMySQL(s);
  }

  console.log('🎉 Hoàn tất đồng bộ dữ liệu người dùng (Admin & Khách hàng) sang MariaDB!');
  process.exit(0);
}

migrate().catch(e => {
  console.error('Lỗi khi migrate:', e);
  process.exit(1);
});
