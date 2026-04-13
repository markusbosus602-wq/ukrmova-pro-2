// js/main.js
const DB = "https://ukrmova-game-default-rtdb.europe-west1.firebasedatabase.app/";
let user = null;
let cC = 0;
let pOn = true;
let currentTheme = '';
let currentIndex = 0;
let correctCount = 0;
let wrongCount = 0;
let items = { gold_frame: false, crown: false, fire: false, shield: false, vip: false };
let currentCorrectAnswer = '';
let marathonQuestions = [];
let isMarathonMode = false;
let saveTimeout = null;

const correctSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3");
const wrongSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3");

// Активація звуків на першому кліку (для мобільних)
document.addEventListener('click', function enableAudio() {
  correctSound.volume = 0.5;
  wrongSound.volume = 0.5;
  document.removeEventListener('click', enableAudio);
});

window.onload = function() {
  const splash = document.getElementById('splash');
  const video = document.getElementById('splash-video');
  const startBtn = document.getElementById('startBtn');
  
  if (video && startBtn) {
    video.src = "https://file.garden/aZHnP_3ch2qR4tWj/video_2026-02-14_17-15-12.mp4";
    video.load();
    
    startBtn.onclick = function(e) {
      e.preventDefault();
      startBtn.style.display = 'none';
      video.muted = false;
      video.play().then(() => {
        console.log("Video playing");
      }).catch(err => {
        console.log("Video play error:", err);
        // Якщо відео не грає, все одно переходимо далі через 2 секунди
        setTimeout(() => {
          splash.style.display = 'none';
          tryAutoLogin();
        }, 2000);
      });
    };
    
    video.onended = function() {
      console.log("Video ended");
      splash.style.display = 'none';
      tryAutoLogin();
    };
    
    video.onerror = function() {
      console.log("Video error");
      splash.style.display = 'none';
      tryAutoLogin();
    };
  }
  
  // Запасний варіант - якщо через 10 секунд відео все ще не закінчилося
  setTimeout(() => {
    if (splash && splash.style.display !== 'none') {
      console.log("Timeout fallback");
      splash.style.display = 'none';
      tryAutoLogin();
    }
  }, 10000);
};

// Функція хешування пароля
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function tryAutoLogin() {
  const savedNick = localStorage.getItem('un');
  const savedPass = localStorage.getItem('up');
  if (savedNick && savedPass) {
    document.getElementById('nick').value = savedNick;
    document.getElementById('pass').value = savedPass;
    auth();
  } else {
    show('auth-screen');
  }
}

async function auth() {
  let n = document.getElementById('nick').value.trim();
  let p = document.getElementById('pass').value.trim();
  if(!n || !p) {
    document.getElementById('auth-error').textContent = "Введіть нікнейм та пароль";
    return;
  }
  document.getElementById('auth-error').textContent = "Завантаження...";
  try {
    const hashedPass = await hashPassword(p);
    let r = await fetch(DB + "users/" + n + ".json");
    let d = await r.json();
    if (d) {
      if (d.pass !== hashedPass) {
        document.getElementById('auth-error').textContent = "Неправильний пароль!";
        return;
      }
      user = d;
    } else {
      user = {
        name: n, pass: hashedPass, points: 0, items: {gold_frame: false},
        themeAttempts: {}, themeResults: {},
        regDate: new Date().toISOString().split('T')[0],
        avatar: '👤', avatarType: 'emoji', avatarData: null,
        friends: [], notifications: true, isAdmin: false,
        lastDailyBonus: null
      };
      await fetch(DB + "users/" + n + ".json", {method:'PUT', body:JSON.stringify(user)});
    }
    localStorage.setItem('un', n);
    localStorage.setItem('up', p);
    const now = new Date().toLocaleString('uk-UA',{timeZone:'Europe/Kyiv'});
    await fetch(DB + "user_logs.json", {method:'POST',body:JSON.stringify({game_nick:n, time:now})});
    items = user.items || {gold_frame:false};
    if (!user.themeResults) user.themeResults = {};
    if (!user.regDate) user.regDate = new Date().toISOString().split('T')[0];
    if (!user.avatar) user.avatar = '👤';
    if (!user.avatarType) user.avatarType = 'emoji';
    if (!user.friends) user.friends = [];
    if (user.notifications === undefined) user.notifications = true;
    if (!user.isAdmin) user.isAdmin = false;
    if (!user.lastDailyBonus) user.lastDailyBonus = null;
    save();
    applyItems();
    update();
    show('menu');
    document.getElementById('auth-error').textContent = "";
    checkDailyBonus();
    checkSavedProgress();
  } catch(e) {
    document.getElementById('auth-error').textContent = "Помилка підключення";
    console.error(e);
  }
}

