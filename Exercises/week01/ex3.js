"use strict";

// Constructor starts with a capital letter
function Answer(text, respondent, score, date) {  
    // a new object is created, it is named "this"
    this.text = text; // Assign the text of the answer to the object.
    this.respondent = respondent; // Assign the respondent's name to the object.
    this.score = score; // Assign the score of the answer to the object.
    this.date = date; // Assign the date of the answer to the object.
}

function Question(text, questioner, date) {  
    // a new object is created
    this.text = text; // Assign the text of the question to the object.
    this.questioner = questioner; // Assign the questioner's name to the object.
    this.date = date; // Assign the date of the question to the object.
    this.list = []; // Initialize an empty array to store answers.

    this.add = (ans) => this.list.push(ans); // Method to add an answer to the list.

    // this.findAll = () => this.list;         // Return the same list (commented out).
    // this.findAll = () => [...this.list];    // Spread all elements of the list; return a new array [a1, a2, ...] (commented out).
    // this.findAll = () => [this.list];       // Return the same array inside another array [ [a1, a2, ...] ] (commented out).
    
    // this.findAll = (name) => {
    //     const ret = [];
    //     for (const a of this.list){
    //         // a the answer object
    //         // check if the respondent is the same as the name
    //         if (a.respondent === name) ret.push(a);     // add the answer to the list
    //         // otherwise, do nothing
    //     }
    //     return ret;
    // }

    /*
    function myfilter(vett, callback) {
        const ret = [];
        for (const a of vett) {
            if (callback(a)) ret.push(a);
        }
        return ret;
    }

    this.findAll = (name) => myfilter(this.list, (a) => a.respondent === name);
    */

   // Filter the list to find answers by a specific respondent.
   this.findAll = (name) => this.list.filter((a) => a.respondent === name); 

}

const q1 = new Question("How are you today?", 'Enrico', "2025-03-03"); // Create a new question object.

const answers_text = [
    ["Hello world!", 'Andrea', '0', "2025-03-02"], // a1       string
    ["Hello world 2!", 'Simone', '0', "2025-03-03"], // a2
    ["Fine", 'Andrea', '1', "2025-03-03"], // a3
]

// const answers_obj = []; // Commented out, not used.
for (let i=0; i<answers_text.length; i++) { // Loop through the array of answer data.
    const ans = answers_text[i]; // Get the current answer data.
    const a = new Answer(ans[0], ans[1], ans[2], ans[3]); // Create a new Answer object.
    q1.add(a); // Add the answer to the question's list.
}

// const a1 = new Answer("Hello world!", 'Andrea', '0', "2025-03-03");     // object (commented out).
// const a2 = new Answer("Hello world 2!", 'Simone', '0', "2025-03-03"); // object (commented out).

// console.log('a1', a1) // Log the answer object (commented out).

// q1.add(a1); // Add the answer to the question's list (commented out).

console.log('q1', q1); // Log the question object, including its list of answers.

const respondentName = 'Andrea'; // Define the respondent name dynamically.
console.log(`q1 findAll by ${respondentName}:`, q1.findAll(respondentName)); // Log all answers by the respondent dynamically.

console.log('q1 answer text', q1.findAll('Simone').map((a) => 'Answer: text ' + a.text).join('\n')); 
// Find all answers by 'Simone', map them to a string format, and join them with newlines.
