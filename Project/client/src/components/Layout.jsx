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
  const [orders, setOrders] = useState([]);

  // Load orders when user changes
  useEffect(() => {
    const loadOrders = async () => {
      if (user) {
        try {
          const ordersData = await API.getOrders();
          setOrders(ordersData);
        } catch (error) {
          console.error('Error loading orders:', error);
          showMessage('Error loading order history', 'danger');
        }
      } else {
        setOrders([]);
      }
    };
    
    loadOrders();
  }, [user, showMessage]);

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
      
      // Refresh orders list
      if (user) {
        const updatedOrders = await API.getOrders();
        setOrders(updatedOrders);
      }
    } catch (error) {
      // On error, reset ingredients selection and refresh availability
      setSelectedIngredients([]);
      
      // Refresh ingredients to show updated availability
      try {
        const updatedIngredients = await API.getIngredients();
        setIngredients(updatedIngredients);
      } catch (refreshError) {
        console.error('Error refreshing ingredients:', refreshError);
      }
      
      const errorMsg = error.error || error.message || 'Error placing order';
      showMessage(errorMsg, 'danger');
      throw error;
    }
  };

  // Handle order cancellation
  const handleCancelOrder = async (orderId) => {
    try {
      await API.cancelOrder(orderId);
      showMessage('Order cancelled successfully!', 'success');
      // Refresh orders list and ingredients
      const updatedOrders = await API.getOrders();
      setOrders(updatedOrders);
      const updatedIngredients = await API.getIngredients();
      setIngredients(updatedIngredients);
    } catch (error) {
      const errorMsg = error.error || error.message || 'Error cancelling order';
      showMessage(errorMsg, 'danger');
    }
  };

  // Handle ingredient selection toggle with dependency checking
  const handleToggleIngredient = (ingredientId) => {
    if (!selectedDish) {
      showMessage('Please select a dish first before adding ingredients', 'warning');
      return;
    }
    
    setSelectedIngredients(prev => {
      if (prev.includes(ingredientId)) {
        // Check if removing this ingredient would break dependencies for others
        const ingredient = ingredients.find(ing => ing.id === ingredientId);
        const wouldBreakDependencies = prev.some(otherIngredientId => {
          if (otherIngredientId === ingredientId) return false;
          const otherIngredient = ingredients.find(ing => ing.id === otherIngredientId);
          return otherIngredient?.dependencies?.includes(ingredient.name);
        });

        if (wouldBreakDependencies) {
          showMessage(`Cannot remove ${ingredient.name} as it's required by other selected ingredients`, 'warning');
          return prev;
        }
        return prev.filter(id => id !== ingredientId);
      } else {
        // Check if we can add more ingredients based on selected dish
        if (selectedDish && prev.length >= selectedDish.max_ingredients) {
          showMessage(`Maximum ${selectedDish.max_ingredients} ingredients allowed for ${selectedDish.size} ${selectedDish.name}`, 'warning');
          return prev;
        }

        // Check if all dependencies are already selected
        const ingredient = ingredients.find(ing => ing.id === ingredientId);
        const missingDependencies = ingredient.dependencies?.filter(depName => {
          const depIngredient = ingredients.find(ing => ing.name === depName);
          return !prev.includes(depIngredient.id);
        }) || [];

        if (missingDependencies.length > 0) {
          showMessage(`${ingredient.name} requires: ${missingDependencies.join(', ')}. Please add them first.`, 'warning');
          return prev;
        }

        // Check incompatibilities
        for (const selectedId of prev) {
          const selectedIngredient = ingredients.find(ing => ing.id === selectedId);
          if (selectedIngredient && selectedIngredient.incompatibilities?.includes(ingredient.name)) {
            showMessage(`${ingredient.name} is incompatible with ${selectedIngredient.name}`, 'warning');
            return prev;
          }
        }

        return [...prev, ingredientId];
      }
    });
  };

  return (
    <Container fluid>
      <Row className="g-4">
        {/* Menu Section */}
        <Col xs={12} lg={4}>
          <div className="sticky-top" style={{ top: '90px' }}>
            <DishList
              dishes={dishes}
              setDishes={setDishes}
              selectedDish={selectedDish}
              onSelectDish={setSelectedDish}
              showMessage={showMessage}
            />
          </div>
        </Col>

        {/* Ingredients Section */}
        <Col xs={12} lg={4}>
          <div className="sticky-top" style={{ top: '90px' }}>
            <IngredientList
              ingredients={ingredients}
              setIngredients={setIngredients}
              selectedIngredients={selectedIngredients}
              onToggleIngredient={handleToggleIngredient}
              showMessage={showMessage}
              disabled={!selectedDish}
            />
          </div>
        </Col>

        {/* Order Configuration and History Section */}
        <Col xs={12} lg={4}>
          <div className="sticky-top" style={{ top: '90px' }}>
            {/* Order Configuration */}
            <div className="mb-4">
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
            
            {/* Order History - Always show the component, it handles authentication internally */}
            <div>
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
// --- Main Restaurant Layout ---
function RestaurantLayout({ user, message, messageType = 'danger', onLogout, showMessage }) {
  const location = useLocation();

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      <NavigationBar user={user} onLogout={onLogout} />
      
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
function TotpLayout({ totpSuccessful }) {
  return (
    <Container fluid className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      <Row className="w-100 justify-content-center">
        <Col xs={12} sm={10} md={8} lg={6} xl={5}>
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
