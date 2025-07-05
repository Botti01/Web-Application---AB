const db = require('../db');
const crypto = require('crypto');

//--------------------------------------------------------------------------
// Get user by email and password (for authentication)
exports.getUser = (email, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.get(sql, [email], (err, row) => {
      if (err) reject(err);
      else if (!row) resolve(false);
      else {
        // Check password
        const salt = row.salt;
        crypto.scrypt(password, salt, 32, (err, hashedPassword) => {
          if (err) reject(err);
          else {
            const passwordHex = hashedPassword.toString('hex');
            if (row.hash === passwordHex) {
              // Return user info without sensitive data for the session
              resolve({
                id: row.id,
                username: row.email,
                name: row.name,
                secret: row.otp_secret // needed for TOTP
              });
            } else {
              resolve(false);
            }
          }
        });
      }
    });
  });
};

//--------------------------------------------------------------------------
// Get user by ID
exports.getUserById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id, email, name, otp_secret FROM users WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err) reject(err);
      else if (!row) resolve({ error: 'User not found' });
      else resolve({
        id: row.id,
        username: row.email,
        name: row.name,
        secret: row.otp_secret
      });
    });
  });
};

