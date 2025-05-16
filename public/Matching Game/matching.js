// Term 2 Final Project Math Matching Game Javascript - Adhvik Harikrishnan (tweaked by Ethan)

// Setting up the game
const grid = document.querySelector('.grid'); // main game grid
const endMessage = document.querySelector('.end-message'); // Message to display when the game ends
const timerDisplay = document.getElementById('timer'); // Timer display element
const finalTimeDisplay = document.getElementById('final-time'); // Final time display element
const timeTakenInput = document.getElementById('timeTaken'); // Hidden input for time

let startTime; // To store the start time
let timerInterval; // To store the interval ID for the timer

const totalTiles = 16; // For a 4x4 grid
const numberOfPairs = totalTiles / 2; // 8 pairs

// variables to manage the game's state
let mathPairs = []; // This will hold the pairs for the problems and their answers
let tileValues = []; // This will store  shuffled problem/answer strings for the tiles
let tiles = []; // This will store tile elements
let flippedTiles = []; // Keeps track of the currently flipped tiles
let matchedTiles = 0;

// Load the sound effect for matched tiles (ensure you have this file)
const matchSound = new Audio('/Matching Game/match-sound.mp3'); // Ensure path is correct

// Function to generate simple math problems (addition and subtraction)
//CREDIT: 
function generateMathPairs() {
    mathPairs = []; 
    const usedPairs = new Set(); 

    while (mathPairs.length < numberOfPairs) {
        let a, b, problem, answer, result;
        const add = Math.random() < 0.5;
        let operationType;
        if (add) {
            operationType = 'add';
        }
        else {
            operationType = 'subtract';
        }

        if (operationType === 'add') {
            a = Math.floor(Math.random() * 10) + 1; 
            b = Math.floor(Math.random() * 10) + 1;
            result = a + b;
            if (result > 20) continue;
            problem = `${a} + ${b}`;
            answer = result.toString();
        } else {
            a = Math.floor(Math.random() * 15) + 5;
            b = Math.floor(Math.random() * 5) + 1; 
            if (a < b) [a, b] = [b, a]; 
            result = a - b;
             if (result < 0) continue; 
             if (result > 10 && a < 15) continue; 
            problem = `${a} - ${b}`;
            answer = result.toString();
        }

        // Create a unique key for pair
        const pairKey = `${problem}|${answer}`;

        // Check if this exact pair (problem and answer) has already been used
        if (!usedPairs.has(pairKey)) {
            mathPairs.push({ problem: problem, answer: answer });
            usedPairs.add(pairKey);
        }
    }
}

//CREDIT: Fisher Yates Method - https://www.w3schools.com/js/tryit.asp?filename=tryjs_array_sort_random2
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

//Prepares the problems and answers and shuffles them around
function populateTileValues() {
    tileValues = []; // Clear existing values
    mathPairs.forEach(pair => {
        tileValues.push(pair.problem, pair.answer); // Add both problem and answer
    });
    shuffle(tileValues); // Mix them up
}

//Creates the tiles and adds them to the grid
function createTiles() {
    //Grid setup
    generateMathPairs(); 
    populateTileValues(); 
    grid.innerHTML = ''; 
    tiles = []; //Array to keep track of all tiles

    tileValues.forEach((value, index) => {
        const tile = document.createElement('div'); //Create new tile element
        tile.classList.add('tile'); 
        tile.dataset.index = index; //Store tile's og index
        tile.dataset.value = value; //Store math problem/answer on the dataset

        // Create inner elements for the front and back of the tile for the flip effect
        const back = document.createElement('div');
        back.classList.add('back');
        back.textContent = '?'; // Display '?' on front

        const front = document.createElement('div');
        front.classList.add('front');
        front.textContent = value; // Display the actual value on back

        tile.appendChild(back);
        tile.appendChild(front);

        tile.addEventListener('click', flipTile); //Makes it flip tile onclick
        grid.appendChild(tile);
        tiles.push(tile); 
    });
}

// Function to start the timer
function startTimer() {
    startTime = new Date();
    timerInterval = setInterval(() => {
        const now = new Date();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        timerDisplay.textContent = `Time: ${elapsedSeconds}s`;
    }, 1000); // Update every second
}

// Function to stop the timer
function stopTimer() {
    clearInterval(timerInterval);
}

// This function handles flipping a tile when it's clicked
function flipTile() {
     // If the game is over, or this tile is already matched, or two tiles are already flipped, ignore the click
    if (matchedTiles === numberOfPairs || this.classList.contains('matched') || flippedTiles.length === 2) {
        return;
    }

    const tile = this;
    // If the clicked tile is already one of the two currently flipped tiles, ignore
    if (flippedTiles.includes(tile)) {
         return;
    }

    // Reveal the tile's content and add the 'flipped' class for animation
    // tile.textContent = tile.dataset.value;
    tile.classList.add('flipped'); // Start the flip animation

    flippedTiles.push(tile); // Add this tile to our list of flipped tiles

    if (flippedTiles.length === 1) {
        // If this is the first tile being flipped and it hasn't started yet, start the timer
        if (!startTime) { 
             startTimer();
        }
    } else if (flippedTiles.length === 2) {
        // If two tiles are flipped, check if they match after a brief delay
        setTimeout(checkMatch, 1000);
    }
}

// This function checks if two flipped tiles are a matching pair
function checkMatch() {
    const [firstTile, secondTile] = flippedTiles;
    const firstValue = firstTile.dataset.value;
    const secondValue = secondTile.dataset.value;

    let isMatch = false;

    // Check if the two values form a problem-answer pair from our original mathPairs
    for (const pair of mathPairs) {
        if ((firstValue === pair.problem && secondValue === pair.answer) ||
            (firstValue === pair.answer && secondValue === pair.problem)) {
            isMatch = true;
            break; // Found a match
        }
    }

    if (isMatch) {
        // Tiles match!
        matchedTiles++; // Increase the count of matched pairs

        // Add 'matched' class and disable clicking on these tiles
        firstTile.classList.add('matched');
        secondTile.classList.add('matched');
        
        matchSound.play(); // Play the match sound effect

        flippedTiles = []; // Reset the flipped tiles list

        // Check if the game is won
        if (matchedTiles === numberOfPairs) {
            stopTimer(); // Stop the timer
            const endTime = new Date();
            const timeTaken = (endTime - startTime) / 1000; // Time in seconds

            // Display the end message and the final time
            finalTimeDisplay.textContent = `Your time: ${timeTaken.toFixed(1)} seconds`; // Display with 1 decimal place
            timeTakenInput.value = timeTaken.toFixed(1); // Set the hidden input value
            endMessage.classList.remove('hidden'); // Show the "You win" message
        }

    } else {
        // Tiles do not match - flip them back after a delay
        setTimeout(() => {
            firstTile.classList.remove('flipped'); // Flip back animation
            secondTile.classList.remove('flipped'); // Flip back animation

            flippedTiles = []; // Reset flipped tiles list after mismatch
        }, 500);
    }
}

// Start the game when the page loads
createTiles();

// test test test