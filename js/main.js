// js/main.js - Головний файл (авторизація, гра)
// Авторизація тепер повністю на Firebase Authentication.
// Паролі ніколи не потрапляють у Realtime Database і не зберігаються в localStorage.
// firebase-config.js та db.js мають бути підключені в index.html ПЕРЕД цим файлом.

let user = null;          // публічні дані профілю гравця (без пароля)
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
  const splash = document.getElementById('splash');
  const video = document.getElementById('splash-video');
  const startBtn = document.getElementById('startBtn');
  
  function afterSplash() {
    if (splash) splash.style.display = 'none';
    enterAppAfterSplash();
  }
  
  if (video && startBtn) {
    video.src = "https://file.garden/aZHnP_3ch2qR4tWj/video_2026-02-14_17-15-12.mp4";
    
    startBtn.onclick = function() {
      startBtn.style.display = 'none';
      video.muted = false;
      video.currentTime = 0;
      video.play().catch(function(e) { console.log("Video play error:", e); });
    };
    
    video.onended = afterSplash;
    
    setTimeout(function() {
      if (splash && splash.style.display !== 'none') {
        afterSplash();
      }
    }, 10000);
  } else {
    afterSplash();
  }
};

// Чекаємо, поки Firebase визначить статус сесії (є вона в цьому браузері чи ні),
// і в залежності від цього або одразу заходимо в гру, або показуємо екран входу.
function waitForAuthState() {
  return new Promise(resolve => {
    const unsubscribe = auth.onAuthStateChanged(fbUser => {
      unsubscribe();
      resolve(fbUser);
    });
  });
}

async function enterAppAfterSplash() {
  const fbUser = await waitForAuthState();
  if (fbUser) {
    await loadUserAndEnterGame(fbUser.uid);
  } else {
    show('auth-screen');
  }
}

// Кнопка "УВІЙТИ / ЗАРЕЄСТРУВАТИСЯ"
async function auth_submit() {
  let nick = document.getElementById('nick').value.trim();
  let pass = document.getElementById('pass').value.trim();
  
  if (!nick || !pass) {
    showCustomMessage("Введіть нікнейм та пароль", true);
    return;
  }
  if (!isValidNick(nick)) {
    showCustomMessage("Нік: 3-20 символів, тільки літери/цифри/підкреслення", true);
    return;
  }
  
  showCustomMessage("Завантаження...");
  const email = nickToEmail(nick);
  const nickKey = nick.toLowerCase();
  const safePass = normalizePassword(pass);
  
  try {
    let cred;
    try {
      cred = await auth.signInWithEmailAndPassword(email, safePass);
    } catch (signInErr) {
      if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
        // Такого акаунта ще немає — реєструємо нового гравця.
        // Перевіряємо, чи нік уже не зайнятий (про всяк випадок, Auth теж це перевірить по email).
        const takenUid = await getUidByNick(nickKey);
        if (takenUid) {
          showCustomMessage("Цей нікнейм вже зайнятий", true);
          return;
        }
        cred = await auth.createUserWithEmailAndPassword(email, safePass);
      } else if (signInErr.code === 'auth/wrong-password') {
        showCustomMessage("Неправильний пароль!", true);
        return;
      } else if (signInErr.code === 'auth/too-many-requests') {
        showCustomMessage("Забагато спроб. Спробуйте через кілька хвилин", true);
        return;
      } else {
        throw signInErr;
      }
    }
    
    const uid = cred.user.uid;
    let data = await dbGet('users/' + uid);
    
    if (!data) {
      // Новий гравець — створюємо профіль і закріплюємо нік в індексі
      data = {
        name: nick, points: 0, points_earned: 0,
        items: { gold_frame: false },
        themeAttempts: {}, themeResults: {},
        regDate: new Date().toISOString().split('T')[0],
        avatar: '👤', avatarType: 'emoji', avatarData: null,
        friends: [], notifications: true, level: 1,
        achievements: {}, lastDailyBonus: null, stickers: {}
      };
      await dbSet('users/' + uid, data);
      await claimNickname(nick, uid);
    }
    
    await loadUserAndEnterGame(uid, data);
  } catch (e) {
    console.error(e);
    showCustomMessage("Помилка підключення", true);
  }
}

