"use strict";   

const v = [1, 2, 3, 4, 5];

v.filter ((c, i, v) => {
    if(i<v.length/2) return true
    else return false;
    console.log('i, c, len', i, c, v.length);
});