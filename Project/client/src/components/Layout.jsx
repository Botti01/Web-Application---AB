import { useState, useEffect } from 'react';
import { Row, Col, Button, Alert, Container } from 'react-bootstrap';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import API from '../API';

import NavigationBar from './NavigationBar';
import DishList from './DishList';
import IngredientList from './IngredientList';
import OrderConfigurator from './OrderConfigurator';
import OrderHistory from './OrderHistory';
import LoginForm from './LoginForm';

//------------------------------------------------------------------------
// --- Not Found Layout ---
function NotFoundLayout() {
  return (
    <Row className="justify-content-center mt-5">
      <Col xs={12} md={8} className="text-center">
        <div className="card shadow-lg border-0" style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '15px' }}>
          <div className="card-body p-5">
            <h2 className="text-danger mb-4 fw-bold">404 - Page Not Found</h2>
            <p className="lead text-muted mb-4">
              Sorry, the page you are looking for doesn't exist or has been moved.
            </p>
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <Link to="/">
                <Button 
                  variant="primary" 
                  size="lg" 
                  style={{ borderRadius: '25px' }}
                >
                  <i className="bi bi-house-fill me-2"></i>
                  Back to Restaurant
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Col>
    </Row>
  );
}

//------------------------------------------------------------------------
// --- Login Layout ---
function LoginLayout({ onLogin, totpRequired, onTotp, onSkipTotp }) {
  return (
    <Container fluid className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      <Row className="w-100 justify-content-center">
        <Col xs={12} sm={10} md={8} lg={6} xl={5}>
          <LoginForm 
            onLogin={onLogin} 
            totpRequired={totpRequired} 
            onTotp={onTotp}
            onSkipTotp={onSkipTotp}
          />
        </Col>
      </Row>
    </Container>
  );
}

