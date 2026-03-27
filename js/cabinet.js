// js/cabinet.js
// ================================================
// МОЯ СКРИНЬКА - ЛОГІКА
// ================================================

let correctWrongChart = null;
let levelProgressChart = null;
let earnedBadges = [];

function loadCabinet() {
  if (!user) return;

  // Аватар
  document.getElementById('cabinetAvatar').innerHTML = user.avatar || '👤';
  
  // Особиста інформація
  document.getElementById('cabNick').innerText = user.name;
  document.getElementById('cabMoney').innerText = (user.points || 0).toLocaleString();
  
  const level = calculateLevel();
  document.getElementById('cabLevel').innerText = level.name;
  document.getElementById('levelBadge').innerHTML = level.badge;
  
  if (!user.regDate) {
    user.regDate = new Date().toISOString().split('T')[0];
    save();
  }
  document.getElementById('regDate').innerHTML = user.regDate;
  
  const stats = calculateStats();
  document.getElementById('totalThemes').innerText = stats.totalThemes;
  document.getElementById('correctAnswers').innerText = stats.totalCorrect;
  document.getElementById('wrongAnswers').innerText = stats.totalWrong;
  document.getElementById('avgPercent').innerText = stats.avgPercent + '%';
  document.getElementById('bestResult').innerText = stats.bestResult + '%';
  document.getElementById('perfectCount').innerText = stats.perfectCount;
  
  updateCharts(stats);
  loadBadges(stats);
  updatePurchasesDisplay();
  loadHistory();
  loadFriends();
  
  const notifToggle = document.getElementById('notificationsToggle');
  if (notifToggle) notifToggle.checked = user.notifications !== false;
}

function calculateLevel() {
  const totalCorrect = calculateStats().totalCorrect;
  
  if (totalCorrect < 50) {
    return { name: 'Новачок', badge: '🌱', level: 1 };
  } else if (totalCorrect < 200) {
    return { name: 'Досвідчений', badge: '📚', level: 2 };
  } else if (totalCorrect < 500) {
    return { name: 'Майстер', badge: '🏅', level: 3 };
  } else if (totalCorrect < 1000) {
    return { name: 'Експерт', badge: '🎓', level: 4 };
  } else {
    return { name: 'Грандмайстер', badge: '👑', level: 5 };
  }
}

function calculateStats() {
  let totalCorrect = 0;
  let totalWrong = 0;
  let totalThemes = 0;
  let perfectCount = 0;
  let bestResult = 0;

  if (user.themeResults) {
    for (let theme in user.themeResults) {
      const result = user.themeResults[theme];
      totalCorrect += result.correct || 0;
      totalWrong += (result.total || result.correct) - (result.correct || 0);
      totalThemes++;
      
      if (result.percent === 100) perfectCount++;
      if (result.percent > bestResult) bestResult = result.percent;
    }
  }
  
  const avgPercent = totalCorrect + totalWrong > 0 
    ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) 
    : 0;
  
  return {
    totalThemes,
    totalCorrect,
    totalWrong,
    avgPercent,
    bestResult,
    perfectCount
  };
}

