/**
 * migrate-to-firebase-auth.js
 * -----------------------------------------------------------------------
 * ОДНОРАЗОВИЙ скрипт міграції наявних гравців зі старої схеми
 * (users/{нікнейм} з полем "pass" відкритим текстом) на нову:
 *   - Firebase Authentication (email+пароль, пароль ніде не зберігається у відкритому вигляді)
 *   - users/{uid}            — публічні дані профілю (без пароля)
 *   - nicknames/{нік_лоуер}  — індекс "нік -> uid" для пошуку гравців за ніком
 *
 * ЧОМУ ЦЕ ОКРЕМИЙ СЕРВЕРНИЙ СКРИПТ, А НЕ ЧАСТИНА ГРИ:
 * Для міграції потрібен Admin SDK, який ігнорує Security Rules і має право
 * створювати Auth-акаунти напряму. Робити це з боку клієнта (браузера) було б
 * ще однією дірою в безпеці. Тому скрипт запускається розробником ОДИН РАЗ
 * зі свого комп'ютера, з приватним сервісним ключем, який ніколи не потрапляє
 * в браузер і не публікується на GitHub.
 *
 * ПОРЯДОК ДІЙ:
 * 1) Firebase Console → Project settings → Service accounts →
 *    "Generate new private key" → зберегти файл як serviceAccountKey.json
 *    поруч із цим скриптом (і одразу додати його в .gitignore!).
 * 2) Firebase Console → Authentication → Sign-in method → увімкнути "Email/Password".
 * 3) npm install firebase-admin
 * 4) node migrate-to-firebase-auth.js --dry-run   (спочатку прогнати без змін і подивитись лог)
 * 5) node migrate-to-firebase-auth.js             (реальна міграція)
 * 6) Перевірити, що всі гравці можуть увійти в гру зі старими паролями.
 * 7) node migrate-to-firebase-auth.js --cleanup    (видалити стару гілку users/{нік} з паролями)
 * -----------------------------------------------------------------------
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'https://ukrmova-game-default-rtdb.europe-west1.firebasedatabase.app';
const NICK_EMAIL_DOMAIN = 'ukrmova.app';
const OLD_USERS_PATH = 'users';          // стара гілка: users/{нікнейм}
const BACKUP_FILE = path.join(__dirname, 'legacy-users-backup.json');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const CLEANUP = args.includes('--cleanup');

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Не знайдено serviceAccountKey.json поруч зі скриптом.');
  console.error('   Firebase Console → Project settings → Service accounts → Generate new private key');
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

// ВАЖЛИВО: ця функція має бути ідентична normalizePassword() в js/firebase-config.js,
// інакше гравці з коротким старим паролем не зможуть увійти після міграції.
function normalizePassword(pass) {
  let p = String(pass || '');
  if (p.length >= 6) return p;
  if (p.length === 0) return 'x'.repeat(6);
  let out = p;
  while (out.length < 6) out += p;
  return out;
}

async function main() {
  if (CLEANUP) {
    await runCleanup();
    return;
  }

  console.log(DRY_RUN ? '🔍 Режим DRY-RUN (нічого не змінюємо)\n' : '🚀 Реальна міграція\n');

  const snap = await db.ref(OLD_USERS_PATH).get();
  if (!snap.exists()) {
    console.log('Гілку users не знайдено.');
    return;
  }

  const allUsers = snap.val();
  // Легасі-записи відрізняємо від уже мігрованих за наявністю поля "pass"
  // (у нових записів users/{uid} поля pass немає взагалі).
  const nicks = Object.keys(allUsers).filter(key => allUsers[key] && allUsers[key].pass);
  console.log(`Знайдено ${nicks.length} гравців у старій схемі (зі старим полем pass).\n`);

  if (nicks.length === 0) {
    console.log('Схоже, міграцію вже виконано — записів зі старим паролем не залишилось.');
    return;
  }

  const legacyUsers = {};
  nicks.forEach(nick => { legacyUsers[nick] = allUsers[nick]; });

  // Робимо локальний бекап перед будь-якими змінами (не перезаписуємо, якщо вже є)
  if (!DRY_RUN) {
    if (fs.existsSync(BACKUP_FILE)) {
      const existing = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
      Object.assign(existing, legacyUsers);
      fs.writeFileSync(BACKUP_FILE, JSON.stringify(existing, null, 2));
    } else {
      fs.writeFileSync(BACKUP_FILE, JSON.stringify(legacyUsers, null, 2));
    }
    console.log(`💾 Резервна копія збережена: ${BACKUP_FILE}\n`);
  }

  let migrated = 0, skipped = 0, alreadyExists = 0, failed = 0;

  for (const nick of nicks) {
    const record = legacyUsers[nick];
    const email = nickToEmail(nick);

    try {
      // Пароль зі старої схеми (якщо він взагалі був заданий)
      const legacyPass = record.pass;

      if (!legacyPass) {
        console.warn(`⚠️  ${nick}: пароль відсутній у старому записі — пропускаю, гравцю доведеться зареєструватися заново.`);
        skipped++;
        continue;
      }

      const authPass = normalizePassword(legacyPass);

      let userRecord;
      try {
        userRecord = await authAdmin.getUserByEmail(email);
        console.log(`ℹ️  ${nick}: Auth-акаунт вже існує (uid=${userRecord.uid}), пароль не змінюю.`);
        alreadyExists++;
      } catch (e) {
        if (e.code !== 'auth/user-not-found') throw e;
        if (DRY_RUN) {
          console.log(`[dry-run] Створив би Auth-акаунт для ${nick} (${email})`);
          migrated++;
          continue;
        }
        userRecord = await authAdmin.createUser({
          email,
          password: authPass,
          displayName: record.name || nick
        });
        console.log(`✅ ${nick}: створено Auth-акаунт (uid=${userRecord.uid})`);
      }

      if (DRY_RUN) continue;

      const uid = userRecord.uid;
      const newProfile = Object.assign({}, record);
      delete newProfile.pass; // пароль більше ніде не зберігається у відкритому вигляді

      await db.ref('users/' + uid).set(newProfile);
      await db.ref('nicknames/' + nick.toLowerCase()).set(uid);

      migrated++;
    } catch (e) {
      console.error(`❌ ${nick}: помилка міграції —`, e.message);
      failed++;
    }
  }

  console.log('\n===== ПІДСУМОК =====');
  console.log(`Мігровано:        ${migrated}`);
  console.log(`Вже існували:     ${alreadyExists}`);
  console.log(`Пропущено:        ${skipped} (пароль був відсутній у записі)`);
  console.log(`Помилок:          ${failed}`);

  if (!DRY_RUN) {
    console.log('\nДалі: перевірте вхід кількох реальних гравців у грі, а потім запустіть');
    console.log('  node migrate-to-firebase-auth.js --cleanup');
    console.log('щоб остаточно видалити старі записи з паролями.');
  }
}

// Видаляє ТІЛЬКИ ключі, що були в локальному бекапі (тобто точно старі, ще з паролем),
// а не всю гілку users — щоб випадково не зачепити вже мігровані users/{uid}.
async function runCleanup() {
  if (!fs.existsSync(BACKUP_FILE)) {
    console.error('❌ Не знайдено legacy-users-backup.json — без нього безпечне видалення неможливе.');
    console.error('   (файл створюється автоматично під час звичайного запуску міграції)');
    process.exit(1);
  }

  const legacyUsers = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
  const nicks = Object.keys(legacyUsers);
  console.log(`🧹 Видаляю ${nicks.length} старих записів (users/{нік} з паролем) поіменно...\n`);

  let removed = 0, failed = 0;
  for (const nick of nicks) {
    try {
      // Подвійна перевірка: видаляємо тільки якщо запис ще містить поле pass
      // (тобто це точно старий формат, а не випадково збіглий uid)
      const current = await db.ref('users/' + nick).get();
      if (current.exists() && current.val().pass) {
        if (DRY_RUN) {
          console.log(`[dry-run] Видалив би users/${nick}`);
          removed++;
          continue;
        }
        await db.ref('users/' + nick).remove();
        removed++;
      }
    } catch (e) {
      console.error(`❌ ${nick}: помилка видалення —`, e.message);
      failed++;
    }
  }

  console.log(`\n✅ Видалено: ${removed}, помилок: ${failed}`);
  console.log('Резервна копія (legacy-users-backup.json) залишається у вас локально — не видаляйте її одразу.');
}

main().then(() => process.exit(0)).catch(e => {
  console.error('Критична помилка:', e);
  process.exit(1);
});
