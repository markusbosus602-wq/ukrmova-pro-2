// js/utils.js - Допоміжні функції

// Кастомне сповіщення
function showCustomMessage(msg, isError = false) {
  const toast = document.getElementById('notificationToast');
  if (toast) {
    toast.textContent = msg;
    toast.style.background = isError ? "var(--red)" : "var(--gold)";
    toast.style.color = isError ? "white" : "#000";
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.style.background = "var(--gold)";
        toast.style.color = "#000";
      }, 300);
    }, 3000);
  }
}

// Кастомне модальне вікно для введення тексту
function showCustomPrompt(title, defaultValue, callback) {
  const modal = document.getElementById('customPromptModal');
  const input = document.getElementById('customPromptInput');
  const message = document.getElementById('customPromptMessage');
  const confirmBtn = document.getElementById('customPromptConfirm');
  const cancelBtn = document.getElementById('customPromptCancel');
  
  message.textContent = title;
  input.value = defaultValue || '';
  modal.style.display = 'flex';
  
  const onConfirm = () => {
    modal.style.display = 'none';
    confirmBtn.removeEventListener('click', onConfirm);
    cancelBtn.removeEventListener('click', onCancel);
    input.removeEventListener('keypress', onKeyPress);
    callback(input.value);
  };
  
  const onCancel = () => {
    modal.style.display = 'none';
    confirmBtn.removeEventListener('click', onConfirm);
    cancelBtn.removeEventListener('click', onCancel);
    input.removeEventListener('keypress', onKeyPress);
    callback(null);
  };
  
  const onKeyPress = (e) => {
    if (e.key === 'Enter') {
      onConfirm();
    }
  };
  
  confirmBtn.addEventListener('click', onConfirm);
  cancelBtn.addEventListener('click', onCancel);
  input.addEventListener('keypress', onKeyPress);
  input.focus();
}

// Кастомне підтвердження
function showCustomConfirm(message, callback) {
  const modal = document.getElementById('customConfirmModal');
  const msgSpan = document.getElementById('customConfirmMessage');
  const confirmBtn = document.getElementById('customConfirmYes');
  const cancelBtn = document.getElementById('customConfirmNo');
  
  msgSpan.textContent = message;
  modal.style.display = 'flex';
  
  const onConfirm = () => {
    modal.style.display = 'none';
    confirmBtn.removeEventListener('click', onConfirm);
    cancelBtn.removeEventListener('click', onCancel);
    callback(true);
  };
  
  const onCancel = () => {
    modal.style.display = 'none';
    confirmBtn.removeEventListener('click', onConfirm);
    cancelBtn.removeEventListener('click', onCancel);
    callback(false);
  };
  
  confirmBtn.addEventListener('click', onConfirm);
  cancelBtn.addEventListener('click', onCancel);
}

// Сповіщення
function showNotification(msg, isError = false, duration = 3000) {
  if (typeof user !== 'undefined' && user && user.notifications === false) return;
  const toast = document.getElementById('notificationToast');
  if (toast) {
    toast.textContent = msg;
    toast.style.background = isError ? "var(--red)" : "var(--gold)";
    toast.style.color = isError ? "white" : "#000";
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.style.background = "var(--gold)";
        toast.style.color = "#000";
      }, 300);
    }, duration);
  }
}

// Отримання назви теми
function getThemeName(key) {
  const names = {
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
    zajmennyky_pravopys: 'Правопис неозначених і заперечних займенників',
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
  return names[key] || key;
}

// Розрахунок статистики
function calculateStats() {
  let totalCorrect = 0, totalWrong = 0, totalThemes = 0, perfectCount = 0, bestResult = 0;
  if (typeof user !== 'undefined' && user && user.themeResults) {
    for (let theme in user.themeResults) {
      const r = user.themeResults[theme];
      totalCorrect += r.correct || 0;
      totalWrong += (r.total || r.correct) - (r.correct || 0);
      totalThemes++;
      if (r.percent === 100) perfectCount++;
      if (r.percent > bestResult) bestResult = r.percent;
    }
  }
  const avgPercent = totalCorrect + totalWrong > 0 ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) : 0;
  return { totalThemes, totalCorrect, totalWrong, avgPercent, bestResult, perfectCount };
}

// Отримання іконки рівня
function getLevelIcon(level) {
  const icons = ['', '🌱', '📚', '🎓', '⭐', '👑', '🏆'];
  return icons[level] || '🌱';
}
