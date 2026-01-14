const db = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  static findByUsername(username, callback) {
    const sql = 'SELECT * FROM users WHERE username = ?';
    db.get(sql, [username], callback);
  }

  static findById(id, callback) {
    const sql = 'SELECT * FROM users WHERE id = ?';
    db.get(sql, [id], callback);
  }

  static comparePassword(plainPassword, hashedPassword, callback) {
    bcrypt.compare(plainPassword, hashedPassword, callback);
  }

  static updatePassword(id, newPassword, callback) {
    bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
      if (err) return callback(err);
      const sql = 'UPDATE users SET password = ? WHERE id = ?';
      db.run(sql, [hashedPassword, id], callback);
    });
  }

  static getAllUsers(callback) {
    const sql = 'SELECT * FROM users';
    db.all(sql, callback);
  }

  static getUsersByRole(role, callback) {
    const sql = 'SELECT * FROM users WHERE role = ?';
    db.all(sql, [role], callback);
  }
}

module.exports = User;