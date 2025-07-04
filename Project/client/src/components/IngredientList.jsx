import { useEffect } from 'react';
import { ListGroup, Badge } from 'react-bootstrap';
import API from '../API';

function IngredientList({ ingredients, setIngredients, selectedIngredients, onToggleIngredient, showMessage, disabled = false, readOnly = false }) {

  //-----------------------------------------------------------------------------
  // Load ingredients on mount
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
  // Helper function to check constraints when trying to add an ingredient
  const checkConstraintsForAdding = (ingredient) => {
    // Check if all dependencies are already selected
    const missingDependencies = ingredient.dependencies?.filter(depName => {
      const depIngredient = ingredients.find(ing => ing.name === depName);
      return !selectedIngredients.includes(depIngredient?.id);
    }) || [];

    if (missingDependencies.length > 0) {
      return {
        canAdd: false,
        message: `${ingredient.name} requires these ingredients first: ${missingDependencies.join(', ')}`
      };
    }

    // Check incompatibilities with already selected ingredients
    for (const selectedId of selectedIngredients) {
      const selectedIngredient = ingredients.find(ing => ing.id === selectedId);
      if (selectedIngredient && selectedIngredient.incompatibilities?.includes(ingredient.name)) {
        return {
          canAdd: false,
          message: `${ingredient.name} is incompatible with ${selectedIngredient.name}. Remove ${selectedIngredient.name} first.`
        };
      }
    }

    // Check if ingredient has incompatibilities with selected ingredients
    if (ingredient.incompatibilities && ingredient.incompatibilities.length > 0) {
      const selectedIncompatible = ingredient.incompatibilities.find(incompatibleName => {
        const incompatibleIngredient = ingredients.find(ing => ing.name === incompatibleName);
        return incompatibleIngredient && selectedIngredients.includes(incompatibleIngredient.id);
      });

      if (selectedIncompatible) {
        return {
          canAdd: false,
          message: `${ingredient.name} is incompatible with ${selectedIncompatible}. Remove ${selectedIncompatible} first.`
        };
      }
    }

    return { canAdd: true, message: null };
  };

  //-----------------------------------------------------------------------------
  // Helper function to check if removing an ingredient would break dependencies
  const checkConstraintsForRemoving = (ingredient) => {
    const wouldBreakDependencies = selectedIngredients.some(otherIngredientId => {
      if (otherIngredientId === ingredient.id) return false;
      const otherIngredient = ingredients.find(ing => ing.id === otherIngredientId);
      return otherIngredient?.dependencies?.includes(ingredient.name);
    });

    if (wouldBreakDependencies) {
      const dependentIngredients = selectedIngredients
        .filter(otherId => otherId !== ingredient.id)
        .map(otherId => ingredients.find(ing => ing.id === otherId))
        .filter(ing => ing?.dependencies?.includes(ingredient.name))
        .map(ing => ing.name);

      return {
        canRemove: false,
        message: `Cannot remove ${ingredient.name} because it's required by: ${dependentIngredients.join(', ')}`
      };
    }

    return { canRemove: true, message: null };
  };

  //-----------------------------------------------------------------------------
  // Handle ingredient button click
  const handleIngredientClick = (ingredient) => {
    if (disabled || readOnly || !onToggleIngredient) {
      if (disabled) {
        showMessage('Please select a dish first before adding ingredients', 'warning');
      }
      return;
    }

    const isSelected = selectedIngredients.includes(ingredient.id);
    const isAvailable = isIngredientAvailable(ingredient);

    // Don't allow selection of unavailable ingredients
    if (!isSelected && !isAvailable) {
      showMessage(`${ingredient.name} is currently out of stock`, 'warning');
      return;
    }

    if (isSelected) {
      // Trying to remove ingredient - check if it would break dependencies
      const constraints = checkConstraintsForRemoving(ingredient);
      if (!constraints.canRemove) {
        showMessage(constraints.message, 'warning');
        return;
      }
      // Remove ingredient
      onToggleIngredient(ingredient.id);
    } else {
      // Trying to add ingredient - check all constraints
      const constraints = checkConstraintsForAdding(ingredient);
      if (!constraints.canAdd) {
        showMessage(constraints.message, 'warning');
        return;
      }
      // Add ingredient
      onToggleIngredient(ingredient.id);
    }
  };

  //-----------------------------------------------------------------------------
  // Helper function to determine if button should be disabled
  const isButtonDisabled = (ingredient) => {
    if (disabled || readOnly) return true;
    if (!isIngredientAvailable(ingredient)) return true;
    return false; // Button is always enabled for available ingredients
  };

  //-----------------------------------------------------------------------------
  // Create constraints display for ingredient
  const getConstraintsDisplay = (ingredient) => {
    const constraints = [];
    
    if (ingredient.dependencies && ingredient.dependencies.length > 0) {
      constraints.push({
        type: 'dependency',
        text: `Requires: ${ingredient.dependencies.join(', ')}`,
        icon: 'bi-arrow-down-circle'
      });
    }
    
    if (ingredient.incompatibilities && ingredient.incompatibilities.length > 0) {
      constraints.push({
        type: 'incompatibility', 
        text: `Incompatible: ${ingredient.incompatibilities.join(', ')}`,
        icon: 'bi-x-circle'
      });
    }
    
    return constraints;
  };

  //-----------------------------------------------------------------------------
  // Render the list of ingredients
  return (
    <div>
      {/* Header for the ingredients section */}
      <div className="p-3 rounded-top text-white shadow-sm" style={{ position: 'relative', zIndex: 10, background: 'linear-gradient(90deg, #059669 0%, #10b981 100%)' }}>
        <h5 className="mb-0 fw-bold">
          <i className="bi bi-basket me-2"></i> 
          Ingredients
        </h5>
      </div>
      
      {/* Message when no dish is selected (but not for read-only mode) */}
      {disabled && !readOnly && (
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
          const isAvailable = isIngredientAvailable(ingredient);
          const buttonDisabled = isButtonDisabled(ingredient);
          const constraints = getConstraintsDisplay(ingredient);
          
          return (
            <ListGroup.Item
              key={ingredient.id}
              className="border-0 px-3"
              style={{ 
                paddingTop: '14px',
                paddingBottom: '14px',
                cursor: buttonDisabled ? 'default' : 'pointer',
                background: isSelected 
                  ? 'linear-gradient(90deg, #059669 0%, #10b981 100%)'
                  : isAvailable ? '#ffffff' : '#f3f4f6',
                color: isSelected ? 'white' : isAvailable ? 'inherit' : '#6b7280',
                opacity: disabled ? 0.6 : (readOnly ? 0.8 : 1)
              }}
              onClick={() => handleIngredientClick(ingredient)}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div className="flex-grow-1 me-3">
                  <div className="fw-bold fs-6 mb-1">
                    {ingredient.name}
                    {isSelected && (
                      <Badge 
                        bg="warning" 
                        className="text-dark ms-2"
                        style={{ fontSize: '0.7rem' }}
                      >
                        Selected
                      </Badge>
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
                
                {/* Constraints display */}
                <div className="text-end" style={{ minWidth: '120px' }}>
                  {constraints.length > 0 && (
                    <div className="d-flex flex-column gap-1">
                      {constraints.map((constraint, index) => (
                        <div 
                          key={index}
                          className="small"
                          style={{ 
                            fontSize: '0.8rem', 
                            lineHeight: '1.3',
                            color: isSelected ? 'white' : (
                              constraint.type === 'dependency' ? '#059669' : '#dc2626'
                            )
                          }}
                        >
                          <i className={`${constraint.icon} me-1`}></i>
                          <span>{constraint.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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