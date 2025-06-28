import { useState } from 'react';
import { Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router';

function LoginForm({ onLogin, totpRequired, onTotp, onSkipTotp }) {

  // state for the username/email
  const [username, setUsername] = useState('');
  // state for the password
  const [password, setPassword] = useState('');
  // state for the TOTP code
  const [totpCode, setTotpCode] = useState('');
  // state for error messages
  const [errorMessage, setErrorMessage] = useState('');
  // state for loading state during submission
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  // ###########################################################################
  // HANDLERS
  // ###########################################################################

  // Handle form submission for login or TOTP verification
  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage(''); // Clear any previous errors
    setIsLoading(true);
    
    try {
      if (totpRequired) {
        await onTotp(totpCode);
      } else {
        const credentials = { username, password };
        await onLogin(credentials);
      }
    } catch (error) {
      // Set appropriate error message based on the type of login
      if (totpRequired) {
        setErrorMessage('Invalid TOTP code. Please try again.');
      } else {
        setErrorMessage('Invalid username or password. Please check your credentials and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  //-----------------------------------------------------------------------------
  // Clear error message when user starts typing
  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    if (errorMessage) setErrorMessage('');
  };

  //-----------------------------------------------------------------------------
  // Handle password change
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errorMessage) setErrorMessage('');
  };

  //-----------------------------------------------------------------------------
  // Handle TOTP code change
  const handleTotpChange = (e) => {
    setTotpCode(e.target.value);
    if (errorMessage) setErrorMessage('');
  };

  //-----------------------------------------------------------------------------
  // Render the login form
  return (
    <Row className="justify-content-center px-3 py-4">
        <div className="card shadow-lg border-0" style={{ background: '#ffffff', borderRadius: '20px' }}>
          <div className="card-body p-5">
            <div className="text-center mb-4">
              <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px', background: 'linear-gradient(45deg, #dc2626, #ef4444)' }}>
                <i className={`bi ${totpRequired ? 'bi-shield-lock-fill' : 'bi-shop'} text-white`} style={{ fontSize: '2rem' }}></i>
              </div>
              <h2 className="fw-bold" style={{ color: '#dc2626' }}>
                {totpRequired ? 'Two-Factor Authentication' : 'Restaurant Login'}
              </h2>
              <p className="text-muted mb-0">
                {totpRequired 
                  ? 'Enter your 6-digit TOTP code to complete authentication'
                  : 'Sign in to place orders and manage your account'
                }
              </p>
            </div>
            <Form onSubmit={handleSubmit}>
              {/* Display error messages */}
              {errorMessage && (
                <Alert variant="danger" onClose={() => setErrorMessage('')} dismissible className="border-0 shadow-sm">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {errorMessage}
                </Alert>
              )}
              {!totpRequired ? (
                <>
                  {/* Username input */}
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold text-dark">
                      <i className="bi bi-person-fill me-2"></i>Email
                    </Form.Label>
                    <Form.Control
                      type="email"
                      value={username}
                      onChange={handleUsernameChange}
                      placeholder="Enter your email address"
                      required
                      disabled={isLoading}
                      className="border-0 shadow-sm"
                      style={{ borderRadius: '10px', padding: '12px 16px', background: '#f8fafc' }}
                    />
                  </Form.Group>
                  {/* Password input */}
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold text-dark">
                      <i className="bi bi-lock-fill me-2"></i>Password
                    </Form.Label>
                    <Form.Control
                      type="password"
                      value={password}
                      onChange={handlePasswordChange}
                      placeholder="Enter your password"
                      required
                      disabled={isLoading}
                      className="border-0 shadow-sm"
                      style={{ borderRadius: '10px', padding: '12px 16px', background: '#f8fafc' }}
                    />
                  </Form.Group>
                </>
              ) : (
                <>
                  {/* TOTP Code input */}
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold text-dark">
                      <i className="bi bi-key-fill me-2"></i>TOTP Code
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={totpCode}
                      onChange={handleTotpChange}
                      placeholder="000000"
                      required
                      disabled={isLoading}
                      className="border-0 shadow-sm text-center"
                      style={{ borderRadius: '10px', padding: '12px 16px', background: '#f8fafc', fontSize: '1.5rem', letterSpacing: '0.3rem' }}
                      maxLength={6}
                      pattern="[0-9]{6}"
                    />
                  </Form.Group>
                  <div className="alert alert-info border-0 shadow-sm mb-4" style={{ borderRadius: '10px' }}>
                    <i className="bi bi-info-circle-fill me-2"></i>
                    <small>
                      Complete 2FA authentication to unlock order cancellation privileges, or skip to continue with standard access.
                    </small>
                  </div>
                </>
              )}
              {/* Submit button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-100 fw-bold border-0 shadow-sm mb-3"
                size="lg"
                style={{ 
                  borderRadius: '10px',
                  background: 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)',
                  padding: '12px'
                }}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {totpRequired ? 'Verifying...' : 'Signing In...'}
                  </>
                ) : (
                  <>
                    <i className={`bi ${totpRequired ? 'bi-shield-check' : 'bi-box-arrow-in-right'} me-2`}></i>
                    {totpRequired ? 'Verify TOTP' : 'Sign In'}
                  </>
                )}
              </Button>
              
              {/* Skip TOTP button */}
              {totpRequired && onSkipTotp && (
                <Button
                  variant="outline-warning"
                  onClick={() => onSkipTotp()}
                  disabled={isLoading}
                  className="w-100 fw-bold border-2 mb-3"
                  size="lg"
                  style={{ 
                    borderRadius: '10px',
                    padding: '12px'
                  }}
                >
                  <i className="bi bi-skip-forward me-2"></i>
                  Skip 2FA (Limited Access)
                </Button>
              )}
              
              {/* Back to menu button */}
              <Button
                variant="outline-secondary"
                onClick={() => navigate('/')}
                disabled={isLoading}
                className="w-100 fw-bold border-2"
                size="lg"
                style={{ 
                  borderRadius: '10px',
                  padding: '12px'
                }}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Back to Menu
              </Button>
            </Form>
          </div>
        </div>
    </Row>
  );
}

//-----------------------------------------------------------------------------
export default LoginForm;

