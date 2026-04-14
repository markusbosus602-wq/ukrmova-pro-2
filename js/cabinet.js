// js/cabinet.js
let earnedBadges = [];

// Кастомне модальне вікно для введення тексту
function showCustomPrompt(title, defaultValue, callback) {
  const modal = document.getElementById('customPromptModal');
  const input = document.getElementById('customPromptInput');
  const message = document.getElementById('customPromptMessage');
  const confirmBtn = document.getElementById('customPromptConfirm');
  const cancelBtn = document.getElementById('customPromptCancel');
  
  message.textContent = title;
  input.value = defaultValue || '';
  modal.style.display = 'flex';
  
  const onConfirm = () => {
    modal.style.display = 'none';
    confirmBtn.removeEventListener('click', onConfirm);
    cancelBtn.removeEventListener('click', onCancel);
    input.removeEventListener('keypress', onKeyPress);
    callback(input.value);
  };
  
  const onCancel = () => {
    modal.style.display = 'none';
    confirmBtn.removeEventListener('click', onConfirm);
    cancelBtn.removeEventListener('click', onCancel);
    input.removeEventListener('keypress', onKeyPress);
    callback(null);
  };
  
  const onKeyPress = (e) => {
    if (e.key === 'Enter') {
      onConfirm();
    }
  };
  
  confirmBtn.addEventListener('click', onConfirm);
  cancelBtn.addEventListener('click', onCancel);
  input.addEventListener('keypress', onKeyPress);
  input.focus();
}

// Кастомне підтвердження
function showCustomConfirm(message, callback) {
  const modal = document.getElementById('customConfirmModal');
  const msgSpan = document.getElementById('customConfirmMessage');
  const confirmBtn = document.getElementById('customConfirmYes');
  const cancelBtn = document.getElementById('customConfirmNo');
  
  msgSpan.textContent = message;
  modal.style.display = 'flex';
  
  const onConfirm = () => {
    modal.style.display = 'none';
    confirmBtn.removeEventListener('click', onConfirm);
    cancelBtn.removeEventListener('click', onCancel);
    callback(true);
  };
  
  const onCancel = () => {
    modal.style.display = 'none';
    confirmBtn.removeEventListener('click', onConfirm);
    cancelBtn.removeEventListener('click', onCancel);
    callback(false);
  };
  
  confirmBtn.addEventListener('click', onConfirm);
  cancelBtn.addEventListener('click', onCancel);
}

function loadCabinet() {
  if (!user) return;
  
  updateAvatarDisplay();
  document.getElementById('cabNick').innerText = user.name;
  document.getElementById('cabMoney').innerText = (user.points || 0).toLocaleString();
  
  const level = calculateLevel();
  document.getElementById('cabLevel').innerText = level.name;
  document.getElementById('levelBadge').innerHTML = level.badge;
  document.getElementById('regDate').innerHTML = user.regDate || new Date().toISOString().split('T')[0];
  
  const stats = calculateStats();
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
    avatarDiv.appendChild(img);
  }
}

function calculateLevel() {
  const totalCorrect = calculateStats().totalCorrect;
  if (totalCorrect < 50) return { name: 'Новачок', badge: '🌱' };
  if (totalCorrect < 200) return { name: 'Досвідчений', badge: '📚' };
  if (totalCorrect < 500) return { name: 'Майстер', badge: '🏅' };
  if (totalCorrect < 1000) return { name: 'Експерт', badge: '🎓' };
  return { name: 'Грандмайстер', badge: '👑' };
}

function calculateStats() {
  let totalCorrect = 0, totalWrong = 0, totalThemes = 0, perfectCount = 0, bestResult = 0;
  if (user.themeResults) {
    for (let theme in user.themeResults) {
      const r = user.themeResults[theme];
      totalCorrect += r.correct || 0;
      totalWrong += (r.total || r.correct) - (r.correct || 0);
      totalThemes++;
      if (r.percent === 100) perfectCount++;
      if (r.percent > bestResult) bestResult = r.percent;
    }
  }
  const avgPercent = totalCorrect + totalWrong > 0 ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) : 0;
  return { totalThemes, totalCorrect, totalWrong, avgPercent, bestResult, perfectCount };
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
  
  document.getElementById('badgesContainer').innerHTML = badges.map(b => 
    `<div class="badge ${b.cond() ? '' : 'locked'}">${b.name}</div>`
  ).join('');
}

