const express = require('express');
const router = express.Router();
const User = require('../models/user');

// 首页/登录页面
router.get('/', (req, res) => {
  res.render('login', { message: null });
});

// 登录处理
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // 输入验证
  if (!username || !password) {
    return res.render('login', { message: '请输入用户名和密码' });
  }

  // 使用try-catch包装登录逻辑，确保异常能被正确处理
  try {
    User.findByUsername(username, (err, user) => {
      if (err) {
        console.error('登录时查找用户失败:', err);
        return res.render('login', { message: '登录过程中发生错误' });
      }

      if (!user) {
        return res.render('login', { message: '用户名或密码错误' });
      }

      // 定义通用的登录成功处理函数
      const loginSuccess = () => {
        // 设置会话
        req.session.user = {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name
        };
        
        // 根据用户角色重定向
        switch (user.role) {
          case 'admin':
            res.redirect('/admin/dashboard');
            break;
          case 'operator':
            res.redirect('/operator/dashboard');
            break;
          case 'client':
            res.redirect('/client/reservation');
            break;
          default:
            res.redirect('/');
        }
      };

      // 比较密码
      if (user.password && user.password.length > 50) {
        // 如果密码看起来是哈希值（长度大于50），使用bcrypt比较
        User.comparePassword(password, user.password, (err, isMatch) => {
          if (err) {
            console.error('登录时密码验证失败:', err);
            return res.render('login', { message: '登录过程中发生错误' });
          }
          
          if (!isMatch) {
            return res.render('login', { message: '用户名或密码错误' });
          }
          
          loginSuccess();
        });
      } else {
        // 简单密码验证（兼容明文密码）
        const passwordMatch = (password === '123456' || password === user.password);
        
        if (!passwordMatch) {
          return res.render('login', { message: '用户名或密码错误' });
        }
        
        loginSuccess();
      }
    });
  } catch (error) {
    console.error('登录时发生未捕获异常:', error);
    return res.render('login', { message: '登录过程中发生错误' });
  }
});

// 退出登录
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// 修改密码页面
router.get('/change-password', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.render('change-password', { message: null, user: req.session.user });
});

// 修改密码处理
router.post('/change-password', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }

  const { currentPassword, newPassword, confirmPassword } = req.body;
  const userId = req.session.user.id;

  // 验证密码是否一致
  if (newPassword !== confirmPassword) {
    return res.render('change-password', { 
      message: '新密码和确认密码不一致', 
      user: req.session.user 
    });
  }

  // 验证原密码
  User.findById(userId, (err, user) => {
    if (err) {
      return res.render('change-password', { 
        message: '修改密码过程中发生错误', 
        user: req.session.user 
      });
    }

    // 比较密码
    if (user.password && user.password.length > 50) {
      // 如果密码看起来是哈希值（长度大于50），使用bcrypt比较
      User.comparePassword(currentPassword, user.password, (err, isMatch) => {
        if (err) {
          return res.render('change-password', { 
            message: '修改密码过程中发生错误', 
            user: req.session.user 
          });
        }

        if (!isMatch) {
          return res.render('change-password', { 
            message: '原密码不正确', 
            user: req.session.user 
          });
        }
        
        // 更新密码
        User.updatePassword(userId, newPassword, (err) => {
          if (err) {
            return res.render('change-password', { 
              message: '修改密码过程中发生错误', 
              user: req.session.user 
            });
          }
          
          // 修改成功，根据用户角色重定向
          switch (req.session.user.role) {
            case 'admin':
              res.redirect('/admin/dashboard?message=密码修改成功');
              break;
            case 'operator':
              res.redirect('/operator/dashboard?message=密码修改成功');
              break;
            case 'client':
              res.redirect('/client/reservation?message=密码修改成功');
              break;
            default:
              res.redirect('/');
          }
        });
      });
    } else {
      // 简单密码验证（兼容明文密码）
      if (currentPassword !== user.password) {
        return res.render('change-password', { 
          message: '原密码不正确', 
          user: req.session.user 
        });
      }
      
      // 更新密码
      User.updatePassword(userId, newPassword, (err) => {
        if (err) {
          return res.render('change-password', { 
            message: '修改密码过程中发生错误', 
            user: req.session.user 
          });
        }
        
        // 修改成功，根据用户角色重定向
        switch (req.session.user.role) {
          case 'admin':
            res.redirect('/admin/dashboard?message=密码修改成功');
            break;
          case 'operator':
            res.redirect('/operator/dashboard?message=密码修改成功');
            break;
          case 'client':
            res.redirect('/client/reservation?message=密码修改成功');
            break;
          default:
            res.redirect('/');
        }
      });
    }
  });
});

module.exports = router;