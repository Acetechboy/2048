// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDhmbx2vQkRBk1r9j21bwuzFw3uEJUdZDY",
  authDomain: "project-4706304311592930157.firebaseapp.com",
  projectId: "project-4706304311592930157",
  storageBucket: "project-4706304311592930157.firebasestorage.app",
  messagingSenderId: "401832134319",
  appId: "1:401832134319:web:99704cf6ec3d2b89cd765a",
  measurementId: "G-LVXWPLG38Q"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// متغیرهای بازی
let currentUser = null;
let gameManager = null;
let bestScore = 0;

// حفظ/لود لاگین
function saveUser() {
    if (currentUser) localStorage.setItem('currentUser', JSON.stringify(currentUser));
}
function loadUser() {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
        currentUser = JSON.parse(saved);
        document.getElementById('welcome-msg').textContent = `خوش آمدید، ${currentUser.name || currentUser.displayName}!`;
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        return true;
    }
    return false;
}

// کلاس Tile
class Tile {
    constructor(value, row, col) {
        this.value = value;
        this.row = row;
        this.col = col;
        this.element = document.createElement('div');
        this.updateClass();
    }
    updateClass() {
        this.element.className = `tile tile-${this.value} tile-position-${this.row + 1}-${this.col + 1}`;
        this.element.innerHTML = `<div class="tile-inner">${this.value}</div>`;
    }
}

// کلاس GameManager (با RTL: col 0=راست, move reverse بر اساس RTL)
class GameManager {
    constructor() {
        this.size = 4;
        this.grid = Array(this.size).fill().map(() => Array(this.size).fill(null));
        this.score = 0;
        this.addRandomTile();
        this.addRandomTile();
        this.updateGrid();
    }
    addRandomTile() {
        let emptyCells = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (!this.grid[i][j]) emptyCells.push({row: i, col: j});
            }
        }
        if (emptyCells.length) {
            let pos = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[pos.row][pos.col] = new Tile(Math.random() < 0.9 ? 2 : 4, pos.row, pos.col);
        }
    }
    move(direction) {
        let moved = false;
        // RTL: left=به راست (col کم به زیاد), right=به چپ (col زیاد به کم)
        if (direction === 'left') { // به راست در RTL
            for (let i = 0; i < this.size; i++) {
                let row = this.grid[i].slice().reverse(); // reverse برای RTL (col 0=راست آخر می‌شه)
                row = this.traverse(row);
                this.grid[i] = row.reverse().map((t, idx) => t ? new Tile(t.value, i, 3 - idx) : null);
                if (this.hasMoved(this.grid[i])) moved = true;
            }
        } else if (direction === 'right') { // به چپ در RTL
            for (let i = 0; i < this.size; i++) {
                let row = this.grid[i].slice();
                row = this.traverse(row);
                this.grid[i] = row.map((t, idx) => t ? new Tile(t.value, i, idx) : null);
                if (this.hasMoved(this.grid[i])) moved = true;
            }
        } else if (direction === 'up') { // بالا: transpose + up
            this.transpose();
            for (let j = 0; j < this.size; j++) {
                let col = this.grid.map(row => row[j]).slice();
                col = this.traverse(col);
                for (let i = 0; i < this.size; i++) {
                    this.grid[i][j] = col[i] ? new Tile(col[i].value, i, j) : null;
                }
                if (this.hasMoved(col)) moved = true;
            }
            this.transpose();
        } else if (direction === 'down') { // پایین: transpose + down (reverse col)
            this.transpose();
            for (let j = 0; j < this.size; j++) {
                let col = this.grid.map(row => row[j]).slice().reverse();
                col = this.traverse(col);
                col = col.reverse();
                for (let i = 0; i < this.size; i++) {
                    this.grid[i][j] = col[i] ? new Tile(col[i].value, i, j) : null;
                }
                if (this.hasMoved(col)) moved = true;
            }
            this.transpose();
        }
        if (moved) this.addRandomTile();
        this.updateGrid();
        if (this.isGameOver()) {
            document.getElementById('game-message').textContent = 'بازی تمام شد!';
            document.getElementById('save-score').style.display = 'block';
        }
    }
    traverse(cells) {
        let newCells = cells.filter(t => t);
        for (let i = 0; i < newCells.length - 1; i++) {
            if (newCells[i].value === newCells[i + 1].value) {
                newCells[i].value *= 2;
                this.score += newCells[i].value;
                newCells.splice(i + 1, 1);
            }
        }
        while (newCells.length < this.size) newCells.push(null);
        return newCells;
    }
    hasMoved(cells) {
        return !cells.every((cell, idx) => !cell || cells[idx].value === this.grid[cells[0]?.row || 0][idx]?.value);
    }
    transpose() {
        for (let i = 0; i < this.size; i++) {
            for (let j = i + 1; j < this.size; j++) {
                [this.grid[i][j], this.grid[j][i]] = [this.grid[j][i], this.grid[i][j]];
            }
        }
    }
    updateGrid() {
        document.querySelectorAll('.tile').forEach(el => el.remove());
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.grid[i][j]) {
                    this.grid[i][j].updateClass();
                    document.querySelector('.grid-container').appendChild(this.grid[i][j].element);
                }
            }
        }
        document.getElementById('score').textContent = `امتیاز: ${this.score}`;
    }
    isGameOver() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (!this.grid[i][j]) return false;
                if (j < this.size - 1 && this.grid[i][j].value === this.grid[i][j + 1].value) return false;
                if (i < this.size - 1 && this.grid[i][j].value === this.grid[i + 1][j].value) return false;
            }
        }
        return true;
    }
    newGame() {
        this.grid = Array(this.size).fill().map(() => Array(this.size).fill(null));
        this.score = 0;
        this.addRandomTile();
        this.addRandomTile();
        this.updateGrid();
        document.getElementById('game-message').textContent = '';
        document.getElementById('save-score').style.display = 'none';
    }
}

// DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    loadUser();  // لود لاگین

    // رویدادهای ورود (همون قبلی)
    const guestBtn = document.getElementById('guest-btn');
    if (guestBtn) {
        guestBtn.addEventListener('click', () => {
            document.getElementById('guest-name-input').style.display = 'flex';
        });
    }

    const submitGuest = document.getElementById('submit-guest');
    if (submitGuest) {
        submitGuest.addEventListener('click', () => {
            const name = document.getElementById('guest-name').value.trim();
            if (name) {
                currentUser = { name, uid: 'guest_' + Date.now() };
                saveUser();
                document.getElementById('welcome-msg').textContent = `خوش آمدید، ${name}!`;
                document.getElementById('login-page').style.display = 'none';
                document.getElementById('dashboard').style.display = 'block';
                const challengeId = new URLSearchParams(window.location.search).get('challenge');
                if (challengeId) {
                    loadLeaderboard(challengeId);
                    document.getElementById('test-game-btn').click();
                }
            } else {
                alert('لطفاً نام خود را وارد کنید!');
            }
        });
    }

    const googleBtn = document.getElementById('google-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider).then((result) => {
                currentUser = result.user;
                saveUser();
                document.getElementById('welcome-msg').textContent = `خوش آمدید، ${currentUser.displayName}!`;
                document.getElementById('login-page').style.display = 'none';
                document.getElementById('dashboard').style.display = 'block';
                const challengeId = new URLSearchParams(window.location.search).get('challenge');
                if (challengeId) {
                    loadLeaderboard(challengeId);
                    document.getElementById('test-game-btn').click();
                }
            }).catch((error) => {
                alert('خطا در ورود: ' + error.message);
            });
        });
    }

    // ساخت چلنج (همون قبلی)
    const createChallengeBtn = document.getElementById('create-challenge-btn');
    if (createChallengeBtn) {
        createChallengeBtn.addEventListener('click', () => {
            document.getElementById('challenge-form').style.display = 'flex';
        });
    }

    const submitChallenge = document.getElementById('submit-challenge');
    if (submitChallenge) {
        submitChallenge.addEventListener('click', () => {
            const name = document.getElementById('challenge-name').value.trim();
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            if (name && startDate && endDate && new Date(startDate) < new Date(endDate)) {
                db.collection('challenges').add({
                    name: name,
                    startDate: firebase.firestore.Timestamp.fromDate(new Date(startDate)),
                    endDate: firebase.firestore.Timestamp.fromDate(new Date(endDate)),
                    creator: currentUser.uid || currentUser.name,
                    createdAt: firebase.firestore.Timestamp.now(),
                    active: true
                }).then((docRef) => {
                    const link = `${window.location.href}?challenge=${docRef.id}`;
                    document.getElementById('challenge-link').innerHTML = `<p>لینک چلنج: <a href="${link}" target="_blank">${link}</a></p><button onclick="document.getElementById('challenge-link').style.display='none';">بستن</button>`;
                    document.getElementById('challenge-link').style.display = 'block';
                    document.getElementById('challenge-form').style.display = 'none';
                    document.getElementById('challenge-name').value = '';
                    document.getElementById('start-date').value = '';
                    document.getElementById('end-date').value = '';
                }).catch((error) => {
                    alert('خطا در ساخت چلنج: ' + error.message);
                });
            } else {
                alert('لطفاً اطلاعات کامل و معتبر وارد کنید (پایان بعد از شروع)!');
            }
        });
    }

    // بازی تستی (همون قبلی)
    const testGameBtn = document.getElementById('test-game-btn');
    if (testGameBtn) {
        testGameBtn.addEventListener('click', () => {
            document.getElementById('dashboard').style.display = 'none';
            document.getElementById('game-container').style.display = 'block';
            if (!gameManager) gameManager = new GameManager();
            document.getElementById('best').textContent = `بهترین: ${bestScore}`;
            if (!document.keydownHandler) {
                document.keydownHandler = true;
                document.addEventListener('keydown', (e) => {
                    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                        e.preventDefault();
                        gameManager.move(e.key.replace('Arrow', '').toLowerCase());
                    }
                });
            }
            const newGameBtn = document.getElementById('new-game');
            if (newGameBtn) newGameBtn.addEventListener('click', () => gameManager.newGame());
        });
    }

    // ذخیره امتیاز (همون قبلی)
    const saveScoreBtn = document.getElementById('save-score');
    if (saveScoreBtn) {
        saveScoreBtn.addEventListener('click', () => {
            const challengeId = new URLSearchParams(window.location.search).get('challenge');
            if (challengeId) {
                db.collection('challenges').doc(challengeId).get().then((doc) => {
                    if (doc.exists && doc.data().active) {
                        const now = firebase.firestore.Timestamp.now();
                        if (now >= doc.data().startDate && now <= doc.data().endDate) {
                            db.collection('scores').add({
                                challengeId: challengeId,
                                userId: currentUser.uid || currentUser.name,
                                userName: currentUser.name || currentUser.displayName || 'ناشناس',
                                score: gameManager.score,
                                timestamp: now
                            }).then(() => {
                                alert('امتیاز ذخیره شد!');
                                loadLeaderboard(challengeId);
                            }).catch((error) => alert('خطا در ذخیره: ' + error.message));
                        } else {
                            alert('چلنج در زمان فعال نیست!');
                        }
                    } else {
                        alert('چلنج یافت نشد!');
                    }
                });
            } else {
                bestScore = Math.max(bestScore, gameManager.score);
                document.getElementById('best').textContent = `بهترین: ${bestScore}`;
                alert('بهترین امتیاز به‌روزرسانی شد!');
            }
            saveScoreBtn.style.display = 'none';
        });
    }

    // خروج از بازی (همون قبلی)
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        gameContainer.addEventListener('click', (e) => {
            if (!e.target.closest('#new-game') && !e.target.closest('#save-score')) {
                gameContainer.style.display = 'none';
                document.getElementById('dashboard').style.display = 'block';
                document.getElementById('leaderboard').style.display = 'none';
            }
        });
    }

    // چک چلنج در URL (همون قبلی)
    const challengeId = new URLSearchParams(window.location.search).get('challenge');
    if (challengeId && !loadUser()) {
        alert('برای شرکت در چلنج، ابتدا وارد شوید.');
    } else if (challengeId && currentUser) {
        loadLeaderboard(challengeId);
        document.getElementById('test-game-btn').click();
    }
});

// تابع لیدربورد (همون قبلی)
function loadLeaderboard(challengeId) {
    db.collection('scores')
        .where('challengeId', '==', challengeId)
        .orderBy('score', 'desc')
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get()
        .then((querySnapshot) => {
            let html = '<h3>لیدربورد چلنج</h3><ul>';
            if (querySnapshot.empty) {
                html += '<li>هنوز امتیازی ثبت نشده!</li>';
            } else {
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    html += `<li>${data.userName}: ${data.score} امتیاز</li>`;
                });
            }
            html += '</ul>';
            document.getElementById('leaderboard').innerHTML = html;
            document.getElementById('leaderboard').style.display = 'block';
        })
        .catch((error) => {
            alert('خطا در لود لیدربورد: ' + error.message);
        });
}

// مدیریت auth گوگل (همون قبلی)
auth.onAuthStateChanged((user) => {
    if (user && !currentUser) {
        currentUser = user;
        saveUser();
        document.getElementById('welcome-msg').textContent = `خوش آمدید، ${user.displayName}!`;
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        const challengeId = new URLSearchParams(window.location.search).get('challenge');
        if (challengeId) {
            loadLeaderboard(challengeId);
            document.getElementById('test-game-btn').click();
        }
    }
});
