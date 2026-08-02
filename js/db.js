// js/db.js - Безпечна робота з Realtime Database через офіційний SDK
// (замість прямих fetch()-запитів до REST API, які раніше не враховували Security Rules)

async function dbGet(path) {
  const snap = await rtdb.ref(path).get();
  return snap.exists() ? snap.val() : null;
}

async function dbSet(path, value) {
  return rtdb.ref(path).set(value);
}

async function dbUpdate(path, value) {
  return rtdb.ref(path).update(value);
}

async function dbRemove(path) {
  return rtdb.ref(path).remove();
}

// Пошук uid гравця за нікнеймом через індекс nicknames/{nickLower} -> uid
async function getUidByNick(nick) {
  if (!nick) return null;
  return dbGet('nicknames/' + nick.trim().toLowerCase());
}

// Реєстрація нікнейма в індексі (тільки для свого uid — перевіряється в Security Rules)
async function claimNickname(nick, uid) {
  return dbSet('nicknames/' + nick.trim().toLowerCase(), uid);
}
