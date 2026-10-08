import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { randomUUID, randomBytes, scryptSync } from 'node:crypto';
import { db } from './db.js';

const rl=createInterface({input,output});
try {
  const email=(await rl.question('Owner email: ')).trim().toLowerCase();
  const name=(await rl.question('Owner name: ')).trim();
  const password=await rl.question('Password (minimum 12 characters): ');
  if(!email.includes('@')||name.length<2||password.length<12)throw new Error('Email, name or password is invalid.');
  const salt=randomBytes(16).toString('hex'); const hash=`scrypt:${salt}:${scryptSync(password,salt,64).toString('hex')}`;
  const existing=db.prepare('SELECT id FROM users WHERE email=?').get(email) as any;
  if(existing) db.prepare("UPDATE users SET role='admin',name=?,password_hash=?,suspended=0 WHERE id=?").run(name,hash,existing.id);
  else db.prepare("INSERT INTO users(id,email,name,password_hash,role) VALUES(?,?,?,?, 'admin')").run(randomUUID(),email,name,hash);
  console.log(`Admin account ready for ${email}.`);
} finally { rl.close(); }
