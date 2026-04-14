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

// Отримання аватарки користувача у вигляді HTML
function getUserAvatarHtml(avatar, avatarType, avatarData) {
  if (avatarType === 'emoji') {
    return `<span style="font-size: 24px;">${avatar || '👤'}</span>`;
  } else if (avatarType === 'photo' && avatarData) {
    return `<img src="${avatarData}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;">`;
  }
  return `<span style="font-size: 24px;">👤</span>`;
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
    if (d) {
      return { 
        name: f, 
        points: d.points || 0, 
        avatar: d.avatar || '👤',
        avatarType: d.avatarType || 'emoji',
        avatarData: d.avatarData || null,
        level: d.level || 1 
      };
    }
    return null;
  })).then(friends => {
    const valid = friends.filter(f => f);
    
    // Список друзів з аватарками
    friendsDiv.innerHTML = valid.map(f => `
      <div class="friend-item">
        <div class="friend-info">
          <div class="friend-avatar">${getUserAvatarHtml(f.avatar, f.avatarType, f.avatarData)}</div>
          <span class="friend-name">${f.name}</span>
          <span class="friend-points">${f.points.toLocaleString()} ₴</span>
          <span class="friend-level">${getLevelIcon(f.level)}</span>
        </div>
        <button class="remove-friend" onclick="removeFriend('${f.name}')">❌</button>
      </div>
    `).join('');
    
    // Таблиця лідерів серед друзів + поточний користувач
    const all = [...valid, { 
      name: user.name, 
      points: user.points, 
      avatar: user.avatar || '👤',
      avatarType: user.avatarType || 'emoji',
      avatarData: user.avatarData || null,
      level: user.level || 1 
    }].sort((a,b) => b.points - a.points);
    
    leaderboardDiv.innerHTML = all.map((f, i) => `
      <div class="leaderboard-item">
        <span class="leaderboard-rank">${i+1}</span>
        <div class="friend-avatar">${getUserAvatarHtml(f.avatar, f.avatarType, f.avatarData)}</div>
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
