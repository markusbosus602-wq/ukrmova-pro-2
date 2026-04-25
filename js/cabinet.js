// js/cabinet.js - Кабінет користувача

let earnedBadges = [];

// Функція для примусової активації всіх покупок
function initAllPurchases() {
  const visualItems = ['rainbow_name', 'sparkles', 'avatar_frame', 'animated_nick', 'vyshyvanka', 'kobza', 'sunflowers', 'bookshelf', 'theater_mask'];
  let changed = false;
  
  visualItems.forEach(item => {
    if (items[item] && items[item + '_active'] === undefined) {
      items[item + '_active'] = true;
      changed = true;
    }
  });
  
  if (changed && typeof save === 'function') {
    save();
  }
}

function loadCabinet() {
  if (!user) return;
  
  initAllPurchases();
  
  updateAvatarDisplay();
  document.getElementById('cabNick').innerText = user.name;
  document.getElementById('cabMoney').innerText = (user.points || 0).toLocaleString();
  
  const stats = calculateStats();
  const totalCorrect = stats.totalCorrect;
  let level = { name: 'Новачок', badge: '🌱' };
  if (totalCorrect >= 1000) level = { name: 'Легенда', badge: '🏆' };
  else if (totalCorrect >= 500) level = { name: 'Експерт', badge: '👑' };
  else if (totalCorrect >= 300) level = { name: 'Майстер', badge: '⭐' };
  else if (totalCorrect >= 150) level = { name: 'Студент', badge: '🎓' };
  else if (totalCorrect >= 50) level = { name: 'Учень', badge: '📚' };
  
  document.getElementById('cabLevel').innerHTML = `${level.name} ${level.badge}`;
  document.getElementById('levelBadge').innerHTML = '';
  document.getElementById('regDate').innerHTML = user.regDate || new Date().toISOString().split('T')[0];
  
  document.getElementById('totalThemes').innerText = stats.totalThemes;
  document.getElementById('correctAnswers').innerText = stats.totalCorrect;
  document.getElementById('wrongAnswers').innerText = stats.totalWrong;
  document.getElementById('avgPercent').innerText = stats.avgPercent + '%';
  document.getElementById('bestResult').innerText = stats.bestResult + '%';
  document.getElementById('perfectCount').innerText = stats.perfectCount;
  
  loadBadges(stats);
  updatePurchases();
  loadHistory();
  loadFriends();
  loadAchievements();
  loadStickers();
  
  const notifToggle = document.getElementById('notificationsToggle');
  if (notifToggle) notifToggle.checked = user.notifications !== false;
  
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.cabinet-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    };
  });
}

// Функція для отримання HTML аватарки
function getAvatarHtml(avatar, avatarType, avatarData) {
  if (avatarType === 'photo' && avatarData && avatarData.startsWith('data:image')) {
    return `<img src="${avatarData}" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover;" onerror="this.style.display='none'; this.parentElement.innerHTML='<span style=\'font-size:32px;\'>👤</span>';">`;
  }
  return `<span style="font-size: 32px;">${avatar || '👤'}</span>`;
}

function updateAvatarDisplay() {
  const avatarDiv = document.getElementById('cabinetAvatar');
  avatarDiv.innerHTML = '';
  
  if (user.avatarType === 'emoji') {
    avatarDiv.innerHTML = user.avatar || '👤';
  } else if (user.avatarType === 'photo' && user.avatarData) {
    const img = document.createElement('img');
    img.src = user.avatarData;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.onerror = () => { avatarDiv.innerHTML = '👤'; };
    avatarDiv.appendChild(img);
  } else {
    avatarDiv.innerHTML = '👤';
  }
  
  // Рамка аватара
  if (items.avatar_frame && items.avatar_frame_active !== false) {
    avatarDiv.style.border = '3px solid gold';
    avatarDiv.style.boxShadow = '0 0 10px gold';
  } else {
    avatarDiv.style.border = 'none';
    avatarDiv.style.boxShadow = 'none';
  }
  
  // Вишиванка
  if (items.vyshyvanka && items.vyshyvanka_active !== false) {
    avatarDiv.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
    avatarDiv.style.color = 'white';
  } else {
    avatarDiv.style.background = 'linear-gradient(135deg, var(--gold), #e67e22)';
  }
}