// Debounced save
function debouncedSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    if (user) {
      fetch(DB + "users/" + user.name + ".json", {method:'PUT', body:JSON.stringify(user)});
    }
  }, 2000);
}

function save() {
  if (!user) return;
  user.items = items;
  debouncedSave();
}

function update() {
  const monEl = document.getElementById('mon');
  if (monEl && user) monEl.innerText = user.points.toLocaleString();
}

function applyItems() {
  if (!user) return;
  let nickDisplay = user.name;
  if(items.gold_frame) nickDisplay += ' <span class="gold-nick">[Золото]</span>';
  if(items.crown) nickDisplay += ' 👑';
  if(items.fire) nickDisplay += ' 🔥';
  if(items.shield) nickDisplay += ' 🛡️';
  if(items.vip) nickDisplay += ' 💎 VIP';
  const nickEl = document.getElementById('playerNick');
  if (nickEl) nickEl.innerHTML = nickDisplay;
}

function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
  const screen = document.getElementById(id);
  if (screen) screen.style.display = 'flex';
  if (id === 'cabinet' && user && typeof loadCabinet === 'function') {
    loadCabinet();
  }
}

// Адмін-панель тепер тільки для адмінів
function admT() {
  if (user && user.isAdmin === true) {
    if(++cC >= 5) {
      const adminPanel = document.getElementById('admin-panel');
      if (adminPanel) adminPanel.style.display = 'block';
      logAdminAccess();
      loadAdminLogs();
      loadUserLog();
      cC = 0;
    }
  } else {
    showNotification("⛔ Доступ заборонено!");
  }
}

async function logAdminAccess() {
  if (!user) return;
  const now = new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' });
  await fetch(DB + "admin_logs.json", { method: 'POST', body: JSON.stringify({ nick: user.name, time: now }) });
}

function closeAdm() {
  document.getElementById('admin-panel').style.display = 'none';
  cC = 0;
}

function toggleP() {
  pOn = !pOn;
  const btn = document.getElementById('pen-btn');
  if (btn) {
    btn.innerText = pOn ? "ШТРАФИ: ВКЛ" : "ШТРАФИ: ВИКЛ";
    btn.style.background = pOn ? "var(--red)" : "var(--green)";
  }
}

async function delU() {
  let n = document.getElementById('a-n').value.trim();
  if(!n) return alert("Введіть нікнейм");
  if(confirm(`Видалити ${n}?`)) {
    await fetch(DB+"users/"+n+".json", {method:'DELETE'});
    alert("Видалено");
    loadPlayers();
  }
}

async function edO(add) {
  let n = document.getElementById('a-n').value.trim();
  if(!n) return alert("Введіть ник");
  let amt = prompt(add ? "Скільки додати?" : "Скільки відняти?");
  if(isNaN(amt) || amt <= 0) return alert("Невірна сума");
  amt = parseInt(amt);
  let r = await fetch(DB+"users/"+n+".json"), d = await r.json();
  if(!d) return alert("Гравця не знайдено");
  d.points += add ? amt : -amt;
  d.points = Math.max(0, d.points);
  await fetch(DB+"users/"+n+".json", {method:'PUT', body:JSON.stringify(d)});
  alert("Гроші оновлено");
  loadPlayers();
}

