"use strict";

const v = [-12, -3, 18, 10, 4, -1, 0, 16];

const v2 = [...v];        // Duplicate the array

// v2.sort()       // Sort works on the string representation of the elements (no good for numbers)

v2.sort((a, b) => a - b);       // Sort the array in ascending order

// console.log(v);
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

let NN = v2.findIndex(el => el >= 0);    // Find the first positive element

console.log(NN);

v2.splice(0, NN);      // Remove the negative elements from the arrayj

v2.shift();
v2.shift();

console.log(v2);


let avg = 0;
for (const val of v2) {
    avg += val;
}
avg = Math.round(avg / v2.length);
console.log(avg);

const addedArray = Array(NN+2).fill(avg);

v2.splice(v2.length, 0, ...addedArray);
console.log(v2);
