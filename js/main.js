// js/main.js - Головний файл (авторизація, гра)

const DB = "https://ukrmova-game-default-rtdb.europe-west1.firebasedatabase.app/";
let user = null;
let cC = 0;
let pOn = true;
let currentTheme = '';
let currentIndex = 0;
let correctCount = 0;
let wrongCount = 0;
let items = { gold_frame: false, crown: false, fire: false, shield: false, vip: false,
  rainbow_name: false, sparkles: false, avatar_frame: false, animated_nick: false,
  vyshyvanka: false, kobza: false, sunflowers: false, bookshelf: false, theater_mask: false };
let currentCorrectAnswer = '';

const correctSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3");
const wrongSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3");

window.onload = function() {
  const splash = document.getElementById('splash');
  const video = document.getElementById('splash-video');
  const startBtn = document.getElementById('startBtn');
  
  if (video && startBtn) {
    video.src = "https://file.garden/aZHnP_3ch2qR4tWj/video_2026-02-14_17-15-12.mp4";
    
    startBtn.onclick = function() {
      startBtn.style.display = 'none';
      video.muted = false;
      video.currentTime = 0;
      video.play().catch(function(e) { console.log("Video play error:", e); });
    };
    
    video.onended = function() {
      splash.style.display = 'none';
      tryAutoLogin();
    };
    
    // Якщо відео не завантажується або забагато часу - через 10 секунд все одно запускаємо
    setTimeout(function() {
      if (splash && splash.style.display !== 'none') {
        splash.style.display = 'none';
        tryAutoLogin();
      }
    }, 10000);
  } else {
    // Якщо елементів немає - одразу запускаємо авторизацію
    tryAutoLogin();
  }
};

function tryAutoLogin() {
  console.log("tryAutoLogin called");
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
    showCustomMessage("Введіть нікнейм та пароль", true);
    return;
  }
  showCustomMessage("Завантаження...");
  try {
    let r = await fetch(DB + "users/" + n + ".json");
    let d = await r.json();
    if (d) {
      if (d.pass !== p) {
        showCustomMessage("Неправильний пароль!", true);
        return;
      }
      user = d;
    } else {
      user = {
        name: n, pass: p, points: 0, items: {gold_frame: false},
        themeAttempts: {}, themeResults: {},
        regDate: new Date().toISOString().split('T')[0],
        avatar: '👤', avatarType: 'emoji', avatarData: null,
        friends: [], notifications: true, level: 1,
        achievements: {}, lastDailyBonus: null, stickers: {}
      };
      await fetch(DB + "users/" + n + ".json", {method:'PUT', body:JSON.stringify(user)});
    }
    localStorage.setItem('un', n);
    localStorage.setItem('up', p);
    const now = new Date().toLocaleString('uk-UA',{timeZone:'Europe/Kyiv'});
    await fetch(DB + "user_logs.json", {method:'POST',body:JSON.stringify({game_nick:n, time:now})});
    items = user.items || {};
    if (!user.themeResults) user.themeResults = {};
    if (!user.regDate) user.regDate = new Date().toISOString().split('T')[0];
    if (!user.avatar) user.avatar = '👤';
    if (!user.avatarType) user.avatarType = 'emoji';
    if (!user.friends) user.friends = [];
    if (user.notifications === undefined) user.notifications = true;
    if (!user.level) user.level = 1;
    if (!user.achievements) user.achievements = {};
    if (!user.lastDailyBonus) user.lastDailyBonus = null;
    if (!user.stickers) user.stickers = {};
    
    save();
    
    if (typeof checkDailyBonus === 'function') checkDailyBonus();
    if (typeof checkEvents === 'function') checkEvents();
    if (typeof checkAchievements === 'function') checkAchievements();
    if (typeof checkStickers === 'function') checkStickers();
    if (typeof checkLevelUp === 'function') checkLevelUp();
    
    applyItems();
    update();
    show('menu');
  } catch(e) {
    showCustomMessage("Помилка підключення", true);
    console.error(e);
  }
}