async function loadUserAndEnterGame(uid, preloadedData) {
  try {
    const data = preloadedData || await dbGet('users/' + uid);
    if (!data) {
      // Дані не знайдено (наприклад, акаунт існує в Auth, але профіль ще не створено) —
      // повертаємо на екран входу, а не показуємо порожню гру.
      show('auth-screen');
      return;
    }
    
    user = data;
    user.uid = uid;
    // The admin panel reads logs/<uid> and displays the nickname, date and
    // time of each successful game sign-in.
    await recordGameLogin(uid, user.name || user.nick || 'Гравець');
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
    
    if (typeof loadCustomTests === 'function') loadCustomTests();
  } catch (e) {
    console.error(e);
    showCustomMessage("Помилка завантаження профілю", true);
    show('auth-screen');
  }
}

async function recordGameLogin(uid, nick) {
  const now = new Date();
  const entry = {
    uid,
    nick,
    type: 'login',
    details: 'Вхід у гру',
    date: now.toLocaleDateString('uk-UA'),
    time: now.toLocaleTimeString('uk-UA'),
    timestamp: firebase.database.ServerValue.TIMESTAMP
  };
  try {
    await rtdb.ref('logs/' + uid).push(entry);
    await dbUpdate('users/' + uid, { lastLoginAt: firebase.database.ServerValue.TIMESTAMP });
  } catch (error) {
    // A logging permission must not prevent the user from entering the game.
    console.warn('Не вдалося записати вхід у гру:', error);
  }
}

function save() {
  if (!user || !user.uid) return;
  user.items = items;
  const toSave = Object.assign({}, user);
  delete toSave.uid; // технічне поле, не зберігаємо його всередині запису
  dbSet('users/' + user.uid, toSave).catch(e => console.error('Помилка збереження:', e));
}

function update() {
  const monEl = document.getElementById('mon');
  if (monEl && user) monEl.innerText = user.points.toLocaleString();
}

function applyItems() {
  if (!user) return;
  let nickDisplay = user.name;
  if(items.gold_frame && items.gold_frame_active !== false) nickDisplay += ' [Золото]';
  if(items.crown && items.crown_active !== false) nickDisplay += ' 👑';
  if(items.fire && items.fire_active !== false) nickDisplay += ' 🔥';
  if(items.shield && items.shield_active !== false) nickDisplay += ' 🛡️';
  if(items.vip && items.vip_active !== false) nickDisplay += ' 💎 VIP';
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
  if (typeof applyPurchasedShopEffects === 'function') applyPurchasedShopEffects();
}

const MASCOT_HINTS = {
  menu: 'Обери, з чого почнемо сьогодні!',
  sections: 'Обери тему, а потім завдання — я поруч!',
  imennyky: 'Вибери завдання та покажи, що знаєш!',
  prykmetnyky: 'Знайди завдання до душі!',
  zajmennyky: 'Тренуйся крок за кроком!',
  chyslivnyky: 'Уважно читай кожне питання!',
  frazeologizmy: 'Фразеологізми — це цікаво!',
  antisurzhyk: 'Обери тест і говори українською впевнено!',
  punctuation: 'Коми й тире стануть твоїми друзями!',
  apostrophe: 'Апостроф любить уважність!',
  game: 'Не поспішай — ти впораєшся!',
  cabinet: 'Тут твої досягнення. Пишаюся тобою!',
  shop: 'Обирай нагороди за свої старання!',
  top: 'Піднімайся вище в рейтингу!'
};

function updateMascotHint(screenId) {
  const mascot = document.getElementById('globalMascot');
  const bubble = document.getElementById('globalMascotBubble');
  if (!mascot || !bubble) return;
  // Topic-selection screens already have their own guide at the top.  Do not
  // show a second fixed mascot over the task buttons.
  const selectionScreens = ['auth-screen', 'shop', 'sections', 'curriculum-section', 'curriculum-tests-screen', 'imennyky', 'prykmetnyky', 'zajmennyky', 'chyslivnyky', 'frazeologizmy', 'antisurzhyk', 'punctuation', 'apostrophe', 'custom-tests-screen'];
  document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('mascot-safe'));
  const screen = document.getElementById(screenId);
  const hasFloatingMascot = !selectionScreens.includes(screenId);
  mascot.style.display = hasFloatingMascot ? 'flex' : 'none';
  if (hasFloatingMascot && screen) screen.classList.add('mascot-safe');
  bubble.textContent = MASCOT_HINTS[screenId] || 'Я вірю в тебе!';
}

function renderPracticePacks() {
  document.querySelectorAll('.practice-tests').forEach(container => {
    const pack = container.dataset.pack;
    const tests = window.practicePacks && window.practicePacks[pack];
    if (!tests) return;
    const label = { antisurzhyk: 'Антисуржик', punctuation: 'Пунктуація', apostrophe: 'Апостроф' }[pack];
    window.customThemeNames = window.customThemeNames || {};
    container.innerHTML = Object.keys(tests).map((key, index) => {
      window.customThemeNames[key] = label + ' — тест ' + (index + 1);
      return `<button class="btn theme-btn" onclick="startTheme('${key}')">Тест ${index + 1} <span>• 5 питань</span></button>`;
    }).join('');
  });
}

