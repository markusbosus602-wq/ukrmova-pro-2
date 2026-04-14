// js/stickers.js - Стікери українських письменників

// Список всіх стікерів
const STICKERS_LIST = [
  { id: 'shevchenko', name: 'Тарас Шевченко', emoji: '🖋️', desc: '100% у темі "Відміни"', price: 5000 },
  { id: 'lesia', name: 'Леся Українка', emoji: '📖', desc: '100% у темі "Прикметники"', price: 5000 },
  { id: 'franko', name: 'Іван Франко', emoji: '🎭', desc: '100% у темі "Займенники"', price: 5000 },
  { id: 'kotsiubynsky', name: 'Михайло Коцюбинський', emoji: '🌾', desc: '100% у темі "Числівники"', price: 5000 },
  { id: 'hohol', name: 'Микола Гоголь', emoji: '🏰', desc: '100% у будь-якому фразеологізмі', price: 5000 },
  { id: 'dovzhenko', name: 'Олександр Довженко', emoji: '🌊', desc: '100% у 5 темах', price: 8000 },
  { id: 'skovoroda', name: 'Григорій Сковорода', emoji: '🎻', desc: '100% у 10 темах', price: 10000 },
  { id: 'kostenko', name: 'Ліна Костенко', emoji: '👑', desc: '100% у всіх темах', price: null },
  { id: 'stus', name: 'Василь Стус', emoji: '⚡', desc: 'Серія 50 правильних', price: 7000 },
  { id: 'teliha', name: 'Олена Теліга', emoji: '🔥', desc: '1000 правильних відповідей', price: 12000 }
];

// Перевірка отримання стікерів за досягнення
function checkStickers() {
  if (!user.stickers) user.stickers = {};
  if (!user.themeResults) return;
  
  const stats = calculateStats();
  const perfectCount = stats.perfectCount;
  
  // Шевченко (100% у Відмінах)
  if (user.themeResults.vydminy?.percent === 100 && !user.stickers.shevchenko) {
    user.stickers.shevchenko = true;
    user.points += 2000;
    if (typeof save === 'function') save();
    showNotification("🎨 ОТРИМАНО СТІКЕР: Тарас Шевченко! +2000 ₴ 🖋️");
  }
  
  // Леся Українка (100% у Прикметниках)
  if (user.themeResults.prykmetnyky?.percent === 100 && !user.stickers.lesia) {
    user.stickers.lesia = true;
    user.points += 2000;
    if (typeof save === 'function') save();
    showNotification("📖 ОТРИМАНО СТІКЕР: Леся Українка! +2000 ₴");
  }
  
  // Франко (100% у Займенниках)
  if (user.themeResults.zajmennyky_rozriady?.percent === 100 && !user.stickers.franko) {
    user.stickers.franko = true;
    user.points += 2000;
    if (typeof save === 'function') save();
    showNotification("🎭 ОТРИМАНО СТІКЕР: Іван Франко! +2000 ₴");
  }
  
  // Коцюбинський (100% у Числівниках)
  if (user.themeResults.chyslivnyky_1?.percent === 100 && !user.stickers.kotsiubynsky) {
    user.stickers.kotsiubynsky = true;
    user.points += 2000;
    if (typeof save === 'function') save();
    showNotification("🌾 ОТРИМАНО СТІКЕР: Михайло Коцюбинський! +2000 ₴");
  }
  
  // Гоголь (100% у будь-якому фразеологізмі)
  const frazeoThemes = ['frazeologizmy1', 'frazeologizmy2', 'frazeologizmy3', 'frazeologizmy4', 'frazeologizmy5', 'frazeologizmy6', 'frazeologizmy7', 'frazeologizmy8', 'frazeologizmy9', 'frazeologizmy10', 'frazeologizmy11', 'frazeologizmy12', 'frazeologizmy13', 'frazeologizmy14'];
  let hasFrazeo100 = false;
  for (let theme of frazeoThemes) {
    if (user.themeResults[theme]?.percent === 100) hasFrazeo100 = true;
  }
  if (hasFrazeo100 && !user.stickers.hohol) {
    user.stickers.hohol = true;
    user.points += 2000;
    if (typeof save === 'function') save();
    showNotification("🏰 ОТРИМАНО СТІКЕР: Микола Гоголь! +2000 ₴");
  }
  
  // Довженко (100% у 5 темах)
  if (perfectCount >= 5 && !user.stickers.dovzhenko) {
    user.stickers.dovzhenko = true;
    user.points += 3000;
    if (typeof save === 'function') save();
    showNotification("🌊 ОТРИМАНО СТІКЕР: Олександр Довженко! +3000 ₴");
  }
  
  // Сковорода (100% у 10 темах)
  if (perfectCount >= 10 && !user.stickers.skovoroda) {
    user.stickers.skovoroda = true;
    user.points += 5000;
    if (typeof save === 'function') save();
    showNotification("🎻 ОТРИМАНО СТІКЕР: Григорій Сковорода! +5000 ₴");
  }
  
  // Костенко (100% у всіх темах)
  const totalThemes = Object.keys(themes).length;
  if (perfectCount >= totalThemes && !user.stickers.kostenko) {
    user.stickers.kostenko = true;
    user.points += 10000;
    if (typeof save === 'function') save();
    showNotification("👑 ОТРИМАНО СТІКЕР: Ліна Костенко! +10000 ₴");
  }
  
  // Стус (серія 50)
  if (typeof correctStreak !== 'undefined' && correctStreak >= 50 && !user.stickers.stus) {
    user.stickers.stus = true;
    user.points += 3000;
    if (typeof save === 'function') save();
    showNotification("⚡ ОТРИМАНО СТІКЕР: Василь Стус! +3000 ₴");
  }
  
  // Теліга (1000 правильних)
  if (stats.totalCorrect >= 1000 && !user.stickers.teliha) {
    user.stickers.teliha = true;
    user.points += 5000;
    if (typeof save === 'function') save();
    showNotification("🔥 ОТРИМАНО СТІКЕР: Олена Теліга! +5000 ₴");
  }
}

// Завантаження стікерів в кабінет
function loadStickers() {
  const stickersContainer = document.getElementById('stickersContainer');
  if (!stickersContainer) return;
  
  if (!user.stickers) user.stickers = {};
  
  stickersContainer.innerHTML = STICKERS_LIST.map(s => {
    const owned = user.stickers[s.id];
    return `
      <div class="sticker-item ${owned ? 'owned' : 'locked'}">
        <div class="sticker-emoji">${s.emoji}</div>
        <div class="sticker-name">${s.name}</div>
        <div class="sticker-desc">${s.desc}</div>
        <div class="sticker-status">${owned ? '✅ Отримано' : (s.price ? `🔒 ${s.price} ₴` : '🔒 Особливий')}</div>
        ${!owned && s.price ? `<button class="btn small sticker-buy" onclick="buyItem('sticker_${s.id}')">Купити</button>` : ''}
      </div>
    `;
  }).join('');
}