//------------------------------------------------------------------------
// --- Order Configuration Layout ---
function OrderConfigurationLayout({ user, showMessage }) {
  const [dishes, setDishes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [selectedDish, setSelectedDish] = useState(null);
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  // Reset selections when user logs out
  useEffect(() => {
    if (!user) {
      setSelectedDish(null);
      setSelectedIngredients([]);
    }
  }, [user]);

  // Handle order submission
  const handleSubmitOrder = async (orderData) => {
    try {
      await API.createOrder(orderData);
      // Reset dish selection after successful order
      setSelectedDish(null);
      setSelectedIngredients([]);
      showMessage('Order placed successfully!', 'success');
      
      // Refresh ingredients to update availability
      const updatedIngredients = await API.getIngredients();
      setIngredients(updatedIngredients);
    } catch (error) {
      // Check if the error contains information about unavailable ingredients
      if (error.error && error.error.includes('unavailable')) {
        // Try to extract ingredient names from the error message
        const errorMessage = error.error;
        
        // Refresh ingredients to get updated availability
        try {
          const updatedIngredients = await API.getIngredients();
          setIngredients(updatedIngredients);
          
          // Remove only unavailable ingredients from selection
          setSelectedIngredients(prevSelected => {
            const availableIngredients = prevSelected.filter(ingredientId => {
              const ingredient = updatedIngredients.find(ing => ing.id === ingredientId);
              // Keep ingredient if it's still available (null means unlimited, >0 means available)
              return ingredient && (ingredient.current_availability === null || ingredient.current_availability > 0);
            });
            
            // Show message about removed ingredients
            const removedIngredients = prevSelected.filter(id => !availableIngredients.includes(id));
            if (removedIngredients.length > 0) {
              const removedNames = removedIngredients.map(id => {
                const ingredient = ingredients.find(ing => ing.id === id);
                return ingredient ? ingredient.name : 'Unknown';
              }).join(', ');
              showMessage(`Some ingredients are no longer available and have been removed: ${removedNames}`, 'warning');
            }
            
            return availableIngredients;
          });
          
        } catch (refreshError) {
          console.error('Error refreshing ingredients:', refreshError);
          // Fallback: clear all ingredients if we can't refresh
          setSelectedIngredients([]);
        }
      } else {
        // For other errors, don't clear ingredients - let user retry
        try {
          const updatedIngredients = await API.getIngredients();
          setIngredients(updatedIngredients);
        } catch (refreshError) {
          console.error('Error refreshing ingredients:', refreshError);
        }
      }
      
      const errorMsg = error.error || error.message || 'Error placing order';
      showMessage(errorMsg, 'danger');
      throw error;
    }
  };

  // Handle ingredient selection toggle - simplified since constraints are handled in IngredientList
  const handleToggleIngredient = (ingredientId) => {
    setSelectedIngredients(prev => {
      if (prev.includes(ingredientId)) {
        return prev.filter(id => id !== ingredientId);
      } else {
        // Check if we can add more ingredients based on selected dish
        if (selectedDish && prev.length >= selectedDish.max_ingredients) {
          showMessage(`Maximum ${selectedDish.max_ingredients} ingredients allowed for ${selectedDish.size} ${selectedDish.name}`, 'warning');
          return prev;
        }
        return [...prev, ingredientId];
      }
    });
  };

  return (
    <Container fluid>
      <Row className="g-4">
        {/* Menu Section */}
        <Col xs={12} lg={user ? 4 : 6}>
          <div className="sticky-top" style={{ top: '90px' }}>
            <DishList
              dishes={dishes}
              setDishes={setDishes}
              selectedDish={user ? selectedDish : null}
              onSelectDish={user ? setSelectedDish : null}
              showMessage={showMessage}
              selectedIngredients={user ? selectedIngredients : []}
              readOnly={!user}
            />
          </div>
        </Col>

        {/* Ingredients Section */}
        <Col xs={12} lg={user ? 4 : 6}>
          <div className="sticky-top" style={{ top: '90px' }}>
            <IngredientList
              ingredients={ingredients}
              setIngredients={setIngredients}
              selectedIngredients={user ? selectedIngredients : []}
              onToggleIngredient={user ? handleToggleIngredient : null}
              showMessage={showMessage}
              disabled={user && !selectedDish}
              readOnly={!user}
            />
          </div>
        </Col>

        {/* Order Configuration Section - Only for authenticated users */}
        {user && (
          <Col xs={12} lg={4}>
            <div className="sticky-top" style={{ top: '90px' }}>
              <OrderConfigurator
                selectedDish={selectedDish}
                selectedIngredients={selectedIngredients}
                setSelectedIngredients={setSelectedIngredients}
                ingredients={ingredients}
                onSubmitOrder={handleSubmitOrder}
                showMessage={showMessage}
                user={user}
              />
            </div>
          </Col>
        )}
      </Row>
    </Container>
  );
}

//------------------------------------------------------------------------
// --- Order History Layout ---
function OrderHistoryLayout({ user, showMessage }) {
  const [orders, setOrders] = useState([]);

  // Handle order cancellation
  const handleCancelOrder = async (orderId) => {
    try {
      await API.cancelOrder(orderId);
      showMessage('Order cancelled successfully!', 'success');
      // Refresh orders list
      const updatedOrders = await API.getOrders();
      setOrders(updatedOrders);
    } catch (error) {
      const errorMsg = error.error || error.message || 'Error cancelling order';
      showMessage(errorMsg, 'danger');
    }
  };

  return (
    <div>
      {/* Page Title */}
      <Row className="mb-4">
        <Col>
          <h2 className="fw-bold text-dark">
            <i className="bi bi-clock-history me-2"></i>
            Order History
          </h2>
          <p className="text-muted mb-0">View and manage your past orders</p>
        </Col>
      </Row>
      
      {/* Order History Content */}
      <OrderHistory
        orders={orders}
        setOrders={setOrders}
        showMessage={showMessage}
        user={user}
        onCancelOrder={handleCancelOrder}
      />
    </div>
  );
}

//------------------------------------------------------------------------
// --- Main Restaurant Layout ---
function RestaurantLayout({ user, message, messageType = 'danger', onLogout, showMessage, onComplete2FA }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      <NavigationBar user={user} onLogout={onLogout} onComplete2FA={onComplete2FA} />
      
      <div style={{ paddingTop: '80px' }}>
        <Container fluid className="px-4 py-4">
          {/* Message Alert */}
          {message && (
            <Row>
              <Col>
                <Alert 
                  className="my-3 border-0 shadow-sm" 
                  variant={messageType} 
                  dismissible 
                  style={{ borderRadius: '10px' }}
                  onClose={() => showMessage('', 'info')}
                >
                  <i className={`bi ${
                    messageType === 'success' ? 'bi-check-circle-fill' : 
                    messageType === 'warning' ? 'bi-exclamation-triangle-fill' : 
                    'bi-exclamation-triangle-fill'
                  } me-2`}></i>
                  {message}
                </Alert>
              </Col>
            </Row>
          )}

          {/* Welcome message for non-authenticated users */}
          {!user && location.pathname === "/" && (
            <Row className="mb-4">
              <Col>
                <div className="card shadow-lg border-0" style={{ background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)', borderRadius: '15px' }}>
                  <div className="card-body text-center py-4">
                    <h2 className="text-white fw-bold mb-3">
                      <i className="bi bi-shop me-2"></i>
                      Welcome to My Restaurant!
                    </h2>
                    <p className="text-white mb-3 lead">
                      Browse our delicious menu and ingredients. Login to start building your custom order!
                    </p>
                    <Button 
                      variant="light" 
                      size="lg" 
                      onClick={() => navigate('/login')}
                      style={{ borderRadius: '25px' }}
                      className="fw-bold"
                    >
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Login to Order
                    </Button>
                  </div>
                </div>
              </Col>
            </Row>
          )}

          {/* Main Content */}
          {location.pathname === "/" && (
            <OrderConfigurationLayout user={user} showMessage={showMessage} />
          )}
          
          {location.pathname === "/orders" && (
            <OrderHistoryLayout user={user} showMessage={showMessage} />
          )}
          
          <Outlet context={{ user, showMessage }} />
        </Container>
      </div>
    </div>
  );
}

//------------------------------------------------------------------------
// --- TOTP Layout ---
function TotpLayout({ onTotp, onSkipTotp, message, messageType }) {
  return (
    <Container fluid className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      <Row className="w-100 justify-content-center">
        <Col xs={12} sm={10} md={8} lg={6} xl={5}>
          {/* Message Alert */}
          {message && (
            <Alert 
              className="mb-4 border-0 shadow-sm" 
              variant={messageType} 
              style={{ borderRadius: '10px' }}
            >
              <i className={`bi ${
                messageType === 'success' ? 'bi-check-circle-fill' : 
                messageType === 'warning' ? 'bi-exclamation-triangle-fill' : 
                messageType === 'info' ? 'bi-info-circle-fill' :
                'bi-exclamation-triangle-fill'
              } me-2`}></i>
              {message}
            </Alert>
          )}
          
          <LoginForm 
            totpRequired={true}
            onTotp={onTotp}
            onSkipTotp={onSkipTotp}
          />
        </Col>
      </Row>
    </Container>
  );
}

//-----------------------------------------------------------------------------
export { NotFoundLayout, LoginLayout, RestaurantLayout, TotpLayout, OrderHistoryLayout };
export default RestaurantLayout;