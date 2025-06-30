import { useState, useEffect } from 'react';
import { ListGroup, Badge, Card } from 'react-bootstrap';
import API from '../API';

function DishList({ dishes, setDishes, onSelectDish, selectedDish, showMessage }) {
  const [selectedDishType, setSelectedDishType] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  // Load dishes on mount
  useEffect(() => {
    const refreshDishes = async () => {
      try {
        const dishesData = await API.getDishes();
        setDishes(dishesData);
      } catch (error) {
        showMessage('Error loading dishes', 'danger');
      }
    };
    
    refreshDishes();
  }, [setDishes, showMessage]);

  // Get unique dish types
  const dishTypes = [...new Set(dishes.map(dish => dish.name))];
  
  // Available sizes
  const sizes = ['Small', 'Medium', 'Large'];

  // Get the specific dish based on type and size selection
  const getSelectedDishData = (type, size) => {
    return dishes.find(dish => dish.name === type && dish.size === size);
  };

  // Handle dish type selection
  const handleDishTypeSelect = (type) => {
    setSelectedDishType(type);
    // Reset size selection when changing dish type
    setSelectedSize('');
    // Clear the selected dish since no size is selected
    onSelectDish(null);
  };

  // Handle size selection
  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    // Only update dish selection if dish type is already selected
    if (selectedDishType) {
      const dishData = getSelectedDishData(selectedDishType, size);
      if (dishData) {
        onSelectDish(dishData);
      }
    }
  };

  // Group dishes by name for display - keeping original structure
  const groupedDishes = dishes.reduce((acc, dish) => {
    if (!acc[dish.name]) {
      acc[dish.name] = [];
    }
    acc[dish.name].push(dish);
    return acc;
  }, {});

  // Render the list of dishes
  return (
    <div>
      {/* Header for the dishes section */}
      <div className="p-3 rounded-top text-white shadow-sm mb-3" style={{ position: 'relative', zIndex: 10, background: 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)' }}>
        <h5 className="mb-0 fw-bold"><i className="bi bi-menu-button-wide me-2"></i> Menu</h5>
      </div>
      
      {/* Display dish types for selection */}
      <div className="shadow-sm">
        <Card className="mb-3 border-0">
          <Card.Header style={{ backgroundColor: '#e9ecef' }}>
            <h6 className="mb-0 text-capitalize fw-bold">
              <i className="bi bi-circle me-2"></i>
              Choose Your Dish
            </h6>
          </Card.Header>
          <ListGroup variant="flush">
            {dishTypes.map(type => {
              const isSelected = selectedDishType === type;
              return (
                <ListGroup.Item
                  key={type}
                  className="d-flex justify-content-between align-items-center border-0"
                  style={{ 
                    cursor: 'pointer',
                    background: isSelected 
                      ? 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)'
                      : '#ffffff',
                    color: isSelected ? 'white' : 'inherit'
                  }}
                  onClick={() => handleDishTypeSelect(type)}
                >
                  <div>
                    <div className="fw-bold fs-6 mb-1">
                      <i className={`bi ${type === 'pizza' ? 'bi-circle' : type === 'pasta' ? 'bi-egg-fried' : 'bi-bowl'} me-2`}></i>
                      <span className="text-capitalize">{type}</span>
                    </div>
                    <div className={`small ${isSelected ? 'text-light' : 'text-muted'}`}>
                      <i className="bi bi-plus-circle me-1"></i>
                      Available in all sizes
                    </div>
                  </div>
                  <div className="text-end">
                    <Badge 
                      bg={isSelected ? "warning" : "success"} 
                      className={`${isSelected ? 'text-dark' : 'text-white'}`}
                    >
                      {isSelected ? 'Selected' : 'Available'}
                    </Badge>
                  </div>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </Card>

        {/* Size selection - show when dish type is selected */}
        {(
          <Card className="border-0">
            <Card.Header style={{ backgroundColor: '#e9ecef' }}>
              <h6 className="mb-0 text-capitalize fw-bold">
                <i className="bi bi-arrows-angle-expand me-2"></i>
                Choose Size for {selectedDishType}
              </h6>
            </Card.Header>
            <ListGroup variant="flush">
              {sizes.map(size => {
                const isSelected = selectedSize === size;
                const dishData = getSelectedDishData(selectedDishType, size);
                return (
                  <ListGroup.Item
                    key={size}
                    className="d-flex justify-content-between align-items-center border-0"
                    style={{ 
                      cursor: 'pointer',
                      background: isSelected 
                        ? 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)'
                        : '#ffffff',
                      color: isSelected ? 'white' : 'inherit'
                    }}
                    onClick={() => handleSizeSelect(size)}
                  >
                    <div>
                      <div className="fw-bold fs-6 mb-1">{size} {selectedDishType}</div>
                      <div className={`small ${isSelected ? 'text-light' : 'text-muted'}`}>
                        <i className="bi bi-plus-circle me-1"></i>
                        Max {dishData?.max_ingredients || 0} ingredients
                      </div>
                    </div>
                    <div className="text-end">
                      <Badge 
                        bg={isSelected ? "warning" : "success"} 
                        className={`${isSelected ? 'text-dark' : 'text-white'}`}
                      >
                        €{dishData?.price?.toFixed(2) || '0.00'}
                      </Badge>
                    </div>
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          </Card>
        )}
      </div>
    </div>
  );
}

//-----------------------------------------------------------------------------
export default DishList;
