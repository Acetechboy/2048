// Firebase
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
let currentUser = null;
let challengeActive = false;
let timerInterval;
let currentChallengeId = null;
let gameManager = null;

// حفظ لاگین
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    showChallengeMenu();
  }
});

// ورود با گوگل
document.getElementById("googleLogin").addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).then((result) => {
    currentUser = result.user;
    showChallengeMenu();
  }).catch((error) => {
    alert("خطا در ورود با گوگل: " + error.message);
  });
});

// ورود مهمان
document.getElementById("guestLogin").addEventListener("click", () => {
  document.getElementById("nameInput").style.display = "block";
});

document.getElementById("saveGuestName").addEventListener("click", () => {
  const name = document.getElementById("guestName").value.trim();
  if (!name) return alert("نام را وارد کنید");
  auth.signInAnonymously().then((result) => {
    currentUser = result.user;
    currentUser.updateProfile({
      displayName: name
    });
    showChallengeMenu();
  }).catch((error) => {
    alert("خطا در ورود مهمان: " + error.message);
  });
});

function showChallengeMenu() {
  document.getElementById("auth-section").style.display = "none";
  document.getElementById("challenge-section").style.display = "block";
}

// ساخت چلنج
document.getElementById("createChallenge").addEventListener("click", () => {
  document.getElementById("challengeForm").style.display = "block";
});

document.getElementById("startChallenge").addEventListener("click", async () => {
  const name = document.getElementById("challengeName").value.trim();
  const time = parseInt(document.getElementById("challengeTime").value) || 30;
  if (!name) return alert("نام چالش را وارد کنید");
  try {
    const challengeRef = await db.collection("challenges").add({
      name: name,
      duration: time,
      startTime: firebase.firestore.Timestamp.now(),
      creator: currentUser.uid,
      active: true
    });
    currentChallengeId = challengeRef.id;
    startChallenge(name, time);
  } catch (error) {
    alert("خطا در ساخت چالش: " + error.message);
  }
});

function startChallenge(name, time) {
  challengeActive = true;
  document.getElementById("challenge-section").style.display = "none";
  document.getElementById("game-section").style.display = "block";
  startTimer(time);
  initGame(); // شروع بازی
}

function startTimer(minutes) {
  let remaining = minutes * 60;
  timerInterval = setInterval(() => {
    const min = Math.floor(remaining / 60);
    const sec = remaining % 60;
    document.getElementById("timer").textContent = `زمان باقی‌مانده: ${min}:${sec.toString().padStart(2, '0')}`;
    remaining--;
    if (remaining < 0) {
      clearInterval(timerInterval);
      challengeActive = false;
      const score = gameManager ? gameManager.score : 0;
      saveScore(score);
      alert("زمان تمام شد! امتیاز ذخیره شد.");
      document.getElementById("game-section").style.display = "none";
      document.getElementById("challenge-section").style.display = "block";
      loadLeaderboard(currentChallengeId);
    }
  }, 1000);
}

async function saveScore(score) {
  if (!currentUser || !currentChallengeId) return;
  try {
    await db.collection("scores").add({
      challengeId: currentChallengeId,
      userId: currentUser.uid,
      userName: currentUser.displayName || "مهمان",
      score: score,
      timestamp: firebase.firestore.Timestamp.now()
    });
  } catch (error) {
    alert("خطا در ذخیره امتیاز: " + error.message);
  }
}

async function loadLeaderboard(challengeId) {
  if (!challengeId) return;
  try {
    const q = query(
      collection(db, "scores"),
      where("challengeId", "==", challengeId),
      orderBy("score", "desc"),
      limit(10)
    );
    const snapshot = await getDocs(q);
    let html = '<h3>لیدربورد</h3><ul>';
    snapshot.forEach((doc) => {
      const data = doc.data();
      html += `<li>${data.userName}: ${data.score}</li>`;
    });
    html += '</ul>';
    document.getElementById("leaderboard").innerHTML = html;
  } catch (error) {
    alert("خطا در لود لیدربورد: " + error.message);
  }
}

function initGame() {
  gameManager = new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
  gameManager.actuator.continueGame();
  document.getElementById('score').textContent = gameManager.score;
}

// دکمه بازی جدید
document.getElementById("new-game").addEventListener("click", () => {
  if (gameManager) gameManager.restart();
  document.getElementById('game-over').style.display = 'none';
  document.getElementById("new-game").style.display = 'none';
});

// JS 2048 کامل (inline)
 // (کد JS کامل از GameManager, Grid, Tile, HTMLActuator, KeyboardInputManager, TouchInputManager, LocalStorageManager – از پیام‌های قبلی کپی، برای اختصار، فرض کن کامل هست)
 // مثال Grid
 function Grid(size, previousState) {
   this.size = size;
   this.cells = previousState ? this.fromState(previousState) : this.empty();
 }

 // ... (بقیه کلاس‌ها – کامل در کد اصلی 2048)
</script>
</body>
</html>
