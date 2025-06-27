const db = require('../db');

//--------------------------------------------------------------------------
// Get all available dishes
exports.getAllDishes = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM dishes ORDER BY name, price';
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

//--------------------------------------------------------------------------
// Get dishes by name (pizza, pasta, salad)
exports.getDishesByName = (dishName) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM dishes WHERE name = ? ORDER BY price';
    db.all(sql, [dishName], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

//--------------------------------------------------------------------------
// Get specific dish by name and size
exports.getDishByNameAndSize = (dishName, size) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM dishes WHERE name = ? AND size = ?';
    db.get(sql, [dishName, size], (err, row) => {
      if (err) reject(err);
      else if (!row) resolve({ error: 'Dish not found' });
      else resolve(row);
    });
  });
};
