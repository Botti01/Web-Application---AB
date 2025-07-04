# Exam #2: "Restaurant"
## Student: s347291 BOTTICELLA ANDREA 

## React Client Application Routes

- Route `/`: Main restaurant page with menu browsing and order configuration (for authenticated users)
- Route `/login`: User authentication page with optional TOTP support
- Route `/totp`: Two-factor authentication page for completing 2FA
- Route `/orders`: Order history page showing past orders with detailed view

## API Server

- POST `/api/sessions`: User login with username/password
  - request body: `{username, password}`
  - response: user info with `canDoTotp` and `isTotp` flags
- POST `/api/login-totp`: TOTP verification for 2FA
  - request body: `{token}` 
  - response: `{otp: 'authorized'}`
- GET `/api/sessions/current`: Get current user session info
  - response: user info or 401 if not authenticated
- DELETE `/api/sessions/current`: User logout
- GET `/api/dishes`: Get all base dishes with sizes and prices (public)
  - response: array of dish objects
- GET `/api/ingredients`: Get all ingredients with prices, availability, dependencies, incompatibilities (public)
  - response: array of ingredient objects
- POST `/api/orders`: Create new order (authenticated users only)
  - request body: `{dish_name, dish_size, ingredients[], total_price}`
  - response: `{id}` of created order
- GET `/api/orders`: Get user's order history (authenticated users only)
  - response: array of order objects with ingredients
- DELETE `/api/orders/:id`: Cancel order (requires TOTP authentication)
  - response: success message

## Database Tables

- Table `users` - contains id, email, name, hash, salt, otp_secret (for TOTP)
- Table `dishes` - contains id, name, size, price, max_ingredients for base dishes
- Table `ingredients` - contains id, name, price, availability, current_availability
- Table `ingredient_dependencies` - contains dependency relationships between ingredients
- Table `ingredient_incompatibilities` - contains incompatibility relationships between ingredients
- Table `orders` - contains id, user_id, dish_name, dish_size, total_price, order_date
- Table `order_ingredients` - junction table linking orders to their ingredients

## Main React Components

- `App` (in `App.jsx`): Main application with authentication state and routing
- `RestaurantLayout` (in `Layout.jsx`): Main layout with navigation and content areas
- `DishList` (in `DishList.jsx`): Component for browsing and selecting base dishes and sizes
- `IngredientList` (in `IngredientList.jsx`): Component for browsing and selecting ingredients with constraints
- `OrderConfigurator` (in `OrderConfigurator.jsx`): Component for configuring orders and showing total price
- `OrderHistory` (in `OrderHistory.jsx`): Component for displaying past orders with cancellation option
- `NavigationBar` (in `NavigationBar.jsx`): Top navigation with user info and authentication controls
- `LoginForm` (in `LoginForm.jsx`): Authentication form with TOTP support

## Screenshot

![Screenshot](./img/screenshot.png)

## Users Credentials

- a@test.com, pwd (TOTP enabled)
- r@test.com, pwd (TOTP enabled)  
- e@test.com, pwd (TOTP enabled)
- s@test.com, pwd (TOTP enabled)

