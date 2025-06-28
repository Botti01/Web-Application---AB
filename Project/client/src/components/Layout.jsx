import { useState, useEffect } from 'react';
import { Row, Col, Button, Alert, Container } from 'react-bootstrap';
import { Link, Outlet, useLocation } from 'react-router-dom';
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
    <Container>
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
    </Container>
  );
}

//------------------------------------------------------------------------
// --- Login Layout ---
function LoginLayout({ onLogin, totpRequired, onTotp, onSkipTotp }) {
  return (
    <Container>
      <Row className="justify-content-center" style={{ minHeight: '100vh', paddingTop: '100px' }}>
          <LoginForm 
            onLogin={onLogin} 
            totpRequired={totpRequired} 
            onTotp={onTotp}
            onSkipTotp={onSkipTotp}
          />
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

  // Handle order submission
  const handleSubmitOrder = async (orderData) => {
    try {
      await API.createOrder(orderData);
      // Reset selection after successful order
      setSelectedDish(null);
      setSelectedIngredients([]);
      showMessage('Order placed successfully!', 'success');
      
      // Refresh ingredients to update availability
      const updatedIngredients = await API.getIngredients();
      setIngredients(updatedIngredients);
    } catch (error) {
      const errorMsg = error.error || error.message || 'Error placing order';
      showMessage(errorMsg, 'danger');
      throw error; // Re-throw to handle in component
    }
  };

  // Handle ingredient selection toggle
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
    <Row className="g-4">
      {/* Menu Section */}
      <Col xs={12} lg={4}>
        <div className="sticky-top" style={{ top: '90px' }}>
          <div className="card shadow-lg border-0" style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '15px' }}>
            <div className="card-body p-0">
              <DishList
                dishes={dishes}
                setDishes={setDishes}
                selectedDish={selectedDish}
                onSelectDish={setSelectedDish}
                showMessage={showMessage}
              />
            </div>
          </div>
        </div>
      </Col>

      {/* Ingredients Section */}
      <Col xs={12} lg={4}>
        <div className="sticky-top" style={{ top: '90px' }}>
          <div className="card shadow-lg border-0" style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '15px' }}>
            <div className="card-body p-0">
              <IngredientList
                ingredients={ingredients}
                setIngredients={setIngredients}
                selectedIngredients={selectedIngredients}
                onToggleIngredient={handleToggleIngredient}
                showMessage={showMessage}
                disabled={!selectedDish}
              />
            </div>
          </div>
        </div>
      </Col>

      {/* Order Configuration Section */}
      <Col xs={12} lg={4}>
        <div className="sticky-top" style={{ top: '90px' }}>
          <div className="card shadow-lg border-0" style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '15px' }}>
            <div className="card-body p-0">
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
          </div>
        </div>
      </Col>
    </Row>
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
    <Row className="justify-content-center">
      <Col xs={12} lg={8}>
        <div className="card shadow-lg border-0" style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '15px' }}>
          <div className="card-body p-0">
            <OrderHistory
              orders={orders}
              setOrders={setOrders}
              showMessage={showMessage}
              user={user}
              onCancelOrder={handleCancelOrder}
            />
          </div>
        </div>
      </Col>
    </Row>
  );
}

//------------------------------------------------------------------------
// --- Welcome Layout (for non-authenticated users) ---
function WelcomeLayout() {
  return (
    <Row className="justify-content-center">
      <Col xs={12} lg={8} className="text-center">
        <div className="card border-0 shadow-lg" style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '20px' }}>
          <div className="card-body p-5">
            <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '120px', height: '120px', background: 'linear-gradient(45deg, #dc2626, #ef4444)' }}>
              <i className="bi bi-shop text-white" style={{ fontSize: '4rem' }}></i>
            </div>
            <h2 className="fw-bold mb-3" style={{ color: '#dc2626' }}>Welcome to Our Restaurant!</h2>
            <p className="lead text-muted mb-4">
              Discover our delicious selection of pizzas, pastas, and fresh salads. 
              Customize your order with premium ingredients and enjoy authentic flavors.
            </p>
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div className="text-center">
                  <i className="bi bi-circle text-warning" style={{ fontSize: '2rem' }}></i>
                  <h5 className="mt-2">Fresh Pizza</h5>
                  <p className="small text-muted">Hand-tossed with premium ingredients</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="text-center">
                  <i className="bi bi-bowl text-primary" style={{ fontSize: '2rem' }}></i>
                  <h5 className="mt-2">Authentic Pasta</h5>
                  <p className="small text-muted">Made fresh daily with traditional recipes</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="text-center">
                  <i className="bi bi-basket text-success" style={{ fontSize: '2rem' }}></i>
                  <h5 className="mt-2">Fresh Salads</h5>
                  <p className="small text-muted">Crisp vegetables and healthy options</p>
                </div>
              </div>
            </div>
            <div className="alert alert-info border-0 shadow-sm" style={{ borderRadius: '15px' }}>
              <i className="bi bi-info-circle-fill me-2"></i>
              <strong>Sign in</strong> to place orders and track your order history.
            </div>
          </div>
        </div>
      </Col>
    </Row>
  );
}

//------------------------------------------------------------------------
// --- Main Restaurant Layout ---
function RestaurantLayout({ user, message, messageType = 'danger', onLogout, showMessage }) {
  const location = useLocation();

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      <NavigationBar user={user} onLogout={onLogout} />
      
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

        {/* Main Content */}
        {location.pathname === "/" && (
          user ? (
            <OrderConfigurationLayout user={user} showMessage={showMessage} />
          ) : (
            <WelcomeLayout />
          )
        )}
        
        {location.pathname === "/orders" && (
          <OrderHistoryLayout user={user} showMessage={showMessage} />
        )}
        
        <Outlet context={{ user, showMessage }} />
      </Container>
    </div>
  );
}

//------------------------------------------------------------------------
// --- TOTP Layout ---
function TotpLayout({ totpSuccessful }) {
  return (
    <Container>
      <Row className="justify-content-center" style={{ minHeight: '100vh', paddingTop: '100px' }}>
        <Col xs={12} sm={10} md={8} lg={6}>
          <LoginForm 
            totpRequired={true}
            onTotp={totpSuccessful}
          />
        </Col>
      </Row>
    </Container>
  );
}

//-----------------------------------------------------------------------------
export { NotFoundLayout, LoginLayout, RestaurantLayout, TotpLayout, OrderHistoryLayout };
export default RestaurantLayout;
