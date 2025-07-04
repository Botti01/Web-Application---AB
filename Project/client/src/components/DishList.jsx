import { useState, useEffect } from 'react';
import { ListGroup, Badge, Card } from 'react-bootstrap';
import API from '../API';

function DishList({ dishes, setDishes, onSelectDish, selectedDish, showMessage, selectedIngredients = [], readOnly = false }) {
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

  // Reset selections when selectedDish becomes null (after order completion or logout)
  useEffect(() => {
    if (!selectedDish) {
      setSelectedDishType('');
      setSelectedSize('');
    }
  }, [selectedDish]);

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
    if (readOnly || !onSelectDish) return;
    
    setSelectedDishType(type);
    // Don't reset size selection when changing dish type
    // If size is already selected, update the dish selection immediately
    if (selectedSize) {
      const dishData = getSelectedDishData(type, selectedSize);
      if (dishData) {
        onSelectDish(dishData);
      }
    }
    // Don't auto-select Medium anymore - let user choose explicitly
  };

  // Handle size selection
  const handleSizeSelect = (size) => {
    if (readOnly || !onSelectDish) return;
    
    // Check if we can change to this size based on current ingredients
    if (selectedDishType && selectedIngredients.length > 0) {
      const newDishData = getSelectedDishData(selectedDishType, size);
      if (newDishData && selectedIngredients.length > newDishData.max_ingredients) {
        const currentSize = selectedSize;
        const ingredientsToRemove = selectedIngredients.length - newDishData.max_ingredients;
        showMessage(
          `Cannot change to ${size} size. Please remove ${ingredientsToRemove} ingredient${ingredientsToRemove > 1 ? 's' : ''} first. ${size} ${selectedDishType} can have maximum ${newDishData.max_ingredients} ingredients.`,
          'warning'
        );
        return; // Don't change the size
      }
    }
    
    setSelectedSize(size);
    // Only update dish selection if dish type is already selected
    if (selectedDishType) {
      const dishData = getSelectedDishData(selectedDishType, size);
      if (dishData) {
        onSelectDish(dishData);
      }
    }
  };

  // Get max ingredients for display when no dish is selected
  const getMaxIngredientsForDisplay = (dishType, size) => {
    if (dishType && size) {
      const dish = dishes.find(d => d.name === dishType && d.size === size);
      return dish ? dish.max_ingredients : 0;
    }
    // When no specific dish is selected, show max ingredients for the size across all dish types
    if (size) {
      const dish = dishes.find(d => d.size === size);
      return dish ? dish.max_ingredients : 0;
    }
    return 0;
  };

  //-----------------------------------------------------------------------------
  // Render the list of dishes
  return (
    <div>
      {/* Header for the dishes section */}
      <div className="p-3 rounded-top text-white shadow-sm mb-3" style={{ position: 'relative', zIndex: 10, background: 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)' }}>
        <h5 className="mb-0 fw-bold">
          <i className="bi bi-menu-button-wide me-2"></i> 
          Menu {readOnly && <span className="small">(Browse Only)</span>}
        </h5>
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
                    cursor: readOnly ? 'default' : 'pointer',
                    background: isSelected 
                      ? 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)'
                      : '#ffffff',
                    color: isSelected ? 'white' : 'inherit',
                    opacity: readOnly ? 0.8 : 1
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
                  {isSelected && (
                    <div className="text-end">
                      <Badge 
                        bg="warning" 
                        className="text-dark"
                      >
                        Selected
                      </Badge>
                    </div>
                  )}
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </Card>

        {/* Size selection - always show */}
        <Card className="border-0">
          <Card.Header style={{ backgroundColor: '#e9ecef' }}>
            <h6 className="mb-0 text-capitalize fw-bold">
              <i className="bi bi-arrows-angle-expand me-2"></i>
              {selectedDishType ? `Choose Size for ${selectedDishType}` : 'Choose Size'}
            </h6>
          </Card.Header>
          <ListGroup variant="flush">
            {sizes.map(size => {
              const isSelected = selectedSize === size;
              const dishData = selectedDishType ? getSelectedDishData(selectedDishType, size) : null;
              const maxIngredients = getMaxIngredientsForDisplay(selectedDishType, size);
              return (
                <ListGroup.Item
                  key={size}
                  className="d-flex justify-content-between align-items-center border-0"
                  style={{ 
                    cursor: readOnly ? 'default' : 'pointer',
                    background: isSelected 
                      ? 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)'
                      : '#ffffff',
                    color: isSelected ? 'white' : 'inherit',
                    opacity: readOnly ? 0.8 : 1
                  }}
                  onClick={() => handleSizeSelect(size)}
                >
                  <div>
                    <div className="fw-bold fs-6 mb-1">
                      {size} {selectedDishType || 'dish'}
                    </div>
                    <div className={`small ${isSelected ? 'text-light' : 'text-muted'}`}>
                      <i className="bi bi-plus-circle me-1"></i>
                      Max {maxIngredients} ingredients
                    </div>
                  </div>
                  <div className="text-end">
                    <Badge 
                      bg={isSelected ? "warning" : "success"} 
                      className={`${isSelected ? 'text-dark' : 'text-white'}`}
                    >
                      {dishData ? `€${dishData.price.toFixed(2)}` : (
                        dishes.find(d => d.size === size) ? 
                          `€${dishes.find(d => d.size === size).price.toFixed(2)}` : 
                          'Select dish type'
                      )}
                    </Badge>
                  </div>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </Card>
      </div>
    </div>
  );
}

//-----------------------------------------------------------------------------
export default DishList;
