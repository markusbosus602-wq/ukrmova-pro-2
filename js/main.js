// js/main.js - Головний файл (авторизація, гра)

const DB = "https://ukrmova-game-default-rtdb.europe-west1.firebasedatabase.app/";
let user = null;
let pOn = true;
let currentTheme = '';
let currentIndex = 0;
let correctCount = 0;
let wrongCount = 0;
let themeStartTime = null;
let items = { gold_frame: false, crown: false, fire: false, shield: false, vip: false,
  rainbow_name: false, sparkles: false, avatar_frame: false, animated_nick: false,
  vyshyvanka: false, kobza: false, sunflowers: false, bookshelf: false, theater_mask: false };
let currentCorrectAnswer = '';

const correctSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3");
const wrongSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3");

window.onload = function() {
  tryAutoLogin();
};

function tryAutoLogin() {
  const savedNick = localStorage.getItem('un');
  const savedPass = localStorage.getItem('up');
  if (savedNick && savedPass) {
    document.getElementById('nick').value = savedNick;
    document.getElementById('pass').value = savedPass;
    auth();
  } else {
    autoRegisterPlayer();
  }
}

function autoRegisterPlayer() {
  const randomName = "Гравець_" + Math.floor(Math.random() * 10000);
  const randomPass = Math.random().toString(36).substring(2, 10);
  
  localStorage.setItem('un', randomName);
  localStorage.setItem('up', randomPass);
  
  document.getElementById('nick').value = randomName;
  document.getElementById('pass').value = randomPass;
  auth();
}

async function auth() {
  let n = document.getElementById('nick').value.trim();
  let p = document.getElementById('pass').value.trim();
  if(!n || !p) {
    showCustomMessage("Помилка авторизації", true);
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
        name: n, pass: p, points: 0, points_earned: 0,
        items: {gold_frame: false},
        themeAttempts: {}, themeResults: {},
        regDate: new Date().toISOString().split('T')[0],
        avatar: '👤', avatarType: 'emoji', avatarData: null,
        friends: [], notifications: true, level: 1,
        achievements: {}, lastDailyBonus: null, stickers: {}, supportMessages: []
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
    if (!user.supportMessages) user.supportMessages = [];
    if (user.points_earned === undefined) user.points_earned = user.points || 0;
    
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
  user.supportMessages = user.supportMessages || [];
  fetch(DB + "users/" + user.name + ".json", {method:'PUT', body:JSON.stringify(user)});
}

function update() {
  const monEl = document.getElementById('mon');
  if (monEl && user) monEl.innerText = user.points.toLocaleString();
}

function applyItems() {
  if (!user) return;
  let nickDisplay = user.name;
  if(items.gold_frame && items.gold_frame_active !== false) nickDisplay += ' ✨';
  if(items.crown && items.crown_active !== false) nickDisplay += ' 👑';
  if(items.fire && items.fire_active !== false) nickDisplay += ' 🔥';
  if(items.shield && items.shield_active !== false) nickDisplay += ' 🛡️';
  if(items.vip && items.vip_active !== false) nickDisplay += ' 💎';
  if(items.kobza && items.kobza_active !== false) nickDisplay += ' 🏺';
  if(items.rainbow_name && items.rainbow_name_active !== false) {
    nickDisplay = `<span style="background: linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet); -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: bold;">${user.name}</span>`;
  }
  if(items.animated_nick && items.animated_nick_active !== false) {
    nickDisplay = `<span style="animation: pulse 1s infinite; display: inline-block;">${nickDisplay}</span>`;
  }
  
  const nickEl = document.getElementById('playerNick');
  if (nickEl) nickEl.innerHTML = nickDisplay;
  
  if (items.bookshelf && items.bookshelf_active !== false) {
    nickDisplay = `<span style="position: relative;">${nickDisplay}<span style="position: absolute; left: -30px; top: -10px; font-size: 20px;">📚</span><span style="position: absolute; right: -30px; top: -10px; font-size: 20px;">📖</span></span>`;
    if (nickEl) nickEl.innerHTML = nickDisplay;
  }
  
  if (items.sunflowers && items.sunflowers_active !== false) {
    document.body.style.background = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('https://file.garden/aZHnP_3ch2qR4tWj/sunflowers-bg.jpg') center/cover no-repeat fixed`;
  } else {
    document.body.style.background = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('https://file.garden/aZHnP_3ch2qR4tWj/61faf7df-bcea-4915-be1f-680907b3eb8f.jpg') center/cover no-repeat fixed`;
  }
  
  if (!document.querySelector('#animated-nick-style')) {
    const style = document.createElement('style');
    style.id = 'animated-nick-style';
    style.textContent = `@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); text-shadow: 0 0 10px gold; } 100% { transform: scale(1); } }`;
    document.head.appendChild(style);
  }
}

function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
  const screen = document.getElementById(id);
  if (screen) screen.style.display = 'flex';
  if (id === 'cabinet' && user && typeof loadCabinet === 'function') {
    loadCabinet();
  }
}

