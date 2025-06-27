-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS order_ingredients;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS ingredient_incompatibilities;
DROP TABLE IF EXISTS ingredient_dependencies;
DROP TABLE IF EXISTS ingredients;
DROP TABLE IF EXISTS dishes;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    email   TEXT    UNIQUE NOT NULL,
    name    TEXT    NOT NULL,
    hash    TEXT    NOT NULL,  -- hashed password
    salt    TEXT    NOT NULL,  -- salt for password
    otp_secret TEXT  -- TOTP secret, NULL for users without TOTP
);

-- Base dishes table (pizza, pasta, salad)
CREATE TABLE dishes (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    name    TEXT NOT NULL,
    size    TEXT NOT NULL CHECK (size IN ('Small', 'Medium', 'Large')),
    price   REAL NOT NULL,
    max_ingredients INTEGER NOT NULL
);

-- Ingredients table
CREATE TABLE ingredients (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    name                    TEXT    UNIQUE NOT NULL,
    price                   REAL    NOT NULL,
    availability            INTEGER,  -- NULL means unlimited
    current_availability    INTEGER  -- tracks current available portions
);

-- Ingredient dependencies table (ingredient_id requires required_ingredient_id)
CREATE TABLE ingredient_dependencies (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    ingredient_id           INTEGER NOT NULL,
    required_ingredient_id  INTEGER NOT NULL,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
    FOREIGN KEY (required_ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
    UNIQUE(ingredient_id, required_ingredient_id)
);

-- Ingredient incompatibilities table (mutual incompatibilities)
CREATE TABLE ingredient_incompatibilities (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    ingredient1_id  INTEGER NOT NULL,
    ingredient2_id  INTEGER NOT NULL,
    FOREIGN KEY (ingredient1_id) REFERENCES ingredients(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient2_id) REFERENCES ingredients(id) ON DELETE CASCADE,
    CHECK (ingredient1_id < ingredient2_id),  -- prevent duplicates
    UNIQUE(ingredient1_id, ingredient2_id)
);

-- Orders table
CREATE TABLE orders (
    id          INTEGER     PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER     NOT NULL,
    dish_name   TEXT        NOT NULL,
    dish_size   TEXT        NOT NULL CHECK (dish_size IN ('Small', 'Medium', 'Large')),
    total_price REAL        NOT NULL,
    order_date  DATETIME    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Order ingredients table (many-to-many between orders and ingredients)
CREATE TABLE order_ingredients (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id        INTEGER NOT NULL,
    ingredient_id   INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
);

-- Insert base dishes with sizes and prices
INSERT INTO dishes (name, size, price, max_ingredients) VALUES
('pizza', 'Small', 5.0, 3),
('pizza', 'Medium', 7.0, 5),
('pizza', 'Large', 9.0, 7),
('pasta', 'Small', 5.0, 3),
('pasta', 'Medium', 7.0, 5),
('pasta', 'Large', 9.0, 7),
('salad', 'Small', 5.0, 3),
('salad', 'Medium', 7.0, 5),
('salad', 'Large', 9.0, 7);

-- Insert ingredients with initial availability
-- Note: current_availability will be adjusted after inserting sample orders
INSERT INTO ingredients (name, price, availability, current_availability) VALUES
('mozzarella', 1.00, 3, 3),
('tomatoes', 0.50, NULL, NULL),  -- unlimited
('mushrooms', 0.80, 3, 3),
('ham', 1.20, 2, 2),
('olives', 0.70, NULL, NULL),  -- unlimited
('tuna', 1.50, 2, 2),
('eggs', 1.00, NULL, NULL),  -- unlimited
('anchovies', 1.50, 1, 1),
('parmesan', 1.20, NULL, NULL),  -- unlimited
('carrots', 0.40, NULL, NULL),  -- unlimited
('potatoes', 0.30, NULL, NULL);  -- unlimited

-- Insert ingredient dependencies
-- tomatoes → olives
INSERT INTO ingredient_dependencies (ingredient_id, required_ingredient_id) VALUES
((SELECT id FROM ingredients WHERE name = 'tomatoes'), (SELECT id FROM ingredients WHERE name = 'olives'));

-- parmesan → mozzarella
INSERT INTO ingredient_dependencies (ingredient_id, required_ingredient_id) VALUES
((SELECT id FROM ingredients WHERE name = 'parmesan'), (SELECT id FROM ingredients WHERE name = 'mozzarella'));

-- mozzarella → tomatoes
INSERT INTO ingredient_dependencies (ingredient_id, required_ingredient_id) VALUES
((SELECT id FROM ingredients WHERE name = 'mozzarella'), (SELECT id FROM ingredients WHERE name = 'tomatoes'));

-- tuna → olives
INSERT INTO ingredient_dependencies (ingredient_id, required_ingredient_id) VALUES
((SELECT id FROM ingredients WHERE name = 'tuna'), (SELECT id FROM ingredients WHERE name = 'olives'));

-- Insert ingredient incompatibilities
-- eggs ↔ mushrooms (eggs id=7, mushrooms id=3, so 3 < 7)
INSERT INTO ingredient_incompatibilities (ingredient1_id, ingredient2_id) VALUES
((SELECT id FROM ingredients WHERE name = 'mushrooms'), (SELECT id FROM ingredients WHERE name = 'eggs'));

-- eggs ↔ tomatoes (eggs id=7, tomatoes id=2, so 2 < 7)
INSERT INTO ingredient_incompatibilities (ingredient1_id, ingredient2_id) VALUES
((SELECT id FROM ingredients WHERE name = 'tomatoes'), (SELECT id FROM ingredients WHERE name = 'eggs'));

-- ham ↔ mushrooms (ham id=4, mushrooms id=3, so 3 < 4)
INSERT INTO ingredient_incompatibilities (ingredient1_id, ingredient2_id) VALUES
((SELECT id FROM ingredients WHERE name = 'mushrooms'), (SELECT id FROM ingredients WHERE name = 'ham'));

-- olives ↔ anchovies (olives id=5, anchovies id=8, so 5 < 8)
INSERT INTO ingredient_incompatibilities (ingredient1_id, ingredient2_id) VALUES
((SELECT id FROM ingredients WHERE name = 'olives'), (SELECT id FROM ingredients WHERE name = 'anchovies'));

-- Password for all users is 'pwd'
INSERT INTO users (email, name, hash, salt, otp_secret) VALUES
('user1@test.com', 'User One', '15d3c4fca80fa608dcedeb65ac10eff78d20c88800d016369a3d2963742ea288', '72e4eeb14def3b21', 'LXBSMDTMSP2I5XFXIYRGFVWSFI'),
('user2@test.com', 'User Two', '15d3c4fca80fa608dcedeb65ac10eff78d20c88800d016369a3d2963742ea288', '72e4eeb14def3b21', 'LXBSMDTMSP2I5XFXIYRGFVWSFI'),
('user3@test.com', 'User Three', '15d3c4fca80fa608dcedeb65ac10eff78d20c88800d016369a3d2963742ea288', '72e4eeb14def3b21', 'LXBSMDTMSP2I5XFXIYRGFVWSFI'),
('u1@p.it', 'Test User', '15d3c4fca80fa608dcedeb65ac10eff78d20c88800d016369a3d2963742ea288', '72e4eeb14def3b21', 'LXBSMDTMSP2I5XFXIYRGFVWSFI');

-- Insert sample orders to meet exam requirements
-- User 1: 2 Small dishes
-- Order 1: Small pizza with mozzarella, tomatoes, olives
INSERT INTO orders (user_id, dish_name, dish_size, total_price, order_date) VALUES
(1, 'pizza', 'Small', 7.20, '2024-12-01 12:30:00');

INSERT INTO order_ingredients (order_id, ingredient_id) VALUES
(1, (SELECT id FROM ingredients WHERE name = 'mozzarella')),
(1, (SELECT id FROM ingredients WHERE name = 'tomatoes')),
(1, (SELECT id FROM ingredients WHERE name = 'olives'));

-- Order 2: Small pasta with ham, carrots
INSERT INTO orders (user_id, dish_name, dish_size, total_price, order_date) VALUES
(1, 'pasta', 'Small', 6.60, '2024-12-02 19:15:00');

INSERT INTO order_ingredients (order_id, ingredient_id) VALUES
(2, (SELECT id FROM ingredients WHERE name = 'ham')),
(2, (SELECT id FROM ingredients WHERE name = 'carrots'));

-- User 2: 1 Medium + 1 Large dish
-- Order 3: Medium salad with tuna, olives, carrots, potatoes
INSERT INTO orders (user_id, dish_name, dish_size, total_price, order_date) VALUES
(2, 'salad', 'Medium', 9.60, '2024-12-03 13:45:00');

INSERT INTO order_ingredients (order_id, ingredient_id) VALUES
(3, (SELECT id FROM ingredients WHERE name = 'tuna')),
(3, (SELECT id FROM ingredients WHERE name = 'olives')),
(3, (SELECT id FROM ingredients WHERE name = 'carrots')),
(3, (SELECT id FROM ingredients WHERE name = 'potatoes'));

-- Order 4: Large pizza with mushrooms, parmesan, mozzarella, tomatoes, olives
INSERT INTO orders (user_id, dish_name, dish_size, total_price, order_date) VALUES
(2, 'pizza', 'Large', 13.30, '2024-12-03 20:00:00');

INSERT INTO order_ingredients (order_id, ingredient_id) VALUES
(4, (SELECT id FROM ingredients WHERE name = 'mushrooms')),
(4, (SELECT id FROM ingredients WHERE name = 'parmesan')),
(4, (SELECT id FROM ingredients WHERE name = 'mozzarella')),
(4, (SELECT id FROM ingredients WHERE name = 'tomatoes')),
(4, (SELECT id FROM ingredients WHERE name = 'olives'));

-- Update ingredient availability based on orders placed
-- mozzarella: used 2 times (order 1, 4) -> 3-2=1 remaining
UPDATE ingredients SET current_availability = 1 WHERE name = 'mozzarella';

-- ham: used 1 time (order 2) -> 2-1=1 remaining  
UPDATE ingredients SET current_availability = 1 WHERE name = 'ham';

-- tuna: used 1 time (order 3) -> 2-1=1 remaining
UPDATE ingredients SET current_availability = 1 WHERE name = 'tuna';

-- mushrooms: used 1 time (order 4) -> 3-1=2 remaining
UPDATE ingredients SET current_availability = 2 WHERE name = 'mushrooms';

-- anchovies: not used -> 1 remaining
-- (current_availability already set to 1)

-- Create indexes for better performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_order_ingredients_order_id ON order_ingredients(order_id);
CREATE INDEX idx_order_ingredients_ingredient_id ON order_ingredients(ingredient_id);
CREATE INDEX idx_ingredient_dependencies_ingredient_id ON ingredient_dependencies(ingredient_id);
CREATE INDEX idx_ingredient_dependencies_required_id ON ingredient_dependencies(required_ingredient_id);
CREATE INDEX idx_ingredient_incompatibilities_ingredient1 ON ingredient_incompatibilities(ingredient1_id);
CREATE INDEX idx_ingredient_incompatibilities_ingredient2 ON ingredient_incompatibilities(ingredient2_id);
