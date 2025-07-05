import { Navbar, Nav, Button, Container } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';

function NavigationBar({ user, onLogout, onComplete2FA }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Navbar style={{ background: 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)' }} variant="dark" expand="lg" fixed="top" className="shadow-lg">
      <Container fluid className="px-3">
        {/* Left side: App title and Order History button */}
        <div className="d-flex align-items-center">
          <Navbar.Brand href="/" className="fw-bold fs-4 me-2">
            <i className="bi bi-shop me-2"></i>
            My Restaurant
          </Navbar.Brand>
          
          {/* Order History button - only show for authenticated users */}
          {user && (
            <>
              {location.pathname === '/orders' ? (
                <Button 
                  variant="outline-light" 
                  size="sm"
                  onClick={() => navigate('/')} 
                  style={{ borderRadius: '20px' }}
                  className="ms-2"
                >
                  <i className="bi bi-arrow-left me-1"></i>
                  Back to Menu
                </Button>
              ) : (
                <Button 
                  variant="outline-light" 
                  size="sm"
                  onClick={() => navigate('/orders')} 
                  style={{ borderRadius: '20px' }}
                  className="ms-2"
                >
                  <i className="bi bi-clock-history me-1"></i>
                  Order History
                </Button>
              )}
            </>
          )}
        </div>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          {/* Right side: User info and Login/Logout */}
          <Nav className="ms-auto">
            {user ? (
              <div className="d-flex align-items-center">
                {/* Display user information */}
                <span className="text-light me-3">
                  <i className="bi bi-person-circle me-1"></i>
                  Welcome, <span className="fw-bold">{user.name}</span>
                  {user.isTotp && (
                    <span className="badge bg-success text-white ms-2">
                      <i className="bi bi-shield-check me-1"></i>
                      2FA
                    </span>
                  )}
                  {!user.isTotp && (
                    <span className="badge bg-warning text-dark ms-2">
                      <i className="bi bi-shield-exclamation me-1"></i>
                      Limited
                    </span>
                  )}
                </span>
                
                {/* TOTP button for users who haven't authenticated with 2FA */}
                {!user.isTotp && (
                  <Button 
                    variant="outline-warning" 
                    size="sm"
                    onClick={onComplete2FA} 
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
              </div>
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
