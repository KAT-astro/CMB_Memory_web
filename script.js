// DOM要素の取得
const gameBoard = document.getElementById('game-board');
const timerElement = document.getElementById('timer');
const easyBtn = document.getElementById('easy-btn');
const hardBtn = document.getElementById('hard-btn');
const easyRankingList = document.getElementById('easy-ranking');
const hardRankingList = document.getElementById('hard-ranking');

// 【かんたんモード用の画像リスト (12個)】
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

// 【むずかしいモード用の画像リスト (14個)】
const HARD_IMAGE_NAMES = [
    'Q-30GHz_hard.png',
    'Q-44GHz_hard.jpg',
    'Q-70GHz_hard.png',
    'Q-100GHz_hard.svg',
    'Q-143GHz_hard.png',
    'Q-217GHz_hard.jpg',
    'Q-353GHz_hard.png',
    'U-30GHz_hard.png',
    'U-44GHz_hard.jpg',
    'U-70GHz_hard.png',
    'U-100GHz_hard.svg',
    'U-143GHz_hard.png',
    'U-217GHz_hard.jpg',
    'U-353GHz_hard.png',
];

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

// イベントリスナーを設定
easyBtn.addEventListener('click', () => startGame('easy'));
hardBtn.addEventListener('click', () => startGame('hard'));
document.addEventListener('DOMContentLoaded', displayRankings);

/**
 * ゲームを開始する関数
 */
function startGame(mode) {
    currentMode = mode;
    const isEasy = (mode === 'easy');
    cardPairs = isEasy ? 12 : 14;
    
    const requiredImages = isEasy ? EASY_IMAGE_NAMES.length : HARD_IMAGE_NAMES.length;
    if (requiredImages < cardPairs) {
        alert(`エラー: 画像の数が足りません。${mode}モードには${cardPairs}種類の画像が必要です。`);
        return;
    }
    
    // ★CSSクラスを切り替える
    gameBoard.className = '';
    gameBoard.classList.add(isEasy ? 'easy-grid' : 'hard-grid');

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
 * カードをシャッフルしてボードを作成する関数（★シンプル化）
 */
function createBoard() {
    const imagesForThisGame = (currentMode === 'easy') ? EASY_IMAGE_NAMES : HARD_IMAGE_NAMES;

    let gameImages = [...imagesForThisGame, ...imagesForThisGame];
    shuffleArray(gameImages);

    // ★カードを生成して追加するだけ（位置計算は不要）
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
 * 配列をシャッフルするヘルパー関数
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