function save() {
  if (!user) return;
  user.items = items;
  user.stickers = user.stickers || {};
  fetch(DB + "users/" + user.name + ".json", {method:'PUT', body:JSON.stringify(user)});
}

function update() {
  const monEl = document.getElementById('mon');
  if (monEl && user) monEl.innerText = user.points.toLocaleString();
}

function applyItems() {
  if (!user) return;
  let nickDisplay = user.name;
  if(items.gold_frame) nickDisplay += ' [Золото]';
  if(items.crown) nickDisplay += ' 👑';
  if(items.fire) nickDisplay += ' 🔥';
  if(items.shield) nickDisplay += ' 🛡️';
  if(items.vip) nickDisplay += ' 💎 VIP';
  if(items.kobza) nickDisplay += ' 🏺';
  if(items.rainbow_name) nickDisplay = `<span style="background: linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet); -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: bold;">${user.name}</span>`;
  if(items.animated_nick) nickDisplay = `<span style="animation: pulse 1s infinite; display: inline-block;">${nickDisplay}</span>`;
  
  const nickEl = document.getElementById('playerNick');
  if (nickEl) nickEl.innerHTML = nickDisplay;
  
  if (items.bookshelf) {
    nickDisplay = `<span style="position: relative;">${nickDisplay}<span style="position: absolute; left: -30px; top: -10px; font-size: 20px;">📚</span><span style="position: absolute; right: -30px; top: -10px; font-size: 20px;">📖</span></span>`;
    if (nickEl) nickEl.innerHTML = nickDisplay;
  }
  
  if (!document.querySelector('#animated-nick-style')) {
    const style = document.createElement('style');
    style.id = 'animated-nick-style';
    style.textContent = `@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); text-shadow: 0 0 10px gold; } 100% { transform: scale(1); } }`;
    document.head.appendChild(style);
  }
}

function show(id) {
  console.log("show called with id:", id);
  document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
  const screen = document.getElementById(id);
  if (screen) screen.style.display = 'flex';
  if (id === 'cabinet' && user && typeof loadCabinet === 'function') {
    loadCabinet();
  }
}

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
  if(!n) {
    showCustomMessage("Введіть нікнейм", true);
    return;
  }
  if(confirm(`Видалити ${n}?`)) {
    await fetch(DB+"users/"+n+".json", {method:'DELETE'});
    showCustomMessage("Видалено");
    loadPlayers();
  }
}

