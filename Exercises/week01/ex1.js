"use strict";

const v = [-12, -3, 18, 10, 4, -1, 0, 16];

// Create a shallow copy of the array `v` into `v2` using the spread operator.
// This ensures `v2` can be modified without affecting the original array `v`.
const v2 = [...v];        // Duplicate the array

// v2.sort()       // Sort works on the string representation of the elements (no good for numbers)

// Sort the array `v2` in ascending order.
// Sorting is necessary to remove the lowest scores in the next steps.
v2.sort((a, b) => a - b);       // Sort the array in ascending order

console.log(v);
// v2 [0] = 0;               // Change the first element of the duplicate array
console.log(v2);

// let i = 0;
// while (i < v2.length) {
//     if (v2[i] < 0) {
//         v2.splice(i, 1, 0);
//     } else {
//         i++;
//     }
// }

// Find the index of the first non-negative element in `v2`.
// This is used to determine where the negative scores end in the sorted array.
let NN = v2.findIndex(el => el >= 0);    // Find the first positive element

console.log(NN);

// Remove all elements before the first non-negative element (negative scores).
// This ensures only non-negative scores remain in the array.
v2.splice(0, NN);      // Remove the negative elements from the arrayj

// Remove the two lowest-ranking scores from the array.
// `shift()` removes the first element of the array, which is the smallest after sorting.
v2.shift(); // Remove the smallest score.
v2.shift(); // Remove the second smallest score.

console.log(v2);

// Initialize a variable `avg` to calculate the average of the remaining scores.
// This will store the sum of the scores initially.
let avg = 0;

// Iterate over each value in the modified `v2` array.
// Add each value to `avg` to calculate the total sum of the scores.
for (const val of v2) {
    avg += val;
}

// Calculate the average by dividing the total sum by the number of elements in `v2`.
// Use `Math.round` to round the result to the nearest integer.
avg = Math.round(avg / v2.length);
console.log(avg);

// Create a new array filled with the average value.
// The length of this array is `NN + 2`, which corresponds to the number of removed elements.
const addedArray = Array(NN+2).fill(avg);

// Append the new array (`addedArray`) to the end of `v2` using `splice`.
// This modifies `v2` to include the new scores with the average value.
v2.splice(v2.length, 0, ...addedArray);
console.log(v2);
