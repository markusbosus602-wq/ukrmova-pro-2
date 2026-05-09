// js/config.js - Глобальні налаштування

const DB = "https://ukrmova-game-default-rtdb.europe-west1.firebasedatabase.app/";

const CONFIG = {
  // Ігрові налаштування
  POINTS_PER_CORRECT: 100,
  PENALTY_PER_WRONG: 30,
  DAILY_BONUS: 200,
  
  // Бонуси
  STREAK_BONUS: 50,
  QUICK_ANSWER_BONUS: 25,
  QUICK_ANSWER_TIME: 3,
  
  // Рівні
  LEVELS: [
    { name: 'Новачок', icon: '🌱', required: 0 },
    { name: 'Учень', icon: '📚', required: 50 },
    { name: 'Студент', icon: '🎓', required: 150 },
    { name: 'Майстер', icon: '⭐', required: 300 },
    { name: 'Експерт', icon: '👑', required: 500 },
    { name: 'Легенда', icon: '🏆', required: 1000 }
  ],
  
  // Товари в магазині
  SHOP_PRICES: {
    gold_frame: 1000,
    crown: 2000,
    fire: 1500,
    shield: 2500,
    vip: 5000,
    rainbow_name: 3000,
    sparkles: 2500,
    avatar_frame: 2000,
    animated_nick: 3500,
    vyshyvanka: 4000,
    kobza: 3000,
    sunflowers: 5000,
    bookshelf: 6000,
    theater_mask: 4500
  },
  
  SHOP_NAMES: {
    gold_frame: '✨ Золота рамка',
    crown: '👑 Корона',
    fire: '🔥 Полум\'я',
    shield: '🛡️ Щит',
    vip: '💎 ВІП',
    rainbow_name: '🌈 Веселкове ім\'я',
    sparkles: '✨ Блискітки',
    avatar_frame: '🖼️ Рамка аватара',
    animated_nick: '🌟 Анімований нік',
    vyshyvanka: '🎨 Вишиванка',
    kobza: '🏺 Кобза',
    sunflowers: '🌻 Соняшникове поле',
    bookshelf: '📜 Книжкова полиця',
    theater_mask: '🎭 Театральна маска'
  },
  
  // Всі товари для кнопок
  ALL_ITEMS: [
    'gold_frame', 'crown', 'fire', 'shield', 'vip',
    'rainbow_name', 'sparkles', 'avatar_frame', 'animated_nick',
    'vyshyvanka', 'kobza', 'sunflowers', 'bookshelf', 'theater_mask'
  ]
};

// Назви тем
const THEME_NAMES = {
  vydminy: 'Відміни',
  orudnyi_1vidmina: 'Орудний відмінок',
  prykmetnyky: 'Прикметники',
  grupy_prykmetnykiv: 'Групи прикметників',
  prykmetnyky_stupeni: 'Ступені',
  prykmetnyky_stupeni_2: 'Ступені 2',
  ne_z_prykmetnykamy: 'НЕ з прикметниками',
  chyslivnyky_1: 'Числівники 1',
  chyslivnyky_2: 'Числівники 2',
  zajmennyky_rozriady: 'Розряди займенників',
  zajmennyky_pravopys: 'Правопис займенників',
  frazeologizmy1: 'Фразеологізми 1',
  frazeologizmy2: 'Фразеологізми 2',
  frazeologizmy3: 'Фразеологізми 3',
  frazeologizmy4: 'Фразеологізми 4',
  frazeologizmy5: 'Фразеологізми 5',
  frazeologizmy6: 'Фразеологізми 6',
  frazeologizmy7: 'Фразеологізми 7',
  frazeologizmy8: 'Фразеологізми 8',
  frazeologizmy9: 'Фразеологізми 9',
  frazeologizmy10: 'Фразеологізми 10',
  frazeologizmy11: 'Фразеологізми 11',
  frazeologizmy12: 'Фразеологізми 12',
  frazeologizmy13: 'Фразеологізми 13',
  frazeologizmy14: 'Фразеологізми 14'
};