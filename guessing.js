/*
    File: guessing.js
    Author: Jacoby Oliverio

    Description: This JavaScript file implements the core 
    functionalities of the word guessing game including
    random word selection, guess handling, color feedback,
    and other core requirements.
*/

// Game state
const MAX_GUESSES = 6;
const WORD_LENGTH = 5;
let gameState = {
    wordToGuess: "",
    guessCount: 0,
    greenLetters: new Set(),
    yellowLetters: new Set(),
    grayLetters: new Set(),
    points: 0,
    revealedHintIndices: [],
    validWords: [],
    streak: 0,
    gameOver: false
};

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    loadSavedData();
    fetchWordList();
});

/**
 * Initializes the game board and keyboard
 */
function initializeGame() {
    // Only generate board if it doesn't exist
    if (!document.getElementById('game-board').innerHTML.trim()) {
        generateGameBoard();
        generateKeyboard();
    }
    
    // Add event listeners
    document.getElementById("guess-input").addEventListener("keydown", handleKeyPress);
    document.getElementById("dark-mode-toggle").addEventListener("change", function() {
        toggleDarkMode(this.checked);
    });
}

/**
 * Loads saved data from localStorage
 */
function loadSavedData() {
    // Load points
    const savedPoints = localStorage.getItem('points');
    if (savedPoints !== null) {
        gameState.points = parseInt(savedPoints);
        displayPoints();
    }
    
    // Load streak
    const savedStreak = localStorage.getItem('streak');
    if (savedStreak !== null) {
        gameState.streak = parseInt(savedStreak);
        displayStreak();
    }
}

/**
 * Generates the game board
 */
function generateGameBoard() {
    const gameBoard = document.getElementById('game-board');
    for (let row = 0; row < MAX_GUESSES; row++) {
        const rowElement = document.createElement('div');
        rowElement.className = 'row';
        
        for (let col = 0; col < WORD_LENGTH; col++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            rowElement.appendChild(tile);
        }
        
        gameBoard.appendChild(rowElement);
    }
}

/**
 * Fetches the word list from the server
 */
function fetchWordList() {
    fetch('wordList.txt')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            // Parse and filter word list
            const wordList = data.split('\n')
                .map(word => word.trim().toUpperCase())
                .filter(word => word.length === WORD_LENGTH);
                
            if (wordList.length === 0) {
                throw new Error("No valid words found in wordList.txt");
            }
            
            gameState.validWords = wordList;
            gameState.wordToGuess = wordList[Math.floor(Math.random() * wordList.length)];
            console.log("Word loaded successfully");
        })
        .catch(error => {
            console.error('Error fetching word list:', error);
            alert("Error loading word list. Using default word.");
            gameState.wordToGuess = "APPLE";
        });
}

/**
 * Processes a user's guess
 */
function makeGuess() {
    // Check if game is over
    if (gameState.gameOver) {
        alert("Game is over. Start a new game.");
        return;
    }
    
    // Check if max guesses reached
    if (gameState.guessCount >= MAX_GUESSES) {
        alert("You've reached the maximum number of guesses.");
        return;
    }

    // Get and validate guess
    const guess = document.getElementById("guess-input").value.toUpperCase();
    
    if (guess.length !== WORD_LENGTH) {
        alert(`Enter a ${WORD_LENGTH} letter word.`);
        return;
    }

    if (!guess.match(/^[A-Z]+$/)) {
        alert("Word contains illegal characters");
        return;
    }

    if (!gameState.validWords.includes(guess)) {
        alert("Word not in dictionary.");
        return;
    }

    // Process the guess
    const result = processGuess(guess);
    
    // Update game state based on result
    gameState.guessCount++;
    document.getElementById('guess-input').value = '';
    
    // Check for win/loss
    if (result.correct) {
        handleWin();
    } else if (gameState.guessCount >= MAX_GUESSES) {
        handleLoss();
    }
    
    // Update keyboard with new letter colors
    generateKeyboard();
}

/**
 * Processes a guess and updates the game board
 * @param {string} guess - The user's guess
 * @returns {Object} Result object with correct flag
 */
