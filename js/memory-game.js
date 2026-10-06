// js/memory-game.js — міні-гра «Пари слів»
// Класичний меморі: на полі лежать картки зі словами-антонімами. Треба
// відкривати по дві картки й знаходити пари «слово — його протилежність».
//
// Гра тренує словниковий запас: щоб знайти пару, гравець має зрозуміти
// значення обох слів. За кожну знайдену пару +очки, за помилкову спробу
// знімається один хід з-понад ліміту. Наприкінці нараховується ігрова
// валюта (1 ₴ за кожні 10 очок) і результат зберігається у профіль гравця.

(function () {
  'use strict';

  // ---------- Пари антонімів ----------
  const PAIRS = [
    ['великий', 'малий'],
    ['день', 'ніч'],
    ['холодний', 'гарячий'],
    ['початок', 'кінець'],
    ['веселий', 'сумний'],
    ['світло', 'темрява'],
    ['швидкий', 'повільний'],
    ['високий', 'низький'],
    ['друг', 'ворог'],
    ['правда', 'брехня'],
    ['легкий', 'важкий'],
    ['старий', 'молодий'],
    ['тихий', 'гучний'],
    ['білий', 'чорний'],
    ['далеко', 'близько'],
    ['багато', 'мало'],
    ['сильний', 'слабкий'],
    ['відкритий', 'закритий']
  ];

  const PAIRS_PER_ROUND = 6;
  const FLIP_BACK_MS = 850;
  const POINTS_PER_PAIR = 60;
  const POINTS_PER_MISTAKE = -15;

  const game = {
    running: false,
    cards: [],
    firstIndex: -1,
    secondIndex: -1,
    lock: false,
    found: 0,
    total: 0,
    moves: 0,
    mistakes: 0,
    score: 0,
    reward: 0,
    timer: 0,
    timerId: 0,
    dom: {}
  };

  function rand(a, b) { return a + Math.random() * (b - a); }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  // ---------- Побудова DOM ----------
  function buildDom() {
    const host = document.getElementById('memory-game');
    if (!host || game.dom.board) return;

    const card = document.createElement('div');
    card.className = 'card mem-card';
    card.innerHTML =
      '<div class="mem-stage">' +
        '<div class="mem-hud">' +
          '<div class="mem-hud-item"><span class="mem-hud-label">Рахунок</span><b id="memScore">0</b></div>' +
          '<div class="mem-hud-item"><span class="mem-hud-label">Пари</span><b id="memPairs">0/0</b></div>' +
          '<div class="mem-hud-item"><span class="mem-hud-label">Ходи</span><b id="memMoves">0</b></div>' +
          '<div class="mem-hud-item"><span class="mem-hud-label">Час</span><b id="memTime">0:00</b></div>' +
        '</div>' +
        '<div class="mem-board" id="memBoard"></div>' +
        '<div class="mem-overlay" id="memOverlay">' +
          '<div class="mem-panel">' +
            '<h3 class="mem-panel-title" id="memPanelTitle">Пари слів</h3>' +
            '<p class="mem-panel-text" id="memPanelText">Знайди пари слів-антонімів: відкривай по дві картки.</p>' +
            '<div class="mem-panel-actions" id="memPanelActions"></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<button class="btn red mem-back" onclick="show(\'minigames\')">◀ НАЗАД</button>';
    host.appendChild(card);

    game.dom = {
      board: card.querySelector('#memBoard'),
      score: card.querySelector('#memScore'),
      pairs: card.querySelector('#memPairs'),
      moves: card.querySelector('#memMoves'),
      time: card.querySelector('#memTime'),
      overlay: card.querySelector('#memOverlay'),
      panelTitle: card.querySelector('#memPanelTitle'),
      panelText: card.querySelector('#memPanelText'),
      panelActions: card.querySelector('#memPanelActions')
    };
  }

  // ---------- Гра ----------
  function start() {
    buildDom();
    const chosen = shuffle(PAIRS.slice()).slice(0, PAIRS_PER_ROUND);
    game.cards = [];
    chosen.forEach(pair => {
      game.cards.push({ text: pair[0], pairId: pair.join('|') });
      game.cards.push({ text: pair[1], pairId: pair.join('|') });
    });
    shuffle(game.cards);

    game.running = true;
    game.firstIndex = -1;
    game.secondIndex = -1;
    game.lock = false;
    game.found = 0;
    game.total = chosen.length;
    game.moves = 0;
    game.mistakes = 0;
    game.score = 0;
    game.reward = 0;
    game.timer = 0;

    renderBoard();
    updateHud();
    hideOverlay();
    startTimer();
  }

  function startTimer() {
    stopTimer();
    game.timerId = setInterval(() => {
      if (!game.running) return;
      game.timer++;
      updateHud();
    }, 1000);
  }

  function stopTimer() {
    if (game.timerId) { clearInterval(game.timerId); game.timerId = 0; }
  }

  function renderBoard() {
    const board = game.dom.board;
    board.innerHTML = '';
    game.cards.forEach((card, index) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'mem-tile';
      el.textContent = card.text;
      el.dataset.index = String(index);
      el.addEventListener('click', () => flip(index));
      board.appendChild(el);
    });
  }

  function tileAt(index) {
    return game.dom.board.querySelector('.mem-tile[data-index="' + index + '"]');
  }

  function flip(index) {
    if (!game.running || game.lock) return;
    const el = tileAt(index);
    if (!el || el.classList.contains('open') || el.classList.contains('done')) return;

    el.classList.add('open');

    if (game.firstIndex === -1) {
      game.firstIndex = index;
      return;
    }

    game.secondIndex = index;
    game.moves++;
    game.lock = true;

    const a = game.cards[game.firstIndex];
    const b = game.cards[game.secondIndex];

    if (a.pairId === b.pairId) {
      // Пара знайдена.
      const first = game.firstIndex, second = game.secondIndex;
      setTimeout(() => {
        tileAt(first).classList.add('done');
        tileAt(second).classList.add('done');
        tileAt(first).classList.remove('open');
        tileAt(second).classList.remove('open');
        game.found++;
        game.score += POINTS_PER_PAIR;
        resetSelection();
        updateHud();
        if (game.found === game.total) finish();
      }, 320);
    } else {
      // Помилка: картки повертаються, бали знімаються.
      game.mistakes++;
      game.score = Math.max(0, game.score + POINTS_PER_MISTAKE);
      const first = game.firstIndex, second = game.secondIndex;
      updateHud();
      setTimeout(() => {
        tileAt(first).classList.remove('open');
        tileAt(second).classList.remove('open');
        resetSelection();
      }, FLIP_BACK_MS);
    }
  }

  function resetSelection() {
    game.firstIndex = -1;
    game.secondIndex = -1;
    game.lock = false;
  }

  function updateHud() {
    const dom = game.dom;
    if (!dom.score) return;
    dom.score.textContent = game.score;
    dom.pairs.textContent = game.found + '/' + game.total;
    dom.moves.textContent = game.moves;
    const m = Math.floor(game.timer / 60);
    const s = game.timer % 60;
    dom.time.textContent = m + ':' + (s < 10 ? '0' : '') + s;
  }

  function hideOverlay() { if (game.dom.overlay) game.dom.overlay.style.display = 'none'; }

  function showOverlay(title, text, buttons) {
    const dom = game.dom;
    dom.panelTitle.textContent = title;
    dom.panelText.textContent = text;
    dom.panelActions.innerHTML = '';
    buttons.forEach(btn => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'btn ' + (btn.className || '');
      el.textContent = btn.label;
      el.addEventListener('click', btn.onClick);
      dom.panelActions.appendChild(el);
    });
    dom.overlay.style.display = 'flex';
  }

  function startScreen() {
    buildDom();
    game.running = false;
    stopTimer();
    showOverlay(
      '🃏 Пари слів',
      'На полі — картки зі словами. Відкривай по дві та знаходь антоніми: «великий» і «малий», «день» і «ніч».',
      [{ label: '▶ Почати', className: 'green', onClick: start }]
    );
  }

  function finish() {
    game.running = false;
    stopTimer();
    // Нагорода: 1 ₴ за кожні 10 очок.
    game.reward = Math.floor(game.score / 10);
    saveResult();
    const m = Math.floor(game.timer / 60);
    const s = game.timer % 60;
    showOverlay(
      'Гру завершено',
      'Час: ' + m + ':' + (s < 10 ? '0' : '') + s + ' · Ходи: ' + game.moves +
        ' · Помилки: ' + game.mistakes + ' · Рахунок: ' + game.score +
        ' · Нагорода: +' + game.reward + ' ₴',
      [
        { label: '🔁 Ще раз', className: 'green', onClick: start },
        { label: '◀ До міні-ігор', onClick: function () { if (typeof show === 'function') show('minigames'); } }
      ]
    );
  }

  function saveResult() {
    if (typeof user === 'undefined' || !user || !user.uid) return;
    const reward = game.reward || 0;
    user.points = (user.points || 0) + reward;
    user.points_earned = (user.points_earned || 0) + reward;
    const record = {
      score: game.score,
      reward: reward,
      pairs: game.found,
      moves: game.moves,
      mistakes: game.mistakes,
      time: game.timer,
      date: new Date().toISOString()
    };
    if (!user.games) user.games = {};
    user.games.memory = record;
    if (typeof save === 'function') save();
    const monEl = document.getElementById('mon');
    if (monEl) monEl.innerText = user.points.toLocaleString();
  }

  window.openMemoryGame = function () {
    if (typeof show === 'function') show('memory-game');
    startScreen();
  };
})();