function loadBadges(stats) {
  const badges = [
    { name: '🌱 Новачок', cond: () => stats.totalThemes >= 1, id: 'novice' },
    { name: '📚 Досвідчений', cond: () => stats.totalThemes >= 10, id: 'exp' },
    { name: '🏅 Майстер', cond: () => stats.totalThemes >= 30, id: 'master' },
    { name: '⭐ Перфекціоніст', cond: () => stats.perfectCount >= 10, id: 'perfect' },
    { name: '🏃 Марафонець', cond: () => stats.totalThemes >= 50, id: 'marathon' },
    { name: '💰 Багатій', cond: () => (user.points || 0) >= 10000, id: 'rich' },
    { name: '🎯 Перша 100%', cond: () => stats.perfectCount >= 1, id: 'first100' },
    { name: '💎 VIP', cond: () => items && items.vip, id: 'vip' },
    { name: '👑 Легенда', cond: () => stats.totalCorrect >= 1000, id: 'legend' }
  ];
  
  if (!earnedBadges) earnedBadges = [];
  badges.forEach(b => {
    if (b.cond() && !earnedBadges.includes(b.id)) {
      earnedBadges.push(b.id);
      showNotification(`🏆 ${b.name}!`);
    }
  });
  
  const container = document.getElementById('badgesContainer');
  if (container) {
    container.innerHTML = badges.map(b => 
      `<div class="badge ${b.cond() ? '' : 'locked'}">${b.name}</div>`
    ).join('');
  }
}

// Функція оновлення покупок
function updatePurchases() {
  // Основні товари
  const goldSpan = document.getElementById('purchaseGold');
  const crownSpan = document.getElementById('purchaseCrown');
  const fireSpan = document.getElementById('purchaseFire');
  const shieldSpan = document.getElementById('purchaseShield');
  const vipSpan = document.getElementById('purchaseVip');
  
  if (goldSpan) goldSpan.innerHTML = items.gold_frame ? '✅' : '❌';
  if (crownSpan) crownSpan.innerHTML = items.crown ? '✅' : '❌';
  if (fireSpan) fireSpan.innerHTML = items.fire ? '✅' : '❌';
  if (shieldSpan) shieldSpan.innerHTML = items.shield ? '✅' : '❌';
  if (vipSpan) vipSpan.innerHTML = items.vip ? '✅' : '❌';
  
  // Візуальні товари - з кнопками для телефону
  updateVisualItem('rainbow_name', 'purchaseRainbow', '🌈 Веселкове ім\'я');
  updateVisualItem('sparkles', 'purchaseSparkles', '✨ Блискітки');
  updateVisualItem('avatar_frame', 'purchaseAvatarFrame', '🖼️ Рамка аватара');
  updateVisualItem('animated_nick', 'purchaseAnimated', '🌟 Анімований нік');
  updateVisualItem('vyshyvanka', 'purchaseVyshyvanka', '🎨 Вишиванка');
  updateVisualItem('kobza', 'purchaseKobza', '🏺 Кобза');
  updateVisualItem('sunflowers', 'purchaseSunflowers', '🌻 Соняшникове поле');
  updateVisualItem('bookshelf', 'purchaseBookshelf', '📜 Книжкова полиця');
  updateVisualItem('theater_mask', 'purchaseTheaterMask', '🎭 Театральна маска');
}

// Функція створення кнопки для товару (працює на телефоні та комп'ютері)
function updateVisualItem(itemKey, elementId, itemName) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  if (!items[itemKey]) {
    element.innerHTML = '❌';
    return;
  }
  
  const isActive = items[itemKey + '_active'] !== false;
  const btnId = 'btn_' + itemKey;
  
  // Створюємо кнопку
  if (isActive) {
    element.innerHTML = '<button id="' + btnId + '" class="toggle-gift-btn" style="background: #2ecc71; color: white; border: none; padding: 8px 16px; border-radius: 25px; font-size: 14px; cursor: pointer; min-width: 90px; font-weight: bold; touch-action: manipulation;">✅ ВКЛ</button>';
  } else {
    element.innerHTML = '<button id="' + btnId + '" class="toggle-gift-btn" style="background: #f1c40f; color: #333; border: none; padding: 8px 16px; border-radius: 25px; font-size: 14px; cursor: pointer; min-width: 90px; font-weight: bold; touch-action: manipulation;">⏻ ВИКЛ</button>';
  }
  
  // Додаємо обробники для телефону і комп'ютера
  const btn = document.getElementById(btnId);
  if (btn) {
    // Для комп'ютера (click)
    btn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleItemEffect(itemKey, itemName);
    };
    // Для телефону (touchstart)
    btn.ontouchstart = function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleItemEffect(itemKey, itemName);
    };
  }
}

// Функція для перемикання ефекту
function toggleItemEffect(itemKey, itemName) {
  if (!items[itemKey]) {
    showNotification('❌ Товар "' + itemName + '" не куплений!', true);
    return;
  }
  
  // Ініціалізуємо статус активності
  if (items[itemKey + '_active'] === undefined) {
    items[itemKey + '_active'] = true;
  }
  
  // Перемикаємо
  const isActive = items[itemKey + '_active'];
  
  if (isActive) {
    items[itemKey + '_active'] = false;
    showNotification('⏸ Ефект "' + itemName + '" вимкнено!');
  } else {
    items[itemKey + '_active'] = true;
    showNotification('▶ Ефект "' + itemName + '" ввімкнено!');
  }
  
  // Зберігаємо
  if (typeof save === 'function') save();
  
  // Оновлюємо відображення
  updatePurchases();
  updateAvatarDisplay();
  if (typeof applyItems === 'function') applyItems();
}

