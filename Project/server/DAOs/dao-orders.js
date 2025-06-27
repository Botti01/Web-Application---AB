const db = require('../db');

//--------------------------------------------------------------------------
// Create a new order
exports.createOrder = (order) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO orders (user_id, dish_name, dish_size, total_price)
      VALUES (?, ?, ?, ?)
    `;
    db.run(sql, [order.user_id, order.dish_name, order.dish_size, order.total_price], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

//--------------------------------------------------------------------------
// Add ingredients to an order
exports.addOrderIngredients = (orderId, ingredientIds) => {
  return new Promise((resolve, reject) => {
    if (ingredientIds.length === 0) {
      resolve();
      return;
    }
    
    const sql = 'INSERT INTO order_ingredients (order_id, ingredient_id) VALUES (?, ?)';
    const insertPromises = ingredientIds.map(ingredientId => {
      return new Promise((res, rej) => {
        db.run(sql, [orderId, ingredientId], function(err) {
          if (err) rej(err);
          else res();
        });
      });
    });
    
    Promise.all(insertPromises)
      .then(() => resolve())
      .catch(err => reject(err));
  });
};

//--------------------------------------------------------------------------
// Get orders by user ID
exports.getOrdersByUserId = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT o.*, 
             GROUP_CONCAT(i.name) as ingredients,
             GROUP_CONCAT(i.id) as ingredient_ids,
             GROUP_CONCAT(i.price) as ingredient_prices
      FROM orders o
      LEFT JOIN order_ingredients oi ON o.id = oi.order_id
      LEFT JOIN ingredients i ON oi.ingredient_id = i.id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.order_date DESC
    `;
    db.all(sql, [userId], (err, rows) => {
      if (err) reject(err);
      else {
        const orders = rows.map(row => ({
          ...row,
          ingredients: row.ingredients ? row.ingredients.split(',') : [],
          ingredient_ids: row.ingredient_ids ? row.ingredient_ids.split(',').map(Number) : [],
          ingredient_prices: row.ingredient_prices ? row.ingredient_prices.split(',').map(Number) : []
        }));
        resolve(orders);
      }
    });
  });
};

//--------------------------------------------------------------------------
// Get order by ID with ingredients
exports.getOrderById = (orderId, userId = null) => {
  return new Promise((resolve, reject) => {
    let sql = `
      SELECT o.*, 
             GROUP_CONCAT(i.name) as ingredients,
             GROUP_CONCAT(i.id) as ingredient_ids,
             GROUP_CONCAT(i.price) as ingredient_prices
      FROM orders o
      LEFT JOIN order_ingredients oi ON o.id = oi.order_id
      LEFT JOIN ingredients i ON oi.ingredient_id = i.id
      WHERE o.id = ?
    `;
    let params = [orderId];
    
    if (userId !== null) {
      sql += ' AND o.user_id = ?';
      params.push(userId);
    }
    
    sql += ' GROUP BY o.id';
    
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else if (!row) resolve({ error: 'Order not found' });
      else {
        const order = {
          ...row,
          ingredients: row.ingredients ? row.ingredients.split(',') : [],
          ingredient_ids: row.ingredient_ids ? row.ingredient_ids.split(',').map(Number) : [],
          ingredient_prices: row.ingredient_prices ? row.ingredient_prices.split(',').map(Number) : []
        };
        resolve(order);
      }
    });
  });
};

//--------------------------------------------------------------------------
// Delete an order (for cancellation)
exports.deleteOrder = (orderId, userId) => {
  return new Promise((resolve, reject) => {
    // First get the order to return ingredient info for availability restoration
    const getOrderSql = `
      SELECT oi.ingredient_id 
      FROM order_ingredients oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.id = ? AND o.user_id = ?
    `;
    
    db.all(getOrderSql, [orderId, userId], (err, ingredients) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Delete order (cascade will delete order_ingredients)
      const deleteSql = 'DELETE FROM orders WHERE id = ? AND user_id = ?';
      db.run(deleteSql, [orderId, userId], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes, ingredients: ingredients.map(i => i.ingredient_id) });
      });
    });
  });
};

//--------------------------------------------------------------------------
// Get all orders for a specific user (order history)
exports.getOrderHistoryByUserId = (userId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT o.*, 
                         GROUP_CONCAT(i.name) as ingredients,
                         GROUP_CONCAT(i.id) as ingredient_ids,
                         GROUP_CONCAT(i.price) as ingredient_prices
            FROM orders o
            LEFT JOIN order_ingredients oi ON o.id = oi.order_id
            LEFT JOIN ingredients i ON oi.ingredient_id = i.id
            WHERE o.user_id = ?
            GROUP BY o.id
            ORDER BY o.order_date DESC
        `;
        db.all(sql, [userId], (err, rows) => {
            if (err) reject(err);
            else {
                const orders = rows.map(row => ({
                    ...row,
                    ingredients: row.ingredients ? row.ingredients.split(',') : [],
                    ingredient_ids: row.ingredient_ids ? row.ingredient_ids.split(',').map(Number) : [],
                    ingredient_prices: row.ingredient_prices ? row.ingredient_prices.split(',').map(Number) : []
                }));
                resolve(orders);
            }
        });
    });
};

//--------------------------------------------------------------------------
// Remove a specific ingredient from an order
exports.removeOrderIngredient = (orderId, ingredientId, userId) => {
  return new Promise((resolve, reject) => {
    // First verify the order belongs to the user
    const checkSql = 'SELECT id FROM orders WHERE id = ? AND user_id = ?';
    db.get(checkSql, [orderId, userId], (err, order) => {
      if (err) {
        reject(err);
        return;
      }
      if (!order) {
        resolve({ error: 'Order not found or unauthorized' });
        return;
      }
      
      // Remove the ingredient from the order
      const deleteSql = 'DELETE FROM order_ingredients WHERE order_id = ? AND ingredient_id = ?';
      db.run(deleteSql, [orderId, ingredientId], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  });
};

//--------------------------------------------------------------------------
// Remove all ingredients from an order (useful for order modification)
exports.removeAllOrderIngredients = (orderId, userId) => {
  return new Promise((resolve, reject) => {
    // First verify the order belongs to the user
    const checkSql = 'SELECT id FROM orders WHERE id = ? AND user_id = ?';
    db.get(checkSql, [orderId, userId], (err, order) => {
      if (err) {
        reject(err);
        return;
      }
      if (!order) {
        resolve({ error: 'Order not found or unauthorized' });
        return;
      }
      
      // Get all ingredients to return for availability restoration
      const getIngredientsSql = 'SELECT ingredient_id FROM order_ingredients WHERE order_id = ?';
      db.all(getIngredientsSql, [orderId], (err, ingredients) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Remove all ingredients from the order
        const deleteSql = 'DELETE FROM order_ingredients WHERE order_id = ?';
        db.run(deleteSql, [orderId], function(err) {
          if (err) reject(err);
          else resolve({ 
            changes: this.changes, 
            ingredients: ingredients.map(i => i.ingredient_id) 
          });
        });
      });
    });
  });
};
