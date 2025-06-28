import { useEffect } from 'react';
import { ListGroup, Badge, Card } from 'react-bootstrap';
import API from '../API';

function DishList({ dishes, setDishes, onSelectDish, selectedDish, showMessage }) {

  //-----------------------------------------------------------------------------
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

  // Group dishes by name for better display
  const groupedDishes = dishes.reduce((acc, dish) => {
    if (!acc[dish.name]) {
      acc[dish.name] = [];
    }
    acc[dish.name].push(dish);
    return acc;
  }, {});

  //-----------------------------------------------------------------------------
  // Render the list of dishes
  return (
    <div>
      {/* Header for the dishes section */}
      <div className="p-3 rounded-top text-white shadow-sm" style={{ position: 'relative', zIndex: 10, background: 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)' }}>
        <h5 className="mb-0 fw-bold"><i className="bi bi-menu-button-wide me-2"></i> Menu</h5>
      </div>
      
      {/* Display dishes grouped by type */}
      <div className="shadow-sm">
        {Object.entries(groupedDishes).map(([dishName, dishVariants]) => (
          <Card key={dishName} className="mb-3 border-0">
            <Card.Header className="bg-light">
              <h6 className="mb-0 text-capitalize fw-bold">
                <i className={`bi ${dishName === 'pizza' ? 'bi-circle' : dishName === 'pasta' ? 'bi-bowl' : 'bi-basket'} me-2`}></i>
                {dishName}
              </h6>
            </Card.Header>
            <ListGroup variant="flush">
              {dishVariants.map(dish => {
                const isSelected = selectedDish && selectedDish.id === dish.id;
                return (
                  <ListGroup.Item
                    key={dish.id}
                    className="d-flex justify-content-between align-items-center border-0"
                    style={{ 
                      cursor: 'pointer',
                      background: isSelected 
                        ? 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)'
                        : '#ffffff',
                      color: isSelected ? 'white' : 'inherit'
                    }}
                    onClick={() => onSelectDish(dish)}
                  >
                    <div>
                      <div className="fw-bold fs-6 mb-1">{dish.size} {dish.name}</div>
                      <div className={`small ${isSelected ? 'text-light' : 'text-muted'}`}>
                        <i className="bi bi-plus-circle me-1"></i>
                        Max {dish.max_ingredients} ingredients
                      </div>
                    </div>
                    <div className="text-end">
                      <Badge 
                        bg={isSelected ? "warning" : "success"} 
                        className={`${isSelected ? 'text-dark' : 'text-white'}`}
                      >
                        €{dish.price.toFixed(2)}
                      </Badge>
                    </div>
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          </Card>
        ))}
      </div>
    </div>
  );
}

//-----------------------------------------------------------------------------
export default DishList;
