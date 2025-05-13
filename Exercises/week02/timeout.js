'use strict'; 

const printSomething = () => {
    console.log('hello');
    // Logs the string 'hello' to the console when the function is called.
}

// runs after 2 seconds
setTimeout(printSomething, 2000);
// Schedules the `printSomething` function to execute after 2000 milliseconds (2 seconds).