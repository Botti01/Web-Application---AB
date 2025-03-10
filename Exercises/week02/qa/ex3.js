"use strict";


//  Constructor starts with a capital letter
function Answer(text, respondent, score, date) {  
    // a new object i created, it named "this"
    this.text = text;
    this.respondent = respondent;
    this.score = score;
    this.date = date;

}

function Question(text, questioner, date) {  
    // a new object i created, it named "this"
    this.text = text;
    this.questioner = questioner;
    this.date = date;
    this.list = [];     // array for listing answers

    this.add = (ans) => this.list.push(ans);

    // this.findAll = () => this.list;         // return the same list
    // this.findAll = () => [...this.list];    // spread all elements of the list; return a new array [a1, a2, ...]
    // this.findAll = () => [this.list];       // return the same array inside another array [ [a1, a2, ...] ]
    
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
   this.findAll = (name) => this.list.filter((a) => a.respondent === name);     // is the same of the function myfilter

}

const q1 = new Question("How are you today?", 'Enrico', "2025-03-03");

const answers_text = [
    ["Hello world!", 'Andrea', '0', "2025-03-02"], // a1       string
    ["Hello world 2!", 'Simone', '0', "2025-03-03"], // a2
    ["Fine", 'Andrea', '1', "2025-03-03"], // a3
]

// const answers_obj = [];
for (let i=0; i<answers_text.length; i++) {
    const ans = answers_text[i];
    const a = new Answer(ans[0], ans[1], ans[2], ans[3]);
    q1.add(a);
}

// const a1 = new Answer("Hello world!", 'Andrea', '0', "2025-03-03");     // object
// const a2 = new Answer("Hello world 2!", 'Simone', '0', "2025-03-03");

// console.log('a1', a1)

// q1.add(a1);

console.log('q1', q1)

console.log('q1 findAll', q1.findAll('Andrea'))

console.log('q1 answer text', q1.findAll('Simone').map((a) => 'Answer: text ' + a.text).join('\n'));