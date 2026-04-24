// js/stickers.js - Стікери українських письменників

// Список всіх стікерів
const STICKERS_LIST = [
  { 
    id: 'shevchenko', 
    name: 'Тарас Шевченко', 
    image: 'images/stickers/shevchenko.png',
    desc: 'Отримайте 100% у темі "Відміни"'
  },
  { 
    id: 'lesia', 
    name: 'Леся Українка', 
    image: 'images/stickers/lesia.png',
    desc: 'Отримайте 100% у темі "Прикметники"'
  },
  { 
    id: 'franko', 
    name: 'Іван Франко', 
    image: 'images/stickers/franko.png',
    desc: 'Отримайте 100% у темі "Займенники"'
  },
  { 
    id: 'kotsiubynsky', 
    name: 'Михайло Коцюбинський', 
    image: 'images/stickers/kotsiubynsky.png',
    desc: 'Отримайте 100% у темі "Числівники"'
  },
  { 
    id: 'hohol', 
    name: 'Микола Гоголь', 
    image: 'images/stickers/hohol.png',
    desc: 'Отримайте 100% у будь-якому фразеологізмі'
  },
  { 
    id: 'dovzhenko', 
    name: 'Олександр Довженко', 
    image: 'images/stickers/dovzhenko.png',
    desc: 'Отримайте 100% у 5 темах'
  },
  { 
    id: 'skovoroda', 
    name: 'Григорій Сковорода', 
    image: 'images/stickers/skovoroda.png',
    desc: 'Отримайте 100% у 10 темах'
  },
  { 
    id: 'kostenko', 
    name: 'Ліна Костенко', 
    image: 'images/stickers/kostenko.png',
    desc: 'Отримайте 100% у всіх темах'
  },
  { 
    id: 'stus', 
    name: 'Василь Стус', 
    image: 'images/stickers/stus.png',
    desc: 'Отримайте серію 50 правильних відповідей'
  },
  { 
    id: 'teliha', 
    name: 'Олена Теліга', 
    image: 'images/stickers/teliha.png',
    desc: 'Дайте 1000 правильних відповідей'
  }
];

// Перевірка отримання стікерів за досягнення
function checkStickers() {
  if (!user) return;
  if (!user.stickers) user.stickers = {};
  if (!user.themeResults) return;
  
  const stats = calculateStats();
  const perfectCount = stats.perfectCount;
  
  // Шевченко
  if (user.themeResults.vydminy?.percent === 100 && !user.stickers.shevchenko) {
    user.stickers.shevchenko = true;
    if (typeof save === 'function') save();
    showNotification("🎨 ОТРИМАНО СТІКЕР: Тарас Шевченко! +2000 ₴");
  }
  
  // Леся Українка
  if (user.themeResults.prykmetnyky?.percent === 100 && !user.stickers.lesia) {
    user.stickers.lesia = true;
    if (typeof save === 'function') save();
    showNotification("📖 ОТРИМАНО СТІКЕР: Леся Українка! +2000 ₴");
  }
  
  // Франко
  if (user.themeResults.zajmennyky_rozriady?.percent === 100 && !user.stickers.franko) {
    user.stickers.franko = true;
    if (typeof save === 'function') save();
    showNotification("🎭 ОТРИМАНО СТІКЕР: Іван Франко! +2000 ₴");
  }
  
  // Коцюбинський
  if (user.themeResults.chyslivnyky_1?.percent === 100 && !user.stickers.kotsiubynsky) {
    user.stickers.kotsiubynsky = true;
    if (typeof save === 'function') save();
    showNotification("🌾 ОТРИМАНО СТІКЕР: Михайло Коцюбинський! +2000 ₴");
  }
  
  // Гоголь
  const frazeoThemes = ['frazeologizmy1', 'frazeologizmy2', 'frazeologizmy3', 'frazeologizmy4', 'frazeologizmy5', 'frazeologizmy6', 'frazeologizmy7', 'frazeologizmy8', 'frazeologizmy9', 'frazeologizmy10', 'frazeologizmy11', 'frazeologizmy12', 'frazeologizmy13', 'frazeologizmy14'];
  let hasFrazeo100 = false;
  for (let theme of frazeoThemes) {
    if (user.themeResults[theme]?.percent === 100) hasFrazeo100 = true;
  }
  if (hasFrazeo100 && !user.stickers.hohol) {
    user.stickers.hohol = true;
    if (typeof save === 'function') save();
    showNotification("🏰 ОТРИМАНО СТІКЕР: Микола Гоголь! +2000 ₴");
  }
  
  // Довженко
  if (perfectCount >= 5 && !user.stickers.dovzhenko) {
    user.stickers.dovzhenko = true;
    if (typeof save === 'function') save();
    showNotification("🌊 ОТРИМАНО СТІКЕР: Олександр Довженко! +3000 ₴");
  }
  
  // Сковорода
  if (perfectCount >= 10 && !user.stickers.skovoroda) {
    user.stickers.skovoroda = true;
    if (typeof save === 'function') save();
    showNotification("🎻 ОТРИМАНО СТІКЕР: Григорій Сковорода! +5000 ₴");
  }
  
  // Костенко
  const totalThemes = Object.keys(themes).length;
  if (perfectCount >= totalThemes && !user.stickers.kostenko) {
    user.stickers.kostenko = true;
    if (typeof save === 'function') save();
    showNotification("👑 ОТРИМАНО СТІКЕР: Ліна Костенко! +10000 ₴");
  }
  
  // Стус
  if (typeof correctStreak !== 'undefined' && correctStreak >= 50 && !user.stickers.stus) {
    user.stickers.stus = true;
    if (typeof save === 'function') save();
    showNotification("⚡ ОТРИМАНО СТІКЕР: Василь Стус! +3000 ₴");
  }
  
  // Теліга
  if (stats.totalCorrect >= 1000 && !user.stickers.teliha) {
    user.stickers.teliha = true;
    if (typeof save === 'function') save();
    showNotification("🔥 ОТРИМАНО СТІКЕР: Олена Теліга! +5000 ₴");
  }
}

// Завантаження стікерів в кабінет з покращеною якістю для телефонів
function loadStickers() {
  const stickersContainer = document.getElementById('stickersContainer');
  if (!stickersContainer) return;
  
  if (!user) return;
  if (!user.stickers) user.stickers = {};
  
  // Використовуємо clamp() для адаптивного розміру
  stickersContainer.innerHTML = STICKERS_LIST.map(s => {
    const owned = user.stickers[s.id];
    return `
      <div class="sticker-item ${owned ? 'owned' : 'locked'}">
        <div class="sticker-emoji">
          <img src="${s.image}" 
               style="width: 100%; max-width: 120px; height: auto; aspect-ratio: 1/1; border-radius: 50%; object-fit: cover; margin-bottom: 10px; image-rendering: crisp-edges; image-rendering: -webkit-optimize-contrast;" 
               loading="lazy"
               onerror="this.style.display='none';">
        </div>
        <div class="sticker-name" style="font-size: clamp(12px, 4vw, 14px); font-weight: bold;">${s.name}</div>
        <div class="sticker-desc" style="font-size: clamp(10px, 3.5vw, 11px); margin: 5px 0;">${s.desc}</div>
        <div class="sticker-status" style="font-size: clamp(10px, 3vw, 11px);">${owned ? '✅ Отримано' : '🔒 Не отримано'}</div>
      </div>
    `;
  }).join('');
}