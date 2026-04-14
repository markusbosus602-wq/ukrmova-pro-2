// js/main.js
const DB = "https://ukrmova-game-default-rtdb.europe-west1.firebasedatabase.app/";
let user = null;
let cC = 0;
let pOn = true;
let currentTheme = '';
let currentIndex = 0;
let correctCount = 0;
let wrongCount = 0;
let items = { gold_frame: false, crown: false, fire: false, shield: false, vip: false, rainbow_name: false, sparkles: false, avatar_frame: false, animated_nick: false };
let currentCorrectAnswer = '';
let correctStreak = 0; // Серія правильних відповідей
let lastAnswerTime = 0; // Час останньої відповіді
let dailyBonusClaimed = false; // Чи отримано щоденний бонус сьогодні
let eventActive = null; // Активна подія: 'double_money', 'discount', 'secret_item'
let secretItemAvailable = false;
let secretItemEndTime = 0;

const correctSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3");
const wrongSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3");

// Кастомне сповіщення замість alert
function showCustomMessage(msg, isError = false) {
  const toast = document.getElementById('notificationToast');
  if (toast) {
    toast.textContent = msg;
    toast.style.background = isError ? "var(--red)" : "var(--gold)";
    toast.style.color = isError ? "white" : "#000";
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.style.background = "var(--gold)";
        toast.style.color = "#000";
      }, 300);
    }, 3000);
  }
}

// Перевірка щоденного бонусу
function checkDailyBonus() {
  const today = new Date().toISOString().split('T')[0];
  if (user.lastDailyBonus !== today) {
    user.lastDailyBonus = today;
    user.points += 200;
    save();
    showNotification("🎁 Щоденний бонус: +200 ₴!");
    return true;
  }
  return false;
}

// Перевірка та активація подій
function checkEvents() {
  const now = new Date();
  const day = now.getDay(); // 0=неділя, 6=субота
  const hour = now.getHours();
  
  // Вихідні - подвійні гроші (субота та неділя)
  if (day === 0 || day === 6) {
    if (eventActive !== 'double_money') {
      eventActive = 'double_money';
      showNotification("🎉 ВИХІДНІ! ПОДВІЙНІ ГРОШІ! 🎉");
    }
  }
  // Свята - знижки (якщо грудень)
  else if (now.getMonth() === 11) {
    if (eventActive !== 'discount') {
      eventActive = 'discount';
      showNotification("🎄 СВЯТКОВА ЗНИЖКА -30% В МАГАЗИНІ! 🎄");
    }
  }
  // Секретний товар (випадково між 18-22 годиною)
  else if (hour >= 18 && hour <= 22 && !secretItemAvailable && Date.now() > secretItemEndTime) {
    if (Math.random() < 0.3) { // 30% шанс появи
      secretItemAvailable = true;
      secretItemEndTime = Date.now() + 3600000; // на 1 годину
      showNotification("🤫 СЕКРЕТНИЙ ТОВАР З'ЯВИВСЯ В МАГАЗИНІ! 🤫");
    }
  }
  // Секретний товар зник через годину
  else if (secretItemAvailable && Date.now() > secretItemEndTime) {
    secretItemAvailable = false;
    showNotification("🔒 Секретний товар зник...");
  }
}

// Перевірка досягнень
function checkAchievements() {
  if (!user.achievements) user.achievements = {};
  
  // Досягнення: перші 1000 ₴
  if (user.points >= 1000 && !user.achievements.firstThousand) {
    user.achievements.firstThousand = true;
    user.points += 100;
    save();
    showNotification("🏆 ДОСЯГНЕННЯ: Перші 1000 ₴! +100 ₴");
  }
  
  // Досягнення: 5 пройдених тем
  const themesCount = Object.keys(user.themeResults || {}).length;
  if (themesCount >= 5 && !user.achievements.fiveThemes) {
    user.achievements.fiveThemes = true;
    user.points += 500;
    save();
    showNotification("🏆 ДОСЯГНЕННЯ: 5 тем пройдено! +500 ₴");
  }
  
  // Досягнення: 10 пройдених тем
  if (themesCount >= 10 && !user.achievements.tenThemes) {
    user.achievements.tenThemes = true;
    user.points += 1000;
    save();
    showNotification("🏆 ДОСЯГНЕННЯ: 10 тем пройдено! +1000 ₴ + значок 📚");
  }
  
  // Досягнення: 100% у 3 темах
  let perfectCount = 0;
  if (user.themeResults) {
    for (let theme in user.themeResults) {
      if (user.themeResults[theme].percent === 100) perfectCount++;
    }
  }
  if (perfectCount >= 3 && !user.achievements.threePerfect) {
    user.achievements.threePerfect = true;
    user.points += 1500;
    save();
    showNotification("🏆 ДОСЯГНЕННЯ: 100% у 3 темах! +1500 ₴ + значок ⭐");
  }
  
  // Досягнення: 50 правильних відповідей поспіль
  if (correctStreak >= 50 && !user.achievements.streak50) {
    user.achievements.streak50 = true;
    user.points += 2000;
    save();
    showNotification("🏆 ДОСЯГНЕННЯ: 50 правильних поспіль! +2000 ₴ + значок 🔥");
  }
  
  // Досягнення: запросити друга
  if ((user.friends?.length || 0) >= 1 && !user.achievements.firstFriend) {
    user.achievements.firstFriend = true;
    user.points += 500;
    save();
    showNotification("🏆 ДОСЯГНЕННЯ: Запросив друга! +500 ₴");
  }
  if ((user.friends?.length || 0) >= 5 && !user.achievements.fiveFriends) {
    user.achievements.fiveFriends = true;
    user.points += 2000;
    save();
    showNotification("🏆 ДОСЯГНЕННЯ: 5 друзів! +2000 ₴");
  }
}

