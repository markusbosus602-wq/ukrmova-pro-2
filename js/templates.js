// js/templates.js - Шаблони для динамічного створення контенту

function renderShopItems() {
  const items = [
    { id: 'gold_frame', name: '✨ Золота рамка', price: 1000 },
    { id: 'crown', name: '👑 Корона', price: 2000 },
    { id: 'fire', name: '🔥 Полум\'я', price: 1500 },
    { id: 'shield', name: '🛡️ Щит', price: 2500 },
    { id: 'vip', name: '💎 ВІП', price: 5000 },
    { id: 'rainbow_name', name: '🌈 Веселкове ім\'я', price: 3000 },
    { id: 'sparkles', name: '✨ Блискітки', price: 2500 },
    { id: 'avatar_frame', name: '🖼️ Рамка аватара', price: 2000 },
    { id: 'animated_nick', name: '🌟 Анімований нік', price: 3500 },
    { id: 'vyshyvanka', name: '🎨 Вишиванка для аватара', price: 4000 },
    { id: 'kobza', name: '🏺 Кобза для ніка', price: 3000 },
    { id: 'sunflowers', name: '🌻 Соняшникове поле', price: 5000 },
    { id: 'bookshelf', name: '📜 Книжкова полиця', price: 6000 },
    { id: 'theater_mask', name: '🎭 Театральна маска', price: 4500 }
  ];
  
  return items.map(item => 
    `<button class="shop-btn" data-item="${item.id}">${item.name} — ${item.price} ₴</button>`
  ).join('');
}

function renderAvatarOptions() {
  const emojis = ['👤', '😀', '🎮', '🏆', '⭐', '🔥', '💎', '👑', '📚', '🎓'];
  return emojis.map(emoji => 
    `<div class="avatar-option" onclick="setAvatar('${emoji}')">${emoji}</div>`
  ).join('');
}

// Автоматичне заповнення магазину при завантаженні
document.addEventListener('DOMContentLoaded', function() {
  const shopGrid = document.querySelector('#shop .shop-grid');
  if (shopGrid && shopGrid.children.length === 0) {
    shopGrid.innerHTML = renderShopItems();
  }
});