// DOM要素の取得
const gameBoard = document.getElementById('game-board');
const timerElement = document.getElementById('timer');
const easyBtn = document.getElementById('easy-btn');
const hardBtn = document.getElementById('hard-btn');
const easyRankingList = document.getElementById('easy-ranking');
const hardRankingList = document.getElementById('hard-ranking');

// ゲームの状態を管理する変数
let cardPairs;
let cards = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let matchedPairs = 0;
let currentMode = '';

// タイマー関連の変数
let timer;
let seconds = 0;

// 画像のパス
const imagePath = 'images/';

// カードのサイズ (CSSと合わせる)
const CARD_WIDTH = 100;
const CARD_HEIGHT = 140;
const ROTATION_RANGE = 15; 

// イベントリスナーを設定
easyBtn.addEventListener('click', () => startGame('easy'));
hardBtn.addEventListener('click', () => startGame('hard'));
document.addEventListener('DOMContentLoaded', displayRankings);

/**
 * ゲームを開始する関数
 */
function startGame(mode) {
    currentMode = mode;
    cardPairs = (mode === 'easy') ? 12 : 13;
    resetGame();
    createBoard();
    startTimer();
}

/**
 * ゲームの状態をリセットする関数
 */
function resetGame() {
    clearInterval(timer);
    seconds = 0;
    timerElement.textContent = '時間: 00:00';
    gameBoard.innerHTML = '';
    matchedPairs = 0;
    lockBoard = false;
    firstCard = null;
    secondCard = null;
    cards = [];
}

/**
 * カードをシャッフルしてボードを作成する関数
 */
function createBoard() {
    let gameImages = [];
    for (let i = 1; i <= cardPairs; i++) {
        gameImages.push(`${i}.jpg`);
        gameImages.push(`${i}.jpg`);
    }
    shuffleArray(gameImages); 

    const numCards = gameImages.length;
    const boardWidth = gameBoard.clientWidth;
    const boardHeight = gameBoard.clientHeight;

    const gridCols = (currentMode === 'easy') ? 6 : 7;
    const gridRows = Math.ceil(numCards / gridCols);

    const cellWidth = boardWidth / gridCols;
    const cellHeight = boardHeight / gridRows;

    let cellPositions = [];
    for (let i = 0; i < numCards; i++) {
        cellPositions.push({
            row: Math.floor(i / gridCols),
            col: i % gridCols,
        });
    }
    shuffleArray(cellPositions);

    gameImages.forEach((imageName, index) => {
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

        const pos = cellPositions[index];
        setCardPositionInCell(card, pos, cellWidth, cellHeight);
        
        card.addEventListener('click', flipCard);
        gameBoard.appendChild(card);
        cards.push(card);
    });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function setCardPositionInCell(card, pos, cellWidth, cellHeight) {
    const cellX = pos.col * cellWidth;
    const cellY = pos.row * cellHeight;

    const maxOffsetX = Math.max(0, cellWidth - CARD_WIDTH - 10);
    const maxOffsetY = Math.max(0, cellHeight - CARD_HEIGHT - 10);

    const randomOffsetX = Math.random() * maxOffsetX;
    const randomOffsetY = Math.random() * maxOffsetY;
    const randomRotation = (Math.random() * (ROTATION_RANGE * 2)) - ROTATION_RANGE;

    card.style.left = `${cellX + randomOffsetX}px`;
    card.style.top = `${cellY + randomOffsetY}px`;
    card.style.transform = `rotateZ(${randomRotation}deg)`;
}

function flipCard() {
    if (lockBoard || this.classList.contains('flipped')) return;
    if (this === firstCard) return;

    this.classList.add('flipped');
    this.style.zIndex = 10;

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

    firstCard.style.zIndex = 1;
    secondCard.style.zIndex = 1;

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
        firstCard.style.zIndex = 1;
        secondCard.style.zIndex = 1;
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
        timerElement.textContent = `時間: ${min}:${sec}`;
    }, 1000);
}

function gameClear() {
    clearInterval(timer);
    setTimeout(() => {
        alert(`クリア！タイムは ${timerElement.textContent} でした！`);
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
        listElement.innerHTML = '<li>まだ記録がありません</li>';
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
