"use strict"; // Enables strict mode, which helps catch common coding errors and prevents the use of unsafe features in JavaScript.

const vehicles = [
  { make: 'Honda', model: 'CR-V', type: 'suv', price: 24045 }, // Define an array of vehicle objects with properties: make, model, type, and price.
  { make: 'Honda', model: 'Accord', type: 'sedan', price: 22455 },
  { make: 'Mazda', model: 'Mazda 6', type: 'sedan', price: 24195 },
  { make: 'Mazda', model: 'CX-9', type: 'suv', price: 31520 },
  { make: 'Toyota', model: '4Runner', type: 'suv', price: 34210 },
  { make: 'Toyota', model: 'Sequoia', type: 'suv', price: 45560 },
  { make: 'Toyota', model: 'Tacoma', type: 'truck', price: 24320 },
  { make: 'Ford', model: 'F-150', type: 'truck', price: 27110 },
  { make: 'Ford', model: 'Fusion', type: 'sedan', price: 22120 },
  { make: 'Ford', model: 'Explorer', type: 'suv', price: 31660 }
];

const averageSUVPrice = vehicles // Start calculating the average price of SUVs.
  .filter(v => v.type === 'suv') // Filter the vehicles array to include only objects where the type is 'suv'.
  .map(v => v.price) // Map the filtered array to an array of prices for SUVs.
  .reduce((sum, price, i, array) => sum + price / array.length, 0); // Use reduce to calculate the average price by summing up the prices and dividing by the array length.

console.log(averageSUVPrice); // 33399 // Log the calculated average SUV price to the console.

