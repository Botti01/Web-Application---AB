import { useEffect } from 'react';
import dayjs from 'dayjs';
import { ListGroup, Badge, Button, Card, Alert } from 'react-bootstrap';
import API from '../API';

function OrderHistory({ orders, setOrders, showMessage, user, onCancelOrder }) {

  //-----------------------------------------------------------------------------
  // Load orders on mount
  useEffect(() => {
    const refreshOrders = async () => {
      if (!user) return;
      
      try {
        const ordersData = await API.getOrders();
        setOrders(ordersData);
      } catch (error) {
        showMessage('Error loading orders', 'danger');
      }
    };
    
    refreshOrders();
  }, [setOrders, showMessage, user]);

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
  // Render the order history
  return (
    <div>
      {/* Header for the orders section */}
      <div className="p-3 rounded-top text-white shadow-sm" style={{ position: 'relative', zIndex: 10, background: 'linear-gradient(90deg, #7c3aed 0%, #a855f7 100%)' }}>
        <h5 className="mb-0 fw-bold"><i className="bi bi-clock-history me-2"></i> Order History</h5>
      </div>
      
      {!user ? (
        <Alert variant="info" className="m-3">
          <i className="bi bi-info-circle me-2"></i>
          Please log in to view your order history.
        </Alert>
      ) : orders.length === 0 ? (
        <Alert variant="light" className="m-3 text-center">
          <i className="bi bi-cart-x" style={{ fontSize: '3rem', color: '#6b7280' }}></i>
          <p className="text-muted mt-2 mb-0">No orders yet. Start by placing your first order!</p>
        </Alert>
      ) : (
        <ListGroup variant="flush" className="shadow-sm">
          {sortedOrders.map(order => (
            <ListGroup.Item key={order.id} className="border-0 p-0">
              <Card className="border-0 border-bottom rounded-0">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h6 className="fw-bold mb-1 text-capitalize">
                        <i className="bi bi-receipt me-2"></i>
                        {order.dish_size} {order.dish_name}
                      </h6>
                      <small className="text-muted">
                        <i className="bi bi-calendar me-1"></i>
                        {dayjs(order.order_date).format('MMM DD, YYYY HH:mm')}
                      </small>
                    </div>
                    <div className="text-end">
                      <Badge bg="success" className="fs-6 mb-2">
                        €{parseFloat(order.total_price).toFixed(2)}
                      </Badge>
                      {user.canDoTotp && user.isTotp && (
                        <div>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleCancelOrder(order.id)}
                          >
                            <i className="bi bi-x-circle me-1"></i>Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Order ingredients */}
                  {order.ingredients && order.ingredients.length > 0 && (
                    <div>
                      <small className="text-muted fw-bold">Ingredients:</small>
                      <div className="mt-1">
                        {order.ingredients.map((ingredient, index) => (
                          <Badge 
                            key={index}
                            bg="light" 
                            text="dark" 
                            className="me-1 mb-1"
                          >
                            {ingredient}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {(!user.canDoTotp || !user.isTotp) && (
                    <small className="text-muted fst-italic d-block mt-2">
                      <i className="bi bi-shield-lock me-1"></i>
                      TOTP authentication required to cancel orders
                    </small>
                  )}
                </Card.Body>
              </Card>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  );
}

//-----------------------------------------------------------------------------
export default OrderHistory;
