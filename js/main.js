// js/main.js
// ================================================
// ГЛОБАЛЬНІ ЗМІННІ
// ================================================
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

const correctSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3");
const wrongSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3");

// ================================================
// ЗАПУСК ВІДЕО + АВТОЛОГІН
// ================================================
window.onload = function() {
  const splash = document.getElementById('splash');
  const video = document.getElementById('splash-video');
  const startBtn = document.getElementById('startBtn');

  if (video) {
    video.src = "https://file.garden/aZHnP_3ch2qR4tWj/video_2026-02-14_17-15-12.mp4";
    startBtn.onclick = function() {
      startBtn.style.display = 'none';
      video.muted = false;
      video.currentTime = 0;
      video.play().catch(() => {});
    };
    video.onended = function() {
      splash.style.display = 'none';
      tryAutoLogin();
    };
  }

  setTimeout(() => {
    if (splash && splash.style.display !== 'none') {
      splash.style.display = 'none';
      tryAutoLogin();
    }
  }, 70000);
};

// ================================================
// ОСНОВНІ ФУНКЦІЇ
// ================================================
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
    let r = await fetch(DB + "users/" + n + ".json");
    let d = await r.json();

    if (d) {
      if (d.pass !== p) {
        document.getElementById('auth-error').textContent = "Неправильний пароль!";
        return;
      }
      user = d;
    } else {
      user = {name:n, pass:p, points:0, items:{gold_frame:false}, themeAttempts:{}, themeResults:{}, regDate:new Date().toISOString().split('T')[0]};
      await fetch(DB + "users/" + n + ".json", {method:'PUT', body:JSON.stringify(user)});
    }

    localStorage.setItem('un', n);
    localStorage.setItem('up', p);

    const now = new Date().toLocaleString('uk-UA',{timeZone:'Europe/Kyiv'});
    await fetch(DB + "user_logs.json", {method:'POST',body:JSON.stringify({game_nick:n, time:now})});

    items = user.items || {gold_frame:false};
    if (!user.themeResults) user.themeResults = {};
    if (!user.regDate) user.regDate = new Date().toISOString().split('T')[0];
    save();
    applyItems();
    update();
    show('menu');
    document.getElementById('auth-error').textContent = "";
  } catch(e) {
    document.getElementById('auth-error').textContent = "Помилка підключення";
    console.error(e);
  }
}

function save() {
  if (!user) return;
  user.items = items;
  fetch(DB + "users/" + user.name + ".json", {method:'PUT', body:JSON.stringify(user)});
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

// Адмінка
function admT() {
  if(++cC >= 5) {
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) adminPanel.style.display = 'block';
    logAdminAccess();
    loadAdminLogs();
    loadUserLog();
    cC = 0;
  }
}

async function logAdminAccess() {
  if (!user) return;
  const now = new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' });
  const entry = { nick: user.name, time: now };
  await fetch(DB + "admin_logs.json", { method: 'POST', body: JSON.stringify(entry) });
}

function closeAdm() {
  const adminPanel = document.getElementById('admin-panel');
  if (adminPanel) adminPanel.style.display = 'none';
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
  let r = await fetch(DB+"users/"+n+".json");
  let d = await r.json();
  if(!d) return alert("Гравця не знайдено");
  d.points += add ? amt : -amt;
  d.points = Math.max(0, d.points);
  await fetch(DB+"users/"+n+".json", {method:'PUT', body:JSON.stringify(d)});
  alert("Гроші оновлено");
  loadPlayers();
}

async function loadPlayers() {
  let r = await fetch(DB + "users/.json");
  let d = await r.json();
  let list = document.getElementById('player-list');
  list.innerHTML = '';
  if (!d || !Object.keys(d).length) {
    list.innerHTML = '<div style="padding:12px;color:#aaa">Гравців немає</div>';
    return;
  }
  for (let key in d) {
    let u = d[key];
    let displayNick = u.name || key;
    list.innerHTML += `
      <div style="padding:10px; border-bottom:1px solid #ddd; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong>${displayNick}</strong><br>
          <small>Баланс: ${u.points || 0} ₴ | Пароль: ${u.pass || '—'}</small>
        </div>
      </div>
    `;
  }
}

async function loadUserLog() {
  try {
    let r = await fetch(DB + "user_logs.json");
    let data = await r.json();
    let logDiv = document.getElementById('user-log');
    logDiv.innerHTML = '';
    if (data) {
      Object.values(data).reverse().slice(0,100).forEach(entry => {
        logDiv.innerHTML += `<div class="log-entry">${entry.time} — <b>${entry.game_nick}</b></div>`;
      });
    } else {
      logDiv.innerHTML = 'Лог порожній';
    }
  } catch (e) {
    document.getElementById('user-log').innerHTML = 'Помилка завантаження';
  }
}

async function clearUserLog() {
  if (!confirm("Очистити лог усіх входів?")) return;
  await fetch(DB + "user_logs.json", {method: 'DELETE'});
  loadUserLog();
  alert("Лог входів очищено");
}

