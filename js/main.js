// js/main.js - Виправлена версія (покупки працюють)

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

// ====================== ФУНКЦІЇ КЕШУВАННЯ ======================
function saveUserToCache(userData) {
    const cacheData = {
        data: userData,
        timestamp: Date.now()
    };
    localStorage.setItem(`user_cache_${userData.name}`, JSON.stringify(cacheData));
}

function getUserFromCache(nickname) {
    const cached = localStorage.getItem(`user_cache_${nickname}`);
    if (!cached) return null;
    
    try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 300000) {
            return data;
        }
    } catch (e) {
        console.error('Помилка читання кешу:', e);
    }
    return null;
}

// ====================== ЗАВАНТАЖЕННЯ ВІДЕО ======================
function setupSplashVideo() {
    const splash = document.getElementById('splash');
    const startBtn = document.getElementById('startBtn');
    
    if (!splash || !startBtn) return;
    
    startBtn.onclick = function() {
        startBtn.style.display = 'none';
        
        const video = document.createElement('video');
        video.id = 'splash-video';
        video.playsInline = true;
        video.muted = false;
        video.preload = 'auto';
        video.src = "https://file.garden/aZHnP_3ch2qR4tWj/video_2026-02-14_17-15-12.mp4";
        
        video.onended = function() {
            splash.style.display = 'none';
            tryAutoLogin();
        };
        
        video.onerror = function() {
            splash.style.display = 'none';
            tryAutoLogin();
        };
        
        splash.prepend(video);
        video.play().catch(() => {
            splash.style.display = 'none';
            tryAutoLogin();
        });
    };
    
    setTimeout(() => {
        if (splash && splash.style.display !== 'none') {
            splash.style.display = 'none';
            tryAutoLogin();
        }
    }, 10000);
}

// ====================== АВТОРИЗАЦІЯ ======================
async function tryAutoLogin() {
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
    if (!n || !p) {
        document.getElementById('auth-error').textContent = "Введіть нікнейм та пароль";
        return;
    }
    document.getElementById('auth-error').textContent = "Завантаження...";
    
    try {
        let cachedUser = getUserFromCache(n);
        let d = null;
        
        if (cachedUser && cachedUser.pass === p) {
            d = cachedUser;
        } else {
            let r = await fetch(DB + "users/" + n + ".json");
            d = await r.json();
        }
        
        if (d) {
            if (d.pass !== p) {
                document.getElementById('auth-error').textContent = "Неправильний пароль!";
                return;
            }
            user = d;
        } else {
            user = {
                name: n, pass: p, points: 0, items: { gold_frame: false, crown: false, fire: false, shield: false, vip: false },
                themeAttempts: {}, themeResults: {},
                regDate: new Date().toISOString().split('T')[0],
                avatar: '👤', avatarType: 'emoji', avatarData: null,
                friends: [], notifications: true
            };
            await fetch(DB + "users/" + n + ".json", { method: 'PUT', body: JSON.stringify(user) });
        }
        
        saveUserToCache(user);
        
        localStorage.setItem('un', n);
        localStorage.setItem('up', p);
        
        const now = new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' });
        await fetch(DB + "user_logs.json", { method: 'POST', body: JSON.stringify({ game_nick: n, time: now }) });
        
        // Важливо: завантажуємо items з user.items
        if (user.items) {
            items = { ...items, ...user.items };
        }
        
        if (!user.themeResults) user.themeResults = {};
        if (!user.regDate) user.regDate = new Date().toISOString().split('T')[0];
        if (!user.avatar) user.avatar = '👤';
        if (!user.avatarType) user.avatarType = 'emoji';
        if (!user.friends) user.friends = [];
        if (user.notifications === undefined) user.notifications = true;
        
        save();
        applyItems();
        update();
        show('menu');
        document.getElementById('auth-error').textContent = "";
    } catch (e) {
        document.getElementById('auth-error').textContent = "Помилка підключення";
        console.error(e);
    }
}

// ====================== ОСНОВНІ ФУНКЦІЇ ======================
function save() {
    if (!user) return;
    user.items = items;
    fetch(DB + "users/" + user.name + ".json", { method: 'PUT', body: JSON.stringify(user) })
        .then(() => {
            saveUserToCache(user);
        })
        .catch(e => console.error('Помилка збереження:', e));
}

function update() {
    const monEl = document.getElementById('mon');
    if (monEl && user) monEl.innerText = user.points.toLocaleString();
}

