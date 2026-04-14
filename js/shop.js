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

// Купівля товару
function buyItem(item) {
  if (!user) return;
  
  let originalPrice = SHOP_PRICES[item];
  if (!originalPrice) {
    showCustomMessage("❌ Товар не знайдено!", true);
    return;
  }
  
  if (item === 'secret_item' && typeof secretItemAvailable !== 'undefined' && !secretItemAvailable) {
    showCustomMessage("❌ Секретний товар недоступний!", true);
    return;
  }
  
  if (item.startsWith('sticker_')) {
    const stickerName = item.replace('sticker_', '');
    if (user.stickers?.[stickerName]) {
      showCustomMessage("❌ Ви вже маєте цей стікер!", true);
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
      showCustomMessage(`🎨 ${SHOP_NAMES[item]} куплено! +2000 ₴ бонусу! 🎨`);
      user.points += 2000;
    } else if (item === 'secret_item') {
      if (typeof secretItemAvailable !== 'undefined') secretItemAvailable = false;
      showCustomMessage(`🤫 ${SHOP_NAMES[item]} куплено! +${finalPrice} ₴ бонусу! 🤫`);
      user.points += finalPrice;
    } else {
      if (typeof items !== 'undefined') items[item] = true;
      showCustomMessage(`✨ ${SHOP_NAMES[item]} куплено! ✨`);
    }
    
    if (typeof save === 'function') save();
    if (typeof update === 'function') update();
    if (typeof applyItems === 'function') applyItems();
    if (typeof updatePurchases === 'function') updatePurchases();
  } else {
    showCustomMessage(`❌ Недостатньо грошей! Потрібно ${finalPrice} ₴ ❌`, true);
  }
}