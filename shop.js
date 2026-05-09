// js/notifications.js - Історія дій гравця

// Додати подію в історію
function addToHistory(action, details, icon = '📌') {
  if (!user) return;
  if (!user.history) user.history = [];
  
  const now = new Date();
  const timeStr = now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('uk-UA');
  
  user.history.unshift({
    id: Date.now(),
    action: action,
    details: details,
    icon: icon,
    time: timeStr,
    date: dateStr,
    timestamp: now.getTime()
  });
  
  // Зберігаємо тільки останні 50 подій
  if (user.history.length > 50) user.history.pop();
  
  if (typeof save === 'function') save();
  
  // Показуємо сповіщення
  showNotification(`${icon} ${action}: ${details}`, false, 3000);
  
  // Оновлюємо відображення історії якщо відкрита вкладка
  if (typeof loadHistoryTab === 'function') loadHistoryTab();
}

// Додати подію покупки
function addPurchaseToHistory(itemName, price) {
  addToHistory('Покупка', `${itemName} за ${price} ₴`, '🛒');
}

// Додати подію отримання бонусу
function addBonusToHistory(bonusName, amount) {
  addToHistory('Бонус', `${bonusName} +${amount} ₴`, '🎁');
}

// Додати подію отримання стікера
function addStickerToHistory(stickerName) {
  addToHistory('Стікер', `Отримано стікер "${stickerName}"`, '🎨');
}

// Додати подію отримання досягнення
function addAchievementToHistory(achievementName, reward) {
  addToHistory('Досягнення', `${achievementName} +${reward} ₴`, '🏆');
}

// Додати подію підвищення рівня
function addLevelUpToHistory(levelName, reward) {
  addToHistory('Рівень', `Підвищення до ${levelName} +${reward} ₴`, '⭐');
}

// Додати подію правильної відповіді
function addCorrectAnswerToHistory(theme, reward) {
  addToHistory('Відповідь', `Правильна відповідь у темі "${theme}" +${reward} ₴`, '✅');
}

// Додати подію неправильної відповіді
function addWrongAnswerToHistory(theme, penalty) {
  addToHistory('Відповідь', `Неправильна відповідь у темі "${theme}" -${penalty} ₴`, '❌');
}

// Додати подію завершення теми
function addThemeCompleteToHistory(theme, percent) {
  addToHistory('Тема', `Завершено тему "${theme}" з результатом ${percent}%`, '📚');
}

// Завантажити історію в кабінет
function loadHistoryTab() {
  const historyContainer = document.getElementById('historyTabList');
  if (!historyContainer) return;
  
  if (!user.history || user.history.length === 0) {
    historyContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #aaa;">Ще немає дій</div>';
    return;
  }
  
  historyContainer.innerHTML = user.history.map(item => `
    <div class="history-action-item" style="display: flex; align-items: center; gap: 10px; padding: 8px; border-bottom: 1px solid #ddd; background: ${item.action === 'Покупка' ? '#e8f5e9' : (item.action === 'Бонус' ? '#fff3e0' : '#f5f5f5')}; border-radius: 8px; margin-bottom: 5px;">
      <div style="font-size: 24px;">${item.icon}</div>
      <div style="flex: 1;">
        <div style="font-weight: bold; font-size: 13px;">${item.action}</div>
        <div style="font-size: 11px; color: #666;">${item.details}</div>
        <div style="font-size: 10px; color: #999;">${item.date} ${item.time}</div>
      </div>
    </div>
  `).join('');
}

// Очистити історію
function clearHistory() {
  showCustomConfirm('Очистити всю історію дій?', (confirmed) => {
    if (confirmed) {
      user.history = [];
      if (typeof save === 'function') save();
      loadHistoryTab();
      showNotification('📜 Історію очищено', false, 2000);
    }
  });
}
