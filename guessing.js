document.addEventListener("DOMContentLoaded", () => {
    const gameState = {
        wordToGuess: "",
        guessCount: 0,
        points: 0,
        streak: 0,
        greenLetters: new Set(),
        yellowLetters: new Set(),
        grayLetters: new Set(),
        revealedHintIndices: new Set(),
        validWords: []
    };

    async function fetchWords() {
        try {
            const response = await fetch('wordList.txt');
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            
            const data = await response.text();
            gameState.validWords = data.split('\n')
                .map(word => word.trim().toUpperCase())
                .filter(word => word.length === 5);

            if (!gameState.validWords.length) throw new Error("No valid words found.");
            gameState.wordToGuess = getRandomWord();
        } catch (error) {
            console.error("Word list error:", error);
            alert("Using default word: APPLE");
            gameState.wordToGuess = "APPLE";
        }
    }

    function getRandomWord() {
        return gameState.validWords[Math.floor(Math.random() * gameState.validWords.length)];
    }

    function makeGuess() {
        const input = document.getElementById("guess-input").value.toUpperCase().trim();
        if (!validateGuess(input)) return;

        updateGameboard(input);
        updateKeyColors();
        checkWinCondition(input);
        resetInput();
    }

    function validateGuess(guess) {
        if (guess.length !== 5 || !gameState.validWords.includes(guess)) {
            alert("Invalid word. Try again!");
            return false;
        }
        return true;
    }

    function updateGameboard(guess) {
        for (let i = 0; i < 5; i++) {
            if (guess[i] === gameState.wordToGuess[i]) gameState.greenLetters.add(guess[i]);
            else if (gameState.wordToGuess.includes(guess[i])) gameState.yellowLetters.add(guess[i]);
            else gameState.grayLetters.add(guess[i]);
        }
    }

    function updateKeyColors() {
        document.querySelectorAll('.key').forEach(button => {
            const letter = button.textContent;
            button.classList.remove('green', 'yellow', 'gray');
            if (gameState.greenLetters.has(letter)) button.classList.add('green');
            else if (gameState.yellowLetters.has(letter)) button.classList.add('yellow');
            else if (gameState.grayLetters.has(letter)) button.classList.add('gray');
        });
    }

    function checkWinCondition(guess) {
        if (guess === gameState.wordToGuess) {
            alert("You guessed the word!");
            gameState.points += 10;
            gameState.streak++;
            resetGame();
        } else {
            gameState.guessCount++;
        }
    }

    function resetGame() {
        gameState.wordToGuess = getRandomWord();
        gameState.guessCount = 0;
        gameState.greenLetters.clear();
        gameState.yellowLetters.clear();
        gameState.grayLetters.clear();
        gameState.revealedHintIndices.clear();
        updateKeyColors();
    }

    function resetInput() {
        document.getElementById("guess-input").value = "";
    }

    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
    }

    function buyHint() {
        if (gameState.points < 5) {
            alert("Not enough points!");
            return;
        }

        const availableIndices = [...Array(5).keys()].filter(i => !gameState.revealedHintIndices.has(i));
        if (availableIndices.length === 0) return alert("No more hints available!");

        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        gameState.revealedHintIndices.add(randomIndex);
        gameState.points -= 5;
    }

    document.getElementById("guess-input").addEventListener("keydown", (event) => {
        if (event.key === "Enter") makeGuess();
    });

    document.getElementById("dark-mode-toggle").addEventListener("click", toggleDarkMode);

    fetchWords();
});
