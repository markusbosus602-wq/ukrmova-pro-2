// js/support.js - Технічна підтримка

// Відправити повідомлення в підтримку
async function sendSupportMessage() {
  if (!user) return;
  
  const messageInput = document.getElementById('supportMessage');
  const message = messageInput.value.trim();
  
  if (!message) {
    showNotification("❌ Введіть повідомлення!", true);
    if (navigator.vibrate) navigator.vibrate(100);
    return;
  }
  
  if (!user.supportMessages) user.supportMessages = [];
  
  const newMessage = {
    id: Date.now(),
    from: user.name,
    message: message,
    date: new Date().toLocaleString('uk-UA'),
    read: false,
    reply: null
  };
  
  user.supportMessages.push(newMessage);
  if (typeof save === 'function') save();
  
  messageInput.value = '';
  messageInput.blur();
  
  loadSupportMessages();
  showNotification("✅ Повідомлення відправлено! Очікуйте відповіді.");
  
  if (navigator.vibrate) navigator.vibrate(50);
}

// Завантажити повідомлення гравця (весь діалог)
function loadSupportMessages() {
  if (!user) return;
  
  const container = document.getElementById('supportMessagesList');
  if (!container) return;
  
  if (!user.supportMessages || user.supportMessages.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 20px; color: #aaa;">📭 У вас ще немає повідомлень</div>';
    return;
  }
  
  // Сортуємо за датою (старі зверху, нові знизу)
  const sortedMessages = [...user.supportMessages].sort((a, b) => a.id - b.id);
  
  container.innerHTML = sortedMessages.map(msg => `
    <div class="message-bubble ${msg.from === user.name ? 'outgoing' : 'incoming'}" style="margin-bottom: 15px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px; flex-wrap: wrap;">
        <strong>${msg.from === user.name ? '👤 Ви' : '📩 Адміністратор'}</strong>
        <small style="color: #666; font-size: 10px;">${msg.date}</small>
      </div>
      <div class="message-text" style="background: ${msg.from === user.name ? '#007bff' : '#e9ecef'}; color: ${msg.from === user.name ? 'white' : '#333'}; padding: 10px; border-radius: 12px; word-break: break-word; white-space: pre-wrap;">
        ${escapeHtml(msg.message)}
      </div>
      ${msg.reply ? `
        <div style="margin-top: 8px; margin-left: 20px; border-left: 3px solid #2ecc71; padding-left: 10px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <strong>📩 Відповідь адміністратора</strong>
          </div>
          <div style="background: #e8f5e9; padding: 10px; border-radius: 12px; word-break: break-word; white-space: pre-wrap;">
            ${escapeHtml(msg.reply)}
          </div>
        </div>
      ` : ''}
    </div>
  `).join('');
  
  // Прокручуємо до останнього повідомлення
  setTimeout(() => {
    container.scrollTop = container.scrollHeight;
  }, 100);
}

// Оновити повідомлення (для адмін-панелі)
function refreshSupportMessages() {
  loadSupportMessages();
}

// Функція для захисту від XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
