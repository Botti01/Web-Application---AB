const db = require('../db');

//--------------------------------------------------------------------------
// Get all ingredients with their dependencies and incompatibilities
exports.getAllIngredients = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT i.*,
             GROUP_CONCAT(DISTINCT dep.name) as dependencies,
             GROUP_CONCAT(DISTINCT CASE 
               WHEN inc_rel.ingredient1_id = i.id THEN inc2.name
               WHEN inc_rel.ingredient2_id = i.id THEN inc1.name
             END) as incompatibilities
      FROM ingredients i
      LEFT JOIN ingredient_dependencies id ON i.id = id.ingredient_id
      LEFT JOIN ingredients dep ON id.required_ingredient_id = dep.id
      LEFT JOIN ingredient_incompatibilities inc_rel ON (i.id = inc_rel.ingredient1_id OR i.id = inc_rel.ingredient2_id)
      LEFT JOIN ingredients inc1 ON inc_rel.ingredient1_id = inc1.id
      LEFT JOIN ingredients inc2 ON inc_rel.ingredient2_id = inc2.id
      GROUP BY i.id
      ORDER BY i.name
    `;
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else {
        // Process the results to format dependencies and incompatibilities
        const ingredients = rows.map(row => ({
          ...row,
          dependencies: row.dependencies ? row.dependencies.split(',') : [],
          incompatibilities: row.incompatibilities ? 
            row.incompatibilities.split(',').filter(inc => inc && inc !== row.name) : []
        }));
        resolve(ingredients);
      }
    });
  });
};

//--------------------------------------------------------------------------
// Get ingredient by ID
exports.getIngredientById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM ingredients WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err) reject(err);
      else if (!row) resolve({ error: 'Ingredient not found' });
      else resolve(row);
    });
  });
};

//--------------------------------------------------------------------------
// Get ingredients dependencies for a specific ingredient
exports.getIngredientDependencies = (ingredientId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT i.* FROM ingredients i
      JOIN ingredient_dependencies id ON i.id = id.required_ingredient_id
      WHERE id.ingredient_id = ?
    `;
    db.all(sql, [ingredientId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

//--------------------------------------------------------------------------
// Get ingredients incompatibilities for a specific ingredient
exports.getIngredientIncompatibilities = (ingredientId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT i.* FROM ingredients i
      JOIN ingredient_incompatibilities inc ON 
        (i.id = inc.ingredient1_id AND inc.ingredient2_id = ?) OR
        (i.id = inc.ingredient2_id AND inc.ingredient1_id = ?)
    `;
    db.all(sql, [ingredientId, ingredientId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

//--------------------------------------------------------------------------
// Update ingredient availability (when an order is placed or cancelled)
exports.updateIngredientAvailability = (ingredientId, newAvailability) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE ingredients SET current_availability = ? WHERE id = ?';
    db.run(sql, [newAvailability, ingredientId], function(err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
};

//--------------------------------------------------------------------------
// Check if ingredients are available for an order
exports.checkIngredientsAvailability = (ingredientIds) => {
  return new Promise((resolve, reject) => {
    if (ingredientIds.length === 0) {
      resolve([]);
      return;
    }
    
    const placeholders = ingredientIds.map(() => '?').join(',');
    const sql = `
      SELECT id, name, current_availability 
      FROM ingredients 
      WHERE id IN (${placeholders}) AND current_availability IS NOT NULL
    `;
    
    db.all(sql, ingredientIds, (err, rows) => {
      if (err) reject(err);
      else {
        const unavailable = rows.filter(row => row.current_availability <= 0);
        resolve(unavailable);
      }
    });
  });
};
