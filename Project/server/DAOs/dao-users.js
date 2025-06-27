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
    const sql = 'SELECT id, email, name FROM users WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err) reject(err);
      else if (!row) resolve({ error: 'User not found' });
      else resolve(row);
    });
  });
};

//--------------------------------------------------------------------------
// Get all users (admin function)
exports.getAllUsers = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id, email, name FROM users ORDER BY name';
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

//--------------------------------------------------------------------------
// Create a new user (registration)
exports.createUser = (email, name, password, hasTotp = false) => {
  return new Promise((resolve, reject) => {
    // Generate salt and hash password
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 32, (err, hashedPassword) => {
      if (err) reject(err);
      else {
        const hash = hashedPassword.toString('hex');
        const otpSecret = hasTotp ? 'LXBSMDTMSP2I5XFXIYRGFVWSFI' : null;
        
        const sql = `
          INSERT INTO users (email, name, hash, salt, otp_secret)
          VALUES (?, ?, ?, ?, ?)
        `;
        db.run(sql, [email, name, hash, salt, otpSecret], function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
      }
    });
  });
};

//--------------------------------------------------------------------------
// Update user TOTP status
exports.updateUserTotp = (userId, hasTotp) => {
  return new Promise((resolve, reject) => {
    const otpSecret = hasTotp ? 'LXBSMDTMSP2I5XFXIYRGFVWSFI' : null;
    const sql = 'UPDATE users SET otp_secret = ? WHERE id = ?';
    db.run(sql, [otpSecret, userId], function(err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
};