function applyItems() {
    if (!user) return;
    let nickDisplay = user.name;
    if (items.gold_frame) nickDisplay += ' ✨';
    if (items.crown) nickDisplay += ' 👑';
    if (items.fire) nickDisplay += ' 🔥';
    if (items.shield) nickDisplay += ' 🛡️';
    if (items.vip) nickDisplay += ' 💎';
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

function admT() {
    if (++cC >= 5) {
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
    if (!n) return alert("Введіть нікнейм");
    if (confirm(`Видалити ${n}?`)) {
        await fetch(DB + "users/" + n + ".json", { method: 'DELETE' });
        alert("Видалено");
        loadPlayers();
    }
}

async function edO(add) {
    let n = document.getElementById('a-n').value.trim();
    if (!n) return alert("Введіть ник");
    let amt = prompt(add ? "Скільки додати?" : "Скільки відняти?");
    if (isNaN(amt) || amt <= 0) return alert("Невірна сума");
    amt = parseInt(amt);
    
    try {
        let r = await fetch(DB + "users/" + n + ".json");
        let d = await r.json();
        if (!d) return alert("Гравця не знайдено");
        d.points += add ? amt : -amt;
        d.points = Math.max(0, d.points);
        await fetch(DB + "users/" + n + ".json", { method: 'PUT', body: JSON.stringify(d) });
        alert("Гроші оновлено");
        loadPlayers();
    } catch (e) {
        console.error('Помилка:', e);
        alert("Помилка оновлення");
    }
}

async function loadPlayers() {
    try {
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
            list.innerHTML += `<div style="padding:8px; border-bottom:1px solid #ddd;"><strong>${u.name || key}</strong><br><small>Баланс: ${u.points || 0} ₴</small></div>`;
        }
    } catch (e) {
        console.error('Помилка завантаження гравців:', e);
        document.getElementById('player-list').innerHTML = '<div style="padding:12px;color:#aaa">Помилка завантаження</div>';
    }
}

async function loadUserLog() {
    try {
        let r = await fetch(DB + "user_logs.json");
        let data = await r.json();
        let logDiv = document.getElementById('user-log');
        logDiv.innerHTML = '';
        if (data) {
            Object.values(data).reverse().slice(0, 50).forEach(entry => {
                logDiv.innerHTML += `<div class="log-entry">${entry.time} — <b>${entry.game_nick}</b></div>`;
            });
        } else {
            logDiv.innerHTML = 'Лог порожній';
        }
    } catch (e) {
        console.error('Помилка завантаження логу:', e);
        document.getElementById('user-log').innerHTML = 'Помилка завантаження';
    }
}

async function clearUserLog() {
    if (!confirm("Очистити лог?")) return;
    await fetch(DB + "user_logs.json", { method: 'DELETE' });
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
        console.error('Помилка завантаження адмін-логу:', e);
        document.getElementById('admin-log').innerHTML = 'Помилка завантаження';
    }
}

async function clearAdminLogs() {
    if (!confirm("Очистити лог адмінки?")) return;
    await fetch(DB + "admin_logs.json", { method: 'DELETE' });
    loadAdminLogs();
}

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
                <strong>Баланс:</strong> ${user.points.toLocaleString()} ₴
            </div>
            <button class="btn" onclick="show('sections')">Обрати тему</button>
        `;
        return;
    }

    const q = qs[currentIndex];
    currentCorrectAnswer = q.a;
    document.getElementById('qtext').textContent = `${currentIndex + 1}/${qs.length}: ${q.q}`;
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
        button.style.background = '#4caf50';
        document.getElementById('feedback').innerHTML = '<span class="correct">✓ ПРАВИЛЬНО!</span>';
        correctSound.play().catch(() => { });
    } else {
        wrongCount++;
        if (pOn) {
            user.points = Math.max(0, user.points - 30);
        }
        button.style.background = '#f44336';
        document.getElementById('feedback').innerHTML = '<span class="wrong">✗ НЕПРАВИЛЬНО!</span>';
        wrongSound.play().catch(() => { });
    }
    document.getElementById('mon').innerText = user.points.toLocaleString();
    save();
    setTimeout(() => {
        currentIndex++;
        loadQuestion();
    }, 1200);
}

async function loadT() {
    show('top');
    try {
        let r = await fetch(DB + "users/.json");
        let d = await r.json();
        let l = document.getElementById('tlist');
        l.innerHTML = '';
        if (d) {
            let topPlayers = Object.values(d).sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 100);
            topPlayers.forEach((u, i) => {
                // Отримуємо аватарку гравця
                let avatar = u.avatar || '👤';
                if (u.avatarType === 'photo' && u.avatarData) {
                    avatar = `<img src="${u.avatarData}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;">`;
                }
                l.innerHTML += `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border-bottom:1px solid #eee;">
                        <div style="display:flex;align-items:center;gap:10px;">
                            <span style="font-weight:bold;min-width:35px;">${i + 1}.</span>
                            <div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;">${avatar}</div>
                            <span><strong>${u.name}</strong></span>
                        </div>
                        <b>${(u.points || 0).toLocaleString()} ₴</b>
                    </div>
                `;
            });
        } else {
            l.innerHTML = '<div style="padding:12px;color:#aaa">Топ порожній</div>';
        }
    } catch (e) {
        console.error('Помилка завантаження топу:', e);
        document.getElementById('tlist').innerHTML = '<div style="padding:12px;color:#aaa">Помилка завантаження</div>';
    }
}

function buyItem(item) {
    if (!user) {
        alert("Користувач не авторизований!");
        return;
    }
    
    const prices = {
        'gold_frame': 1000,
        'crown': 2000,
        'fire': 1500,
        'shield': 2500,
        'vip': 5000
    };
    
    const itemNames = {
        'gold_frame': '✨ Золота рамка',
        'crown': '👑 Корона',
        'fire': '🔥 Полум\'я',
        'shield': '🛡️ Щит',
        'vip': '💎 ВІП'
    };
    
    if (items[item]) {
        alert(`❌ У вас вже є ${itemNames[item]}!`);
        return;
    }
    
    const price = prices[item];
    
    if (!price) {
        alert("Помилка: товар не знайдено!");
        return;
    }
    
    if (user.points >= price) {
        user.points -= price;
        items[item] = true;
        user.items = items;
        applyItems();
        save();
        update();
        
        if (typeof updatePurchases === 'function') {
            updatePurchases();
        }
        
        alert(`✅ Ви придбали ${itemNames[item]} за ${price} ₴!`);
    } else {
        alert(`❌ Недостатньо грошей! Потрібно ${price} ₴, у вас ${user.points} ₴`);
    }
}

window.onload = function() {
    setupSplashVideo();
};
