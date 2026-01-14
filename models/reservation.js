const db = require('../config/database');

class Reservation {
  static create(userId, date, timeSlot, containerNumber, packingList, callback) {
    const sql = 'INSERT INTO reservations (user_id, date, time_slot, container_number, packing_list) VALUES (?, ?, ?, ?, ?)';
    db.run(sql, [userId, date, timeSlot, containerNumber, packingList], function(err) {
      callback(err, this.lastID);
    });
  }

  static findByUserId(userId, callback) {
    const sql = 'SELECT * FROM reservations WHERE user_id = ? ORDER BY date ASC, time_slot ASC';
    db.all(sql, [userId], callback);
  }

  static findByDate(date, callback) {
    const sql = 'SELECT * FROM reservations WHERE date = ?';
    db.all(sql, [date], callback);
  }

  static findAll(callback) {
    const sql = `
      SELECT r.*, u.name, u.username, u.contact 
      FROM reservations r 
      JOIN users u ON r.user_id = u.id 
      ORDER BY r.date ASC, r.time_slot ASC
    `;
    db.all(sql, callback);
  }

  static findAllWithUserInfo(callback) {
    const sql = `
      SELECT r.*, u.name, u.username, u.contact, u.role 
      FROM reservations r 
      JOIN users u ON r.user_id = u.id 
      ORDER BY r.date ASC, r.time_slot ASC
    `;
    db.all(sql, callback);
  }

  static delete(id, callback) {
    // 将预约状态设置为取消，而不是直接删除
    const sql = 'UPDATE reservations SET status = ? WHERE id = ?';
    db.run(sql, ['cancelled', id], callback);
  }

  static isSlotAvailable(date, timeSlot, callback) {
    // 首先检查是否是周六或周日
    const slotDate = new Date(date);
    const dayOfWeek = slotDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // 周日(0)或周六(6)不可预约
      return callback(null, false);
    }
    
    // 然后检查是否有活跃的预约
    const checkReservationSql = 'SELECT COUNT(*) as count FROM reservations WHERE date = ? AND time_slot = ? AND status = ?';
    db.get(checkReservationSql, [date, timeSlot, 'active'], (err, row) => {
      if (err) return callback(err);
      if (row.count > 0) return callback(null, false);
      
      // 最后检查是否被关闭
      const checkClosedSlotSql = 'SELECT COUNT(*) as count FROM closed_slots WHERE date = ? AND time_slot = ?';
      db.get(checkClosedSlotSql, [date, timeSlot], (err, row) => {
        if (err) return callback(err);
        callback(null, row.count === 0);
      });
    });
  }
}

module.exports = Reservation;