// js/achievements.js - Досягнення

function checkAchievements() {
  if (!user.achievements) user.achievements = {};
  
  const themesCount = Object.keys(user.themeResults || {}).length;
  const stats = calculateStats();
  const perfectCount = stats.perfectCount;
  
  // Перші 1000 ₴
  if (user.points >= 1000 && !user.achievements.firstThousand) {
    user.achievements.firstThousand = true;
    user.points += 100;
    if (typeof save === 'function') save();
    showNotification("🏆 ДОСЯГНЕННЯ: Перші 1000 ₴! +100 ₴");
  }
  
  // 5 тем
  if (themesCount >= 5 && !user.achievements.fiveThemes) {
    user.achievements.fiveThemes = true;
    user.points += 500;
    if (typeof save === 'function') save();
    showNotification("🏆 ДОСЯГНЕННЯ: 5 тем пройдено! +500 ₴");
  }
  
  // 10 тем
  if (themesCount >= 10 && !user.achievements.tenThemes) {
    user.achievements.tenThemes = true;
    user.points += 1000;
    if (typeof save === 'function') save();
    showNotification("🏆 ДОСЯГНЕННЯ: 10 тем пройдено! +1000 ₴");
  }
  
  // 100% у 3 темах
  if (perfectCount >= 3 && !user.achievements.threePerfect) {
    user.achievements.threePerfect = true;
    user.points += 1500;
    if (typeof save === 'function') save();
    showNotification("🏆 ДОСЯГНЕННЯ: 100% у 3 темах! +1500 ₴ + значок ⭐");
  }
  
  // 50 правильних поспіль
  if (typeof correctStreak !== 'undefined' && correctStreak >= 50 && !user.achievements.streak50) {
    user.achievements.streak50 = true;
    user.points += 2000;
    if (typeof save === 'function') save();
    showNotification("🏆 ДОСЯГНЕННЯ: 50 правильних поспіль! +2000 ₴ + значок 🔥");
  }
  
  // Перший друг
  if ((user.friends?.length || 0) >= 1 && !user.achievements.firstFriend) {
    user.achievements.firstFriend = true;
    user.points += 500;
    if (typeof save === 'function') save();
    showNotification("🏆 ДОСЯГНЕННЯ: Перший друг! +500 ₴");
  }
  
  // 5 друзів
  if ((user.friends?.length || 0) >= 5 && !user.achievements.fiveFriends) {
    user.achievements.fiveFriends = true;
    user.points += 2000;
    if (typeof save === 'function') save();
    showNotification("🏆 ДОСЯГНЕННЯ: 5 друзів! +2000 ₴");
  }
}

// Завантаження списку досягнень в кабінет
function loadAchievements() {
  const achievementsList = document.getElementById('achievementsList');
  if (!achievementsList) return;
  
  const achievements = [
    { id: 'firstThousand', name: '💰 Перші 1000 ₴', reward: '+100 ₴' },
    { id: 'fiveThemes', name: '📚 5 тем пройдено', reward: '+500 ₴' },
    { id: 'tenThemes', name: '🎓 10 тем пройдено', reward: '+1000 ₴' },
    { id: 'threePerfect', name: '⭐ 100% у 3 темах', reward: '+1500 ₴ + значок' },
    { id: 'streak50', name: '🔥 50 правильних поспіль', reward: '+2000 ₴ + значок' },
    { id: 'firstFriend', name: '👥 Перший друг', reward: '+500 ₴' },
    { id: 'fiveFriends', name: '🌟 5 друзів', reward: '+2000 ₴' }
  ];
  
  achievementsList.innerHTML = achievements.map(ach => {
    const earned = user.achievements?.[ach.id];
    return `
      <div class="achievement-item ${earned ? 'earned' : 'locked'}">
        <span class="achievement-name">${ach.name}</span>
        <span class="achievement-reward">${ach.reward}</span>
        <span class="achievement-status">${earned ? '✅' : '🔒'}</span>
      </div>
    `;
  }).join('');
}