async function loadPlayers() {
  let r = await fetch(DB + "users/.json"), d = await r.json(), list = document.getElementById('player-list');
  list.innerHTML = '';
  if (!d || !Object.keys(d).length) {
    list.innerHTML = '<div style="padding:12px;color:#aaa">Гравців немає</div>';
    return;
  }
  for (let key in d) {
    let u = d[key];
    list.innerHTML += `<div style="padding:8px; border-bottom:1px solid #ddd;"><strong>${u.name || key}</strong><br><small>Баланс: ${u.points || 0} ₴</small></div>`;
  }
}

async function loadUserLog() {
  try {
    let r = await fetch(DB + "user_logs.json");
    let data = await r.json();
    let logDiv = document.getElementById('user-log');
    logDiv.innerHTML = '';
    if (data) {
      Object.values(data).reverse().slice(0,50).forEach(entry => {
        logDiv.innerHTML += `<div class="log-entry">${entry.time} — <b>${entry.game_nick}</b></div>`;
      });
    } else {
      logDiv.innerHTML = 'Лог порожній';
    }
  } catch (e) {
    document.getElementById('user-log').innerHTML = 'Помилка';
  }
}

async function clearUserLog() {
  if (!confirm("Очистити лог?")) return;
  await fetch(DB + "user_logs.json", {method: 'DELETE'});
  loadUserLog();
}

async function loadAdminLogs() {
  try {
    let r = await fetch(DB + "admin_logs.json");
    let data = await r.json();
    let logDiv = document.getElementById('admin-log');
    logDiv.innerHTML = '';
    if (data) {
      Object.values(data).reverse().forEach(log => {
        logDiv.innerHTML += `<div class="log-entry">${log.time} — <b>${log.nick}</b></div>`;
      });
    } else {
      logDiv.innerHTML = 'Лог порожній';
    }
  } catch (e) {
    document.getElementById('admin-log').innerHTML = 'Помилка';
  }
}

async function clearAdminLogs() {
  if (!confirm("Очистити лог адмінки?")) return;
  await fetch(DB + "admin_logs.json", {method: 'DELETE'});
  loadAdminLogs();
}

// МАРАФОН
function startMarathon() {
  const allQuestions = [];
  for (let theme in themes) {
    if (themes[theme] && Array.isArray(themes[theme])) {
      allQuestions.push(...themes[theme]);
    }
  }
  marathonQuestions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 20);
  isMarathonMode = true;
  currentIndex = 0;
  correctCount = 0;
  wrongCount = 0;
  show('game');
  loadQuestion();
}

function startTheme(theme) {
  currentTheme = theme;
  currentIndex = 0;
  correctCount = 0;
  wrongCount = 0;
  isMarathonMode = false;
  if (!user.themeAttempts) user.themeAttempts = {};
  if (!user.themeAttempts[theme]) user.themeAttempts[theme] = 0;
  show('game');
  loadQuestion();
}

function updateProgress() {
  let total = 0;
  if (isMarathonMode) {
    total = marathonQuestions.length;
  } else {
    const qs = themes[currentTheme];
    if (qs) total = qs.length;
  }
  if (total > 0) {
    const percent = ((currentIndex) / total) * 100;
    const fill = document.getElementById('progressFill');
    if (fill) fill.style.width = `${percent}%`;
    const counter = document.getElementById('question-counter');
    if (counter) counter.innerText = `${currentIndex}/${total}`;
  }
}

