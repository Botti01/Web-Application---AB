"use strict";   

const v = [1, 2, 3, 4, 5];
// Declares a constant array `v` containing the numbers 1 through 5.

v.filter ((c, i, v) => {
    // Calls the `filter` method on the array `v`. The filter method creates a new array with elements that pass the test implemented by the provided callback function.
    // The callback function takes three arguments:
    // `c` - the current element being processed in the array.
    // `i` - the index of the current element being processed.
    // `v` - the array `v` itself.

    if(i<v.length/2) return true
    // Checks if the index `i` is less than half the length of the array `v`.
    // If true, the current element `c` will be included in the new filtered array.

    else return false;
    // If the index `i` is not less than half the length of the array, the current element `c` will be excluded from the new filtered array.

    console.log('i, c, len', i, c, v.length);
    // Logs the index `i`, the current element `c`, and the length of the array `v` to the console.
    // NOTE: This line is unreachable because it is placed after the `return` statements.
});