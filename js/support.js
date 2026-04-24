// js/support.js - Технічна підтримка

// Відправити повідомлення в підтримку
async function sendSupportMessage() {
  if (!user) return;
  
  const message = document.getElementById('supportMessage').value.trim();
  if (!message) {
    showNotification("❌ Введіть повідомлення!", true);
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
  
  document.getElementById('supportMessage').value = '';
  loadSupportMessages();
  showNotification("✅ Повідомлення відправлено! Очікуйте відповіді.");
}

// Завантажити повідомлення гравця
function loadSupportMessages() {
  if (!user) return;
  
  const container = document.getElementById('supportMessagesList');
  if (!container) return;
  
  if (!user.supportMessages || user.supportMessages.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 20px; color: #aaa;">У вас ще немає повідомлень</div>';
    return;
  }
  
  container.innerHTML = user.supportMessages.map(msg => `
    <div style="background: ${msg.reply ? '#e8f5e9' : '#fff3e0'}; padding: 12px; border-radius: 12px; margin-bottom: 10px; border-left: 4px solid ${msg.reply ? '#2ecc71' : '#f1c40f'};">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <strong>📝 ${msg.from}</strong>
        <small style="color: #666;">${msg.date}</small>
      </div>
      <div style="margin-bottom: 8px;">${msg.message}</div>
      ${msg.reply ? `
        <div style="background: #e8f5e9; padding: 8px; border-radius: 8px; margin-top: 8px;">
          <strong>📩 Відповідь адміністратора:</strong><br>
          ${msg.reply}
        </div>
      ` : '<div style="color: #999; font-size: 12px;">⏳ Очікує відповіді...</div>'}
    </div>
  `).join('');
}