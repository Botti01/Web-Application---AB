"use strict";

const userNames = 'Andrea Botticella, Simone Romano, Renato Mignone, Elia Innocenti, Enrico Masala, Juan Pablo Saenz Moreno';

const names = userNames.split(', ');

for (let i = 0; i < names.length; i++) {
    names[i] = names[i].trim();     // Remove leading and trailing spaces
}

console.log(userNames);
console.log(names);

const acronyms = [];
for (const name of names) {
    let str = name[0].toUpperCase();
    for (let i = 1; i < name.length; i++) {
        if (name[i-1] === ' ')
            str = str + name[i].toUpperCase();
    }
    // console.log(str);
    acronyms.push(str);
}
console.log(acronyms.sort());