function loadHistory() {
  const container = document.getElementById('historyList');
  if (!user.themeResults || Object.keys(user.themeResults).length === 0) {
    container.innerHTML = 'Ще немає пройдених тем';
    return;
  }
  const recent = Object.entries(user.themeResults).sort((a,b) => new Date(b[1].date) - new Date(a[1].date)).slice(0,15);
  container.innerHTML = recent.map(([theme, data]) => `
    <div class="history-item">
      <span>${getThemeName(theme)}</span>
      <span class="history-percent">${data.percent}%</span>
      <span style="font-size:10px">${data.date?.split(',')[0] || ''}</span>
    </div>
  `).join('');
}

function getThemeName(key) {
  const names = {
    vydminy: 'Відміни',
    orudnyi_1vidmina: 'Орудний відмінок',
    prykmetnyky: 'Прикметники',
    grupy_prykmetnykiv: 'Групи прикметників',
    prykmetnyky_stupeni: 'Ступені',
    prykmetnyky_stupeni_2: 'Ступені 2',
    ne_z_prykmetnykamy: 'НЕ з прикметниками',
    chyslivnyky_1: 'Числівники 1',
    chyslivnyky_2: 'Числівники 2',
    zajmennyky_rozriady: 'Розряди займенників',
    zajmennyky_pravopys: 'Правопис неозначених і заперечних займенників',
    frazeologizmy1: 'Фразеологізми 1',
    frazeologizmy2: 'Фразеологізми 2',
    frazeologizmy3: 'Фразеологізми 3',
    frazeologizmy4: 'Фразеологізми 4',
    frazeologizmy5: 'Фразеологізми 5',
    frazeologizmy6: 'Фразеологізми 6',
    frazeologizmy7: 'Фразеологізми 7',
    frazeologizmy8: 'Фразеологізми 8',
    frazeologizmy9: 'Фразеологізми 9',
    frazeologizmy10: 'Фразеологізми 10',
    frazeologizmy11: 'Фразеологізми 11',
    frazeologizmy12: 'Фразеологізми 12',
    frazeologizmy13: 'Фразеологізми 13',
    frazeologizmy14: 'Фразеологізми 14'
  };
  return names[key] || key;
}

function editNick() {
  showCustomPrompt('Новий нікнейм:', user.name, (newNick) => {
    if (!newNick || newNick === user.name) return;
    
    fetch(DB + "users/" + newNick + ".json").then(r => r.json()).then(existing => {
      if (existing && existing.name !== user.name) {
        showNotification('❌ Нікнейм зайнятий!', true);
        return;
      }
      const oldNick = user.name;
      const newUser = { ...user, name: newNick };
      fetch(DB + "users/" + newNick + ".json", { method: 'PUT', body: JSON.stringify(newUser) })
        .then(() => fetch(DB + "users/" + oldNick + ".json", { method: 'DELETE' }))
        .then(() => {
          user = newUser;
          localStorage.setItem('un', newNick);
          if (typeof update === 'function') update();
          if (typeof applyItems === 'function') applyItems();
          loadCabinet();
          showNotification('✅ Нікнейм змінено!');
        });
    });
  });
}

function changePassword() {
  showCustomPrompt('Новий пароль:', '', (newPass) => {
    if (!newPass) return;
    user.pass = newPass;
    localStorage.setItem('up', newPass);
    if (typeof save === 'function') save();
    showNotification('✅ Пароль змінено!');
  });
}

function logout() {
  showCustomConfirm('Вийти з акаунту?', (confirmed) => {
    if (confirmed) {
      localStorage.removeItem('un');
      localStorage.removeItem('up');
      user = null;
      if (typeof show === 'function') show('auth-screen');
    }
  });
}

function saveThemeResult(theme, correct, total) {
  if (!user.themeResults) user.themeResults = {};
  const percent = Math.round((correct / total) * 100);
  const date = new Date().toLocaleString('uk-UA');
  const oldPercent = user.themeResults[theme]?.percent || 0;
  user.themeResults[theme] = { correct, total, percent, date };
  if (typeof save === 'function') save();
  if (percent === 100 && oldPercent !== 100) {
    showNotification(`🎉 100% у темі "${getThemeName(theme)}"!`);
  }
}

function showNotification(msg, isError = false, duration = 3000) {
  if (user && user.notifications === false) return;
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
    }, duration);
  }
}

