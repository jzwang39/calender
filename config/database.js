const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接数据库
const dbPath = path.resolve(__dirname, '../database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('无法连接到数据库:', err.message);
  } else {
    console.log('成功连接到SQLite数据库');
    initializeDatabase();
  }
});

// 初始化数据库表
function initializeDatabase() {
  // 创建用户表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      contact TEXT
    )
  `, (err) => {
    if (err) console.error('创建用户表失败:', err.message);
  });

  // 创建预约表
  db.run(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) console.error('创建预约表失败:', err.message);
  });

  // 创建关闭时段表
  db.run(`
    CREATE TABLE IF NOT EXISTS closed_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      reason TEXT,
      created_by INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id),
      UNIQUE(date, time_slot)
    )
  `, (err) => {
    if (err) console.error('创建关闭时段表失败:', err.message);
  });

  // 初始化测试数据
  initializeTestData();
}

// 初始化测试数据
function initializeTestData() {
  // 检查是否已有用户数据
  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (err) return;
    
    if (row.count === 0) {
      // 创建测试用户
      const users = [
        // 仓库管理员
        { username: 'admin', password: '$2b$10$8a1UQvQ9n9UQ2FzGzK4zK4u3x3y3z3w3v3u3t3s3r3q3p3o3n3m3l3k', role: 'admin', name: '仓库管理员', contact: '13800138000' },
        // 运营人员
        { username: 'operator', password: '$2b$10$8a1UQvQ9n9UQ2FzGzK4zK4u3x3y3z3w3v3u3t3s3r3q3p3o3n3m3l3k', role: 'operator', name: '运营人员', contact: '13900139000' },
        // 客户
        { username: 'client1', password: '$2b$10$8a1UQvQ9n9UQ2FzGzK4zK4u3x3y3z3w3v3u3t3s3r3q3p3o3n3m3l3k', role: 'client', name: '客户1', contact: '13700137001' },
        { username: 'client2', password: '$2b$10$8a1UQvQ9n9UQ2FzGzK4zK4u3x3y3z3w3v3u3t3s3r3q3p3o3n3m3l3k', role: 'client', name: '客户2', contact: '13700137002' }
      ];

      const stmt = db.prepare('INSERT INTO users (username, password, role, name, contact) VALUES (?, ?, ?, ?, ?)');
      users.forEach(user => {
        stmt.run(user.username, user.password, user.role, user.name, user.contact);
      });
      stmt.finalize();

      console.log('测试用户数据已初始化');
    }
  });
}

module.exports = db;