// Перевірка рівня
function checkLevelUp() {
  if (!user.level) user.level = 1;
  const stats = calculateStats();
  const totalCorrect = stats.totalCorrect;
  
  let newLevel = user.level;
  let reward = 0;
  
  if (totalCorrect >= 1000 && user.level < 6) { newLevel = 6; reward = 10000; }
  else if (totalCorrect >= 500 && user.level < 5) { newLevel = 5; reward = 5000; }
  else if (totalCorrect >= 300 && user.level < 4) { newLevel = 4; reward = 2000; }
  else if (totalCorrect >= 150 && user.level < 3) { newLevel = 3; reward = 1000; }
  else if (totalCorrect >= 50 && user.level < 2) { newLevel = 2; reward = 500; }
  
  if (newLevel > user.level) {
    user.level = newLevel;
    user.points += reward;
    save();
    const levelNames = ['', '🌱 Новачок', '📚 Учень', '🎓 Студент', '⭐ Майстер', '👑 Експерт', '🏆 Легенда'];
    showNotification(`🎉 ПІДВИЩЕННЯ РІВНЯ! ${levelNames[newLevel]}! +${reward} ₴ 🎉`);
    return true;
  }
  return false;
}

// Отримання ціни з урахуванням знижки
function getPriceWithDiscount(originalPrice) {
  if (eventActive === 'discount') {
    return Math.floor(originalPrice * 0.7);
  }
  return originalPrice;
}

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
        achievements: {}, lastDailyBonus: null
      };
      await fetch(DB + "users/" + n + ".json", {method:'PUT', body:JSON.stringify(user)});
    }
    localStorage.setItem('un', n);
    localStorage.setItem('up', p);
    const now = new Date().toLocaleString('uk-UA',{timeZone:'Europe/Kyiv'});
    await fetch(DB + "user_logs.json", {method:'POST',body:JSON.stringify({game_nick:n, time:now})});
    items = user.items || {gold_frame:false, rainbow_name:false, sparkles:false, avatar_frame:false, animated_nick:false};
    if (!user.themeResults) user.themeResults = {};
    if (!user.regDate) user.regDate = new Date().toISOString().split('T')[0];
    if (!user.avatar) user.avatar = '👤';
    if (!user.avatarType) user.avatarType = 'emoji';
    if (!user.friends) user.friends = [];
    if (user.notifications === undefined) user.notifications = true;
    if (!user.level) user.level = 1;
    if (!user.achievements) user.achievements = {};
    if (!user.lastDailyBonus) user.lastDailyBonus = null;
    save();
    
    // Перевірка щоденного бонусу
    checkDailyBonus();
    checkEvents();
    checkAchievements();
    checkLevelUp();
    
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
  if(items.rainbow_name) nickDisplay = `<span style="background: linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet); -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: bold;">${user.name}</span>`;
  if(items.animated_nick) nickDisplay = `<span style="animation: pulse 1s infinite; display: inline-block;">${nickDisplay}</span>`;
  
  const nickEl = document.getElementById('playerNick');
  if (nickEl) nickEl.innerHTML = nickDisplay;
  
  // Додаємо анімацію для пульсуючого ніка
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
  if (id === 'shop' && user && typeof updateShopPrices === 'function') {
    updateShopPrices();
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
  correctStreak = 0;
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
    document.getElementById('qtext').textContent = "Тема завершена!";
    document.getElementById('feedback').innerHTML = '';
    document.getElementById('abox').innerHTML = `
      <div class="summary">
        <strong>Правильних:</strong> ${correctCount}<br>
        <strong>Неправильних:</strong> ${wrongCount}<br>
        <strong>Серія правильних:</strong> ${correctStreak}<br>
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
  
  lastAnswerTime = Date.now();
}

function checkAnswer(selected, correct, button) {
  document.querySelectorAll('#abox .btn').forEach(b => b.disabled = true);
  
  let reward = 100;
  let bonus = 0;
  
  // Бонус за швидку відповідь (менше 3 секунд)
  const timeTaken = (Date.now() - lastAnswerTime) / 1000;
  if (timeTaken < 3) {
    bonus += 25;
    showNotification(`⚡ Швидка відповідь! +25 ₴`, false, 1000);
  }
  
  if (selected === correct) {
    correctCount++;
    correctStreak++;
    
    // Бонус за серію (кожна 5-та правильна)
    if (correctStreak % 5 === 0) {
      bonus += 50;
      showNotification(`🔥 Серія ${correctStreak}! +50 ₴`, false, 1000);
    }
    
    // Подвійні гроші під час події
    let finalReward = reward + bonus;
    if (eventActive === 'double_money') {
      finalReward *= 2;
      showNotification(`🎉 ПОДВІЙНІ ГРОШІ! +${finalReward} ₴`, false, 1000);
    }
    
    user.points += finalReward;
    button.style.background = '#4caf50';
    document.getElementById('feedback').innerHTML = `<span class="correct">✓ ПРАВИЛЬНО! +${finalReward} ₴</span>`;
    correctSound.play().catch(()=>{});
  } else {
    wrongCount++;
    correctStreak = 0;
    if(pOn) {
      let penalty = 30;
      if (eventActive === 'double_money') penalty *= 1; // штраф не подвоюється
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
  
  // Перевірка досягнень та рівня
  checkAchievements();
  checkLevelUp();
  
  setTimeout(() => {
    currentIndex++;
    loadQuestion();
  }, 1200);
}

async function loadT() {
  show('top');
  let r = await fetch(DB+"users/.json"), d = await r.json();
  let l = document.getElementById('tlist');
  l.innerHTML = '';
  if(d) {
    let topPlayers = Object.values(d).sort((a,b)=> (b.points||0) - (a.points||0)).slice(0,100);
    topPlayers.forEach((u,i) => {
      const levelNames = ['', '🌱', '📚', '🎓', '⭐', '👑', '🏆'];
      const levelIcon = levelNames[u.level] || '🌱';
      l.innerHTML += `<div style="display:flex;justify-content:space-between;padding:8px"><span>${i+1}. ${levelIcon} ${u.name}</span><b>${u.points||0} ₴</b></div>`;
    });
  } else {
    l.innerHTML = '<div style="padding:12px;color:#aaa">Топ порожній</div>';
  }
}

function buyItem(item) {
  const prices = {
    gold_frame: 1000, crown: 2000, fire: 1500, shield: 2500, vip: 5000,
    rainbow_name: 3000, sparkles: 2500, avatar_frame: 2000, animated_nick: 3500,
    secret_item: 10000
  };
  
  // Перевірка на секретний товар
  if (item === 'secret_item' && !secretItemAvailable) {
    showCustomMessage("❌ Секретний товар недоступний!", true);
    return;
  }
  
  let originalPrice = prices[item];
  let finalPrice = getPriceWithDiscount(originalPrice);
  let discountText = (eventActive === 'discount' && originalPrice !== finalPrice) ? ` (знижка -30%: ${finalPrice} ₴)` : '';
  
  if(user.points >= finalPrice){
    user.points -= finalPrice;
    items[item] = true;
    applyItems();
    save();
    update();
    
    if (item === 'secret_item') {
      secretItemAvailable = false;
      showCustomMessage(`🤫 Секретний товар куплено! +${finalPrice} ₴ бонусу! 🤫`);
      user.points += finalPrice; // Повертаємо гроші як бонус
      save();
      update();
    } else {
      showCustomMessage(`✨ Куплено! ${discountText} ✨`);
    }
  } else {
    showCustomMessage(`❌ Недостатньо грошей! Потрібно ${finalPrice} ₴ ❌`, true);
  }
}

// Функція для оновлення цін в магазині
function updateShopPrices() {
  const shopItems = document.querySelectorAll('.shop-btn');
  const priceMap = {
    gold_frame: 1000, crown: 2000, fire: 1500, shield: 2500, vip: 5000,
    rainbow_name: 3000, sparkles: 2500, avatar_frame: 2000, animated_nick: 3500
  };
  
  if (eventActive === 'discount') {
    shopItems.forEach(btn => {
      const item = btn.getAttribute('data-item');
      if (item && priceMap[item] && !btn.innerHTML.includes('знижка')) {
        const oldPrice = priceMap[item];
        const newPrice = Math.floor(oldPrice * 0.7);
        btn.innerHTML = btn.innerHTML.replace(`${oldPrice} ₴`, `${newPrice} ₴ (знижка -30%)`);
      }
    });
  }
  
  // Показуємо секретний товар якщо доступний
  const secretBtn = document.querySelector('.shop-btn[data-item="secret_item"]');
  if (secretBtn) {
    if (secretItemAvailable) {
      secretBtn.style.display = 'block';
      secretBtn.innerHTML = `🤫 СЕКРЕТНИЙ ТОВАР — 10000 ₴ (повертається як бонус!) 🤫`;
    } else {
      secretBtn.style.display = 'none';
    }
  }
}
