import { useEffect } from 'react';
import { ListGroup, Badge, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import API from '../API';

function IngredientList({ ingredients, setIngredients, selectedIngredients, onToggleIngredient, showMessage, disabled = false }) {

  //-----------------------------------------------------------------------------
  // Load ingredients on mount and when ingredients prop changes
  useEffect(() => {
    const refreshIngredients = async () => {
      try {
        const ingredientsData = await API.getIngredients();
        setIngredients(ingredientsData);
      } catch (error) {
        showMessage('Error loading ingredients', 'danger');
      }
    };
    
    refreshIngredients();
  }, [setIngredients, showMessage]);

  // Enhanced effect to handle when ingredients are updated externally
  useEffect(() => {
    // Check if any selected ingredients are no longer available
    const unavailableSelected = selectedIngredients.filter(selectedId => {
      const ingredient = ingredients.find(ing => ing.id === selectedId);
      return ingredient && ingredient.current_availability !== null && ingredient.current_availability <= 0;
    });
    
    // If any selected ingredients are no longer available, remove them automatically
    if (unavailableSelected.length > 0) {
      unavailableSelected.forEach(ingredientId => {
        const ingredient = ingredients.find(ing => ing.id === ingredientId);
        if (ingredient) {
          // Use onToggleIngredient to remove the ingredient (this will trigger the removal logic)
          setTimeout(() => onToggleIngredient(ingredientId), 0);
        }
      });
    }
  }, [ingredients]); // Only depend on ingredients, not selectedIngredients to avoid infinite loops

  //-----------------------------------------------------------------------------
  // Helper function to check if ingredient is available
  const isIngredientAvailable = (ingredient) => {
    return ingredient.current_availability === null || ingredient.current_availability > 0;
  };

  //-----------------------------------------------------------------------------
  // Helper function to check if ingredient can be selected
  const canSelectIngredient = (ingredient) => {
    if (disabled) return false;
    if (!isIngredientAvailable(ingredient)) return false;
    
    const isSelected = selectedIngredients.includes(ingredient.id);
    if (isSelected) {
      // Check if removing this ingredient would break dependencies for others
      const wouldBreakDependencies = selectedIngredients.some(otherIngredientId => {
        if (otherIngredientId === ingredient.id) return false;
        const otherIngredient = ingredients.find(ing => ing.id === otherIngredientId);
        return otherIngredient?.dependencies?.includes(ingredient.name);
      });
      return !wouldBreakDependencies;
    }
    
    // For adding: check if all dependencies are already selected
    const missingDependencies = ingredient.dependencies?.filter(depName => {
      const depIngredient = ingredients.find(ing => ing.name === depName);
      return !selectedIngredients.includes(depIngredient?.id);
    }) || [];
    
    if (missingDependencies.length > 0) {
      return false; // Cannot select if dependencies are missing
    }
    
    // Check incompatibilities
    for (const selectedId of selectedIngredients) {
      const selectedIngredient = ingredients.find(ing => ing.id === selectedId);
      if (selectedIngredient && selectedIngredient.incompatibilities?.includes(ingredient.name)) {
        return false;
      }
    }
    
    return true;
  };

  //-----------------------------------------------------------------------------
  // Create tooltip content for ingredient constraints
  const getTooltipContent = (ingredient) => {
    const constraints = [];
    
    if (ingredient.dependencies && ingredient.dependencies.length > 0) {
      constraints.push(`Requires: ${ingredient.dependencies.join(', ')}`);
    }
    
    if (ingredient.incompatibilities && ingredient.incompatibilities.length > 0) {
      constraints.push(`Incompatible with: ${ingredient.incompatibilities.join(', ')}`);
    }
    
    // if (ingredient.current_availability !== null) {
    //   constraints.push(`Available: ${ingredient.current_availability}`);
    // } else {
    //   constraints.push('Unlimited availability');
    // }

    // // Add selection hint for dependencies
    // const isSelected = selectedIngredients.includes(ingredient.id);
    // if (!isSelected && ingredient.dependencies && ingredient.dependencies.length > 0) {
    //   const missingDependencies = ingredient.dependencies.filter(depName => {
    //     const depIngredient = ingredients.find(ing => ing.name === depName);
    //     return !selectedIngredients.includes(depIngredient?.id);
    //   });
    //   if (missingDependencies.length > 0) {
    //     constraints.push(`⚠️ Add first: ${missingDependencies.join(', ')}`);
    //   }
    // }
    
    return constraints.join('\n');
  };

  //-----------------------------------------------------------------------------
  // Render the list of ingredients
  return (
    <div>
      {/* Header for the ingredients section */}
      <div className="p-3 rounded-top text-white shadow-sm" style={{ position: 'relative', zIndex: 10, background: 'linear-gradient(90deg, #059669 0%, #10b981 100%)' }}>
        <h5 className="mb-0 fw-bold"><i className="bi bi-basket me-2"></i> Ingredients</h5>
      </div>
      
      {/* Message when no dish is selected */}
      {disabled && (
        <div className="p-4 text-center bg-light border-bottom">
          <i className="bi bi-arrow-left text-muted" style={{ fontSize: '2rem' }}></i>
          <p className="text-muted mt-2 mb-0">
            <strong>Please select a dish first</strong><br/>
            Choose a dish from the menu to start adding ingredients
          </p>
        </div>
      )}
      
      {/* List of ingredients */}
      <ListGroup variant="flush" className="shadow-sm">
        {ingredients.map(ingredient => {
          const isSelected = selectedIngredients.includes(ingredient.id);
          const canSelect = canSelectIngredient(ingredient);
          const isAvailable = isIngredientAvailable(ingredient);
          
          return (
            <ListGroup.Item
              key={ingredient.id}
              className="d-flex justify-content-between align-items-center border-0"
              style={{ 
                background: isSelected 
                  ? 'linear-gradient(90deg, #059669 0%, #10b981 100%)'
                  : isAvailable ? '#ffffff' : '#f3f4f6',
                color: isSelected ? 'white' : isAvailable ? 'inherit' : '#6b7280',
                opacity: disabled ? 0.6 : 1
              }}
            >
              <div className="flex-grow-1">
                <div className="fw-bold fs-6 mb-1">
                  {ingredient.name}
                  {(ingredient.dependencies?.length > 0 || ingredient.incompatibilities?.length > 0) && (
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>{getTooltipContent(ingredient)}</Tooltip>}
                    >
                      <i className={`bi bi-info-circle ms-2 ${isSelected ? 'text-light' : 'text-muted'}`}></i>
                    </OverlayTrigger>
                  )}
                </div>
                <div className={`small ${isSelected ? 'text-light' : 'text-muted'}`}>
                  <span>€{ingredient.price.toFixed(2)}</span>
                  {ingredient.current_availability !== null && (
                    <span className="ms-2">
                      <i className="bi bi-box me-1"></i>
                      {ingredient.current_availability} left
                    </span>
                  )}
                </div>
              </div>
              
              <div className="text-end">
                <Button
                  variant={isSelected ? "warning" : "outline-success"}
                  size="sm"
                  disabled={!canSelect || disabled}
                  onClick={() => onToggleIngredient(ingredient.id)}
                  className={isSelected ? 'text-dark' : ''}
                >
                  {isSelected ? (
                    <><i className="bi bi-dash-circle me-1"></i>Remove</>
                  ) : (
                    <><i className="bi bi-plus-circle me-1"></i>Add</>
                  )}
                </Button>
              </div>
            </ListGroup.Item>
          );
        })}
      </ListGroup>
    </div>
  );
}

//-----------------------------------------------------------------------------
export default IngredientList;
