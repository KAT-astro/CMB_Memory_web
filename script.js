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
let lockBoard = false; // ボードをロックしてカードをめくれないようにする
let matchedPairs = 0;
let currentMode = '';

// タイマー関連の変数
let timer;
let seconds = 0;

// 画像のパス
const imagePath = 'images/';
const imageCount = 13; // imagesフォルダにある画像の総数

// イベントリスナーを設定
easyBtn.addEventListener('click', () => startGame('easy'));
hardBtn.addEventListener('click', () => startGame('hard'));
document.addEventListener('DOMContentLoaded', displayRankings);

/**
 * ゲームを開始する関数
 * @param {string} mode - 'easy' または 'hard'
 */
function startGame(mode) {
    currentMode = mode;
    cardPairs = (mode === 'easy') ? 12 : 13;
    
    // ゲームボードのクラスをリセット
    gameBoard.className = ''; // 既存のグリッドクラスを削除
    gameBoard.classList.add(mode === 'easy' ? 'easy-grid' : 'hard-grid');
    if (mode === 'hard') {
        gameBoard.style.gridTemplateColumns = 'repeat(13, 1fr)'; // 難しいモードは横長に
    } else {
        // 簡単モードは6x4のグリッドになるように調整
        const cardWidth = 100; // .cardのwidth
        const gap = 10; // gap
        const boardWidth = 6 * cardWidth + 5 * gap;
        gameBoard.style.maxWidth = `${boardWidth}px`;
        gameBoard.style.gridTemplateColumns = 'repeat(6, 1fr)';
    }


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
}

/**
 * カードをシャッフルしてボードを作成する関数
 */
function createBoard() {
    // 必要な数の画像を選ぶ
    let gameImages = [];
    for (let i = 1; i <= cardPairs; i++) {
        gameImages.push(`${i}.png`);
        gameImages.push(`${i}.png`); // ペアにする
    }

    // Fisher-Yatesアルゴリズムでシャッフル
    for (let i = gameImages.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gameImages[i], gameImages[j]] = [gameImages[j], gameImages[i]];
    }
    
    // カードをHTMLに生成
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
    });
}

/**
 * カードをクリックしたときの処理
 */
function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return; // 同じカードの連続クリックを防止

    this.classList.add('flipped');

    if (!firstCard) {
        firstCard = this;
        return;
    }

    secondCard = this;
    lockBoard = true;
    checkForMatch();
}

/**
 * 2枚のカードが一致するかチェックする関数
 */
function checkForMatch() {
    const isMatch = firstCard.dataset.name === secondCard.dataset.name;
    isMatch ? disableCards() : unflipCards();
}

/**
 * カードが一致した場合の処理
 */
function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);
    firstCard.classList.add('matched');
    secondCard.classList.add('matched');

    matchedPairs++;
    resetTurn();
    
    // 全てのペアが揃ったらゲームクリア
    if (matchedPairs === cardPairs) {
        gameClear();
    }
}

/**
 * カードが不一致の場合の処理
 */
function unflipCards() {
    setTimeout(() => {
        firstCard.classList.remove('flipped');
        secondCard.classList.remove('flipped');
        resetTurn();
    }, 1200); // 1.2秒後にカードを裏返す
}

/**
 * めくったカードの状態をリセットする関数
 */
function resetTurn() {
    [firstCard, secondCard, lockBoard] = [null, null, false];
}

/**
 * タイマーを開始する関数
 */
function startTimer() {
    timer = setInterval(() => {
        seconds++;
        const min = String(Math.floor(seconds / 60)).padStart(2, '0');
        const sec = String(seconds % 60).padStart(2, '0');
        timerElement.textContent = `時間: ${min}:${sec}`;
    }, 1000);
}

/**
 * ゲームクリア時の処理
 */
function gameClear() {
    clearInterval(timer);
    setTimeout(() => {
        alert(`クリア！タイムは ${timerElement.textContent} でした！`);
        saveRanking(seconds);
        displayRankings();
    }, 500);
}

/**
 * ランキングを保存する関数
 * @param {number} timeInSeconds - クリアにかかった秒数
 */
function saveRanking(timeInSeconds) {
    const rankingKey = currentMode === 'easy' ? 'easyRanking' : 'hardRanking';
    const rankings = JSON.parse(localStorage.getItem(rankingKey)) || [];
    
    rankings.push(timeInSeconds);
    rankings.sort((a, b) => a - b); // タイムの昇順にソート
    
    // 上位5件のみ保存
    localStorage.setItem(rankingKey, JSON.stringify(rankings.slice(0, 5)));
}

/**
 * ランキングを表示する関数
 */
function displayRankings() {
    displayRankingForMode('easy', easyRankingList);
    displayRankingForMode('hard', hardRankingList);
}

/**
 * 指定されたモードのランキングを表示するヘルパー関数
 * @param {string} mode - 'easy' or 'hard'
 * @param {HTMLElement} listElement - ランキングを表示するol要素
 */
function displayRankingForMode(mode, listElement) {
    const rankingKey = mode === 'easy' ? 'easyRanking' : 'hardRanking';
    const rankings = JSON.parse(localStorage.getItem(rankingKey)) || [];
    
    listElement.innerHTML = ''; // リストをクリア
    
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