function processGuess(guess) {
    const row = document.querySelector(`#game-board .row:nth-child(${gameState.guessCount + 1})`);
    if (!row) {
        console.error("Could not find game board row");
        return { correct: false };
    }

    const tiles = row.querySelectorAll('.tile');
    let correctCount = 0;
    
    // First pass: Mark exact matches (green)
    for (let i = 0; i < WORD_LENGTH; i++) {
        const letter = guess[i];
        tiles[i].innerText = letter;
        
        if (gameState.wordToGuess[i] === letter) {
            tiles[i].style.backgroundColor = 'rgb(0, 122, 0)';
            gameState.greenLetters.add(letter);
            correctCount++;
        }
    }
    
    // Second pass: Mark partial matches (yellow) and misses (gray)
    // Count letter occurrences in the target word
    const letterCounts = {};
    for (const letter of gameState.wordToGuess) {
        letterCounts[letter] = (letterCounts[letter] || 0) + 1;
    }
    
    // Deduct green matches from available counts
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (gameState.wordToGuess[i] === guess[i]) {
            letterCounts[guess[i]]--;
        }
    }
    
    // Now mark yellows and grays
    for (let i = 0; i < WORD_LENGTH; i++) {
        const letter = guess[i];
        
        // Skip already marked green tiles
        if (gameState.wordToGuess[i] === letter) continue;
        
        if (letterCounts[letter] > 0) {
            // Yellow - letter exists but in wrong position
            tiles[i].style.backgroundColor = 'rgb(255, 215, 0)';
            gameState.yellowLetters.add(letter);
            letterCounts[letter]--;
        } else {
            // Gray - letter doesn't exist in word
            tiles[i].style.backgroundColor = 'gray';
            gameState.grayLetters.add(letter);
        }
    }
    
    return { correct: correctCount === WORD_LENGTH };
}

/**
 * Handles a winning game
 */
function handleWin() {
    gameState.gameOver = true;
    
    // Award points based on number of guesses
    const pointsAwarded = gameState.guessCount <= 2 ? 6 : 3;
    updatePoints(pointsAwarded);
    
    // Update streak
    updateStreak();
    
    alert(`Congratulations! You guessed the word in ${gameState.guessCount} tries and earned ${pointsAwarded} points!`);
}

/**
 * Handles a losing game
 */
function handleLoss() {
    gameState.gameOver = true;
    resetStreak();
    alert(`Game over! The word was ${gameState.wordToGuess}.`);
}

/**
 * Generates the keyboard with colored keys
 */
function generateKeyboard() {
    const keyboard = document.getElementById('keyboard');
    keyboard.innerHTML = '';
    
    const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
    
    rows.forEach(rowString => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';
        
        for (const letter of rowString) {
            const button = createKey(letter);
            rowDiv.appendChild(button);
        }
        
        keyboard.appendChild(rowDiv);
    });
}

/**
 * Creates a keyboard key with appropriate styling
 * @param {string} letter - The letter for the key
 * @returns {HTMLElement} The key button element
 */
function createKey(letter) {
    const button = document.createElement('button');
    button.textContent = letter;
    button.addEventListener('click', () => insertLetter(letter));
    
    // Apply appropriate color class
    if (gameState.greenLetters.has(letter)) {
        button.className = 'key green-key';
    } else if (gameState.yellowLetters.has(letter)) {
        button.className = 'key yellow-key';
    } else if (gameState.grayLetters.has(letter)) {
        button.className = 'key gray-key';
    } else {
        button.className = 'key';
    }
    
    return button;
}

/**
 * Inserts a letter into the input field
 * @param {string} letter - The letter to insert
 */
function insertLetter(letter) {
    const input = document.getElementById('guess-input');
    if (input.value.length < WORD_LENGTH) {
        input.value += letter;
    }
    input.focus();
}

/**
 * Handles key press events
 * @param {Event} event - The key event
 */
function handleKeyPress(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        makeGuess();
    } else if (event.key === "Backspace") {
        // Allow backspace to work normally
    } else if (/^[a-zA-Z]$/.test(event.key) && document.getElementById('guess-input').value.length >= WORD_LENGTH) {
        // Prevent adding more than WORD_LENGTH letters
        event.preventDefault();
    }
}

