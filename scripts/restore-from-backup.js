/**
 * restore-from-backup.js
 * -----------------------------------------------------------------------
 * ЕКСТРЕНЕ ВІДНОВЛЕННЯ після помилкового видалення гілки users/.
 * Бере дані з локального бекапу legacy-users-backup.json (він створювався
 * автоматично під час першого запуску migrate-to-firebase-auth.js) і
 * записує їх назад у users/{uid}, використовуючи вже наявний індекс
 * nicknames/{нік} -> uid (він видаленням не зачіпався).
 *
 * Auth-акаунти (логін/пароль) теж НЕ постраждали — --cleanup видаляв
 * тільки дані в Realtime Database, а не в Firebase Authentication.
 *
 * ЗАПУСК (з тієї ж папки scripts, де вже лежить serviceAccountKey.json):
 *   node restore-from-backup.js --dry-run   (спочатку подивитись, що буде)
 *   node restore-from-backup.js             (реальне відновлення)
 * -----------------------------------------------------------------------
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'https://ukrmova-game-default-rtdb.europe-west1.firebasedatabase.app';
const NICK_EMAIL_DOMAIN = 'ukrmova.app';
const BACKUP_FILE = path.join(__dirname, 'legacy-users-backup.json');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Не знайдено serviceAccountKey.json поруч зі скриптом.');
  process.exit(1);
}
if (!fs.existsSync(BACKUP_FILE)) {
  console.error('❌ Не знайдено legacy-users-backup.json поруч зі скриптом. Без нього автоматичне відновлення неможливе.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
  databaseURL: DATABASE_URL
});

const db = admin.database();
const authAdmin = admin.auth();

function nickToEmail(nick) {
  return nick.trim().toLowerCase() + '@' + NICK_EMAIL_DOMAIN;
}

async function main() {
  console.log(DRY_RUN ? '🔍 Режим DRY-RUN (нічого не змінюємо)\n' : '🚀 Реальне відновлення\n');

  const legacyUsers = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
  const nicks = Object.keys(legacyUsers);
  console.log(`У бекапі ${nicks.length} гравців.\n`);

  let restored = 0, failed = 0, notFound = 0;

  for (const nick of nicks) {
    const record = Object.assign({}, legacyUsers[nick]);
    delete record.pass; // пароль назад у базу не повертаємо

    try {
      // 1. Спершу пробуємо знайти uid через індекс нікнеймів
      let uid = null;
      const nickSnap = await db.ref('nicknames/' + nick.toLowerCase()).get();
      if (nickSnap.exists()) {
        uid = nickSnap.val();
      } else {
        // 2. Якщо індексу немає — дістаємо uid напряму з Firebase Auth за email
        try {
          const userRecord = await authAdmin.getUserByEmail(nickToEmail(nick));
          uid = userRecord.uid;
        } catch (e) {
          if (e.code === 'auth/user-not-found') {
            console.warn(`⚠️  ${nick}: не знайдено ні в nicknames, ні в Auth — пропускаю.`);
            notFound++;
            continue;
          }
          throw e;
        }
      }

      if (DRY_RUN) {
        console.log(`[dry-run] Відновив би users/${uid} для ${nick}`);
        restored++;
        continue;
      }

      await db.ref('users/' + uid).set(record);
      // На випадок, якщо індекс теж якось постраждав — перестворюємо його
      await db.ref('nicknames/' + nick.toLowerCase()).set(uid);

      console.log(`✅ ${nick}: відновлено (uid=${uid})`);
      restored++;
    } catch (e) {
      console.error(`❌ ${nick}: помилка відновлення —`, e.message);
      failed++;
    }
  }

  console.log('\n===== ПІДСУМОК =====');
  console.log(`Відновлено: ${restored}`);
  console.log(`Не знайдено: ${notFound}`);
  console.log(`Помилок:     ${failed}`);
}

main().then(() => process.exit(0)).catch(e => {
  console.error('Критична помилка:', e);
  process.exit(1);
});
