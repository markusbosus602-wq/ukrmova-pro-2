// js/friends.js - Друзі

// Додати друга
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

// Завантажити друзів
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
    return d ? { name: f, points: d.points || 0, avatar: d.avatar || '👤', level: d.level || 1 } : null;
  })).then(friends => {
    const valid = friends.filter(f => f);
    friendsDiv.innerHTML = valid.map(f => `
      <div class="friend-item">
        <div class="friend-info">
          <span class="friend-avatar">${f.avatar}</span>
          <span class="friend-name">${f.name}</span>
          <span class="friend-points">${f.points.toLocaleString()} ₴</span>
          <span class="friend-level">${getLevelIcon(f.level)}</span>
        </div>
        <button class="remove-friend" onclick="removeFriend('${f.name}')">❌</button>
      </div>
    `).join('');
    
    const all = [...valid, { name: user.name, points: user.points, avatar: user.avatar || '👤', level: user.level || 1 }]
      .sort((a,b) => b.points - a.points);
    
    leaderboardDiv.innerHTML = all.map((f, i) => `
      <div class="leaderboard-item">
        <span class="leaderboard-rank">${i+1}</span>
        <span class="friend-avatar">${f.avatar}</span>
        <span class="leaderboard-name">${f.name} ${f.name === user.name ? '(Ви)' : ''}</span>
        <span class="leaderboard-points">${f.points.toLocaleString()} ₴</span>
        <span class="leaderboard-level">${getLevelIcon(f.level)}</span>
      </div>
    `).join('');
  });
}

// Видалити друга
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