// Lesson 2
// Functions and Var vs Let
// https://jsbin.com/yeqimib/edit?js,output

// Function Types
let add = function (a, b) {
  return a + b;
}

let answer1 = add(5, 8);

console.log(answer1);

// Functions can be defined like this:
function subtract (a, b) {
  return a - b;
}

let answer2 = subtract(10, 3);

console.log(answer2);

// Re-using a variable, use var
var answer = add(1, 2);

// What will happen here?
answer = add(answer, 3);

console.log(answer);

// Functions can do many things
answer = add(add(1, 1), subtract(3, 1));

console.log(answer);