function updatePurchases() {
  document.getElementById('purchaseGold').innerHTML = items.gold_frame ? '✅' : '❌';
  document.getElementById('purchaseCrown').innerHTML = items.crown ? '✅' : '❌';
  document.getElementById('purchaseFire').innerHTML = items.fire ? '✅' : '❌';
  document.getElementById('purchaseShield').innerHTML = items.shield ? '✅' : '❌';
  document.getElementById('purchaseVip').innerHTML = items.vip ? '✅' : '❌';
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
          update();
          applyItems();
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
    save();
    showNotification('✅ Пароль змінено!');
  });
}

function logout() {
  showCustomConfirm('Вийти з акаунту?', (confirmed) => {
    if (confirmed) {
      localStorage.removeItem('un');
      localStorage.removeItem('up');
      user = null;
      show('auth-screen');
    }
  });
}

function saveThemeResult(theme, correct, total) {
  if (!user.themeResults) user.themeResults = {};
  const percent = Math.round((correct / total) * 100);
  const date = new Date().toLocaleString('uk-UA');
  const oldPercent = user.themeResults[theme]?.percent || 0;
  user.themeResults[theme] = { correct, total, percent, date };
  save();
  if (percent === 100 && oldPercent !== 100) {
    showNotification(`🎉 100% у темі "${getThemeName(theme)}"!`);
  }
}

function showNotification(msg, isError = false) {
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
    }, 2500);
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
  save();
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
          save();
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
  save();
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
  save();
  document.getElementById('friendNick').value = '';
  loadFriends();
  showNotification(`👥 ${friendNick} додано!`);
}

function loadFriends() {
  const friendsDiv = document.getElementById('friendsList');
  const leaderboardDiv = document.getElementById('leaderboardFriends');
  
  if (!user.friends || user.friends.length === 0) {
    friendsDiv.innerHTML = 'У вас ще немає друзів';
    leaderboardDiv.innerHTML = 'Додайте друзів';
    return;
  }
  
  Promise.all(user.friends.map(async f => {
    const r = await fetch(DB + "users/" + f + ".json");
    const d = await r.json();
    return d ? { name: f, points: d.points || 0, avatar: d.avatar || '👤' } : null;
  })).then(friends => {
    const valid = friends.filter(f => f);
    friendsDiv.innerHTML = valid.map(f => `
      <div class="friend-item">
        <div class="friend-info">
          <span class="friend-avatar">${f.avatar}</span>
          <span class="friend-name">${f.name}</span>
          <span class="friend-points">${f.points.toLocaleString()} ₴</span>
        </div>
        <button class="remove-friend" onclick="removeFriend('${f.name}')">❌</button>
      </div>
    `).join('');
    
    const all = [...valid, { name: user.name, points: user.points, avatar: user.avatar || '👤' }]
      .sort((a,b) => b.points - a.points);
    
    leaderboardDiv.innerHTML = all.map((f, i) => `
      <div class="leaderboard-item">
        <span class="leaderboard-rank">${i+1}</span>
        <span class="friend-avatar">${f.avatar}</span>
        <span class="leaderboard-name">${f.name} ${f.name === user.name ? '(Ви)' : ''}</span>
        <span class="leaderboard-points">${f.points.toLocaleString()} ₴</span>
      </div>
    `).join('');
  });
}

function removeFriend(friendName) {
  showCustomConfirm(`Видалити ${friendName} з друзів?`, (confirmed) => {
    if (confirmed) {
      user.friends = user.friends.filter(f => f !== friendName);
      save();
      loadFriends();
      showNotification(`👥 ${friendName} видалено`);
    }
  });
}