document.addEventListener('DOMContentLoaded', renderPracticePacks);

function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
  const screen = document.getElementById(id);
  if (screen) screen.style.display = 'flex';
  if (id === 'cabinet' && user && typeof loadCabinet === 'function') {
    loadCabinet();
  }
  if (id === 'shop' && typeof refreshShopUi === 'function') refreshShopUi();
  updateMascotHint(id);
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
    const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    
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
    } else {
      timeSpent = 'невідомо';
    }
    
    const resultPercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    
    // Зберігаємо результат в базу — окремий, незмінний запис для перевірки вчителем
    // (навіть якщо скріншот десь загубиться або буде відредагований, тут лишиться правда)
    if (total > 0 && user.uid) {
      const resultRecord = {
        nick: user.name,
        themeId: currentTheme,
        themeName: themeName,
        correct: correctCount,
        wrong: wrongCount,
        total: total,
        percent: resultPercent,
        date: dateStr,
        time: timeStr,
        timeSpent: timeSpent,
        timestamp: Date.now()
      };
      rtdb.ref('results/' + user.uid).push(resultRecord).catch(e => console.error('Не вдалося зберегти результат:', e));
    }
    
    let resultColor = '#e74c3c';
    if (resultPercent >= 80) resultColor = '#2ecc71';
    else if (resultPercent >= 60) resultColor = '#f39c12';
    
    document.getElementById('qtext').innerHTML = `🎓 Сертифікат проходження тесту`;
    document.getElementById('feedback').innerHTML = '';
    document.getElementById('abox').innerHTML = `
      <div class="summary" id="resultCertificate" style="background: linear-gradient(135deg, rgba(255,215,0,0.08), rgba(0,0,0,0.04)); border: 2px solid var(--gold); border-radius: 16px; padding: 18px;">
        <div style="text-align:center;margin-bottom:10px;">
          <div style="font-size:13px;color:#888;">Учень / учениця</div>
          <div style="font-size:22px;font-weight:bold;color:var(--gold);">${escapeHtml(user.name)}</div>
          <div style="font-size:15px;margin-top:4px;">Тест: <b>${escapeHtml(themeName)}</b></div>
        </div>
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
        <div style="text-align:center;font-size:11px;color:#888;">Результат також збережено в системі під ніком гравця</div>
      </div>
      <div style="text-align:center;font-size:12px;color:#888;margin-top:8px;">📸 Зробіть скріншот цього екрана і надішліть вчителю</div>
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

// ========== ФУНКЦІЇ ДЛЯ ТОПУ ТА ПРОФІЛЮ ==========

function getUserAvatarHtmlForTop(avatar, avatarType, avatarData) {
  if (avatarType === 'emoji') {
    return `<span style="font-size: 20px;">${avatar || '👤'}</span>`;
  } else if (avatarType === 'photo' && avatarData) {
    return `<img src="${avatarData}" style="width: 25px; height: 25px; border-radius: 50%; object-fit: cover; vertical-align: middle;">`;
  }
  return `<span style="font-size: 20px;">👤</span>`;
}

const ITEM_NAMES = {
  gold_frame: '✨ Золота рамка',
  crown: '👑 Корона',
  fire: '🔥 Полум\'я',
  shield: '🛡️ Щит',
  vip: '💎 ВІП',
  rainbow_name: '🌈 Веселкове ім\'я',
  sparkles: '✨ Блискітки',
  avatar_frame: '🖼️ Рамка аватара',
  animated_nick: '🌟 Анімований нік',
  vyshyvanka: '🎨 Вишиванка',
  kobza: '🏺 Кобза',
  sunflowers: '🌻 Соняшникове поле',
  bookshelf: '📜 Книжкова полиця',
  theater_mask: '🎭 Театральна маска'
};

const STICKER_NAMES = {
  shevchenko: '🖋️ Тарас Шевченко',
  lesia: '📖 Леся Українка',
  franko: '🎭 Іван Франко',
  kotsiubynsky: '🌾 Михайло Коцюбинський',
  hohol: '🏰 Микола Гоголь',
  dovzhenko: '🌊 Олександр Довженко',
  skovoroda: '🎻 Григорій Сковорода',
  kostenko: '👑 Ліна Костенко',
  stus: '⚡ Василь Стус',
  teliha: '🔥 Олена Теліга'
};

const BADGES_LIST = [
  { name: '🌱 Новачок', condition: (stats) => stats.totalThemes >= 1 },
  { name: '📚 Досвідчений', condition: (stats) => stats.totalThemes >= 10 },
  { name: '🏅 Майстер', condition: (stats) => stats.totalThemes >= 30 },
  { name: '⭐ Перфекціоніст', condition: (stats) => stats.perfectCount >= 10 },
  { name: '🏃 Марафонець', condition: (stats) => stats.totalThemes >= 50 },
  { name: '💰 Багатій', condition: (stats, points) => points >= 10000 },
  { name: '🎯 Перша 100%', condition: (stats) => stats.perfectCount >= 1 },
  { name: '💎 VIP', condition: (stats, points, items) => items && items.vip },
  { name: '👑 Легенда', condition: (stats) => stats.totalCorrect >= 1000 }
];

function getPlayerBadges(playerData) {
  const stats = { totalThemes: 0, totalCorrect: 0, perfectCount: 0 };
  if (playerData.themeResults) {
    for (let theme in playerData.themeResults) {
      const res = playerData.themeResults[theme];
      stats.totalCorrect += res.correct || 0;
      stats.totalThemes++;
      if (res.percent === 100) stats.perfectCount++;
    }
  }
  const earnedBadges = [];
  for (let badge of BADGES_LIST) {
    if (badge.condition(stats, playerData.points_earned || playerData.points || 0, playerData.items)) {
      earnedBadges.push(badge.name);
    }
  }
  return earnedBadges;
}

async function showPlayerProfile(nickname) {
  if (!nickname) return;
  try {
    const targetUid = await getUidByNick(nickname);
    if (!targetUid) {
      showCustomMessage("❌ Гравця не знайдено!", true);
      return;
    }
    const playerData = await dbGet('users/' + targetUid);
    if (!playerData) {
      showCustomMessage("❌ Гравця не знайдено!", true);
      return;
    }
    
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
    
    let levelName = '🌱 Новачок';
    if (totalCorrect >= 1000) levelName = '🏆 Легенда';
    else if (totalCorrect >= 500) levelName = '👑 Експерт';
    else if (totalCorrect >= 300) levelName = '⭐ Майстер';
    else if (totalCorrect >= 150) levelName = '🎓 Студент';
    else if (totalCorrect >= 50) levelName = '📚 Учень';
    
    const playerItems = playerData.items || {};
    const purchasedItems = [];
    for (let [key, value] of Object.entries(ITEM_NAMES)) {
      if (playerItems[key] === true) purchasedItems.push(value);
    }
    
    const playerStickers = playerData.stickers || {};
    const earnedStickers = [];
    for (let [key, value] of Object.entries(STICKER_NAMES)) {
      if (playerStickers[key] === true) earnedStickers.push(value);
    }
    const earnedBadges = getPlayerBadges(playerData);
    
    let avatarHtml = '';
    if (playerData.avatarType === 'emoji') {
      avatarHtml = `<span style="font-size: 64px;">${playerData.avatar || '👤'}</span>`;
    } else if (playerData.avatarType === 'photo' && playerData.avatarData) {
      avatarHtml = `<img src="${playerData.avatarData}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;">`;
    } else {
      avatarHtml = `<span style="font-size: 64px;">👤</span>`;
    }
    
    const rating = playerData.points_earned || playerData.points || 0;
    
    const modalHtml = `
      <div id="playerProfileModal" class="modal" style="display: flex;">
        <div class="modal-content" style="max-width: 380px; max-height: 85vh; overflow-y: auto;">
          <span class="modal-close" onclick="closePlayerProfileModal()">&times;</span>
          <div style="text-align: center;">
            ${avatarHtml}
            <h2 style="margin: 10px 0; color: var(--gold);">${escapeHtml(playerData.name)}</h2>
            <p style="margin: 5px 0;"><strong>${levelName}</strong></p>
            <p style="margin: 5px 0;">💰 Баланс: <strong>${(playerData.points || 0).toLocaleString()} ₴</strong></p>
            <p style="margin: 5px 0;">🏆 Рейтинг: <strong>${rating.toLocaleString()} ₴</strong></p>
            <p style="margin: 5px 0;">📅 Реєстрація: ${playerData.regDate || 'невідомо'}</p>
          </div>
          <hr style="margin: 15px 0; border-color: var(--gold);">
          <h3 style="color: var(--gold);">📊 Статистика</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 10px 0;">
            <div style="background: #2c3e50; padding: 8px; border-radius: 10px; text-align: center;"><div style="font-size: 20px; font-weight: bold; color: var(--gold);">${totalThemes}</div><div style="font-size: 10px;">Тем пройдено</div></div>
            <div style="background: #2c3e50; padding: 8px; border-radius: 10px; text-align: center;"><div style="font-size: 20px; font-weight: bold; color: var(--gold);">${totalCorrect}</div><div style="font-size: 10px;">Правильних</div></div>
            <div style="background: #2c3e50; padding: 8px; border-radius: 10px; text-align: center;"><div style="font-size: 20px; font-weight: bold; color: var(--gold);">${totalWrong}</div><div style="font-size: 10px;">Неправильних</div></div>
            <div style="background: #2c3e50; padding: 8px; border-radius: 10px; text-align: center;"><div style="font-size: 20px; font-weight: bold; color: var(--gold);">${avgPercent}%</div><div style="font-size: 10px;">Середній %</div></div>
            <div style="background: #2c3e50; padding: 8px; border-radius: 10px; text-align: center;"><div style="font-size: 20px; font-weight: bold; color: var(--gold);">${perfectCount}</div><div style="font-size: 10px;">100% тем</div></div>
            <div style="background: #2c3e50; padding: 8px; border-radius: 10px; text-align: center;"><div style="font-size: 20px; font-weight: bold; color: var(--gold);">${playerData.friends?.length || 0}</div><div style="font-size: 10px;">Друзів</div></div>
          </div>
          <hr style="margin: 15px 0; border-color: var(--gold);">
          <h3 style="color: var(--gold);">🏆 Значки</h3>
          <div style="margin: 10px 0; display: flex; flex-wrap: wrap; gap: 6px;">
            ${earnedBadges.length > 0 ? earnedBadges.map(badge => `<div style="background: linear-gradient(135deg, var(--gold), #e67e22); padding: 4px 8px; border-radius: 20px; font-size: 11px; font-weight: bold; color: #000;">${badge}</div>`).join('') : '<div style="text-align: center; color: #aaa; padding: 10px; width: 100%;">Ще немає значків</div>'}
          </div>
          <hr style="margin: 15px 0; border-color: var(--gold);">
          <h3 style="color: var(--gold);">🛍️ Покупки в крамничці</h3>
          <div style="margin: 10px 0; max-height: 150px; overflow-y: auto;">
            ${purchasedItems.length > 0 ? purchasedItems.map(item => `<div style="background: #e8f5e9; padding: 6px 10px; border-radius: 8px; margin: 5px 0; color: #2e7d32;">✅ ${item}</div>`).join('') : '<div style="text-align: center; color: #aaa; padding: 10px;">Ще немає покупок</div>'}
          </div>
          <hr style="margin: 15px 0; border-color: var(--gold);">
          <h3 style="color: var(--gold);">🎨 Стікери письменників</h3>
          <div style="margin: 10px 0; max-height: 150px; overflow-y: auto;">
            ${earnedStickers.length > 0 ? earnedStickers.map(sticker => `<div style="background: linear-gradient(135deg, var(--gold), #e67e22); padding: 6px 10px; border-radius: 8px; margin: 5px 0; color: #000; font-weight: bold;">${sticker}</div>`).join('') : '<div style="text-align: center; color: #aaa; padding: 10px;">Ще немає стікерів</div>'}
          </div>
          <button class="btn" onclick="closePlayerProfileModal()" style="margin-top: 15px;">ЗАКРИТИ</button>
        </div>
      </div>
    `;
    
    const existingModal = document.getElementById('playerProfileModal');
    if (existingModal) existingModal.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
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

async function loadT() {
  show('top');
  let l = document.getElementById('tlist');
  l.innerHTML = '<div style="padding:12px;color:#aaa">Завантаження...</div>';
  
  let d;
  try {
    d = await dbGet('users');
  } catch (e) {
    console.error(e);
    l.innerHTML = '<div style="padding:12px;color:#aaa">Не вдалося завантажити топ</div>';
    return;
  }
  
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
      const avatarHtml = getUserAvatarHtmlForTop(u.avatar, u.avatarType, u.avatarData);
      const safeName = escapeHtml(u.name);
      const nickAttr = safeName.replace(/'/g, "&#39;");
      l.innerHTML += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #ddd;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-weight: bold; width: 35px;">${i + 1}.</span>
            ${avatarHtml}
            <span style="cursor: pointer; color: var(--gold); text-decoration: underline;" onclick="showPlayerProfile('${nickAttr}')">${getLevelIcon(u.level)} ${safeName}</span>
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