async function edO(add) {
  let n = document.getElementById('a-n').value.trim();
  if(!n) {
    showCustomMessage("Введіть ник", true);
    return;
  }
  let amt = prompt(add ? "Скільки додати?" : "Скільки відняти?");
  if(isNaN(amt) || amt <= 0) {
    showCustomMessage("Невірна сума", true);
    return;
  }
  amt = parseInt(amt);
  let r = await fetch(DB+"users/"+n+".json"), d = await r.json();
  if(!d) {
    showCustomMessage("Гравця не знайдено", true);
    return;
  }
  d.points += add ? amt : -amt;
  d.points = Math.max(0, d.points);
  await fetch(DB+"users/"+n+".json", {method:'PUT', body:JSON.stringify(d)});
  showCustomMessage("Гроші оновлено");
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
    list.innerHTML += `<div style="padding:8px; border-bottom:1px solid #ddd;"><strong>${u.name || key}</strong><br><small>Баланс: ${u.points || 0} ₴ | Рівень: ${u.level || 1}</small></div>`;
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

function startTheme(theme) {
  currentTheme = theme;
  currentIndex = 0;
  correctCount = 0;
  wrongCount = 0;
  if (typeof resetStreak === 'function') resetStreak();
  else if (typeof correctStreak !== 'undefined') correctStreak = 0;
  if (!user.themeAttempts) user.themeAttempts = {};
  if (!user.themeAttempts[theme]) user.themeAttempts[theme] = 0;
  show('game');
  loadQuestion();
}

function loadQuestion() {
  const qs = themes[currentTheme];
  if (!qs || currentIndex >= qs.length) {
    const total = correctCount + wrongCount;
    if (typeof saveThemeResult === 'function' && total > 0) {
      saveThemeResult(currentTheme, correctCount, total);
    }
    user.themeAttempts[currentTheme] = (user.themeAttempts[currentTheme] || 0) + 1;
    save();
    
    if (typeof checkStickers === 'function') checkStickers();
    
    document.getElementById('qtext').textContent = "Тема завершена!";
    document.getElementById('feedback').innerHTML = '';
    document.getElementById('abox').innerHTML = `
      <div class="summary">
        <strong>Правильних:</strong> ${correctCount}<br>
        <strong>Неправильних:</strong> ${wrongCount}<br>
        <strong>Серія правильних:</strong> ${typeof correctStreak !== 'undefined' ? correctStreak : 0}<br>
        <strong>Баланс:</strong> ${user.points.toLocaleString()} ₴
      </div>
      <button class="btn" onclick="show('sections')">Обрати тему</button>
    `;
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('question-counter').textContent = '';
    return;
  }

  const q = qs[currentIndex];
  const total = qs.length;
  currentCorrectAnswer = q.a;
  document.getElementById('qtext').textContent = `${currentIndex+1}/${total}: ${q.q}`;
  document.getElementById('feedback').innerHTML = '';
  
  const percent = ((currentIndex) / total) * 100;
  document.getElementById('progressFill').style.width = percent + '%';
  document.getElementById('question-counter').textContent = `Питання ${currentIndex+1} з ${total}`;
  
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
  
  if (typeof lastAnswerTime !== 'undefined') lastAnswerTime = Date.now();
}

function checkAnswer(selected, correct, button) {
  document.querySelectorAll('#abox .btn').forEach(b => b.disabled = true);
  
  let reward = 100;
  const timeTaken = (Date.now() - (typeof lastAnswerTime !== 'undefined' ? lastAnswerTime : Date.now())) / 1000;
  
  if (selected === correct) {
    correctCount++;
    let bonus = 0;
    if (typeof applyGameBonuses === 'function') {
      bonus = applyGameBonuses(true, timeTaken);
    } else {
      if (typeof correctStreak !== 'undefined') {
        correctStreak++;
        if (correctStreak % 5 === 0) bonus += 50;
        if (timeTaken < 3) bonus += 25;
      }
    }
    
    let finalReward = reward + bonus;
    if (typeof eventActive !== 'undefined' && eventActive === 'double_money') {
      finalReward *= 2;
      showNotification(`🎉 ПОДВІЙНІ ГРОШІ! +${finalReward} ₴`, false, 1000);
    }
    
    user.points += finalReward;
    button.style.background = '#4caf50';
    document.getElementById('feedback').innerHTML = `<span class="correct">✓ ПРАВИЛЬНО! +${finalReward} ₴</span>`;
    correctSound.play().catch(()=>{});
  } else {
    wrongCount++;
    if (typeof applyGameBonuses === 'function') applyGameBonuses(false);
    else if (typeof correctStreak !== 'undefined') correctStreak = 0;
    
    if(pOn) {
      let penalty = 30;
      user.points = Math.max(0, user.points - penalty);
      document.getElementById('feedback').innerHTML = `<span class="wrong">✗ НЕПРАВИЛЬНО! -${penalty} ₴</span>`;
    } else {
      document.getElementById('feedback').innerHTML = '<span class="wrong">✗ НЕПРАВИЛЬНО! (штрафи вимкнені)</span>';
    }
    button.style.background = '#f44336';
    wrongSound.play().catch(()=>{});
  }
  
  document.getElementById('mon').innerText = user.points.toLocaleString();
  save();
  
  if (typeof checkAchievements === 'function') checkAchievements();
  if (typeof checkStickers === 'function') checkStickers();
  if (typeof checkLevelUp === 'function') checkLevelUp();
  
  setTimeout(() => {
    currentIndex++;
    loadQuestion();
  }, 1200);
}

// Отримання аватарки для топу
function getUserAvatarHtmlForTop(avatar, avatarType, avatarData) {
  if (avatarType === 'emoji') {
    return `<span style="font-size: 20px;">${avatar || '👤'}</span>`;
  } else if (avatarType === 'photo' && avatarData) {
    return `<img src="${avatarData}" style="width: 25px; height: 25px; border-radius: 50%; object-fit: cover; vertical-align: middle;">`;
  }
  return `<span style="font-size: 20px;">👤</span>`;
}

// Показати профіль гравця (досягнення)
async function showPlayerProfile(nickname) {
  if (!nickname) return;
  
  try {
    const r = await fetch(DB + "users/" + nickname + ".json");
    const playerData = await r.json();
    
    if (!playerData) {
      showCustomMessage("❌ Гравця не знайдено!", true);
      return;
    }
    
    // Розрахунок статистики гравця
    let totalCorrect = 0, totalWrong = 0, totalThemes = 0, perfectCount = 0;
    if (playerData.themeResults) {
      for (let theme in playerData.themeResults) {
        const res = playerData.themeResults[theme];
        totalCorrect += res.correct || 0;
        totalWrong += (res.total || res.correct) - (res.correct || 0);
        totalThemes++;
        if (res.percent === 100) perfectCount++;
      }
    }
    
    const avgPercent = totalCorrect + totalWrong > 0 ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) : 0;
    
    // Визначення рівня
    let levelName = '🌱 Новачок';
    if (totalCorrect >= 1000) levelName = '🏆 Легенда';
    else if (totalCorrect >= 500) levelName = '👑 Експерт';
    else if (totalCorrect >= 300) levelName = '⭐ Майстер';
    else if (totalCorrect >= 150) levelName = '🎓 Студент';
    else if (totalCorrect >= 50) levelName = '📚 Учень';
    
    // Список досягнень гравця
    const achievementsList = [
      { id: 'firstThousand', name: '💰 Перші 1000 ₴' },
      { id: 'fiveThemes', name: '📚 5 тем пройдено' },
      { id: 'tenThemes', name: '🎓 10 тем пройдено' },
      { id: 'threePerfect', name: '⭐ 100% у 3 темах' },
      { id: 'firstFriend', name: '👥 Перший друг' },
      { id: 'fiveFriends', name: '🌟 5 друзів' }
    ];
    
    const earnedAchievements = achievementsList.filter(ach => playerData.achievements?.[ach.id]);
    const lockedAchievements = achievementsList.filter(ach => !playerData.achievements?.[ach.id]);
    
    // Отримання аватарки
    let avatarHtml = '';
    if (playerData.avatarType === 'emoji') {
      avatarHtml = `<span style="font-size: 64px;">${playerData.avatar || '👤'}</span>`;
    } else if (playerData.avatarType === 'photo' && playerData.avatarData) {
      avatarHtml = `<img src="${playerData.avatarData}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;">`;
    } else {
      avatarHtml = `<span style="font-size: 64px;">👤</span>`;
    }
    
    // Формуємо HTML модального вікна
    const modalHtml = `
      <div id="playerProfileModal" class="modal" style="display: flex;">
        <div class="modal-content" style="max-width: 350px; max-height: 80vh; overflow-y: auto;">
          <span class="modal-close" onclick="closePlayerProfileModal()">&times;</span>
          <div style="text-align: center;">
            ${avatarHtml}
            <h2 style="margin: 10px 0; color: var(--gold);">${playerData.name}</h2>
            <p style="margin: 5px 0;"><strong>${levelName}</strong></p>
            <p style="margin: 5px 0;">💰 Баланс: <strong>${(playerData.points || 0).toLocaleString()} ₴</strong></p>
            <p style="margin: 5px 0;">📅 Реєстрація: ${playerData.regDate || 'невідомо'}</p>
          </div>
          
          <hr style="margin: 15px 0; border-color: var(--gold);">
          
          <h3 style="color: var(--gold);">📊 Статистика</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 10px 0;">
            <div style="background: #2c3e50; padding: 8px; border-radius: 10px; text-align: center;">
              <div style="font-size: 20px; font-weight: bold; color: var(--gold);">${totalThemes}</div>
              <div style="font-size: 10px;">Тем пройдено</div>
            </div>
            <div style="background: #2c3e50; padding: 8px; border-radius: 10px; text-align: center;">
              <div style="font-size: 20px; font-weight: bold; color: var(--gold);">${totalCorrect}</div>
              <div style="font-size: 10px;">Правильних</div>
            </div>
            <div style="background: #2c3e50; padding: 8px; border-radius: 10px; text-align: center;">
              <div style="font-size: 20px; font-weight: bold; color: var(--gold);">${totalWrong}</div>
              <div style="font-size: 10px;">Неправильних</div>
            </div>
            <div style="background: #2c3e50; padding: 8px; border-radius: 10px; text-align: center;">
              <div style="font-size: 20px; font-weight: bold; color: var(--gold);">${avgPercent}%</div>
              <div style="font-size: 10px;">Середній %</div>
            </div>
            <div style="background: #2c3e50; padding: 8px; border-radius: 10px; text-align: center;">
              <div style="font-size: 20px; font-weight: bold; color: var(--gold);">${perfectCount}</div>
              <div style="font-size: 10px;">100% тем</div>
            </div>
            <div style="background: #2c3e50; padding: 8px; border-radius: 10px; text-align: center;">
              <div style="font-size: 20px; font-weight: bold; color: var(--gold);">${playerData.friends?.length || 0}</div>
              <div style="font-size: 10px;">Друзів</div>
            </div>
          </div>
          
          <h3 style="color: var(--gold);">🏆 Досягнення</h3>
          <div style="margin: 10px 0;">
            ${earnedAchievements.map(ach => `
              <div style="background: linear-gradient(135deg, #2ecc71, #27ae60); padding: 8px; border-radius: 8px; margin: 5px 0; color: white;">
                ✅ ${ach.name}
              </div>
            `).join('')}
            ${lockedAchievements.map(ach => `
              <div style="background: #555; padding: 8px; border-radius: 8px; margin: 5px 0; color: #aaa;">
                🔒 ${ach.name}
              </div>
            `).join('')}
            ${earnedAchievements.length === 0 ? '<div style="text-align: center; color: #aaa;">Ще немає досягнень</div>' : ''}
          </div>
          
          <button class="btn" onclick="closePlayerProfileModal()" style="margin-top: 15px;">ЗАКРИТИ</button>
        </div>
      </div>
    `;
    
    // Додаємо модальне вікно в body
    const existingModal = document.getElementById('playerProfileModal');
    if (existingModal) existingModal.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Додаємо обробник для закриття при кліку поза вікном
    document.getElementById('playerProfileModal').addEventListener('click', function(e) {
      if (e.target === this) closePlayerProfileModal();
    });
    
  } catch(e) {
    console.error(e);
    showCustomMessage("❌ Помилка завантаження профілю!", true);
  }
}

function closePlayerProfileModal() {
  const modal = document.getElementById('playerProfileModal');
  if (modal) modal.remove();
}

// Оновлена функція loadT з аватарками та клікабельними ніками
async function loadT() {
  show('top');
  let r = await fetch(DB + "users/.json");
  let d = await r.json();
  let l = document.getElementById('tlist');
  l.innerHTML = '';
  
  if (d) {
    let topPlayers = Object.values(d).sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 100);
    
    for (let i = 0; i < topPlayers.length; i++) {
      const u = topPlayers[i];
      const avatarHtml = getUserAvatarHtmlForTop(u.avatar, u.avatarType, u.avatarData);
      l.innerHTML += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #ddd;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-weight: bold; width: 35px;">${i + 1}.</span>
            ${avatarHtml}
            <span style="cursor: pointer; color: var(--gold); text-decoration: underline;" onclick="showPlayerProfile('${u.name.replace(/'/g, "\\'")}')">${getLevelIcon(u.level)} ${u.name}</span>
          </div>
          <b>${(u.points || 0).toLocaleString()} ₴</b>
        </div>
      `;
    }
  } else {
    l.innerHTML = '<div style="padding:12px;color:#aaa">Топ порожній</div>';
  }
}