async function loadAdminLogs() {
  try {
    let r = await fetch(DB + "admin_logs.json");
    let data = await r.json();
    let logDiv = document.getElementById('admin-log');
    logDiv.innerHTML = '';
    if (data && Object.keys(data).length > 0) {
      Object.values(data).reverse().forEach(log => {
        logDiv.innerHTML += `<div class="log-entry">${log.time} — <b>${log.nick}</b></div>`;
      });
    } else {
      logDiv.innerHTML = 'Лог порожній';
    }
  } catch (e) {
    document.getElementById('admin-log').innerHTML = 'Помилка завантаження логу';
  }
}

async function clearAdminLogs() {
  if (!confirm("Очистити лог адмінки?")) return;
  await fetch(DB + "admin_logs.json", {method: 'DELETE'});
  loadAdminLogs();
  alert("Лог адмінки очищено");
}

// ================================================
// ГРА
// ================================================
function startTheme(theme) {
  currentTheme = theme;
  currentIndex = 0;
  correctCount = 0;
  wrongCount = 0;
  if (!user.themeAttempts) user.themeAttempts = {};
  if (!user.themeAttempts[theme]) user.themeAttempts[theme] = 0;
  show('game');
  loadQuestion();
}

function loadQuestion() {
  const qs = themes[currentTheme];
  if (currentIndex >= qs.length) {
    // Зберігаємо результат теми
    const totalQuestions = correctCount + wrongCount;
    if (typeof saveThemeResult === 'function' && totalQuestions > 0) {
      saveThemeResult(currentTheme, correctCount, totalQuestions);
    }
    
    user.themeAttempts[currentTheme] = (user.themeAttempts[currentTheme] || 0) + 1;
    save();
    document.getElementById('qtext').textContent = "Тема завершена!";
    document.getElementById('feedback').innerHTML = '';
    document.getElementById('abox').innerHTML = `
      <div class="summary">
        <strong>Гравець:</strong> ${user ? user.name : '—'}<br><br>
        <strong style="color:var(--green)">Правильних відповідей:</strong> ${correctCount}<br>
        <strong style="color:var(--red)">Неправильних відповідей:</strong> ${wrongCount}<br><br>
        <strong>Цю тему ти проходив:</strong> ${user.themeAttempts[currentTheme]} раз(ів)<br><br>
        <strong>Поточний баланс:</strong> ${user ? user.points.toLocaleString() : 0} ₴
      </div>
      <button class="btn" onclick="show('sections')">Обрати іншу тему</button>
    `;
    return;
  }

  const q = qs[currentIndex];
  currentCorrectAnswer = q.a;
  document.getElementById('qtext').textContent = `Питання ${currentIndex+1}/${qs.length}: ${q.q}`;
  document.getElementById('feedback').innerHTML = '';
  const abox = document.getElementById('abox');
  abox.innerHTML = '';

  let answers = [q.a, ...q.w];
  answers.sort(() => Math.random() - 0.5);

  answers.forEach(o => {
    let btn = document.createElement('button');
    btn.className = 'btn';
    btn.innerText = o;
    btn.onclick = () => checkAnswer(o, q.a, btn);
    abox.appendChild(btn);
  });
}

function checkAnswer(selected, correct, button) {
  document.querySelectorAll('#abox .btn').forEach(b => b.disabled = true);

  if (selected === correct) {
    correctCount++;
    user.points += 100;
    button.style.background = 'var(--green)';
    button.style.color = 'white';
    document.getElementById('feedback').innerHTML = '<span class="correct">ПРАВИЛЬНО! ✓</span>';
    correctSound.currentTime = 0;
    correctSound.play().catch(()=>{});
  } else {
    wrongCount++;
    user.points = Math.max(0, user.points - 30);
    button.style.background = 'var(--red)';
    button.style.color = 'white';
    document.getElementById('feedback').innerHTML = '<span class="wrong">НЕПРАВИЛЬНО! ×</span>';
    wrongSound.currentTime = 0;
    wrongSound.play().catch(()=>{});
  }

  document.getElementById('mon').innerText = user.points.toLocaleString();
  save();

  setTimeout(() => {
    currentIndex++;
    loadQuestion();
  }, 1400);
}

async function loadT() {
  show('top');
  let r = await fetch(DB+"users/.json");
  let d = await r.json();
  let l = document.getElementById('tlist');
  l.innerHTML = '';
  if(d) {
    let topPlayers = Object.values(d).sort((a,b)=> (b.points||0) - (a.points||0)).slice(0,1000);
    topPlayers.forEach((u,i) => {
      l.innerHTML += `<div style="display:flex;justify-content:space-between;padding:8px">
        <span>${i+1}. ${u.name}</span><b>${u.points||0}</b>
      </div>`;
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
    applyItems();
    save();
    update();
    alert("Куплено: " + item);
  } else {
    alert("Недостатньо грошей!");
  }
}