function loadQuestion() {
  let qs;
  if (isMarathonMode) {
    qs = marathonQuestions;
  } else {
    qs = themes[currentTheme];
  }
  
  if (!qs || currentIndex >= qs.length) {
    const total = correctCount + wrongCount;
    if (typeof saveThemeResult === 'function' && total > 0 && !isMarathonMode) {
      saveThemeResult(currentTheme, correctCount, total);
    }
    if (isMarathonMode) {
      const reward = correctCount * 50;
      user.points += reward;
      showNotification(`🏃 Марафон завершено! +${reward} ₴ за ${correctCount} правильних відповідей!`);
      save();
    } else {
      user.themeAttempts[currentTheme] = (user.themeAttempts[currentTheme] || 0) + 1;
      save();
    }
    document.getElementById('qtext').textContent = "Тема завершена!";
    document.getElementById('feedback').innerHTML = '';
    document.getElementById('abox').innerHTML = `
      <div class="summary">
        <strong>Правильних:</strong> ${correctCount}<br>
        <strong>Неправильних:</strong> ${wrongCount}<br>
        <strong>Баланс:</strong> ${user.points.toLocaleString()} ₴
      </div>
      <button class="btn" onclick="show('sections')">Обрати тему</button>
    `;
    updateProgress();
    return;
  }

  const q = qs[currentIndex];
  currentCorrectAnswer = q.a;
  document.getElementById('qtext').textContent = `${currentIndex+1}/${qs.length}: ${q.q}`;
  document.getElementById('feedback').innerHTML = '';
  const abox = document.getElementById('abox');
  abox.innerHTML = '';
  updateProgress();

  let answers = [q.a, ...q.w];
  answers.sort(() => Math.random() - 0.5);

  answers.forEach(o => {
    let btn = document.createElement('button');
    btn.className = 'btn';
    btn.innerText = o;
    btn.onclick = () => checkAnswer(o, q.a, btn);
    abox.appendChild(btn);
  });
  
  const hintBtn = document.getElementById('hintBtn');
  if (hintBtn) hintBtn.disabled = false;
}

function checkAnswer(selected, correct, button) {
  document.querySelectorAll('#abox .btn').forEach(b => b.disabled = true);
  
  if (selected === correct) {
    correctCount++;
    user.points += 100;
    button.style.background = '#4caf50';
    document.getElementById('feedback').innerHTML = '<span class="correct">✓ ПРАВИЛЬНО!</span>';
    correctSound.play().catch(()=>{});
    applyShakeEffect(button, false);
  } else {
    wrongCount++;
    if (pOn) {
      user.points = Math.max(0, user.points - 30);
    }
    button.style.background = '#f44336';
    document.getElementById('feedback').innerHTML = '<span class="wrong">✗ НЕПРАВИЛЬНО!</span>';
    wrongSound.play().catch(()=>{});
    applyShakeEffect(button, true);
    
    const correctButtons = document.querySelectorAll('#abox .btn');
    correctButtons.forEach(btn => {
      if (btn.innerText === correct) {
        btn.style.background = '#4caf50';
        btn.style.animation = 'pulse 0.5s ease';
      }
    });
  }
  
  document.getElementById('mon').innerText = user.points.toLocaleString();
  save();
  
  setTimeout(() => {
    currentIndex++;
    loadQuestion();
  }, 1500);
}

function applyShakeEffect(button, isWrong) {
  if (isWrong) {
    button.style.animation = 'shake 0.3s ease';
    setTimeout(() => {
      button.style.animation = '';
    }, 300);
  } else {
    button.style.animation = 'bounce 0.5s ease';
    setTimeout(() => {
      button.style.animation = '';
    }, 500);
  }
}

// ПІДКАЗКА
function useHint() {
  if (!user || user.points < 50) {
    showNotification("❌ Недостатньо грошей для підказки! (50₴)");
    return;
  }
  
  const buttons = document.querySelectorAll('#abox .btn');
  let correctButton = null;
  
  buttons.forEach(btn => {
    if (btn.innerText === currentCorrectAnswer) {
      correctButton = btn;
    }
  });
  
  if (correctButton) {
    user.points -= 50;
    correctButton.style.background = '#ffd700';
    correctButton.style.color = '#000';
    correctButton.style.animation = 'pulse 0.5s ease';
    document.getElementById('mon').innerText = user.points.toLocaleString();
    save();
    showNotification(`💡 Підказка: правильна відповідь виділена! -50₴`);
    
    const hintBtn = document.getElementById('hintBtn');
    if (hintBtn) hintBtn.disabled = true;
  }
}

async function loadT() {
  show('top');
  let r = await fetch(DB+"users/.json"), d = await r.json();
  let l = document.getElementById('tlist');
  l.innerHTML = '';
  if(d) {
    let topPlayers = Object.values(d).sort((a,b)=> (b.points||0) - (a.points||0)).slice(0,100);
    topPlayers.forEach((u,i) => {
      l.innerHTML += `<div style="display:flex;justify-content:space-between;padding:8px"><span>${i+1}. ${u.name}</span><b>${u.points||0} ₴</b></div>`;
    });
  } else {
    l.innerHTML = '<div style="padding:12px;color:#aaa">Топ порожній</div>';
  }
}

