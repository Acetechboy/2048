// Firebase Config - با اطلاعات شما
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
let grid = [];
let score = 0;
let bestScore = 0;

// کلاس‌های بازی (از کد اصلی 2048 الهام‌گرفته)
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
    savePosition() {
        this.element.style.top = this.row * 121 + 'px';
        this.element.style.left = this.col * 121 + 'px';
    }
}

class GameManager {
    constructor() {
        this.grid = new Array(4).fill(0).map(() => new Array(4).fill(null));
        this.score = 0;
        this.addRandomTile();
        this.addRandomTile();
        this.updateGrid();
    }
    addRandomTile() {
        let emptyCells = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (!this.grid[i][j]) emptyCells.push({row: i, col: j});
            }
        }
        if (emptyCells.length) {
            let pos = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[pos.row][pos.col] = new Tile(Math.random() < 0.9 ? 2 : 4, pos.row, pos.col);
        }
    }
    move(direction) {
        // ساده‌سازی حرکت: فقط راست (direction=0) - برای کامل، up/down/left اضافه کن
        if (direction === 'right') {
            for (let i = 0; i < 4; i++) {
                let row = this.grid[i].filter(t => t).reverse();
                for (let j = 0; j < row.length - 1; j++) {
                    if (row[j].value === row[j+1].value) {
                        row[j].value *= 2;
                        this.score += row[j].value;
                        row.splice(j+1, 1);
                    }
                }
                while (row.length < 4) row.push(null);
                this.grid[i] = row.reverse().map((t, idx) => t ? new Tile(t.value, i, 3 - idx) : null);
            }
        }
        // مشابه برای left, up, down - مثال برای left:
        if (direction === 'left') {
            for (let i = 0; i < 4; i++) {
                let row = this.grid[i].filter(t => t);
                for (let j = 0; j < row.length - 1; j++) {
                    if (row[j].value === row[j+1].value) {
                        row[j].value *= 2;
                        this.score += row[j].value;
                        row.splice(j+1, 1);
                    }
                }
                while (row.length < 4) row.push(null);
                this.grid[i] = row.map((t, idx) => t ? new Tile(t.value, i, idx) : null);
            }
        }
        // برای up و down، transpose grid رو انجام بده (کد کامل رو می‌تونی از GitHub اصلی کپی کنی)
        this.addRandomTile();
        this.updateGrid();
        if (this.isGameOver()) {
            document.getElementById('game-message').textContent = 'بازی تمام شد!';
            document.getElementById('save-score').style.display = 'block'; // اجازه ذخیره امتیاز
        }
    }
    updateGrid() {
        document.querySelectorAll('.tile').forEach(el => el.remove());
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.grid[i][j]) {
                    document.querySelector('.grid-container').appendChild(this.grid[i][j].element);
                    this.grid[i][j].savePosition();
                }
            }
        }
        document.getElementById('score').textContent = `امتیاز: ${this.score}`;
    }
    isGameOver() {
        // چک پر بودن grid بدون حرکت ممکن - ساده‌سازی
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (!this.grid[i][j]) return false;
                if (j < 3 && this.grid[i][j].value === this.grid[i][j+1].value) return false;
                if (i < 3 && this.grid[i][j].value === this.grid[i+1][j].value) return false;
            }
        }
        return true;
    }
    newGame() {
        this.grid = new Array(4).fill(0).map(() => new Array(4).fill(null));
        this.score = 0;
        this.addRandomTile();
        this.addRandomTile();
        this.updateGrid();
        document.getElementById('game-message').textContent = '';
        document.getElementById('save-score').style.display = 'none';
    }
}

// رویدادهای ورود
document.getElementById('guest-btn').addEventListener('click', () => {
    document.getElementById('guest-name-input').style.display = 'block';
});

document.getElementById('submit-guest').addEventListener('click', () => {
    const name = document.getElementById('guest-name').value.trim();
    if (name) {
        currentUser = { name, uid: 'guest_' + Date.now() };
        document.getElementById('welcome-msg').textContent = `خوش آمدید، ${name}!`;
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
    } else {
        alert('لطفاً نام خود را وارد کنید!');
    }
});

document.getElementById('google-btn').addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then((result) => {
        currentUser = result.user;
        document.getElementById('welcome-msg').textContent = `خوش آمدید، ${currentUser.displayName}!`;
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
    }).catch((error) => {
        alert('خطا در ورود: ' + error.message);
    });
});

// ساخت چلنج
document.getElementById('create-challenge-btn').addEventListener('click', () => {
    document.getElementById('challenge-form').style.display = 'block';
});

