'use strict';

/*** Importing modules ***/
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const session = require('express-session');

const passport = require('passport');
const base32 = require('thirty-two');
const LocalStrategy = require('passport-local');
const TotpStrategy = require('passport-totp').Strategy;

// Import the Data Access Objects (DAOs)
const userDao = require('./DAOs/dao-users');
const dishDao = require('./DAOs/dao-dishes');
const ingredientDao = require('./DAOs/dao-ingredients');
const orderDao = require('./DAOs/dao-orders');

const { validationResult, check } = require('express-validator');

//----------------------------------------------------------------------------
// Create the Express app and configure middleware
const app = express();
const port = 3001;

//----------------------------------------------------------------------------
// Middleware setup
app.use(morgan('dev'));
app.use(express.json());

//----------------------------------------------------------------------------
// Enable CORS for the frontend communication
const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));

//----------------------------------------------------------------------------
// Session management
app.use(session({
  secret: "secret!",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate('session'));

//----------------------------------------------------------------------------
// Initialize Passport.js for authentication
// The local strategy is used for username/password authentication
passport.use(new LocalStrategy(
  function(username, password, done) {
    userDao.getUser(username, password)
      .then(user => {
        if (!user) return done(null, false, { message: 'Incorrect username or password.' });
        return done(null, user);
      })
      .catch(err => done(err));
  }
));

//----------------------------------------------------------------------------
// The TOTP strategy is used for two-factor authentication (2FA)
passport.use(new TotpStrategy(
  function(user, done) {
    // All users should have TOTP, check for robustness
    if (!user.secret) return done(null, null);
    return done(null, base32.decode(user.secret), 30);
  }
));

//----------------------------------------------------------------------------
// Serialize and deserialize user instances to support sessions
// The serialization is used to store user ID in the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser((id, done) => {
  userDao.getUserById(id)
    .then(user => done(null, user))
    .catch(err => done(err, null));
});

//----------------------------------------------------------------------------
// middleware to check if user is authenticated
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Not authenticated' });
}

//----------------------------------------------------------------------------
// middleware to check if user has TOTP authentication
function isTotp(req, res, next) {
  if (req.session.method === 'totp') return next();
  return res.status(401).json({ error: 'Missing TOTP authentication' });
}

//----------------------------------------------------------------------------
// Helper to send user info to client
function clientUserInfo(req) {
  const user = req.user;
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    isTotp: req.session.method === 'totp'
  };
}

//----------------------------------------------------------------------------
// Utility functions
const errorFormatter = ({ location, msg, param, value }) => {
  let error = `${location}[${param}]: ${msg}`;
  if (value !== undefined && value !== null && value !== '') {
    error += ` (received: ${JSON.stringify(value)})`;
  }
  return error;
};

//#############################################################################
// Authentication APIs

// Login (username/password)
app.post('/api/sessions', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info.message || info });

    req.login(user, function(err) {
      if (err) return next(err);
      return res.json(clientUserInfo(req));
    });
  })(req, res, next);
});

//----------------------------------------------------------------------------
// TOTP verification (2FA)
app.post('/api/login-totp', isLoggedIn, function(req, res, next) {
  passport.authenticate('totp', function(err, user, info) {
    if (err) return next(err);
    if (!user) {
      const errorMessage = info && info.message ? info.message : 'Invalid TOTP code';
      return res.status(401).json({ error: errorMessage });
    }

    req.session.method = 'totp';
    return res.json({ otp: 'authorized' });
  })(req, res, next);
});

//----------------------------------------------------------------------------
// Get current session info
app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(clientUserInfo(req));
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

//----------------------------------------------------------------------------
// Logout
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    req.session.destroy(() => res.status(200).json({}));
  });
});

//#############################################################################
// Restaurant APIs

