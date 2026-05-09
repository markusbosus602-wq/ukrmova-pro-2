// js/admin.js - Адмін-панель

let playersListVisible = false;

function togglePlayersList() {
  const playersList = document.getElementById('adminPlayersList');
  const btn = event.target;
  if (playersListVisible) {
    playersList.style.display = 'none';
    btn.innerHTML = '👥 ПОКАЗАТИ ГРАВЦІВ';
    playersListVisible = false;
  } else {
    playersList.style.display = 'block';
    btn.innerHTML = '👥 ПРИХОВАТИ ГРАВЦІВ';
    playersListVisible = true;
    updateAdminPanel();
  }
}

async function resetAllPlayersItems() {
  if (!confirm("⚠️ УВАГА! Це скине ВСІ покупки для ВСІХ гравців! Гроші за покупки НЕ ПОВЕРНУТЬСЯ. Ви впевнені?")) return;
  if (!confirm("🔴 ОСТАННЄ ПОПЕРЕДЖЕННЯ! Цю дію НЕ МОЖНА СКАСУВАТИ. Продовжити?")) return;
  
  showCustomMessage("🔄 Скидання всіх покупок...");
  
  try {
    const r = await fetch(DB + "users/.json");
    const players = await r.json();
    if (!players) {
      showCustomMessage("❌ Гравців не знайдено!", true);
      return;
    }
    
    let count = 0;
    const allItems = CONFIG.ALL_ITEMS;
    
    for (let playerName in players) {
      const player = players[playerName];
      let changed = false;
      
      allItems.forEach(item => {
        if (player.items && player.items[item]) {
          player.items[item] = false;
          changed = true;
        }
        if (player.items && player.items[item + '_active'] !== undefined) {
          delete player.items[item + '_active'];
          changed = true;
        }
      });
      
      if (changed && player.items) {
        await fetch(DB + "users/" + playerName + ".json", { method: 'PUT', body: JSON.stringify(player) });
        count++;
      }
    }
    
    showNotification(`✅ Скинуто покупки для ${count} гравців! Оновіть сторінку.`);
    setTimeout(() => location.reload(), 2000);
  } catch(e) {
    console.error(e);
    showCustomMessage("❌ Помилка при скиданні покупок!", true);
  }
}

async function adminAddMoney() {
  const nick = document.getElementById('adminPlayerNick').value.trim();
  if (!nick) { showCustomMessage("❌ Введіть нікнейм гравця!", true); return; }
  const amount = prompt("Скільки додати?");
  if (!amount) return;
  const numAmount = parseInt(amount);
  if (isNaN(numAmount)) { showCustomMessage("❌ Введіть число!", true); return; }
  const r = await fetch(DB + "users/" + nick + ".json");
  const playerData = await r.json();
  if (!playerData) { showCustomMessage("❌ Гравця не знайдено!", true); return; }
  playerData.points = (playerData.points || 0) + numAmount;
  await fetch(DB + "users/" + nick + ".json", { method: 'PUT', body: JSON.stringify(playerData) });
  showNotification(`✅ ${nick} +${numAmount} ₴`);
  updateAdminPanel();
}

async function adminRemoveMoney() {
  const nick = document.getElementById('adminPlayerNick').value.trim();
  if (!nick) { showCustomMessage("❌ Введіть нікнейм гравця!", true); return; }
  const amount = prompt("Скільки відняти?");
  if (!amount) return;
  const numAmount = parseInt(amount);
  if (isNaN(numAmount)) { showCustomMessage("❌ Введіть число!", true); return; }
  const r = await fetch(DB + "users/" + nick + ".json");
  const playerData = await r.json();
  if (!playerData) { showCustomMessage("❌ Гравця не знайдено!", true); return; }
  playerData.points = Math.max(0, (playerData.points || 0) - numAmount);
  await fetch(DB + "users/" + nick + ".json", { method: 'PUT', body: JSON.stringify(playerData) });
  showNotification(`✅ ${nick} -${numAmount} ₴`);
  updateAdminPanel();
}

async function adminDeletePlayer() {
  const nick = document.getElementById('adminPlayerNick').value.trim();
  if (!nick) { showCustomMessage("❌ Введіть нікнейм гравця!", true); return; }
  if (confirm(`Видалити гравця ${nick}? Цю дію не можна скасувати!`)) {
    await fetch(DB + "users/" + nick + ".json", { method: 'DELETE' });
    showNotification(`🗑 Гравець ${nick} видалений`);
    updateAdminPanel();
    document.getElementById('adminPlayerNick').value = '';
  }
}

async function loadAdminAccessLog() {
  const logDiv = document.getElementById('adminAccessLog');
  if (!logDiv) return;
  try {
    const r = await fetch(DB + "admin_logs.json");
    const data = await r.json();
    if (data) {
      const logs = Object.values(data).reverse().slice(0, 30);
      logDiv.innerHTML = logs.map(log => `<div style="padding: 6px; border-bottom: 1px solid #ddd; font-size: 12px;">🕐 ${log.time} — <strong>${log.nick}</strong></div>`).join('');
      if (logs.length === 0) logDiv.innerHTML = '<div style="padding: 12px; text-align: center; color: #aaa;">Лог порожній</div>';
    } else { logDiv.innerHTML = '<div style="padding: 12px; text-align: center; color: #aaa;">Лог порожній</div>'; }
  } catch(e) { logDiv.innerHTML = '<div style="padding: 12px; text-align: center; color: #aaa;">Помилка завантаження</div>'; }
}

async function clearAdminAccessLog() {
  if (!confirm("Очистити лог входів в адмінку?")) return;
  await fetch(DB + "admin_logs.json", { method: 'DELETE' });
  loadAdminAccessLog();
  showNotification("✅ Лог адмінки очищено");
}