function buyItem(item) {
  const prices = {gold_frame:1000, crown:2000, fire:1500, shield:2500, vip:5000};
  if(user.points >= prices[item]){
    user.points -= prices[item];
    items[item] = true;
    user.items = items;
    applyItems();
    save();
    update();
    showNotification(`✅ Куплено ${getItemName(item)}!`);
  } else {
    showNotification("❌ Недостатньо грошей!");
  }
}

function getItemName(item) {
  const names = {
    gold_frame: "Золота рамка",
    crown: "Корона",
    fire: "Полум'я",
    shield: "Щит",
    vip: "ВІП"
  };
  return names[item] || item;
}

// ЩОДЕННИЙ БОНУС
function checkDailyBonus() {
  const today = new Date().toDateString();
  if (user.lastDailyBonus !== today) {
    showNotification("🎁 Натисніть кнопку 'ДЕНЬ' у меню, щоб отримати щоденний бонус!");
  }
}

function claimDailyBonus() {
  const today = new Date().toDateString();
  if (user.lastDailyBonus === today) {
    showNotification("❌ Ви вже отримали бонус сьогодні!");
    return;
  }
  
  user.lastDailyBonus = today;
  user.points += 200;
  save();
  update();
  showNotification("🎁 Щоденний бонус: +200 ₴!");
}

// ЕКСПОРТ/ІМПОРТ ПРОГРЕСУ
function exportProgress() {
  const data = {
    name: user.name,
    points: user.points,
    themeResults: user.themeResults,
    items: user.items,
    friends: user.friends,
    avatar: user.avatar,
    avatarType: user.avatarType,
    avatarData: user.avatarData
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ukrmova_${user.name}_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showNotification("💾 Прогрес експортовано!");
}

function importProgress() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (imported.name !== user.name) {
          if (!confirm(`Увага! Імпорт даних для іншого ніка "${imported.name}". Продовжити?`)) return;
        }
        
        user.points = imported.points || user.points;
        user.themeResults = imported.themeResults || user.themeResults;
        user.items = imported.items || user.items;
        user.friends = imported.friends || user.friends;
        if (imported.avatar) user.avatar = imported.avatar;
        if (imported.avatarType) user.avatarType = imported.avatarType;
        if (imported.avatarData) user.avatarData = imported.avatarData;
        items = user.items;
        
        save();
        update();
        applyItems();
        if (typeof loadCabinet === 'function') loadCabinet();
        showNotification("📥 Прогрес імпортовано!");
      } catch (err) {
        alert("Помилка імпорту: невірний формат файлу");
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ЗБЕРЕЖЕННЯ ПРОГРЕСУ ГРИ
function saveGameProgress() {
  if (currentTheme && currentIndex > 0 && !isMarathonMode) {
    localStorage.setItem('game_progress', JSON.stringify({
      theme: currentTheme,
      index: currentIndex,
      correct: correctCount,
      wrong: wrongCount
    }));
  }
}

function checkSavedProgress() {
  const saved = localStorage.getItem('game_progress');
  if (saved) {
    try {
      const progress = JSON.parse(saved);
      if (confirm(`У вас є збережений прогрес у темі. Продовжити?`)) {
        currentTheme = progress.theme;
        currentIndex = progress.index;
        correctCount = progress.correct;
        wrongCount = progress.wrong;
        isMarathonMode = false;
        show('game');
        loadQuestion();
        localStorage.removeItem('game_progress');
      } else {
        localStorage.removeItem('game_progress');
      }
    } catch(e) {}
  }
}

window.addEventListener('beforeunload', () => {
  if (currentTheme && currentIndex > 0 && !isMarathonMode && user) {
    saveGameProgress();
  }
});

function showNotification(msg) {
  if (user && user.notifications === false) return;
  const toast = document.getElementById('notificationToast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}