//----------------------------------------------------------------------------
// Get all dishes (public)
app.get('/api/dishes', async (_req, res) => {
  try {
    const dishes = await dishDao.getAllDishes();
    res.json(dishes);
  } catch (err) {
    console.error('Error getting dishes:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

//----------------------------------------------------------------------------
// Get all ingredients with constraints (public)
app.get('/api/ingredients', async (_req, res) => {
  try {
    const ingredients = await ingredientDao.getAllIngredients();
    res.json(ingredients);
  } catch (err) {
    console.error('Error getting ingredients:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

//----------------------------------------------------------------------------
// Validate ingredient constraints helper function
async function validateIngredientConstraints(ingredientIds) {
  if (ingredientIds.length === 0) return { valid: true };

  try {
    // Check dependencies and incompatibilities for each ingredient
    for (const ingredientId of ingredientIds) {
      // Check dependencies
      const dependencies = await ingredientDao.getIngredientDependencies(ingredientId);
      for (const dep of dependencies) {
        if (!ingredientIds.includes(dep.id)) {
          const ingredient = await ingredientDao.getIngredientById(ingredientId);
          return { 
            valid: false, 
            error: `${ingredient.name} requires ${dep.name} to be selected` 
          };
        }
      }

      // Check incompatibilities
      const incompatibilities = await ingredientDao.getIngredientIncompatibilities(ingredientId);
      for (const inc of incompatibilities) {
        if (ingredientIds.includes(inc.id)) {
          const ingredient = await ingredientDao.getIngredientById(ingredientId);
          return { 
            valid: false, 
            error: `${ingredient.name} is incompatible with ${inc.name}` 
          };
        }
      }
    }

    return { valid: true };
  } catch (err) {
    throw err;
  }
}

//----------------------------------------------------------------------------
// Create new order (authenticated users only)
app.post('/api/orders', isLoggedIn, [
  check('dish_name').isIn(['pizza', 'pasta', 'salad']).withMessage('Invalid dish name'),
  check('dish_size').isIn(['Small', 'Medium', 'Large']).withMessage('Invalid dish size'),
  check('ingredients').isArray().optional(),
  check('total_price').isFloat({ min: 0 }).withMessage('Invalid total price')
], async (req, res) => {
  const errors = validationResult(req).formatWith(errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.errors });
  }

  try {
    // Get dish details to validate max ingredients
    const dish = await dishDao.getDishByNameAndSize(req.body.dish_name, req.body.dish_size);
    if (dish.error) {
      return res.status(404).json({ error: 'Dish not found' });
    }

    const ingredients = req.body.ingredients || [];

    // Check max ingredients constraint
    if (ingredients.length > dish.max_ingredients) {
      return res.status(400).json({ 
        error: `Too many ingredients. ${dish.size} ${dish.name} can have maximum ${dish.max_ingredients} ingredients` 
      });
    }

    // Check ingredient availability
    if (ingredients.length > 0) {
      const unavailable = await ingredientDao.checkIngredientsAvailability(ingredients);
      if (unavailable.length > 0) {
        return res.status(400).json({ 
          error: `Not enough ingredients available: ${unavailable.map(i => i.name).join(', ')}` 
        });
      }

      // Validate ingredient constraints (dependencies and incompatibilities)
      const constraintValidation = await validateIngredientConstraints(ingredients);
      if (!constraintValidation.valid) {
        return res.status(400).json({ error: constraintValidation.error });
      }
    }

    // Create order
    const order = {
      user_id: req.user.id,
      dish_name: req.body.dish_name,
      dish_size: req.body.dish_size,
      total_price: req.body.total_price
    };

    const orderId = await orderDao.createOrder(order);

    // Add ingredients to order
    if (ingredients.length > 0) {
      await orderDao.addOrderIngredients(orderId, ingredients);
      
      // Update ingredient availability
      for (const ingredientId of ingredients) {
        const ingredient = await ingredientDao.getIngredientById(ingredientId);
        if (ingredient.current_availability !== null) {
          await ingredientDao.updateIngredientAvailability(ingredientId, ingredient.current_availability - 1);
        }
      }
    }

    res.status(201).json({ id: orderId });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

//----------------------------------------------------------------------------
// Get user's orders (authenticated users only)
app.get('/api/orders', isLoggedIn, async (req, res) => {
  try {
    const orders = await orderDao.getOrdersByUser(req.user.id);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

//----------------------------------------------------------------------------
// Cancel order (requires TOTP authentication)
app.delete('/api/orders/:id', isLoggedIn, isTotp, [
  check('id').isInt({ min: 1 }).withMessage('Invalid order ID')
], async (req, res) => {
  const errors = validationResult(req).formatWith(errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.errors });
  }

  try {
    const result = await orderDao.deleteOrder(req.params.id, req.user.id);
    
    // Restore ingredient availability
    for (const ingredientId of result.ingredients) {
      const ingredient = await ingredientDao.getIngredientById(ingredientId);
      if (ingredient.current_availability !== null) {
        await ingredientDao.updateIngredientAvailability(ingredientId, ingredient.current_availability + 1);
      }
    }

    res.status(200).json({ message: 'Order cancelled successfully' });
  } catch (err) {
    console.error('Error cancelling order:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

//----------------------------------------------------------------------------
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