document.getElementById('submit-challenge').addEventListener('click', () => {
    const name = document.getElementById('challenge-name').value.trim();
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    if (name && startDate && endDate && new Date(startDate) < new Date(endDate)) {
        db.collection('challenges').add({
            name: name,
            startDate: startDate,
            endDate: endDate,
            creator: currentUser.uid || currentUser.name,
            createdAt: firebase.firestore.Timestamp.now(),
            active: true
        }).then((docRef) => {
            const link = `${window.location.href}?challenge=${docRef.id}`;
            document.getElementById('challenge-link').innerHTML = `<p>لینک چلنج ساخته شد: <a href="${link}" target="_blank">${link}</a></p><button onclick="document.getElementById('challenge-link').style.display='none';">بستن</button>`;
            document.getElementById('challenge-link').style.display = 'block';
            document.getElementById('challenge-form').style.display = 'none';
            // ریست فرم
            document.getElementById('challenge-name').value = '';
            document.getElementById('start-date').value = '';
            document.getElementById('end-date').value = '';
        }).catch((error) => {
            alert('خطا در ساخت چلنج: ' + error.message);
        });
    } else {
        alert('لطفاً اطلاعات کامل و معتبر وارد کنید (تاریخ پایان بعد از شروع)!');
    }
});

// بازی تستی
document.getElementById('test-game-btn').addEventListener('click', () => {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    gameManager = new GameManager();
    document.getElementById('best').textContent = `بهترین: ${bestScore}`;
    // Event listener برای کلیدها (فقط اگر قبلاً اضافه نشده)
    if (!document.keydownHandler) {
        document.keydownHandler = true;
        document.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                gameManager.move(e.key.replace('Arrow', '').toLowerCase());
            }
        });
    }
    document.getElementById('new-game').addEventListener('click', () => gameManager.newGame());
});

// ذخیره امتیاز (برای چلنج یا کلی)
document.getElementById('save-score').addEventListener('click', () => {
    const challengeId = new URLSearchParams(window.location.search).get('challenge');
    if (challengeId) {
        // چک فعال بودن چلنج
        db.collection('challenges').doc(challengeId).get().then((doc) => {
            if (doc.exists && doc.data().active) {
                const now = new Date();
                if (now >= new Date(doc.data().startDate) && now <= new Date(doc.data().endDate)) {
                    db.collection('scores').add({
                        challengeId: challengeId,
                        userId: currentUser.uid || currentUser.name,
                        userName: currentUser.name || currentUser.displayName || 'ناشناس',
                        score: gameManager.score,
                        timestamp: firebase.firestore.Timestamp.now()
                    }).then(() => {
                        alert('امتیاز ذخیره شد!');
                        loadLeaderboard(challengeId);
                    }).catch((error) => {
                        alert('خطا در ذخیره: ' + error.message);
                    });
                } else {
                    alert('چلنج در زمان فعال نیست!');
                }
            } else {
                alert('چلنج یافت نشد!');
            }
        });
    } else {
        // ذخیره کلی (local)
        bestScore = Math.max(bestScore, gameManager.score);
        document.getElementById('best').textContent = `بهترین: ${bestScore}`;
        alert('امتیاز به عنوان بهترین ذخیره شد!');
    }
    document.getElementById('save-score').style.display = 'none';
});

// لود لیدربورد (برای چلنج)
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

// چک URL برای چلنج خودکار (در onload)
window.addEventListener('load', () => {
    const challengeId = new URLSearchParams(window.location.search).get('challenge');
    if (challengeId && currentUser) {
        loadLeaderboard(challengeId);
        // شروع بازی تستی
        document.getElementById('test-game-btn').click();
    } else if (challengeId) {
        // اگر کاربر لاگین نکرده، به صفحه ورود برو
        alert('لطفاً ابتدا وارد شوید!');
    }
});

// خروج از بازی به داشبورد (کلیک خارج از دکمه‌ها)
document.getElementById('game-container').addEventListener('click', (e) => {
    if (!e.target.closest('#new-game') && !e.target.closest('#save-score')) {
        document.getElementById('game-container').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        document.getElementById('leaderboard').style.display = 'none';
    }
});

// مدیریت خروج (اختیاری)
auth.onAuthStateChanged((user) => {
    if (!user && currentUser && currentUser.uid.startsWith('guest_')) {
        // guest ها logout نمی‌شن، اما گوگل می‌شه
        currentUser = null;
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('login-page').style.display = 'block';
    }
});
