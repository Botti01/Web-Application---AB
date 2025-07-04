import { Navbar, Nav, Button, Container } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';

function NavigationBar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Navbar style={{ background: 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)' }} variant="dark" expand="lg" fixed="top" className="shadow-lg">
      <Container>
        {/* App title */}
        <Navbar.Brand href="/" className="fw-bold fs-4">
          <i className="bi bi-shop me-2"></i>
          Restaurant Orders
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {user ? (
              <>
                {/* Navigation buttons for authenticated users */}
                {location.pathname === '/orders' ? (
                  <Button 
                    variant="outline-light" 
                    size="sm"
                    onClick={() => navigate('/')} 
                    className="me-3"
                    style={{ borderRadius: '20px' }}
                  >
                    <i className="bi bi-arrow-left me-1"></i>
                    Back to Menu
                  </Button>
                ) : (
                  <Button 
                    variant="outline-light" 
                    size="sm"
                    onClick={() => navigate('/orders')} 
                    className="me-3"
                    style={{ borderRadius: '20px' }}
                  >
                    <i className="bi bi-clock-history me-1"></i>
                    Order History
                  </Button>
                )}
                
                {/* Display user information */}
                <Nav.Link disabled className="text-light me-3">
                  <i className="bi bi-person-circle me-1"></i>
                  Welcome, <span className="fw-bold">{user.name}</span>
                  {user.canDoTotp && user.isTotp && (
                    <span className="badge bg-success text-white ms-2">
                      <i className="bi bi-shield-check me-1"></i>
                      2FA
                    </span>
                  )}
                  {user.canDoTotp && !user.isTotp && (
                    <span className="badge bg-warning text-dark ms-2">
                      <i className="bi bi-shield-exclamation me-1"></i>
                      Limited
                    </span>
                  )}
                </Nav.Link>
                
                {/* TOTP button for users who can do TOTP but haven't authenticated */}
                {user.canDoTotp && !user.isTotp && (
                  <Button 
                    variant="outline-warning" 
                    size="sm"
                    onClick={() => navigate('/login')} 
                    className="me-2"
                    style={{ borderRadius: '20px' }}
                  >
                    <i className="bi bi-shield-lock me-1"></i>
                    Complete 2FA
                  </Button>
                )}
                
                {/* Logout button */}
                <Button variant="outline-light" onClick={onLogout} style={{ borderRadius: '20px' }}>
                  <i className="bi bi-box-arrow-right me-1"></i>
                  Logout
                </Button>
              </>
            ) : (
              // Login button for unauthenticated users
              <Button variant="outline-light" onClick={() => navigate('/login')} style={{ borderRadius: '20px' }}>
                <i className="bi bi-box-arrow-in-right me-1"></i>
                Login
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;
