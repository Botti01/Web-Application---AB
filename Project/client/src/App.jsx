// -----------------------------------------------------------------------------
// App Component
// -----------------------------------------------------------------------------
// This file defines the main App component, which serves as the root of the
// restaurant ordering application. It manages authentication state, handles 
// user sessions with TOTP support, and defines routes for navigation.
// -----------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import API from './API';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { RestaurantLayout, LoginLayout, NotFoundLayout, OrderHistoryLayout} from './components/Layout';

//----------------------------------------------------------------------------
function App() {

  //----------------------------------------------------------------------------
  // State management using React hooks

  // User information
  const [user, setUser] = useState(null);
  // If TOTP is required for the user
  const [totpRequired, setTotpRequired] = useState(false);
  // Pending user data (for TOTP verification)
  const [pendingUser, setPendingUser] = useState(null);
  // Global message to display to the user (e.g., success or error messages)
  const [message, setMessage] = useState('');
  // Type of message to display (success, warning, danger)
  const [messageType, setMessageType] = useState('danger');

  const navigate = useNavigate();

  //----------------------------------------------------------------------------
  // Check session on mount
  // This effect runs once when the component mounts to check if the user is logged in
  useEffect(() => {
    API.getUserInfo()
      .then(u => setUser(u))
      .catch(() => setUser(null));
  }, []);

  //----------------------------------------------------------------------------
  // Handle user login
  async function handleLogin(credentials) {
    try {
      const res = await API.logIn(credentials);
      
      // If user can do TOTP, set up for TOTP verification
      if (res.canDoTotp) {
        setTotpRequired(true);
        setPendingUser(res);
        setUser(null);
        setMessage('Please complete 2FA authentication for full access');
        setMessageType('info');
      } else {
        // User doesn't have TOTP, login directly
        setUser(res);
        setTotpRequired(false);
        setPendingUser(null);
        navigate('/');
        showMessage('Welcome! You are now logged in.', 'success');
      }
    } catch (err) {
      setUser(null);
      setTotpRequired(false);
      setPendingUser(null);
      setMessage('');
      throw new Error(err.error || 'Login failed. Please check your credentials.');
    }
  }

  //----------------------------------------------------------------------------
  // Handle TOTP verification
  async function handleTotp(code) {
    try {
      await API.logInTotp(code);
      const u = await API.getUserInfo();
      setUser(u);
      setTotpRequired(false);
      setPendingUser(null);
      setMessage('');
      navigate('/');
      showMessage('2FA authentication successful! You now have full access.', 'success');
    } catch (err) {
      throw new Error(err.error || 'Invalid TOTP code. Please try again.');
    }
  }

  //----------------------------------------------------------------------------
  // Handle skipping TOTP for users who can do TOTP but choose not to
  async function handleSkipTotp() {
    if (pendingUser) {
      setUser({
        ...pendingUser,
        isTotp: false // Mark as not having completed TOTP
      });
      setTotpRequired(false);
      setPendingUser(null);
      setMessage('');
      navigate('/');
      showMessage('Logged in with limited access. Complete 2FA to cancel orders.', 'warning');
    }
  }

  //----------------------------------------------------------------------------
  // Handle user logout
  async function handleLogout() {
    try {
      await API.logOut();
      setUser(null);
      setTotpRequired(false);
      setPendingUser(null);
      setMessage('');
      navigate('/');
      showMessage('You have been logged out successfully.', 'info');
    } catch (err) {
      showMessage('Error during logout', 'danger');
    }
  }

  //----------------------------------------------------------------------------
  // Global message handler
  const showMessage = (msg, type = 'danger') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000); // Longer timeout for restaurant messages
  };

  //############################################################################
  // --- Routing ---
  return (
    <div style={{ minHeight: '100vh' }}>
      <Routes>
        {/* Login Route */}
        <Route 
          path="/login" 
          element={
            user && !totpRequired ? (
              <Navigate replace to="/" />
            ) : (
              <LoginLayout 
                onLogin={handleLogin} 
                totpRequired={totpRequired} 
                onTotp={handleTotp} 
                onSkipTotp={handleSkipTotp} 
              />
            )
          } 
        />
        
        {/* Main Restaurant Route - Public browsing, login required for ordering */}
        <Route 
          path="/" 
          element={
            <RestaurantLayout 
              user={user} 
              message={message} 
              messageType={messageType} 
              onLogout={handleLogout} 
              showMessage={showMessage} 
            />
          } 
        />
        
        {/* Order History Route - Requires authentication */}
        <Route 
          path="/orders" 
          element={
            <RestaurantLayout 
              user={user} 
              message={message} 
              messageType={messageType} 
              onLogout={handleLogout} 
              showMessage={showMessage} 
            />
          } 
        />
        
        {/* 404 Not Found */}
        <Route path="*" element={<NotFoundLayout />} />
      </Routes>
    </div>
  );
}

//----------------------------------------------------------------------------
export default App;