/**
 * Updates points and saves to localStorage
 * @param {number} score - Points to add (negative for deduction)
 */
function updatePoints(score) {
    gameState.points += score;
    localStorage.setItem('points', gameState.points);
    displayPoints();
}

/**
 * Displays current points
 */
function displayPoints() {
    document.getElementById('points-display').innerText = `Points: ${gameState.points}`;
}

/**
 * Updates streak and saves to localStorage
 */
function updateStreak() {
    gameState.streak += 1;
    localStorage.setItem('streak', gameState.streak);
    displayStreak();
}

/**
 * Displays current streak
 */
function displayStreak() {
    const streakDisplay = document.getElementById('streak-display');
    if (gameState.streak > 0) {
        streakDisplay.style.display = 'block';
        streakDisplay.innerText = `Streak: ${gameState.streak}`;
    } else {
        streakDisplay.style.display = 'none';
    }
}

/**
 * Resets streak to zero
 */
function resetStreak() {
    gameState.streak = 0;
    localStorage.setItem('streak', gameState.streak);
    displayStreak();
}

/**
 * Provides a hint by revealing a letter
 */
function buyHint() {
    if (gameState.gameOver) {
        alert("Game is over. Start a new game.");
        return;
    }
    
    if (gameState.points < 5) {
        alert("You don't have enough points to buy a hint. You need 5 points.");
        return;
    }
    
    // Find unrevealed indices
    const availableIndices = [];
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (!gameState.revealedHintIndices.includes(i)) {
            availableIndices.push(i);
        }
    }
    
    if (availableIndices.length === 0) {
        alert("All letters have been revealed as hints!");
        return;
    }
    
    // Select random unrevealed index
    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    gameState.revealedHintIndices.push(randomIndex);
    
    // Deduct points
    updatePoints(-5);
    
    // Reveal the hint
    const hintLetter = gameState.wordToGuess[randomIndex];
    const hintRow = document.querySelector(`#game-board .row:nth-child(${gameState.guessCount + 1})`);
    const hintTile = hintRow.querySelectorAll('.tile')[randomIndex];
    
    hintTile.innerText = hintLetter;
    hintTile.style.backgroundColor = 'lightblue';
}

/**
 * Toggles dark mode
 * @param {boolean} enabled - Whether dark mode is enabled
 */
function toggleDarkMode(enabled) {
    const elements = {
        body: document.body,
        darkModeLabel: document.getElementById("dark-mode-label"),
        pointsDisplay: document.getElementById("points-display"),
        streakDisplay: document.getElementById("streak-display")
    };
    
    if (enabled) {
        elements.body.style.backgroundColor = "rgb(47, 47, 47)";
        elements.darkModeLabel.style.color = "#fff";
        elements.pointsDisplay.style.color = "#fff";
        if (elements.streakDisplay) elements.streakDisplay.style.color = "#fff";
    } else {
        elements.body.style.backgroundColor = "#fff";
        elements.darkModeLabel.style.color = "#333";
        elements.pointsDisplay.style.color = "#333";
        if (elements.streakDisplay) elements.streakDisplay.style.color = "#333";
    }
    
    // Save preference
    localStorage.setItem('darkMode', enabled);
}

/**
 * Starts a new game
 */
function newGame() {
    // Reset game state
    gameState.guessCount = 0;
    gameState.greenLetters.clear();
    gameState.yellowLetters.clear();
    gameState.grayLetters.clear();
    gameState.revealedHintIndices = [];
    gameState.gameOver = false;
    
    // Clear the board
    const tiles = document.querySelectorAll('.tile');
    tiles.forEach(tile => {
        tile.innerText = '';
        tile.style.backgroundColor = '';
    });
    
    // Select a new word
    if (gameState.validWords.length > 0) {
        gameState.wordToGuess = gameState.validWords[Math.floor(Math.random() * gameState.validWords.length)];
    }
    
    // Reset input and regenerate keyboard
    document.getElementById('guess-input').value = '';
    generateKeyboard();
}
