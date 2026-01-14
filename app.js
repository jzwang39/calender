const express = require('express');
const path = require('path');
const session = require('express-session');
const dotenv = require('dotenv');
const db = require('./config/database');

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();

// 设置视图引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 解析请求体
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 配置会话
app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // 在生产环境中应设置为true
}));

// 引入路由
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const operatorRoutes = require('./routes/operator');
const clientRoutes = require('./routes/client');

// 使用路由
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/operator', operatorRoutes);
app.use('/client', clientRoutes);

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器正在运行在 http://localhost:${PORT}`);
});

module.exports = app;