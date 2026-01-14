const express = require('express');
const router = express.Router();
const { isLoggedIn, isOperator } = require('../middlewares/auth');
const Reservation = require('../models/reservation');
const User = require('../models/user');

// 运营人员仪表盘
router.get('/dashboard', isLoggedIn, isOperator, (req, res) => {
  Reservation.findAllWithUserInfo((err, reservations) => {
    if (err) {
      return res.status(500).send('获取预约信息失败');
    }
    
    // 处理日历视图所需数据
    const dates = [];
    const timeSlots = ['09:00-10:00', '10:00-11:00', '11:00-12:00', '13:00-14:00', '14:00-15:00', '15:00-16:00'];
    const bookedSlots = {};
    const cancelledSlots = {};
    
    // 生成两周内的工作日日期
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // 只添加工作日
      if (date.getDay() >= 1 && date.getDay() <= 5) {
        const dateStr = date.toISOString().split('T')[0];
        dates.push(dateStr);
        bookedSlots[dateStr] = [];
        cancelledSlots[dateStr] = [];
      }
    }
    
    // 处理预约数据
    reservations.forEach(reservation => {
      const date = reservation.date;
      const timeSlot = reservation.time_slot;
      
      if (!bookedSlots[date]) {
        bookedSlots[date] = [];
      }
      
      if (!cancelledSlots[date]) {
        cancelledSlots[date] = [];
      }
      
      if (reservation.status === 'cancelled') {
        cancelledSlots[date].push(timeSlot);
      } else {
        bookedSlots[date].push(timeSlot);
      }
    });
    
    res.render('operator/dashboard', {
      user: req.session.user,
      reservations: reservations,
      dates: dates,
      timeSlots: timeSlots,
      bookedSlots: bookedSlots,
      cancelledSlots: cancelledSlots
    });
  });
});

// 获取所有客户信息
router.get('/clients', isLoggedIn, isOperator, (req, res) => {
  User.getUsersByRole('client', (err, clients) => {
    if (err) {
      return res.status(500).send('获取客户信息失败');
    }
    
    res.render('operator/clients', {
      user: req.session.user,
      clients: clients
    });
  });
});

module.exports = router;