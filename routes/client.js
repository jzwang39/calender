const express = require('express');
const router = express.Router();
const { isLoggedIn, isClient } = require('../middlewares/auth');
const Reservation = require('../models/reservation');
const ClosedSlot = require('../models/closedSlot');
const multer = require('multer');
const path = require('path');

// 配置multer存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'packing_list-' + uniqueSuffix + ext);
  }
});

// 创建multer实例
const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // 只接受doc, docx, pdf文件
    const allowedTypes = /\.(doc|docx|pdf)$/i;
    if (allowedTypes.test(path.extname(file.originalname))) {
      return cb(null, true);
    }
    cb(new Error('只支持.doc, .docx, .pdf格式的文件'));
  }
});

// 生成两周内的日期列表（过滤掉周六和周日）
function generateTwoWeeksDates() {
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // 跳过周六（6）和周日（0）
    if (date.getDay() === 0 || date.getDay() === 6) {
      continue;
    }
    
    // 格式化日期为YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    dates.push(`${year}-${month}-${day}`);
  }
  
  return dates;
}

// 客户预约页面
router.get('/reservation', isLoggedIn, isClient, (req, res) => {
  const dates = generateTwoWeeksDates();
  const timeSlots = ['09:00-12:00', '13:00-16:00'];
  
  // 获取所有已预约的时段
  Reservation.findAll((err, allReservations) => {
    if (err) {
      return res.status(500).send('获取预约信息失败');
    }
    
    // 构建已预约时段和已取消时段的映射
    const bookedSlots = {};
    const cancelledSlots = {};
    allReservations.forEach(reservation => {
      if (!bookedSlots[reservation.date]) {
        bookedSlots[reservation.date] = [];
      }
      if (!cancelledSlots[reservation.date]) {
        cancelledSlots[reservation.date] = [];
      }
      
      if (reservation.status === 'active') {
        bookedSlots[reservation.date].push(reservation.time_slot);
      } else if (reservation.status === 'cancelled') {
        cancelledSlots[reservation.date].push(reservation.time_slot);
      }
    });
    
    // 获取所有关闭的时段
    ClosedSlot.findAll((err, allClosedSlots) => {
      if (err) {
        return res.status(500).send('获取关闭时段信息失败');
      }
      
      // 构建关闭时段的映射
      const closedSlots = {};
      allClosedSlots.forEach(slot => {
        if (!closedSlots[slot.date]) {
          closedSlots[slot.date] = [];
        }
        closedSlots[slot.date].push(slot.time_slot);
      });
      
      // 获取当前用户的预约
      Reservation.findByUserId(req.session.user.id, (err, userReservations) => {
        if (err) {
          return res.status(500).send('获取您的预约信息失败');
        }
        
        res.render('client/reservation', {
          user: req.session.user,
          dates: dates,
          timeSlots: timeSlots,
          bookedSlots: bookedSlots,
          closedSlots: closedSlots,
          cancelledSlots: cancelledSlots,
          userReservations: userReservations
        });
      });
    });
  });
});

// 提交预约
router.post('/reservation/create', isLoggedIn, isClient, upload.single('packing_list'), (req, res) => {
  const { date, time_slot, container_number } = req.body;
  const userId = req.session.user.id;
  const packing_list = req.file ? req.file.filename : null;
  
  // 检查时段是否可用
  Reservation.isSlotAvailable(date, time_slot, (err, available) => {
    if (err) {
      return res.status(500).send('检查预约时段失败');
    }
    
    if (!available) {
      return res.status(400).send('该时段已被预约，请选择其他时段');
    }
    
    // 创建预约
    Reservation.create(userId, date, time_slot, container_number, packing_list, (err, reservationId) => {
      if (err) {
        return res.status(500).send('创建预约失败');
      }
      res.redirect('/client/reservation');
    });
  });
});

// 取消预约
router.post('/reservation/cancel/:id', isLoggedIn, isClient, (req, res) => {
  const id = req.params.id;
  Reservation.delete(id, (err) => {
    if (err) {
      return res.status(500).send('取消预约失败');
    }
    res.redirect('/client/reservation');
  });
});

module.exports = router;