function updateCharts(stats) {
  const ctx1 = document.getElementById('correctWrongChart');
  const ctx2 = document.getElementById('levelProgressChart');
  
  if (ctx1) {
    if (correctWrongChart) correctWrongChart.destroy();
    correctWrongChart = new Chart(ctx1, {
      type: 'doughnut',
      data: {
        labels: ['Правильні', 'Неправильні'],
        datasets: [{
          data: [stats.totalCorrect, stats.totalWrong],
          backgroundColor: ['#4caf50', '#f44336'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { position: 'bottom', labels: { color: '#fff' } } }
      }
    });
  }
  
  if (ctx2) {
    if (levelProgressChart) levelProgressChart.destroy();
    const levelData = getLevelProgressData();
    levelProgressChart = new Chart(ctx2, {
      type: 'line',
      data: {
        labels: levelData.labels,
        datasets: [{
          label: 'Правильні відповіді',
          data: levelData.values,
          borderColor: '#f1c40f',
          backgroundColor: 'rgba(241, 196, 15, 0.1)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { labels: { color: '#fff' } } },
        scales: { y: { grid: { color: '#333' }, ticks: { color: '#fff' } }, x: { ticks: { color: '#fff' } } }
      }
    });
  }
}

function getLevelProgressData() {
  const results = [];
  if (user.themeResults) {
    let cumulative = 0;
    for (let theme in user.themeResults) {
      cumulative += user.themeResults[theme].correct || 0;
      results.push(cumulative);
    }
  }
  return {
    labels: results.map((_, i) => i + 1),
    values: results
  };
}

function loadBadges(stats) {
  const badgesContainer = document.getElementById('badgesContainer');
  const newBadges = [];
  
  const allBadges = [
    { name: '🌱 Новачок', condition: () => stats.totalThemes >= 1, id: 'novice' },
    { name: '📚 Досвідчений', condition: () => stats.totalThemes >= 10, id: 'experienced' },
    { name: '🏅 Майстер', condition: () => stats.totalThemes >= 30, id: 'master' },
    { name: '⭐ Перфекціоніст', condition: () => stats.perfectCount >= 10, id: 'perfectionist' },
    { name: '🏃 Марафонець', condition: () => stats.totalThemes >= 50, id: 'marathon' },
    { name: '💰 Багатій', condition: () => (user.points || 0) >= 10000, id: 'rich' },
    { name: '🎯 Перша 100%', condition: () => stats.perfectCount >= 1, id: 'first100' },
    { name: '⚡ Трудоголік', condition: () => getTodayThemes() >= 10, id: 'workaholic' },
    { name: '💎 VIP', condition: () => items && items.vip, id: 'vip' },
    { name: '👑 Легенда', condition: () => stats.totalCorrect >= 1000, id: 'legend' }
  ];
  
  if (!earnedBadges) earnedBadges = [];
  
  allBadges.forEach(badge => {
    const isUnlocked = badge.condition();
    const wasEarned = earnedBadges.includes(badge.id);
    
    if (isUnlocked && !wasEarned) {
      earnedBadges.push(badge.id);
      showNotification(`🏆 Нове досягнення: ${badge.name}!`);
    }
  });
  
  badgesContainer.innerHTML = allBadges.map(b => 
    `<div class="badge ${badge.condition() ? '' : 'locked'}">${b.name}</div>`
  ).join('');
}

function getTodayThemes() {
  const today = new Date().toLocaleDateString();
  let count = 0;
  if (user.themeResults) {
    for (let theme in user.themeResults) {
      const date = user.themeResults[theme].date?.split(',')[0];
      if (date === today) count++;
    }
  }
  return count;
}

function updatePurchasesDisplay() {
  document.getElementById('purchaseGold').innerHTML = items.gold_frame ? '✅ Куплено' : '❌';
  document.getElementById('purchaseCrown').innerHTML = items.crown ? '✅ Куплено' : '❌';
  document.getElementById('purchaseFire').innerHTML = items.fire ? '✅ Куплено' : '❌';
  document.getElementById('purchaseShield').innerHTML = items.shield ? '✅ Куплено' : '❌';
  document.getElementById('purchaseVip').innerHTML = items.vip ? '✅ Куплено' : '❌';
}

function loadHistory() {
  const historyContainer = document.getElementById('historyList');
  
  if (!user.themeResults || Object.keys(user.themeResults).length === 0) {
    historyContainer.innerHTML = '<div class="history-empty">Ще немає пройдених тем</div>';
    return;
  }
  
  const recent = Object.entries(user.themeResults)
    .sort((a, b) => new Date(b[1].date) - new Date(a[1].date))
    .slice(0, 15);
  
  historyContainer.innerHTML = recent.map(([theme, data]) => `
    <div class="history-item">
      <span>${getThemeName(theme)}</span>
      <span class="history-percent">${data.percent}%</span>
      <span style="font-size:0.7rem; color:#888">${data.date || '—'}</span>
    </div>
  `).join('');
}

function getThemeName(themeKey) {
  const themeNames = {
    vydminy: 'Відміни іменників',
    orudnyi_1vidmina: 'Орудний відмінок 1 відміни',
    prykmetnyky: 'Прикметники',
    grupy_prykmetnykiv: 'Групи прикметників',
    prykmetnyky_stupeni: 'Ступені порівняння',
    prykmetnyky_stupeni_2: 'Ступені порівняння 2',
    ne_z_prykmetnykamy: 'НЕ з прикметниками',
    chyslivnyky_1: 'Числівники №1',
    chyslivnyky_2: 'Числівники №2',
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
  return themeNames[themeKey] || themeKey;
}

function editNick() {
  const newNick = prompt('Введіть новий нікнейм:', user.name);
  if (!newNick || newNick === user.name) return;
  
  fetch(DB + "users/" + newNick + ".json")
    .then(r => r.json())
    .then(existing => {
      if (existing && existing.name !== user.name) {
        alert('Цей нікнейм вже зайнятий!');
        return;
      }
      
      const oldNick = user.name;
      const newUser = { ...user, name: newNick };
      
      fetch(DB + "users/" + newNick + ".json", { method: 'PUT', body: JSON.stringify(newUser) })
        .then(() => {
          fetch(DB + "users/" + oldNick + ".json", { method: 'DELETE' })
            .then(() => {
              user = newUser;
              localStorage.setItem('un', newNick);
              update();
              applyItems();
              loadCabinet();
              alert('Нікнейм змінено!');
            });
        });
    });
}

function changePassword() {
  const newPass = prompt('Введіть новий пароль:');
  if (!newPass) return;
  
  user.pass = newPass;
  localStorage.setItem('up', newPass);
  save();
  alert('Пароль змінено!');
}

function logout() {
  if (confirm('Ви впевнені, що хочете вийти?')) {
    localStorage.removeItem('un');
    localStorage.removeItem('up');
    user = null;
    show('auth-screen');
  }
}

function saveThemeResult(theme, correct, total) {
  if (!user.themeResults) user.themeResults = {};
  
  const percent = Math.round((correct / total) * 100);
  const date = new Date().toLocaleString('uk-UA');
  
  const oldPercent = user.themeResults[theme]?.percent || 0;
  
  user.themeResults[theme] = {
    correct: correct,
    total: total,
    percent: percent,
    date: date
  };
  
  save();
  
  if (percent === 100 && oldPercent !== 100) {
    showNotification(`🎉 Вітаємо! 100% у темі "${getThemeName(theme)}"!`);
  }
}

function showNotification(message) {
  if (user && user.notifications === false) return;
  
  const toast = document.getElementById('notificationToast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function switchCabinetTab(tab) {
  document.querySelectorAll('.cabinet-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  
  document.getElementById(`cabinet-${tab}`).classList.add('active');
  event.target.classList.add('active');
}

function openAvatarModal() {
  document.getElementById('avatarModal').style.display = 'flex';
}

function closeAvatarModal() {
  document.getElementById('avatarModal').style.display = 'none';
}

function setAvatar(emoji) {
  user.avatar = emoji;
  save();
  document.getElementById('cabinetAvatar').innerHTML = emoji;
  closeAvatarModal();
}

function exportDataJSON() {
  const data = {
    name: user.name,
    points: user.points,
    regDate: user.regDate,
    stats: calculateStats(),
    themeResults: user.themeResults,
    items: items
  };
  const json = JSON.stringify(data, null, 2);
  downloadFile(`${user.name}_stats.json`, json, 'application/json');
  showNotification('📄 Дані експортовано в JSON');
}

function exportDataCSV() {
  const stats = calculateStats();
  const rows = [
    ['Нікнейм', user.name],
    ['Баланс', user.points],
    ['Дата реєстрації', user.regDate],
    ['Пройдено тем', stats.totalThemes],
    ['Правильних відповідей', stats.totalCorrect],
    ['Неправильних відповідей', stats.totalWrong],
    ['Середній відсоток', stats.avgPercent + '%'],
    ['Найкращий результат', stats.bestResult + '%'],
    ['100% завершено', stats.perfectCount],
    [''],
    ['Тема', 'Правильні', 'Всього', 'Відсоток', 'Дата']
  ];
  
  if (user.themeResults) {
    for (let theme in user.themeResults) {
      const r = user.themeResults[theme];
      rows.push([getThemeName(theme), r.correct, r.total, r.percent + '%', r.date]);
    }
  }
  
  const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  downloadFile(`${user.name}_stats.csv`, csv, 'text/csv');
  showNotification('📊 Дані експортовано в CSV');
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type: type });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function toggleNotifications() {
  const enabled = document.getElementById('notificationsToggle').checked;
  user.notifications = enabled;
  save();
}

async function addFriend() {
  const friendNick = document.getElementById('friendNick').value.trim();
  if (!friendNick) return alert('Введіть нікнейм друга');
  if (friendNick === user.name) return alert('Не можна додати себе');
  if (user.friends && user.friends.includes(friendNick)) return alert('Цей друг вже у списку');
  
  const r = await fetch(DB + "users/" + friendNick + ".json");
  const friendData = await r.json();
  
  if (!friendData) {
    alert('Користувача з таким нікнеймом не знайдено');
    return;
  }
  
  if (!user.friends) user.friends = [];
  user.friends.push(friendNick);
  save();
  document.getElementById('friendNick').value = '';
  loadFriends();
  showNotification(`👥 ${friendNick} додано до друзів!`);
}

function loadFriends() {
  const friendsContainer = document.getElementById('friendsList');
  const leaderboardContainer = document.getElementById('leaderboardFriends');
  
  if (!user.friends || user.friends.length === 0) {
    friendsContainer.innerHTML = '<div class="history-empty">У вас ще немає друзів</div>';
    leaderboardContainer.innerHTML = '<div class="history-empty">Додайте друзів, щоб бачити таблицю</div>';
    return;
  }
  
  Promise.all(user.friends.map(async (friendName) => {
    const r = await fetch(DB + "users/" + friendName + ".json");
    const data = await r.json();
    return data ? { name: friendName, points: data.points || 0, avatar: data.avatar || '👤' } : null;
  })).then(friendsData => {
    const validFriends = friendsData.filter(f => f !== null);
    
    friendsContainer.innerHTML = validFriends.map(f => `
      <div class="friend-item">
        <div class="friend-info">
          <span class="friend-avatar">${f.avatar}</span>
          <span class="friend-name">${f.name}</span>
          <span class="friend-points">${f.points.toLocaleString()} ₴</span>
        </div>
        <button class="remove-friend" onclick="removeFriend('${f.name}')">Видалити</button>
      </div>
    `).join('');
    
    const sortedFriends = [...validFriends, { name: user.name, points: user.points, avatar: user.avatar || '👤' }]
      .sort((a, b) => b.points - a.points);
    
    leaderboardContainer.innerHTML = sortedFriends.map((f, i) => `
      <div class="leaderboard-item">
        <span class="leaderboard-rank">${i + 1}</span>
        <span class="friend-avatar">${f.avatar}</span>
        <span class="leaderboard-name">${f.name} ${f.name === user.name ? '(Ви)' : ''}</span>
        <span class="leaderboard-points">${f.points.toLocaleString()} ₴</span>
      </div>
    `).join('');
  });
}

function removeFriend(friendName) {
  if (confirm(`Видалити ${friendName} з друзів?`)) {
    user.friends = user.friends.filter(f => f !== friendName);
    save();
    loadFriends();
    showNotification(`👥 ${friendName} видалено з друзів`);
  }
}