// js/custom-tests.js
// Показує учням тести, які були створені через ОКРЕМУ адмін-панель
// (вона більше не вбудована в саму гру — керування тестами тепер там).
// Цей файл нічого не створює і не видаляє, тільки читає й показує.

window.customThemeNames = window.customThemeNames || {};

async function loadCustomTests() {
  let data = null;
  try {
    data = await dbGet('customTests');
  } catch (e) {
    console.error('Не вдалося завантажити додаткові тести:', e);
  }

  const container = document.getElementById('customTestsSection');
  if (!container) return;

  if (!data) {
    container.innerHTML = '<p style="color:#aaa;text-align:center;">Ще немає жодного додаткового тесту</p>';
    return;
  }

  const entries = Object.entries(data);
  container.innerHTML = `
    <h3>📝 Додаткові тести</h3>
    <div class="theme-buttons">
      ${entries.map(([id, t]) => {
        window.customThemeNames[id] = t.name;
        if (typeof themes !== 'undefined') {
          themes[id] = Array.isArray(t.questions) ? t.questions : [];
        }
        return `<button class="btn theme-btn" onclick="startTheme('${id}')">${escapeHtml(t.name)}</button>`;
      }).join('')}
    </div>
  `;
}
