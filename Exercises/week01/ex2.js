"use strict"; 

// Splits the `userNames` string into an array of individual names using ', ' as the delimiter.
const userNames = 'Andrea Botticella, Simone Romano, Renato Mignone, Elia Innocenti, Enrico Masala, Juan Pablo Saenz Moreno';
const names = userNames.split(', ');

// Iterates through the `names` array and removes any leading or trailing spaces from each name.
for (let i = 0; i < names.length; i++) {
    // Trim is used to remove whitespace from both ends of the string.
    names[i] = names[i].trim();     
}

// Logs the original `userNames` string to the console for reference.
console.log(userNames);

// Logs the `names` array to the console to verify that it has been split and trimmed correctly.
console.log(names);

// Initializes an empty array to store the acronyms generated from the names.
const acronyms = [];

// Generates acronyms for each name in the `names` array.
for (const name of names) {
    // Takes the first character of the current name, converts it to uppercase, and initializes the acronym string.
    let str = name[0].toUpperCase();

    // Checks if the previous character is a space. If true, appends the current character (converted to uppercase) to the acronym string.
    for (let i = 1; i < name.length; i++) {
        if (name[i-1] === ' ')
            str = str + name[i].toUpperCase();
    }

    // Adds the generated acronym to the `acronyms` array.
    acronyms.push(str);
}

// Sorts the `acronyms` array alphabetically and logs it to the console.
console.log(acronyms.sort());
