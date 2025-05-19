// Term 2 Final Project Math Matching Game Javascript - Adhvik Harikrishnan (tweaked by Ethan)

// Setting up game

// Represents main HTML container for game tiles
const grid = document.querySelector('.grid');
// Message element displayed when game ends
const endMessage = document.querySelector('.end-message');
// HTML element used to display elapsed time during gameplay
const timerDisplay = document.getElementById('timer');
// HTML element used to display final time taken when game ends
const finalTimeDisplay = document.getElementById('final-time');
// Hidden input field used to store final time taken, often for form submission
const timeTakenInput = document.getElementById('timeTaken');

// Variable to store Date object when timer starts
let startTime;
// Variable to store ID returned by setInterval, used to clear timer later
let timerInterval;

// Total number of tiles in game grid (4x4 = 16)
const totalTiles = 16;
// Number of matching pairs needed to win game (total tiles / 2)
const numberOfPairs = totalTiles / 2; // 8 pairs

// variables to manage game's state

// Array that will store objects, each containing math 'problem' and its 'answer'
let mathPairs = [];
// Array that will store all problem and answer strings, shuffled, ready to be assigned to tiles
let tileValues = [];
// Array that will hold all HTML tile elements created for grid
let tiles = [];
// Array that temporarily stores two tile elements that have been most recently flipped by player
let flippedTiles = [];
// Counter that keeps track of how many pairs of tiles player has successfully matched
let matchedTiles = 0;

// Load sound effect played when tiles are matched (ensure you have this file at correct path)
const matchSound = new Audio('/Matching Game/match-sound.mp3'); // Ensure path is correct

// Function to generate simple math problems (addition and subtraction) and their answers
// It ensures a set number of unique pairs are created
function generateMathPairs() {
    mathPairs = []; // Clear existing pairs at start
    const usedPairs = new Set(); // Use Set to efficiently track unique problem|answer combinations

    // Continue generating pairs until desired number of pairs is reached
    while (mathPairs.length < numberOfPairs) {
        let a, b, problem, answer, result;
        // Randomly decide if problem will be addition or subtraction
        const add = Math.random() < 0.5;
        let operationType;
        if (add) {
            operationType = 'add';
        }
        else {
            operationType = 'subtract';
        }

        if (operationType === 'add') {
            // Generate two random numbers (1-10) for addition
            a = Math.floor(Math.random() * 10) + 1;
            b = Math.floor(Math.random() * 10) + 1;
            result = a + b;
            // Skip if result is too large (e g > 20)
            if (result > 20) continue;
            problem = `${a} + ${b}`; // Format problem as string
            answer = result.toString(); // Convert answer to string
        } else {
            // Generate two random numbers for subtraction, ensuring first is larger
            a = Math.floor(Math.random() * 15) + 5; // Number between 5 and 19
            b = Math.floor(Math.random() * 5) + 1; // Number between 1 and 5
            if (a < b) [a, b] = [b, a]; // Swap if a is smaller than b
            result = a - b;
             // Skip if result is negative
             if (result < 0) continue;
             // Skip if result is large but first number was small (avoids simple problems with large results)
             if (result > 10 && a < 15) continue;
            problem = `${a} - ${b}`; // Format problem as string
            answer = result.toString(); // Convert answer to string
        }

        // Create unique key string combining problem and answer
        const pairKey = `${problem}|${answer}`;

        // Check if exact pair (problem and answer) has already been used
        if (!usedPairs.has(pairKey)) {
            // If not used, add pair object to mathPairs array
            mathPairs.push({ problem: problem, answer: answer });
            // Add unique key to set to mark it as used
            usedPairs.add(pairKey);
        }
    }
}

