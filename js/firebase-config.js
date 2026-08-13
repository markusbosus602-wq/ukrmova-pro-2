// js/firebase-config.js
// ⚠️ ЗАПОВНІТЬ ЦІ ЗНАЧЕННЯ ЗІ СВОГО ПРОЄКТУ FIREBASE:
// Firebase Console → Project settings (шестерня) → General →
// розділ "Your apps" → Web app → SDK setup and configuration → Config
//
// databaseURL нижче вже підставлено з вашого поточного проєкту.
// apiKey, appId, messagingSenderId, storageBucket — треба скопіювати з консолі.

const firebaseConfig = {
  apiKey: "AIzaSyCr7fiw5bBbwGxWGw2IeQbhFeIQC6CWMT0",
  authDomain: "ukrmova-game.firebaseapp.com",
  databaseURL: "https://ukrmova-game-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ukrmova-game",
  storageBucket: "ukrmova-game.firebasestorage.app",
  messagingSenderId: "308588793628",
  appId: "1:308588793628:web:3e644485e493f01c17f4d9"
};

firebase.initializeApp(firebaseConfig);

// Тримаємо сесію користувача в браузері (без збереження пароля!)
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);

const auth = firebase.auth();
const rtdb = firebase.database();

// Домен для "фейкового" email, оскільки Firebase Auth вимагає email,
// а гра використовує нікнейми. Реальний email користувача ніде не питається і не зберігається.
const NICK_EMAIL_DOMAIN = "ukrmova.app";

function nickToEmail(nick) {
  return nick.trim().toLowerCase() + "@" + NICK_EMAIL_DOMAIN;
}

// Дозволені символи в нікнеймі: латиниця, кирилиця, цифри, підкреслення. 3-20 символів.
// Це одночасно і UX-обмеження, і вимога безпеки — нік використовується як ключ у базі даних,
// а Realtime Database забороняє символи . # $ [ ] у ключах.
const NICK_REGEX = /^[a-zA-Zа-яА-ЯіІїЇєЄґҐ0-9_]{3,20}$/;

function isValidNick(nick) {
  return NICK_REGEX.test(nick);
}

// Firebase Authentication вимагає пароль довжиною щонайменше 6 символів.
// У старій схемі в частини гравців паролі були коротшими. Щоб не "відрізати" таких
// гравців від їхнього старого пароля, ми детерміновано подовжуємо короткий пароль
// до 6+ символів завжди однаковим способом — і під час входу, і під час реєстрації,
// і під час міграції (див. ідентичну функцію в scripts/migrate-to-firebase-auth.js).
// Це не робить короткий пароль надійнішим за замовчуванням, зате не ламає вхід старим гравцям.
function normalizePassword(pass) {
  let p = String(pass || '');
  if (p.length >= 6) return p;
  if (p.length === 0) return 'x'.repeat(6);
  let out = p;
  while (out.length < 6) out += p;
  return out;
}
