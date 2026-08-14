// js/shop.js - Вся крамничка

// Ціни на товари
const SHOP_PRICES = {
  gold_frame: 1000, crown: 2000, fire: 1500, shield: 2500, vip: 5000,
  rainbow_name: 3000, sparkles: 2500, avatar_frame: 2000, animated_nick: 3500,
  vyshyvanka: 4000, kobza: 3000, sunflowers: 5000, bookshelf: 6000, theater_mask: 4500,
  sticker_shevchenko: 5000, sticker_lesia: 5000, sticker_franko: 5000,
  sticker_kotsiubynsky: 5000, sticker_hohol: 5000, sticker_dovzhenko: 8000,
  sticker_skovoroda: 10000, sticker_stus: 7000, sticker_teliha: 12000,
  secret_item: 10000
};

// Назви товарів
const SHOP_NAMES = {
  gold_frame: 'Золота рамка', crown: 'Корона', fire: 'Полум\'я', shield: 'Щит', vip: 'ВІП',
  rainbow_name: 'Веселкове ім\'я', sparkles: 'Блискітки', avatar_frame: 'Рамка аватара',
  animated_nick: 'Анімований нік', vyshyvanka: 'Вишиванка', kobza: 'Кобза',
  sunflowers: 'Соняшникове поле', bookshelf: 'Книжкова полиця', theater_mask: 'Театральна маска',
  secret_item: 'Секретний товар'
};

const EXTRA_SHOP_ITEMS = [
  ['neon_frame','Неонова рамка','Профіль у фіолетовому неоні',2200,'profile'], ['crystal_frame','Кришталева рамка','Холодний кришталевий контур',2600,'profile'],
  ['forest_frame','Лісова рамка','Зелений природний стиль',2400,'profile'], ['ocean_frame','Океанська рамка','Синя хвиля навколо профілю',2400,'profile'],
  ['neon_nick','Неоновий нік','Яскраве сяйво нікнейма',2800,'effects'], ['gold_nick','Золотий нік','Золотий градієнт для імені',3200,'effects'],
  ['ice_nick','Крижаний нік','Холодний блакитний стиль',2700,'effects'], ['shadow_nick','Тіньовий нік','Темний ефект для нікнейма',2500,'effects'],
  ['aurora_bg','Полярне сяйво','Анімований фон профілю',4200,'premium'], ['night_bg','Нічне небо','Зоряний фон для гри',4000,'premium'],
  ['cyber_bg','Кібермісто','Неоновий ігровий фон',4500,'premium'], ['sakura_bg','Сакура','Ніжний рожевий фон',4300,'premium'],
  ['confetti_fx','Конфеті','Святкові частинки на екрані',1800,'effects'], ['snow_fx','Снігопад','Легкий зимовий ефект',1800,'effects'],
  ['stars_fx','Зоряний пил','Мерехтливі зірки навколо',2000,'effects'], ['fireflies_fx','Світлячки','Тепле вечірнє сяйво',2000,'effects'],
  ['badge_legend','Бейдж «Легенда»','Преміум-позначка біля ніка',3500,'premium'], ['badge_master','Бейдж «Майстер»','Покажи свій рівень',3000,'profile'],
  ['badge_star','Бейдж «Зірка»','Яскрава зірка біля імені',2800,'profile'], ['badge_guardian','Бейдж «Оберіг»','Особливий символ профілю',2800,'profile']
];

EXTRA_SHOP_ITEMS.forEach(([id, name, description, price]) => { SHOP_PRICES[id] = price; SHOP_NAMES[id] = name; });

function renderExtraShopItems() {
  const list = document.querySelector('.shop-grid');
  if (!list || list.dataset.extraRendered) return;
  list.dataset.extraRendered = 'true';
  EXTRA_SHOP_ITEMS.forEach(([id, name, description, price, category]) => {
    const premium = category === 'premium' ? ' premium' : '';
    list.insertAdjacentHTML('beforeend', `<button class="shop-item${premium}" data-category="${category}" onclick="buyItem('${id}')"><span class="shop-icon"><svg viewBox="0 0 24 24"><path d="m12 3 2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z"/></svg></span><span class="shop-copy"><span class="shop-name">${name}</span><span class="shop-description">${description}</span></span><span class="shop-price">🪙 ${price}</span></button>`);
  });
}