function startTheme(theme) {
  themeStartTime = Date.now();
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
    
    const themeName = getThemeName(currentTheme);
    const now = new Date();
    const dateStr = now.toLocaleDateString('uk-UA');
    const timeStr = now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    
    let timeSpent = '';
    if (themeStartTime) {
      const elapsedSeconds = Math.floor((Date.now() - themeStartTime) / 1000);
      const minutes = Math.floor(elapsedSeconds / 60);
      const seconds = elapsedSeconds % 60;
      if (minutes > 0) {
        timeSpent = `${minutes} хв ${seconds} сек`;
      } else {
        timeSpent = `${seconds} сек`;
      }
    }
    
    const resultPercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    let resultColor = '#e74c3c';
    if (resultPercent >= 80) resultColor = '#2ecc71';
    else if (resultPercent >= 60) resultColor = '#f39c12';
    
    document.getElementById('qtext').innerHTML = `📚 Тема "<span style="color: var(--gold);">${themeName}</span>" завершена!`;
    document.getElementById('feedback').innerHTML = '';
    document.getElementById('abox').innerHTML = `
      <div class="summary" style="background: rgba(0,0,0,0.05); border-radius: 16px; padding: 16px;">
        <div style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid var(--gold); text-align: center;">
          <span style="font-size: 14px; font-weight: bold;">📅 ${dateStr} &nbsp;|&nbsp; ⏰ ${timeStr} &nbsp;|&nbsp; ⏱️ ${timeSpent}</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 15px;">
          <div style="background: #2ecc71; padding: 10px; border-radius: 12px; text-align: center; color: white;">
            <div style="font-size: 24px; font-weight: bold;">${correctCount}</div>
            <div style="font-size: 11px;">✅ Правильних</div>
          </div>
          <div style="background: #ff4d4d; padding: 10px; border-radius: 12px; text-align: center; color: white;">
            <div style="font-size: 24px; font-weight: bold;">${wrongCount}</div>
            <div style="font-size: 11px;">❌ Неправильних</div>
          </div>
          <div style="background: #3498db; padding: 10px; border-radius: 12px; text-align: center; color: white;">
            <div style="font-size: 24px; font-weight: bold;">${total}</div>
            <div style="font-size: 11px;">📊 Всього питань</div>
          </div>
          <div style="background: ${resultColor}; padding: 10px; border-radius: 12px; text-align: center; color: white;">
            <div style="font-size: 24px; font-weight: bold;">${resultPercent}%</div>
            <div style="font-size: 11px;">🎯 Результат</div>
          </div>
        </div>
        <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #ddd; text-align: center;">
          <div style="margin-bottom: 5px;">
            <span style="font-weight: bold;">💰 Баланс:</span> <span style="color: var(--gold);">${user.points.toLocaleString()} ₴</span>
            &nbsp;&nbsp;|&nbsp;&nbsp;
            <span style="font-weight: bold;">🏆 Рейтинг:</span> <span style="color: var(--gold);">${(user.points_earned || user.points).toLocaleString()} ₴</span>
          </div>
        </div>
      </div>
      <button class="btn" style="margin-top: 15px; background: #9c27b0;" onclick="show('sections')">🎯 Обрати іншу тему</button>
    `;
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('question-counter').textContent = '';
    themeStartTime = null;
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
  let finalReward = reward;
  let penalty = 30;
  
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
    
    finalReward = reward + bonus;
    if (typeof eventActive !== 'undefined' && eventActive === 'double_money') {
      finalReward *= 2;
      showNotification(`🎉 ПОДВІЙНІ ГРОШІ! +${finalReward} ₴`, false, 1000);
    }
    
    user.points += finalReward;
    user.points_earned = (user.points_earned || 0) + finalReward;
    button.style.background = '#4caf50';
    document.getElementById('feedback').innerHTML = `<span class="correct">✓ ПРАВИЛЬНО! +${finalReward} ₴</span>`;
    correctSound.play().catch(()=>{});
  } else {
    wrongCount++;
    if (typeof applyGameBonuses === 'function') applyGameBonuses(false);
    else if (typeof correctStreak !== 'undefined') correctStreak = 0;
    
    if(pOn) {
      user.points = Math.max(0, user.points - penalty);
      document.getElementById('feedback').innerHTML = `<span class="wrong">✗ НЕПРАВИЛЬНО! -${penalty} ₴</span>`;
    } else {
      document.getElementById('feedback').innerHTML = '<span class="wrong">✗ НЕПРАВИЛЬНО! (штрафи вимкнені)</span>';
      penalty = 0;
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

async function loadT() {
  show('top');
  let r = await fetch(DB + "users/.json");
  let d = await r.json();
  let l = document.getElementById('tlist');
  l.innerHTML = '';
  
  if (d) {
    let topPlayers = Object.values(d).sort((a, b) => {
      const ratingA = a.points_earned || a.points || 0;
      const ratingB = b.points_earned || b.points || 0;
      return ratingB - ratingA;
    }).slice(0, 100);
    
    for (let i = 0; i < topPlayers.length; i++) {
      const u = topPlayers[i];
      const rating = u.points_earned || u.points || 0;
      l.innerHTML += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #ddd;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-weight: bold; width: 35px;">${i + 1}.</span>
            <span>${getLevelIcon(u.level)} ${u.name}</span>
          </div>
          <b>${rating.toLocaleString()} ₴</b>
        </div>
      `;
    }
  } else {
    l.innerHTML = '<div style="padding:12px;color:#aaa">Топ порожній</div>';
  }
}

function getLevelIcon(level) {
  const icons = ['', '🌱', '📚', '🎓', '⭐', '👑', '🏆'];
  return icons[level] || '🌱';
}
