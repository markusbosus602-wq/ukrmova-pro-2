// js/bonuses.js - Бонуси, події, рівні

// Глобальні змінні для бонусів
let correctStreak = 0;
let lastAnswerTime = 0;
let eventActive = null;
let secretItemAvailable = false;
let secretItemEndTime = 0;

// Щоденний бонус
function checkDailyBonus() {
  const today = new Date().toISOString().split('T')[0];
  if (user.lastDailyBonus !== today) {
    user.lastDailyBonus = today;
    user.points += 200;
    if (typeof save === 'function') save();
    showNotification("🎁 Щоденний бонус: +200 ₴!");
    if (typeof addBonusToHistory === 'function') addBonusToHistory('Щоденний бонус', 200);
    return true;
  }
  return false;
}

// Перевірка подій
function checkEvents() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  
  if (day === 0 || day === 6) {
    if (eventActive !== 'double_money') {
      eventActive = 'double_money';
      showNotification("🎉 ВИХІДНІ! ПОДВІЙНІ ГРОШІ! 🎉");
    }
  } else if (now.getMonth() === 11) {
    if (eventActive !== 'discount') {
      eventActive = 'discount';
      showNotification("🎄 СВЯТКОВА ЗНИЖКА -30% В КРАМНИЧЦІ! 🎄");
    }
  } else if (hour >= 18 && hour <= 22 && !secretItemAvailable && Date.now() > secretItemEndTime) {
    if (Math.random() < 0.3) {
      secretItemAvailable = true;
      secretItemEndTime = Date.now() + 3600000;
      showNotification("🤫 СЕКРЕТНИЙ ТОВАР З'ЯВИВСЯ В КРАМНИЧЦІ! 🤫");
    }
  } else if (secretItemAvailable && Date.now() > secretItemEndTime) {
    secretItemAvailable = false;
    showNotification("🔒 Секретний товар зник...");
  }
}

// Отримання ціни зі знижкою
function getPriceWithDiscount(originalPrice) {
  if (eventActive === 'discount') {
    return Math.floor(originalPrice * 0.7);
  }
  return originalPrice;
}

// Перевірка рівня
function checkLevelUp() {
  if (!user.level) user.level = 1;
  const stats = calculateStats();
  const totalCorrect = stats.totalCorrect;
  
  let newLevel = user.level;
  let reward = 0;
  let levelName = '';
  
  if (totalCorrect >= 1000 && user.level < 6) { newLevel = 6; reward = 10000; levelName = 'Легенда'; }
  else if (totalCorrect >= 500 && user.level < 5) { newLevel = 5; reward = 5000; levelName = 'Експерт'; }
  else if (totalCorrect >= 300 && user.level < 4) { newLevel = 4; reward = 2000; levelName = 'Майстер'; }
  else if (totalCorrect >= 150 && user.level < 3) { newLevel = 3; reward = 1000; levelName = 'Студент'; }
  else if (totalCorrect >= 50 && user.level < 2) { newLevel = 2; reward = 500; levelName = 'Учень'; }
  
  if (newLevel > user.level) {
    user.level = newLevel;
    user.points += reward;
    if (typeof save === 'function') save();
    const levelNames = ['', '🌱 Новачок', '📚 Учень', '🎓 Студент', '⭐ Майстер', '👑 Експерт', '🏆 Легенда'];
    showNotification(`🎉 ПІДВИЩЕННЯ РІВНЯ! ${levelNames[newLevel]}! +${reward} ₴ 🎉`);
    if (typeof addLevelUpToHistory === 'function') addLevelUpToHistory(levelNames[newLevel], reward);
    return true;
  }
  return false;
}

// Бонуси в грі
function applyGameBonuses(isCorrect, timeTaken) {
  let bonus = 0;
  
  if (isCorrect) {
    correctStreak++;
    
    if (correctStreak % 5 === 0) {
      bonus += 50;
      showNotification(`🔥 Серія ${correctStreak}! +50 ₴`, false, 1000);
      if (typeof addBonusToHistory === 'function') addBonusToHistory(`Серія ${correctStreak}`, 50);
    }
    
    if (timeTaken < 3) {
      bonus += 25;
      showNotification(`⚡ Швидка відповідь! +25 ₴`, false, 1000);
      if (typeof addBonusToHistory === 'function') addBonusToHistory('Швидка відповідь', 25);
    }
  } else {
    correctStreak = 0;
  }
  
  return bonus;
}

// Скидання серії
function resetStreak() {
  correctStreak = 0;
}
