const express = require('express');
const router = express.Router();
const { isLoggedIn, isAdmin } = require('../middlewares/auth');
const Reservation = require('../models/reservation');
const ClosedSlot = require('../models/closedSlot');

// 管理员仪表盘
router.get('/dashboard', isLoggedIn, isAdmin, (req, res) => {
  Reservation.findAll((err, reservations) => {
    if (err) {
      return res.status(500).send('获取预约信息失败');
    }
    
    res.render('admin/dashboard', {
      user: req.session.user,
      reservations: reservations
    });
  });
});

// 删除预约
router.post('/reservation/delete/:id', isLoggedIn, isAdmin, (req, res) => {
  const id = req.params.id;
  Reservation.delete(id, (err) => {
    if (err) {
      return res.status(500).send('删除预约失败');
    }
    res.redirect('/admin/dashboard');
  });
});

// 获取关闭时段管理页面
router.get('/closed-slots', isLoggedIn, isAdmin, (req, res) => {
  ClosedSlot.findNextTwoWeeks((err, closedSlots) => {
    if (err) {
      return res.status(500).send('获取关闭时段信息失败');
    }
    // 从session中提取消息并传递给模板
    const success = req.session.success;
    const error = req.session.error;
    // 清除session中的消息
    delete req.session.success;
    delete req.session.error;
    
    // 生成未来两周的日期（过滤掉周六和周日）
    const dates = [];
    const today = new Date();
    const timeSlots = ['09:00-12:00', '13:00-16:00'];
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      // 跳过周六（6）和周日（0）
      if (date.getDay() === 0 || date.getDay() === 6) {
        continue;
      }
      
      const dateString = date.toISOString().split('T')[0];
      dates.push(dateString);
    }
    
    // 将关闭时段转换为日期-时间段的映射，方便模板使用
    const closedSlotsMap = {};
    closedSlots.forEach(slot => {
      if (!closedSlotsMap[slot.date]) {
        closedSlotsMap[slot.date] = [];
      }
      closedSlotsMap[slot.date].push(slot);
    });
    
    res.render('admin/closed-slots', {
      user: req.session.user,
      closedSlots: closedSlots,
      closedSlotsMap: closedSlotsMap,
      dates: dates,
      timeSlots: timeSlots,
      success: success,
      error: error
    });
  });
});

// 关闭预约时段
router.post('/closed-slots/add', isLoggedIn, isAdmin, (req, res) => {
  const { date, time_slot, reason } = req.body;
  ClosedSlot.create(date, time_slot, reason, req.session.user.id, (err) => {
    if (err) {
      console.error('关闭时段失败:', err);
      req.session.error = '关闭时段失败，该时段可能已被关闭或无效';
      return res.redirect('/admin/closed-slots');
    }
    req.session.success = '预约时段已成功关闭';
    res.redirect('/admin/closed-slots');
  });
});

// 取消关闭预约时段
router.post('/closed-slots/delete/:id', isLoggedIn, isAdmin, (req, res) => {
  const id = req.params.id;
  ClosedSlot.delete(id, (err) => {
    if (err) {
      return res.status(500).send('取消关闭时段失败');
    }
    req.session.success = '预约时段已成功取消关闭';
    res.redirect('/admin/closed-slots');
  });
});

// 获取可选时间段（用于客户端预约）
  router.get('/available-time-slots/:date', (req, res) => {
    const date = req.params.date;
    
    // 定义所有可能的时间段
    const allTimeSlots = [
      '09:00-12:00',
      '13:00-16:00'
    ];
  
  // 获取已预约的时间段
  Reservation.findByDate(date, (err, reservations) => {
    if (err) return res.json({ error: '获取预约信息失败' });
    
    const reservedSlots = reservations.map(r => r.time_slot);
    
    // 获取已关闭的时间段
    ClosedSlot.findByDate(date, (err, closedSlots) => {
      if (err) return res.json({ error: '获取关闭时段信息失败' });
      
      const closedSlotTimes = closedSlots.map(c => c.time_slot);
      
      // 计算可用时间段
      const availableSlots = allTimeSlots.filter(slot => 
        !reservedSlots.includes(slot) && !closedSlotTimes.includes(slot)
      );
      
      res.json({ availableSlots });
    });
  });
});

module.exports = router;