import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { ListGroup, Badge, Button, Card, Alert, Modal, Row, Col } from 'react-bootstrap';
import API from '../API';
import OrderConfigurator from './OrderConfigurator';

function OrderHistory({ orders, setOrders, showMessage, user, onCancelOrder }) {
  const [showModal, setShowModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [dishes, setDishes] = useState([]);

  //-----------------------------------------------------------------------------
  // Load orders on mount and when user changes
  useEffect(() => {
    const refreshOrders = async () => {
      if (!user) {
        setOrders([]);
        return;
      }
      
      try {
        const ordersData = await API.getOrders();
        setOrders(ordersData);
      } catch (error) {
        console.error('Error loading orders:', error);
        showMessage('Error loading orders', 'danger');
      }
    };
    
    refreshOrders();
  }, [setOrders, showMessage, user]);

  //-----------------------------------------------------------------------------
  // Load ingredients and dishes for display
  useEffect(() => {
    const loadData = async () => {
      try {
        const [ingredientsData, dishesData] = await Promise.all([
          API.getIngredients(),
          API.getDishes()
        ]);
        setIngredients(ingredientsData);
        setDishes(dishesData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, []);

  //-----------------------------------------------------------------------------
  // Handle order cancellation
  const handleCancelOrder = async (orderId) => {
    try {
      await API.cancelOrder(orderId);
      showMessage('Order cancelled successfully!', 'success');
      // Refresh orders after cancellation
      const ordersData = await API.getOrders();
      setOrders(ordersData);
      if (onCancelOrder) onCancelOrder(orderId);
    } catch (error) {
      const errorMsg = error.error || error.message || 'Error cancelling order';
      showMessage(errorMsg, 'danger');
    }
  };

  // Sort orders by date in descending order
  const sortedOrders = [...orders].sort((a, b) => 
    dayjs(b.order_date).unix() - dayjs(a.order_date).unix()
  );

  //-----------------------------------------------------------------------------
  // Convert order to dish format for OrderConfigurator
  const getOrderDish = (order) => {
    const dish = dishes.find(d => d.name === order.dish_name && d.size === order.dish_size);
    if (dish) {
      return dish;
    }
    
    // Fallback if dish not found in current dishes - use standard pricing
    const standardPrice = order.dish_size === 'Small' ? 5 : 
                         order.dish_size === 'Medium' ? 7 : 9;
    
    return {
      id: `order-${order.id}`,
      name: order.dish_name,
      size: order.dish_size,
      price: standardPrice,
      max_ingredients: order.dish_size === 'Small' ? 3 : order.dish_size === 'Medium' ? 5 : 7
    };
  };

  //-----------------------------------------------------------------------------
  // Convert order ingredients to IDs for OrderConfigurator
  const getOrderIngredientIds = (order) => {
    if (!order.ingredient_ids) return [];
    return order.ingredient_ids;
  };

  //-----------------------------------------------------------------------------
  // Handle order cancellation confirmation
  const handleCancelOrderClick = (order) => {
    setOrderToCancel(order);
    setShowModal(true);
  };

  //-----------------------------------------------------------------------------
  // Handle confirmed order cancellation
  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;

    try {
      await API.cancelOrder(orderToCancel.id);
      showMessage('Order cancelled successfully!', 'success');
      // Refresh orders after cancellation
      const ordersData = await API.getOrders();
      setOrders(ordersData);
      if (onCancelOrder) onCancelOrder(orderToCancel.id);
    } catch (error) {
      const errorMsg = error.error || error.message || 'Error cancelling order';
      showMessage(errorMsg, 'danger');
    } finally {
      setShowModal(false);
      setOrderToCancel(null);
    }
  };

  //-----------------------------------------------------------------------------
  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
    setOrderToCancel(null);
  };

  //-----------------------------------------------------------------------------
  // Render the order history
  return (
    <div>
      {!user ? (
        <Alert variant="info" className="m-3">
          <i className="bi bi-info-circle me-2"></i>
          Please log in to view your order history.
        </Alert>
      ) : orders.length === 0 ? (
        <Alert variant="light" className="m-3 text-center">
          <i className="bi bi-cart-x" style={{ fontSize: '2rem', color: '#6b7280' }}></i>
          <p className="text-muted mt-2 mb-0 small">No orders yet. Your orders will appear here after you place them.</p>
        </Alert>
      ) : (
        <Row className="g-4">
          {sortedOrders.map((order) => (
            <Col key={order.id} xs={12} md={6} lg={4}>
              <OrderConfigurator
                selectedDish={getOrderDish(order)}
                selectedIngredients={getOrderIngredientIds(order)}
                setSelectedIngredients={() => {}} // No-op for read-only
                ingredients={ingredients}
                onSubmitOrder={() => {}} // No-op for read-only
                showMessage={showMessage}
                user={user}
                readOnly={true}
                orderDate={dayjs(order.order_date).format('MMM DD, YYYY HH:mm')}
                title={`Order #${order.id}`}
                totalPriceOverride={parseFloat(order.total_price)}
                onCancelOrder={handleCancelOrderClick}
                order={order}
              />
            </Col>
          ))}
        </Row>
      )}

      {/* Cancel confirmation modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton style={{ background: 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)', color: 'white', border: 'none' }}>
          <Modal.Title>
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Confirm Order Cancellation
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {orderToCancel && (
            <div>
              <p className="mb-3">Are you sure you want to cancel this order? This action cannot be undone.</p>
              <div className="bg-light p-3 rounded">
                <div className="fw-bold text-capitalize mb-2">
                  <i className="bi bi-receipt me-1"></i>
                  {orderToCancel.dish_size} {orderToCancel.dish_name}
                </div>
                <div className="text-muted small mb-2">
                  <i className="bi bi-calendar me-1"></i>
                  {dayjs(orderToCancel.order_date).format('MMM DD, YYYY HH:mm')}
                </div>
                <div className="fw-bold text-success">
                  Total: €{parseFloat(orderToCancel.total_price).toFixed(2)}
                </div>
                {orderToCancel.ingredients && orderToCancel.ingredients.length > 0 && (
                  <div className="mt-2">
                    <small className="text-muted">Ingredients: </small>
                    {orderToCancel.ingredients.map((ingredient, index) => (
                      <Badge 
                        key={index}
                        bg="secondary" 
                        className="me-1"
                        style={{ fontSize: '0.7rem' }}
                      >
                        {ingredient}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="outline-secondary" onClick={handleCloseModal} style={{ borderRadius: '20px' }}>
            Keep Order
          </Button>
          <Button variant="danger" onClick={handleConfirmCancel} style={{ borderRadius: '20px' }}>
            <i className="bi bi-x-circle me-1"></i>
            Cancel Order
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

//-----------------------------------------------------------------------------
export default OrderHistory;