// Function to shuffle array using Fisher-Yates (aka Knuth) Shuffle algorithm
// This ensures randomness in tile placement
//CREDIT: Fisher Yates Method - https://www w3schools com/js/tryit asp?filename=tryjs_array_sort_random2
function shuffle(array) {
    // Loop backward through array
    for (let i = array.length - 1; i > 0; i--) {
        // Pick random index from remaining unshuffled portion
        const j = Math.floor(Math.random() * (i + 1));
        // Swap element at current index with element at random index
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Prepares final list of values (problems and answers) for tiles and shuffles them
function populateTileValues() {
    tileValues = []; // Clear existing values to start fresh
    // Iterate over each generated math pair
    mathPairs.forEach(pair => {
        // Add both problem and its answer string to tileValues array
        tileValues.push(pair.problem, pair.answer);
    });
    // Shuffle combined list of problems and answers randomly
    shuffle(tileValues);
}

// Creates HTML tile elements based on shuffled values and adds them to grid container
function createTiles() {
    // First, generate math problem/answer pairs
    generateMathPairs();
    // Then, populate and shuffle list of values that will go on tiles
    populateTileValues();
    // Clear any existing tiles from grid HTML
    grid.innerHTML = '';
    tiles = []; // Reset array that keeps track of all tile elements

    // Iterate over each value in shuffled tileValues array
    tileValues.forEach((value, index) => {
        // Create new div element for tile
        const tile = document.createElement('div');
        // Add base 'tile' class for general styling
        tile.classList.add('tile');
        // Store tile's original index in shuffled array for potential future use (though not strictly needed for this logic)
        tile.dataset.index = index;
        // Store actual math problem or answer value on tile's dataset attribute
        tile.dataset.value = value;

        // Create inner elements for front and back of tile for flip effect
        const back = document.createElement('div');
        back.classList.add('back'); // Class for back side styling
        back.textContent = '?'; // Display '?' on back when flipped back over

        const front = document.createElement('div');
        front.classList.add('front'); // Class for front side styling
        front.textContent = value; // Display actual value (problem or answer) on front

        // Append back and front elements to tile
        tile.appendChild(back);
        tile.appendChild(front);

        // Add click event listener to each tile that calls flipTile function
        tile.addEventListener('click', flipTile);
        // Append newly created tile element to main game grid in HTML
        grid.appendChild(tile);
        // Add tile element to local 'tiles' array for future reference
        tiles.push(tile);
    });
}

// Function to start game timer
function startTimer() {
    // Record exact time when timer starts
    startTime = new Date();
    // Set up interval that runs every 1000 milliseconds (1 second)
    timerInterval = setInterval(() => {
        // Get current time inside interval
        const now = new Date();
        // Calculate elapsed time in seconds
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        // Update timer display element with elapsed time
        timerDisplay.textContent = `Time: ${elapsedSeconds}s`;
    }, 1000); // Update each second
}

// Function to stop game timer
function stopTimer() {
    // Clear interval previously set by setInterval, stopping timer updates
    clearInterval(timerInterval);
}

// This function handles click event on a tile, managing its flip state and game logic
function flipTile() {
     // Check for conditions where tile click should be ignored:
     // - If game is already won (all pairs matched)
     // - If clicked tile has already been matched
     // - If two tiles are currently already flipped and waiting to be checked
    if (matchedTiles === numberOfPairs || this.classList.contains('matched') || flippedTiles.length === 2) {
        return; // Exit function, ignoring click
    }

    const tile = this; // Reference to clicked tile element
    // If clicked tile is one of two currently in flippedTiles array, ignore click (prevents double-clicking same tile)
    if (flippedTiles.includes(tile)) {
         return; // Exit function, ignoring click
    }

    // Add 'flipped' class to tile's class list
    // This class triggers CSS transition for flip animation
    tile.classList.add('flipped');

    // Add current tile element to array keeping track of currently flipped tiles
    flippedTiles.push(tile);

    // Check how many tiles are currently flipped
    if (flippedTiles.length === 1) {
        // If this is first tile flipped (and timer hasn't started yet), start timer
        if (!startTime) {
             startTimer();
        }
    } else if (flippedTiles.length === 2) {
        // If two tiles are now flipped, wait for short delay before checking if they match
        // This delay allows player to see both flipped tiles before they are potentially flipped back
        setTimeout(checkMatch, 1000); // Wait 1 second (1000 milliseconds)
    }
}

// This function is called after short delay when two tiles are flipped
// It checks if two flipped tiles form matching problem-answer pair
function checkMatch() {
    // Get two tile elements that were most recently flipped from flippedTiles array
    const [firstTile, secondTile] = flippedTiles;
    // Get data-value (problem or answer string) from each of flipped tiles
    const firstValue = firstTile.dataset.value;
    const secondValue = secondTile.dataset.value;

    let isMatch = false; // Flag to indicate if match is found

    // Iterate through original mathPairs array to check if two flipped values correspond to a pair
    for (const pair of mathPairs) {
        // Check if (firstValue is problem AND secondValue is answer) OR
        // (firstValue is answer AND secondValue is problem) for current pair
        if ((firstValue === pair.problem && secondValue === pair.answer) ||
            (firstValue === pair.answer && secondValue === pair.problem)) {
            isMatch = true; // Set flag to true because match is found
            break; // Exit loop early as match is confirmed
        }
    }

    if (isMatch) {
        // If tiles are matching pair:
        matchedTiles++; // Increment counter for successfully matched pairs

        // Add 'matched' class to both tiles for styling (e g a border change)
        firstTile.classList.add('matched');
        secondTile.classList.add('matched');

        matchSound.play(); // Play sound effect for a successful match

        flippedTiles = []; // Clear array of flipped tiles since these two are now matched

        // Check if total number of matched pairs equals total number of pairs in game
        if (matchedTiles === numberOfPairs) {
            stopTimer(); // If all pairs are matched, stop game timer
            const endTime = new Date(); // Get exact time when game ended
            // Calculate total time taken by subtracting start time from end time and converting milliseconds to seconds
            const timeTaken = (endTime - startTime) / 1000;

            // Update final time display element with calculated time taken, formatted to one decimal place
            finalTimeDisplay.textContent = `Your time: ${timeTaken.toFixed(1)} seconds`;
            // Set value of hidden input field with final time taken (formatted)
            timeTakenInput.value = timeTaken.toFixed(1);
            // Remove 'hidden' class from end game message element to make it visible
            endMessage.classList.remove('hidden');
        }

    } else {
        // If tiles do not match, set timeout to flip tiles back after short delay
        setTimeout(() => {
            firstTile.classList.remove('flipped'); // Remove 'flipped' class from first tile to flip it back
            secondTile.classList.remove('flipped'); // Remove 'flipped' class from second tile to flip it back

            flippedTiles = []; // Clear array of flipped tiles because they didn't match and are being reset
        }, 500); // Wait .5 seconds before flipping them back
    }
}

// Call createTiles function to set up game board with tiles when script first loads
createTiles();