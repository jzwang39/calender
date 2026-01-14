// 检查用户是否登录
function isLoggedIn(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/');
  }
}

// 检查是否为仓库管理员
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    next();
  } else {
    res.status(403).send('您没有权限访问此页面');
  }
}

// 检查是否为运营人员
function isOperator(req, res, next) {
  if (req.session.user && req.session.user.role === 'operator') {
    next();
  } else {
    res.status(403).send('您没有权限访问此页面');
  }
}

// 检查是否为客户
function isClient(req, res, next) {
  if (req.session.user && req.session.user.role === 'client') {
    next();
  } else {
    res.status(403).send('您没有权限访问此页面');
  }
}

// 检查是否为管理员或运营人员
function isAdminOrOperator(req, res, next) {
  if (req.session.user && (req.session.user.role === 'admin' || req.session.user.role === 'operator')) {
    next();
  } else {
    res.status(403).send('您没有权限访问此页面');
  }
}

module.exports = {
  isLoggedIn,
  isAdmin,
  isOperator,
  isClient,
  isAdminOrOperator
};