function applyPurchasedShopEffects() {
  if (typeof items === 'undefined') return;
  const body = document.body;
  const effects = ['aurora_bg', 'night_bg', 'cyber_bg', 'sakura_bg', 'confetti_fx', 'snow_fx', 'stars_fx', 'fireflies_fx'];
  effects.forEach(effect => body.classList.toggle('effect-' + effect, !!items[effect]));
  const nick = document.getElementById('playerNick');
  if (!nick) return;
  nick.classList.remove('style-neon-nick', 'style-gold-nick', 'style-ice-nick', 'style-shadow-nick', 'style-neon-frame', 'style-crystal-frame', 'style-forest-frame', 'style-ocean-frame');
  ['neon_nick', 'gold_nick', 'ice_nick', 'shadow_nick', 'neon_frame', 'crystal_frame', 'forest_frame', 'ocean_frame'].forEach(effect => {
    if (items[effect]) nick.classList.add('style-' + effect.replace('_', '-'));
  });
  const badges = [['badge_legend','◆'], ['badge_master','✦'], ['badge_star','★'], ['badge_guardian','✹']].filter(([id]) => items[id]).map(([, icon]) => icon).join(' ');
  nick.querySelector('.shop-badge')?.remove();
  if (badges) nick.insertAdjacentHTML('afterbegin', `<span class="shop-badge">${badges}</span> `);
}

// Купівля товару
let activeShopCategory = 'all';

function refreshShopUi() {
  const balance = document.getElementById('shopBalance');
  if (balance && typeof user !== 'undefined' && user) balance.textContent = (user.points || 0).toLocaleString();
  document.querySelectorAll('.shop-item').forEach(item => {
    const action = item.getAttribute('onclick') || '';
    const category = item.dataset.category || (action.includes('gold_frame') || action.includes('avatar_frame') ? 'profile'
      : action.includes('vip') || action.includes('sunflowers') ? 'premium' : 'effects');
    item.hidden = activeShopCategory !== 'all' && category !== activeShopCategory;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderExtraShopItems();
  document.querySelectorAll('.shop-tab').forEach(tab => tab.addEventListener('click', () => {
    const label = tab.textContent.trim();
    activeShopCategory = label === 'Профіль' ? 'profile' : label === 'Ефекти' ? 'effects' : label === 'Преміум' ? 'premium' : 'all';
    document.querySelectorAll('.shop-tab').forEach(button => button.classList.toggle('active', button === tab));
    refreshShopUi();
  }));
  refreshShopUi();
});

function buyItem(item) {
  if (!user) return;
  
  let originalPrice = SHOP_PRICES[item];
  if (!originalPrice) {
    showCustomMessage("❌ Товар не знайдено!", true);
    return;
  }
  
  // ПЕРЕВІРКА: чи товар вже куплений (для звичайних товарів)
  if (!item.startsWith('sticker_') && item !== 'secret_item') {
    if (items[item] === true) {
      showCustomMessage(`❌ Ви вже купили "${SHOP_NAMES[item]}"!`, true);
      return;
    }
  }
  
  if (item === 'secret_item' && typeof secretItemAvailable !== 'undefined' && !secretItemAvailable) {
    showCustomMessage("❌ Секретний товар недоступний!", true);
    return;
  }
  
  // ПЕРЕВІРКА: чи стікер вже є
  if (item.startsWith('sticker_')) {
    const stickerName = item.replace('sticker_', '');
    if (user.stickers?.[stickerName]) {
      showCustomMessage(`❌ Ви вже маєте стікер "${SHOP_NAMES[item]}"!`, true);
      return;
    }
  }
  
  let finalPrice = originalPrice;
  if (typeof getPriceWithDiscount === 'function') {
    finalPrice = getPriceWithDiscount(originalPrice);
  }
  
  if (user.points >= finalPrice) {
    user.points -= finalPrice;
    
    if (item.startsWith('sticker_')) {
      const stickerName = item.replace('sticker_', '');
      if (!user.stickers) user.stickers = {};
      user.stickers[stickerName] = true;
      showCustomMessage(`🎨 Стікер "${SHOP_NAMES[item]}" куплено! +2000 ₴ бонусу! 🎨`);
      user.points += 2000;
    } else if (item === 'secret_item') {
      if (typeof secretItemAvailable !== 'undefined') secretItemAvailable = false;
      showCustomMessage(`🤫 ${SHOP_NAMES[item]} куплено! +${finalPrice} ₴ бонусу! 🤫`);
      user.points += finalPrice;
    } else {
      items[item] = true;
      showCustomMessage(`✨ ${SHOP_NAMES[item]} куплено! ✨`);
    }
    
    if (typeof save === 'function') save();
    if (typeof update === 'function') update();
    if (typeof applyItems === 'function') applyItems();
    if (typeof updatePurchases === 'function') updatePurchases();
    refreshShopUi();
  } else {
    showCustomMessage(`❌ Недостатньо грошей! Потрібно ${finalPrice} ₴ ❌`, true);
  }
}
