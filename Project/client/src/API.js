import dayjs from 'dayjs';

const SERVER_URL = 'http://localhost:3001/api/';

//----------------------------------------------------------------------------
/**
 * Utility function for parsing the HTTP response.
 */
function getJson(httpResponsePromise) {
  // server API always return JSON, in case of error the format is the following { error: <message> } 
  return new Promise((resolve, reject) => {
    httpResponsePromise
      .then((response) => {
        if (response.ok) {
          // Handle 204 No Content (no body to parse)
          if (response.status === 204) {
            resolve({});
          } else {
            response.json()
              .then(json => resolve(json))
              .catch(err => reject({ error: "Cannot parse server response" }))
          }
        } else {
          response.json()
            .then(obj => reject(obj))
            .catch(err => reject({ error: "Cannot parse server response" }))
        }
      })
      .catch(err => reject({ error: "Cannot communicate" }))
  });
}

//############################################################################
// DISHES
//############################################################################

// Fetch all dishes from the server (public)
const getDishes = async () => {
  return getJson(
    fetch(SERVER_URL + 'dishes', { credentials: 'include' })
  );
};

//############################################################################
// INGREDIENTS
//############################################################################

// Fetch all ingredients with constraints (public)
const getIngredients = async () => {
  return getJson(
    fetch(SERVER_URL + 'ingredients', { credentials: 'include' })
  );
};

//############################################################################
// ORDERS
//############################################################################

// Create a new order (authenticated users only)
const createOrder = async (orderData) => {
  return getJson(
    fetch(SERVER_URL + 'orders', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    })
  );
};

//----------------------------------------------------------------------------
// Fetch user's orders (authenticated users only)
const getOrders = async () => {
  return getJson(
    fetch(SERVER_URL + 'orders', { credentials: 'include' })
  ).then(json => json.map(order => ({
    ...order,
    order_date: order.order_date ? dayjs(order.order_date) : null,
  })));
};

//----------------------------------------------------------------------------
// Cancel an order by ID (requires TOTP authentication)
const cancelOrder = async (orderId) => {
  return getJson(
    fetch(SERVER_URL + `orders/${orderId}`, {
      method: 'DELETE',
      credentials: 'include'
    })
  );
};

//############################################################################
// AUTHENTICATION and 2FA
//############################################################################

// Log in a user with credentials
const logIn = async (credentials) => {
  return getJson(
    fetch(SERVER_URL + 'sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(credentials)
    })
  );
};

//----------------------------------------------------------------------------
// Verify a TOTP code for 2FA
const logInTotp = async (code) => {
  return getJson(
    fetch(SERVER_URL + 'login-totp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code })
    })
  );
};

//----------------------------------------------------------------------------
// Log out the current user
const logOut = async () => {
  return getJson(
    fetch(SERVER_URL + 'sessions/current', {
      method: 'DELETE',
      credentials: 'include'
    })
  );
};

//----------------------------------------------------------------------------
// Fetch information about the currently logged-in user
const getUserInfo = async () => {
  return getJson(
    fetch(SERVER_URL + 'sessions/current', {
      credentials: 'include'
    })
  );
};

//----------------------------------------------------------------------------
// Export all API functions
const API = {
  // Dishes
  getDishes,
  
  // Ingredients
  getIngredients,
  
  // Orders
  createOrder,
  getOrders,
  cancelOrder,
  
  // Authentication
  logIn,
  logInTotp,
  logOut,
  getUserInfo,
};

//----------------------------------------------------------------------------
export default API;
