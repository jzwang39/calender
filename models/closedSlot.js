const db = require('../config/database');

class ClosedSlot {
  static create(date, timeSlot, reason, createdBy, callback) {
    const sql = 'INSERT INTO closed_slots (date, time_slot, reason, created_by) VALUES (?, ?, ?, ?)';
    db.run(sql, [date, timeSlot, reason, createdBy], function(err) {
      callback(err, this.lastID);
    });
  }

  static findByDate(date, callback) {
    const sql = 'SELECT * FROM closed_slots WHERE date = ?';
    db.all(sql, [date], callback);
  }

  static findAll(callback) {
    const sql = `
      SELECT cs.*, u.name as created_by_name 
      FROM closed_slots cs 
      JOIN users u ON cs.created_by = u.id 
      ORDER BY cs.date ASC, cs.time_slot ASC
    `;
    db.all(sql, callback);
  }

  static delete(id, callback) {
    const sql = 'DELETE FROM closed_slots WHERE id = ?';
    db.run(sql, [id], callback);
  }

  static deleteByDateAndTimeSlot(date, timeSlot, callback) {
    const sql = 'DELETE FROM closed_slots WHERE date = ? AND time_slot = ?';
    db.run(sql, [date, timeSlot], callback);
  }

  static isSlotClosed(date, timeSlot, callback) {
    const sql = 'SELECT COUNT(*) as count FROM closed_slots WHERE date = ? AND time_slot = ?';
    db.get(sql, [date, timeSlot], (err, row) => {
      if (err) return callback(err);
      callback(null, row.count > 0);
    });
  }

  // 获取未来两周内的所有关闭时段
  static findNextTwoWeeks(callback) {
    const sql = `
      SELECT cs.*, u.name as created_by_name 
      FROM closed_slots cs 
      JOIN users u ON cs.created_by = u.id 
      WHERE date >= date('now') AND date <= date('now', '+14 days')
      ORDER BY cs.date ASC, cs.time_slot ASC
    `;
    db.all(sql, callback);
  }
}

module.exports = ClosedSlot;