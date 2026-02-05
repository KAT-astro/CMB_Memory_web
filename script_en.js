// Get DOM elements
const gameBoard = document.getElementById('game-board');
const timerElement = document.getElementById('timer');
const easyBtn = document.getElementById('easy-btn');
const hardBtn = document.getElementById('hard-btn');
const easyRankingList = document.getElementById('easy-ranking');
const hardRankingList = document.getElementById('hard-ranking');

// [Easy Mode Image List (12 images)]
const EASY_IMAGE_NAMES = [
    'LiteBIRD_easy.png',
    'CMB_easy.png',
    'CMB_vec_easy.png',
    'Emode_easy.png',
    'Bmode_easy.png',
    'Inflation_easy.png',
    'Q-30GHz_easy.png',
    'Q-143GHz_easy.png',
    'Q-353GHz_easy.png',
    'U-30GHz_easy.png',
    'U-143GHz_easy.png',
    'U-353GHz_easy.png',
];

// [Hard Mode Image List (14 images)]
const HARD_IMAGE_NAMES = [
    'Q-100GHz_hard.png',
    'Q-143GHz_hard.png',
    'Q-217GHz_hard.png',
    'Q-30GHz_hard.png',
    'Q-353GHz_hard.png',
    'Q-44GHz_hard.png',
    'Q-70GHz_hard.png',
    'U-100GHz_hard.png',
    'U-143GHz_hard.png',
    'U-217GHz_hard.png',
    'U-30GHz_hard.png',
    'U-353GHz_hard.png',
    'U-44GHz_hard.png',
    'U-70GHz_hard.png'
];

// Variables to manage game state
let cardPairs;
let cards = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let matchedPairs = 0;
let currentMode = '';

// Timer-related variables
let timer;
let seconds = 0;

// Image path
const imagePath = 'images/';

// Set event listeners
easyBtn.addEventListener('click', () => startGame('easy'));
hardBtn.addEventListener('click', () => startGame('hard'));
document.addEventListener('DOMContentLoaded', displayRankings);

/**
 * Function to start the game
 */
function startGame(mode) {
    currentMode = mode;
    const isEasy = (mode === 'easy');
    cardPairs = isEasy ? 12 : 14;
    
    const requiredImages = isEasy ? EASY_IMAGE_NAMES.length : HARD_IMAGE_NAMES.length;
    if (requiredImages < cardPairs) {
        alert(`Error: Not enough images. ${mode} mode requires ${cardPairs} types of images.`);
        return;
    }
    
    // Toggle CSS class
    gameBoard.className = '';
    gameBoard.classList.add(isEasy ? 'easy-grid' : 'hard-grid');

    resetGame();
    createBoard();
    startTimer();
}

/**
 * Function to reset game state
 */
function resetGame() {
    clearInterval(timer);
    seconds = 0;
    timerElement.textContent = 'Time: 00:00';
    gameBoard.innerHTML = '';
    matchedPairs = 0;
    lockBoard = false;
    firstCard = null;
    secondCard = null;
    cards = [];
}

/**
 * Function to shuffle cards and create board (simplified)
 */
function createBoard() {
    const imagesForThisGame = (currentMode === 'easy') ? EASY_IMAGE_NAMES : HARD_IMAGE_NAMES;

    let gameImages = [...imagesForThisGame, ...imagesForThisGame];
    shuffleArray(gameImages);

    // Create and add cards (no position calculation needed)
    gameImages.forEach(imageName => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.name = imageName;

        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                    <img src="${imagePath}${imageName}" alt="card">
                </div>
                <div class="card-back"></div>
            </div>
        `;
        
        card.addEventListener('click', flipCard);
        gameBoard.appendChild(card);
        cards.push(card);
    });
}

/**
 * Helper function to shuffle array
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


// これ以降の関数 (flipCard, checkForMatch など) は変更ありません
// ... (以下、変更なし) ...

function flipCard() {
    if (lockBoard || this.classList.contains('flipped') || this.classList.contains('matched')) return;
    if (this === firstCard) return;
    this.classList.add('flipped');
    if (!firstCard) {
        firstCard = this;
        return;
    }
    secondCard = this;
    lockBoard = true;
    checkForMatch();
}

function checkForMatch() {
    const isMatch = firstCard.dataset.name === secondCard.dataset.name;
    isMatch ? disableCards() : unflipCards();
}

function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);
    firstCard.classList.add('matched');
    secondCard.classList.add('matched');
    matchedPairs++;
    resetTurn();
    if (matchedPairs === cardPairs) {
        gameClear();
    }
}

function unflipCards() {
    setTimeout(() => {
        firstCard.classList.remove('flipped');
        secondCard.classList.remove('flipped');
        resetTurn();
    }, 1200);
}

function resetTurn() {
    [firstCard, secondCard, lockBoard] = [null, null, false];
}

function startTimer() {
    timer = setInterval(() => {
        seconds++;
        const min = String(Math.floor(seconds / 60)).padStart(2, '0');
        const sec = String(seconds % 60).padStart(2, '0');
        timerElement.textContent = `Time: ${min}:${sec}`;
    }, 1000);
}

function gameClear() {
    clearInterval(timer);
    setTimeout(() => {
        alert(`Cleared! Your time: ${timerElement.textContent}`);
        saveRanking(seconds);
        displayRankings();
    }, 500);
}

function saveRanking(timeInSeconds) {
    const rankingKey = currentMode === 'easy' ? 'easyRanking' : 'hardRanking';
    const rankings = JSON.parse(localStorage.getItem(rankingKey)) || [];
    rankings.push(timeInSeconds);
    rankings.sort((a, b) => a - b);
    localStorage.setItem(rankingKey, JSON.stringify(rankings.slice(0, 5)));
}

function displayRankings() {
    displayRankingForMode('easy', easyRankingList);
    displayRankingForMode('hard', hardRankingList);
}

function displayRankingForMode(mode, listElement) {
    const rankingKey = mode === 'easy' ? 'easyRanking' : 'hardRanking';
    const rankings = JSON.parse(localStorage.getItem(rankingKey)) || [];
    listElement.innerHTML = '';
    if (rankings.length === 0) {
        listElement.innerHTML = '<li>No records yet</li>';
    } else {
        rankings.forEach(time => {
            const min = String(Math.floor(time / 60)).padStart(2, '0');
            const sec = String(time % 60).padStart(2, '0');
            const li = document.createElement('li');
            li.textContent = `${min}:${sec}`;
            listElement.appendChild(li);
        });
    }
}
