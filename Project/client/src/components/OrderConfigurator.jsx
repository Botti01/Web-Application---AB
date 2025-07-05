import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Alert, Badge, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import API from '../API';

function OrderConfigurator({ selectedDish, selectedIngredients, setSelectedIngredients, ingredients, onSubmitOrder, showMessage, user, readOnly = false, orderDate = null, title = "Order Configuration", totalPriceOverride = null, onCancelOrder = null, order = null }) {
  const [totalPrice, setTotalPrice] = useState(0);
  const [validationError, setValidationError] = useState('');
  const navigate = useNavigate();

  //-----------------------------------------------------------------------------
  // Calculate total price when dish or ingredients change
  useEffect(() => {
    if (totalPriceOverride !== null) {
      setTotalPrice(totalPriceOverride);
      return;
    }
    
    if (!selectedDish) {
      setTotalPrice(0);
      return;
    }

    let price = selectedDish.price;
    
    selectedIngredients.forEach(ingredientId => {
      const ingredient = ingredients.find(ing => ing.id === ingredientId);
      if (ingredient) {
        price += ingredient.price;
      }
    });

    setTotalPrice(price);
  }, [selectedDish, selectedIngredients, ingredients, totalPriceOverride]);

  //-----------------------------------------------------------------------------
  // Validate current configuration
  useEffect(() => {
    if (!selectedDish || readOnly) {
      setValidationError('');
      return;
    }

    // Check max ingredients
    if (selectedIngredients.length > selectedDish.max_ingredients) {
      setValidationError(`Too many ingredients! ${selectedDish.size} ${selectedDish.name} can have maximum ${selectedDish.max_ingredients} ingredients.`);
      return;
    }

    // Check dependencies and incompatibilities would be done server-side
    setValidationError('');
  }, [selectedDish, selectedIngredients, readOnly]);

  //-----------------------------------------------------------------------------
  // Handle order submission or redirect to login
  const handleSubmitOrder = async () => {
    if (!user) {
      // Redirect to login page if user is not authenticated
      navigate('/login');
      return;
    }

    if (!selectedDish) return;

    try {
      const orderData = {
        dish_name: selectedDish.name,
        dish_size: selectedDish.size,
        ingredients: selectedIngredients,
        total_price: totalPrice
      };

      // Only call the callback, don't create the order here
      // Let the Layout handle the order creation and messaging
      await onSubmitOrder(orderData);
      
      // Reset selection after successful order (only on success)
      setSelectedIngredients([]);
    } catch (error) {
      // Don't reset ingredients here - let the Layout handle selective removal
      // Don't show success message on error
      const errorMsg = error.error || error.message || 'Error placing order';
      showMessage(errorMsg, 'danger');
    }
  };

  //-----------------------------------------------------------------------------
  // Get selected ingredients details
  const getSelectedIngredientsDetails = () => {
    return selectedIngredients.map(id => 
      ingredients.find(ing => ing.id === id)
    ).filter(Boolean);
  };

  //-----------------------------------------------------------------------------
  // Render the order configurator
  return (
    <div className="h-100 d-flex flex-column">
      {/* Header for the configurator section with total price */}
      <div className="p-3 rounded-top text-white shadow-sm d-flex justify-content-between align-items-center" style={{ position: 'relative', zIndex: 10, background: 'linear-gradient(90deg, #7c2d12 0%, #ea580c 100%)', flexShrink: 0 }}>
        <h5 className="mb-0 fw-bold">
          <i className={`bi ${readOnly ? 'bi-receipt' : 'bi-cart3'} me-2`}></i> 
          {title}
          {orderDate && (
            <small className="d-block mt-1" style={{ fontSize: '0.8rem', opacity: 0.9 }}>
              <i className="bi bi-calendar me-1"></i>
              {orderDate}
            </small>
          )}
        </h5>
        {selectedDish && (
          <div className="text-end p-2 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', border: '2px solid #fbbf24' }}>
            <div className="fw-bold text-warning" style={{ fontSize: '2.2rem', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>€{totalPrice.toFixed(2)}</div>
            <small className="text-warning fw-bold" style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Price</small>
          </div>
        )}
      </div>

      <Card className="shadow-sm border-0 flex-grow-1 d-flex flex-column" style={{ borderRadius: '0 0 15px 15px' }}>
        <Card.Body className="flex-grow-1 d-flex flex-column">
          {!selectedDish ? (
            <div className="text-center py-5 flex-grow-1 d-flex flex-column justify-content-center">
              <div className="mb-4">
                <i className="bi bi-arrow-left-circle text-muted" style={{ fontSize: '4rem' }}></i>
              </div>
              <h5 className="text-muted mb-3">Start Your Order</h5>
              <p className="text-muted mb-4">
                Select a dish from the menu to start configuring your order.<br/>
                Once you choose a dish, you'll be able to add ingredients and see the total price.
              </p>
              <div className="bg-light p-3 rounded">
                <small className="text-muted">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>How it works:</strong><br/>
                  1. Choose a dish and size from the menu<br/>
                  2. Add ingredients (respecting constraints)<br/>
                  3. Review your order and place it
                </small>
              </div>
            </div>
          ) : (
            <div className="flex-grow-1 d-flex flex-column">
              {/* Selected Dish */}
              <div className="mb-3 flex-shrink-0">
                <h6 className="fw-bold text-primary mb-2">
                  <i className="bi bi-check-circle me-2"></i>Selected Dish
                </h6>
                <Card className="bg-light border-0">
                  <Card.Body className="py-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="fw-bold text-capitalize">{selectedDish.size} {selectedDish.name}</span>
                        <small className="text-muted ms-2">
                          (Max {selectedDish.max_ingredients} ingredients)
                        </small>
                      </div>
                      <Badge bg="primary">€{selectedDish.price.toFixed(2)}</Badge>
                    </div>
                  </Card.Body>
                </Card>
              </div>

              {/* Selected Ingredients */}
              <div className="mb-3 flex-grow-1 d-flex flex-column">
                <h6 className="fw-bold text-success mb-2 flex-shrink-0">
                  <i className="bi bi-plus-circle me-2"></i>Selected Ingredients ({selectedIngredients.length}/{selectedDish.max_ingredients})
                </h6>
                {selectedIngredients.length === 0 ? (
                  <div className="text-center py-3 bg-light rounded flex-shrink-0">
                    <i className="bi bi-basket text-muted" style={{ fontSize: '1.5rem' }}></i>
                    <p className="text-muted mb-0 mt-2">
                      No ingredients selected<br/>
                      <small>Add ingredients from the list on the left</small>
                    </p>
                  </div>
                ) : (
                  <div className="flex-grow-1" style={{ maxHeight: '205px' }}>
                    <ListGroup className="small">
                      {getSelectedIngredientsDetails().map(ingredient => (
                        <ListGroup.Item key={ingredient.id} className="d-flex justify-content-between align-items-center py-1 border-0 bg-light">
                          <span>{ingredient.name}</span>
                          <Badge bg="success">€{ingredient.price.toFixed(2)}</Badge>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </div>
                )}
              </div>

              {/* Cancel Order Button - only show in read-only mode for order history */}
              {readOnly && onCancelOrder && order && (
                <div className="mb-3 flex-shrink-0">
                  {user.isTotp ? (
                    <div className="d-grid">
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => onCancelOrder(order)}
                        className="fw-bold"
                      >
                        <i className="bi bi-x-circle me-1"></i>Cancel Order
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <div className="d-grid mb-2">
                        <Button variant="outline-secondary" size="sm" disabled className="fw-bold">
                          <i className="bi bi-shield-lock me-1"></i>Cancel Order
                        </Button>
                      </div>
                      <small className="text-muted fst-italic d-block text-center">
                        <i className="bi bi-shield-lock me-1"></i>
                        TOTP required to cancel orders
                      </small>
                    </div>
                  )}
                </div>
              )}

              {/* Validation Error */}
              {validationError && !readOnly && (
                <Alert variant="warning" className="small py-2 flex-shrink-0">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {validationError}
                </Alert>
              )}

              {/* Submit Button - only show if not read-only */}
              {!readOnly && (
                <div className="d-grid flex-shrink-0">
                  <Button
                    variant={!user ? "outline-primary" : "primary"}
                    size="lg"
                    disabled={validationError && user}
                    onClick={handleSubmitOrder}
                    className="fw-bold"
                  >
                    <i className={`bi ${!user ? 'bi-box-arrow-in-right' : 'bi-cart-check'} me-2`}></i>
                    {!user ? 'Login to Order' : 'Place Order'}
                  </Button>
                </div>
              )}

              {!user && !readOnly && (
                <small className="text-muted d-block text-center mt-2 flex-shrink-0">
                  <i className="bi bi-info-circle me-1"></i>
                  You need to be logged in to place an order
                </small>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

//-----------------------------------------------------------------------------
export default OrderConfigurator;