function openAvatarModal() {
  document.getElementById('avatarModal').style.display = 'flex';
}

function closeAvatarModal() {
  document.getElementById('avatarModal').style.display = 'none';
}

function setAvatar(emoji) {
  user.avatar = emoji;
  user.avatarType = 'emoji';
  user.avatarData = null;
  if (typeof save === 'function') save();
  updateAvatarDisplay();
  closeAvatarModal();
}

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('avatarFile');
  if (fileInput) {
    fileInput.onchange = function(e) {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(ev) {
          user.avatar = ev.target.result;
          user.avatarType = 'photo';
          user.avatarData = ev.target.result;
          if (typeof save === 'function') save();
          updateAvatarDisplay();
          closeAvatarModal();
          showNotification('✅ Аватарку оновлено!');
        };
        reader.readAsDataURL(file);
      } else {
        showNotification('❌ Оберіть фото', true);
      }
    };
  }
});

function toggleNotifications() {
  const enabled = document.getElementById('notificationsToggle').checked;
  user.notifications = enabled;
  if (typeof save === 'function') save();
}

async function addFriend() {
  const friendNick = document.getElementById('friendNick').value.trim();
  if (!friendNick) {
    showNotification('❌ Введіть нікнейм друга', true);
    return;
  }
  if (friendNick === user.name) {
    showNotification('❌ Не можна додати себе', true);
    return;
  }
  if (user.friends?.includes(friendNick)) {
    showNotification('❌ Вже є в друзях', true);
    return;
  }
  
  const r = await fetch(DB + "users/" + friendNick + ".json");
  const friendData = await r.json();
  if (!friendData) {
    showNotification('❌ Користувача не знайдено', true);
    return;
  }
  
  if (!user.friends) user.friends = [];
  user.friends.push(friendNick);
  if (typeof save === 'function') save();
  document.getElementById('friendNick').value = '';
  loadFriends();
  showNotification(`👥 ${friendNick} додано!`);
  
  if (typeof checkAchievements === 'function') checkAchievements();
}

function loadFriends() {
  const friendsDiv = document.getElementById('friendsList');
  const leaderboardDiv = document.getElementById('leaderboardFriends');
  
  if (!friendsDiv || !leaderboardDiv) return;
  
  if (!user.friends || user.friends.length === 0) {
    friendsDiv.innerHTML = 'У вас ще немає друзів';
    leaderboardDiv.innerHTML = 'Додайте друзів';
    return;
  }
  
  Promise.all(user.friends.map(async f => {
    const r = await fetch(DB + "users/" + f + ".json");
    const d = await r.json();
    return d ? { name: f, points: d.points || 0, avatar: d.avatar || '👤', avatarType: d.avatarType || 'emoji', avatarData: d.avatarData || null, level: d.level || 1 } : null;
  })).then(friends => {
    const valid = friends.filter(f => f);
    friendsDiv.innerHTML = valid.map(f => `
      <div class="friend-item">
        <div class="friend-info">
          <div class="friend-avatar">${getAvatarHtml(f.avatar, f.avatarType, f.avatarData)}</div>
          <span class="friend-name">${f.name}</span>
          <span class="friend-points">${f.points.toLocaleString()} ₴</span>
          <span class="friend-level">${getLevelIcon(f.level)}</span>
        </div>
        <button class="remove-friend" onclick="removeFriend('${f.name}')">❌</button>
      </div>
    `).join('');
    
    const all = [...valid, { name: user.name, points: user.points, avatar: user.avatar || '👤', avatarType: user.avatarType || 'emoji', avatarData: user.avatarData || null, level: user.level || 1 }]
      .sort((a,b) => b.points - a.points);
    
    leaderboardDiv.innerHTML = all.map((f, i) => `
      <div class="leaderboard-item">
        <span class="leaderboard-rank">${i+1}</span>
        <div class="friend-avatar">${getAvatarHtml(f.avatar, f.avatarType, f.avatarData)}</div>
        <span class="leaderboard-name">${f.name} ${f.name === user.name ? '(Ви)' : ''}</span>
        <span class="leaderboard-points">${f.points.toLocaleString()} ₴</span>
        <span class="leaderboard-level">${getLevelIcon(f.level)}</span>
      </div>
    `).join('');
  });
}

function getLevelIcon(level) {
  const icons = ['', '🌱', '📚', '🎓', '⭐', '👑', '🏆'];
  return icons[level] || '🌱';
}

function removeFriend(friendName) {
  showCustomConfirm(`Видалити ${friendName} з друзів?`, (confirmed) => {
    if (confirmed) {
      user.friends = user.friends.filter(f => f !== friendName);
      if (typeof save === 'function') save();
      loadFriends();
      showNotification(`👥 ${friendName} видалено`);
    }
  });
}
