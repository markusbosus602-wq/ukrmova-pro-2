// js/snake-game.js — міні-гра «Змійка-мовознавець»
// Класична змійка на сітці: повзе полем, збирає слова. Але їсти можна лише
// слова заданої частини мови — за правильне слово змійка росте й дає очки,
// за зайве втрачається життя. У стіну чи в себе врізатися не можна.
//
// Наприкінці нараховується ігрова валюта (1 ₴ за кожні 10 очок), а результат
// зберігається у профіль гравця (ігри/{uid}).

(function () {
  'use strict';

  // ---------- Банк слів ----------
  const WORD_BANK = [
    { w: 'книга', kind: 'noun' }, { w: 'стіл', kind: 'noun' }, { w: 'земля', kind: 'noun' },
    { w: 'ніч', kind: 'noun' }, { w: 'море', kind: 'noun' }, { w: 'сонце', kind: 'noun' },
    { w: 'дитина', kind: 'noun' }, { w: 'дерево', kind: 'noun' }, { w: 'квітка', kind: 'noun' },
    { w: 'школа', kind: 'noun' }, { w: 'місто', kind: 'noun' }, { w: 'пісня', kind: 'noun' },
    { w: 'серце', kind: 'noun' }, { w: 'дорога', kind: 'noun' }, { w: 'зошит', kind: 'noun' },

    { w: 'весняний', kind: 'adj' }, { w: 'синій', kind: 'adj' }, { w: 'новий', kind: 'adj' },
    { w: 'гарний', kind: 'adj' }, { w: 'тихий', kind: 'adj' }, { w: 'теплий', kind: 'adj' },
    { w: 'добрий', kind: 'adj' }, { w: 'швидкий', kind: 'adj' }, { w: 'сміливий', kind: 'adj' },
    { w: 'золотий', kind: 'adj' }, { w: 'високий', kind: 'adj' }, { w: 'радісний', kind: 'adj' },

    { w: 'п’ять', kind: 'num' }, { w: 'третій', kind: 'num' }, { w: 'сто', kind: 'num' },
    { w: 'сорок', kind: 'num' }, { w: 'перший', kind: 'num' }, { w: 'двоє', kind: 'num' },
    { w: 'сьомий', kind: 'num' }, { w: 'двадцять', kind: 'num' }, { w: 'п’ятдесят', kind: 'num' },

    { w: 'він', kind: 'pron' }, { w: 'вона', kind: 'pron' }, { w: 'вони', kind: 'pron' },
    { w: 'хтось', kind: 'pron' }, { w: 'мій', kind: 'pron' }, { w: 'ніхто', kind: 'pron' },
    { w: 'ми', kind: 'pron' }, { w: 'ти', kind: 'pron' }, { w: 'я', kind: 'pron' }
  ];

  const TARGETS = {
    noun: { label: 'Іменники', short: 'хто? що?', question: 'З’їж лише ІМЕННИКИ — слова, що відповідають на питання хто? що?' },
    adj: { label: 'Прикметники', short: 'який? яка?', question: 'З’їж лише ПРИКМЕТНИКИ — слова, що відповідають на питання який? яка? яке?' },
    num: { label: 'Числівники', short: 'скільки? котрий?', question: 'З’їж лише ЧИСЛІВНИКИ — слова, що означають кількість або порядок.' },
    pron: { label: 'Займенники', short: 'вказує, не називає', question: 'З’їж лише ЗАЙМЕННИКИ — слова, що вказують на предмет, але не називають його.' }
  };
  const KINDS = Object.keys(TARGETS);

  const COLS = 13;
  const POINTS_CORRECT = 25;
  const PENALTY_WRONG = 40;
  const BASE_STEP = 0.34;
  const MIN_STEP = 0.19;
  const START_LEN = 4;

  const game = {
    canvas: null, ctx: null,
    running: false, paused: false, rafId: 0, lastTs: 0,
    width: 0, height: 0, dpr: 1,
    cell: 0, rows: 0,
    targetKind: 'noun',
    snake: [], dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 },
    food: null, step: BASE_STEP, acc: 0,
    score: 0, lives: 3, eaten: 0, wrong: 0, reward: 0,
    floats: [], spawnDelay: 0,
    dom: {}
  };

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // ---------- Побудова DOM ----------
  function buildDom() {
    const host = document.getElementById('snake-game');
    if (!host || game.dom.canvas) return;

    const card = document.createElement('div');
    card.className = 'card snake-card';
    card.innerHTML =
      '<div class="snake-stage">' +
        '<div class="snake-hud">' +
          '<div class="snake-hud-item"><span class="snake-hud-label">Рахунок</span><b id="snakeScore">0</b></div>' +
          '<div class="snake-hud-item snake-hud-target"><span class="snake-hud-label">Ціль</span><b id="snakeTarget">Іменники</b></div>' +
          '<div class="snake-hud-item"><span class="snake-hud-label">Життя</span><b id="snakeLives">❤❤❤</b></div>' +
        '</div>' +
        '<canvas id="snakeCanvas"></canvas>' +
        '<div class="snake-task" id="snakeTask">З’їж лише ІМЕННИКИ</div>' +
        '<div class="snake-overlay" id="snakeOverlay">' +
          '<div class="snake-panel">' +
            '<h3 class="snake-panel-title" id="snakePanelTitle">Змійка-мовознавець</h3>' +
            '<p class="snake-panel-text" id="snakePanelText">Керуй змійкою та збирай лише слова потрібної частини мови.</p>' +
            '<div class="snake-panel-actions" id="snakePanelActions"></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<button class="btn red snake-back" onclick="show(\'minigames\')">◀ НАЗАД</button>';
    host.appendChild(card);

    game.canvas = card.querySelector('#snakeCanvas');
    game.ctx = game.canvas.getContext('2d');
    game.dom = {
      canvas: game.canvas,
      score: card.querySelector('#snakeScore'),
      target: card.querySelector('#snakeTarget'),
      lives: card.querySelector('#snakeLives'),
      overlay: card.querySelector('#snakeOverlay'),
      task: card.querySelector('#snakeTask'),
      panelTitle: card.querySelector('#snakePanelTitle'),
      panelText: card.querySelector('#snakePanelText'),
      panelActions: card.querySelector('#snakePanelActions')
    };
    bindInput();
    window.addEventListener('resize', resize);
    resize();
  }

  // ---------- Сітка й канвас ----------
  function resize() {
    if (!game.canvas) return;
    const rect = game.canvas.parentElement.getBoundingClientRect();
    const width = Math.max(260, Math.round(rect.width));
    const height = Math.max(340, Math.round(rect.height));
    game.dpr = Math.min(window.devicePixelRatio || 1, 2);
    game.width = width;
    game.height = height;
    game.cell = Math.floor(width / COLS);
    game.rows = Math.max(12, Math.floor(height / game.cell));
    game.canvas.width = Math.round(width * game.dpr);
    game.canvas.height = Math.round(height * game.dpr);
    game.canvas.style.width = width + 'px';
    game.canvas.style.height = height + 'px';
    game.ctx.setTransform(game.dpr, 0, 0, game.dpr, 0, 0);
  }

  function cellCenter(c) {
    return { x: c.x * game.cell + game.cell / 2, y: c.y * game.cell + game.cell / 2 };
  }

  function occupied(x, y) {
    return game.snake.some(s => s.x === x && s.y === y);
  }

  // ---------- Логіка ----------
  function start(kind) {
    buildDom();
    game.targetKind = kind || game.targetKind;
    game.snake = [];
    const startY = Math.floor(game.rows / 2);
    for (let i = 0; i < START_LEN; i++) {
      game.snake.push({ x: START_LEN - 1 - i, y: startY });
    }
    game.dir = { x: 1, y: 0 };
    game.nextDir = { x: 1, y: 0 };
    game.score = 0; game.lives = 3; game.eaten = 0; game.wrong = 0; game.reward = 0;
    game.step = BASE_STEP; game.acc = 0; game.lastTs = 0;
    game.floats = []; game.spawnDelay = 0;
    game.paused = false; game.running = true;
    spawnFood();
    hideOverlay();
    updateHud();
    if (!game.rafId) game.rafId = requestAnimationFrame(loop);
  }

  function spawnFood() {
    const wantTarget = Math.random() < 0.55;
    let kind = game.targetKind;
    if (!wantTarget) {
      kind = pick(KINDS.filter(k => k !== game.targetKind));
    }
    const source = WORD_BANK.filter(item => item.kind === kind);
    const entry = pick(source);
    let x, y, guard = 0;
    do {
      x = Math.floor(rand(0, COLS));
      y = Math.floor(rand(0, game.rows));
      guard++;
    } while (occupied(x, y) && guard < 200);
    game.food = { x, y, text: entry.w, kind: entry.kind };
  }

  function loop(ts) {
    if (!game.running) { game.rafId = 0; return; }
    if (game.canvas.offsetParent === null) { stopGame(); return; }
    if (!game.lastTs) game.lastTs = ts;
    let dt = (ts - game.lastTs) / 1000;
    game.lastTs = ts;
    if (dt > 0.1) dt = 0.1;
    if (!game.paused) {
      if (game.spawnDelay > 0) {
        game.spawnDelay -= dt;
        if (game.spawnDelay <= 0 && game.running) spawnFood();
      }
      game.acc += dt;
      while (game.acc >= game.step && game.running && !game.paused) {
        game.acc -= game.step;
        tick();
      }
      updateFloats(dt);
    }
    render();
    game.rafId = requestAnimationFrame(loop);
  }

  function tick() {
    // Застосовуємо напрямок, змінений гравцем, і забороняємо розворот на 180°.
    if (game.nextDir.x !== -game.dir.x || game.nextDir.y !== -game.dir.y) {
      game.dir = game.nextDir;
    }
    const head = game.snake[0];
    const nx = head.x + game.dir.x;
    const ny = head.y + game.dir.y;

    // Стіна або власне тіло — кінець гри.
    if (nx < 0 || ny < 0 || nx >= COLS || ny >= game.rows || occupied(nx, ny)) {
      gameOver();
      return;
    }

    game.snake.unshift({ x: nx, y: ny });

    if (game.food && game.food.x === nx && game.food.y === ny) {
      const correct = game.food.kind === game.targetKind;
      const cx = game.food.x * game.cell + game.cell / 2;
      const cy = game.food.y * game.cell + game.cell / 2;
      if (correct) {
        game.eaten++;
        game.score += POINTS_CORRECT;
        game.step = Math.max(MIN_STEP, game.step - 0.0025);
        addFloat(cx, cy, '+' + POINTS_CORRECT, '#8ff0c0');
      } else {
        // Зайве слово зникає з поля, забирає життя і бали.
        game.wrong++;
        game.score = Math.max(0, game.score - PENALTY_WRONG);
        game.lives--;
        game.snake.pop();
        addFloat(cx, cy, '−' + PENALTY_WRONG + ' ❤', '#ff6b81');
      }
      // Слово з'їдене — прибираємо його з поля. Нове з'явиться за мить,
      // щоб гравець встиг побачити, що воно зникло.
      game.food = null;
      game.spawnDelay = 0.45;
      updateHud();
      if (game.lives <= 0) { gameOver(); return; }
    } else {
      game.snake.pop();
    }
  }

  function addFloat(x, y, text, color) {
    game.floats.push({ x: x, y: y, text: text, color: color, life: 0.9 });
  }

  function updateFloats(dt) {
    for (let i = game.floats.length - 1; i >= 0; i--) {
      const f = game.floats[i];
      f.y -= 34 * dt;
      f.life -= dt;
      if (f.life <= 0) game.floats.splice(i, 1);
    }
  }

  function stopGame() {
    game.running = false;
    if (game.rafId) { cancelAnimationFrame(game.rafId); game.rafId = 0; }
    hideOverlay();
  }

  // ---------- Малювання ----------
  function render() {
    const ctx = game.ctx;
    ctx.clearRect(0, 0, game.width, game.height);

    const grad = ctx.createLinearGradient(0, 0, 0, game.height);
    grad.addColorStop(0, '#07130f');
    grad.addColorStop(1, '#0e2a20');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, game.width, game.height);

    // Сітка
    ctx.strokeStyle = 'rgba(255,255,255,.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * game.cell, 0);
      ctx.lineTo(x * game.cell, game.rows * game.cell);
      ctx.stroke();
    }
    for (let y = 0; y <= game.rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * game.cell);
      ctx.lineTo(COLS * game.cell, y * game.cell);
      ctx.stroke();
    }

    drawFood();
    drawSnake();
    drawFloats();
  }

  function drawFloats() {
    const ctx = game.ctx;
    for (const f of game.floats) {
      ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 1.4));
      ctx.fillStyle = f.color;
      ctx.font = '800 ' + Math.max(13, Math.round(game.cell * 0.46)) + 'px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawSnake() {
    const ctx = game.ctx;
    const pad = Math.max(1, game.cell * 0.08);
    game.snake.forEach((seg, i) => {
      const px = seg.x * game.cell + pad;
      const py = seg.y * game.cell + pad;
      const size = game.cell - pad * 2;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') ctx.roundRect(px, py, size, size, size * 0.28);
      else ctx.rect(px, py, size, size);
      if (i === 0) {
        ctx.fillStyle = '#8ff0c0';
      } else {
        const t = i / Math.max(1, game.snake.length);
        ctx.fillStyle = 'rgba(70, 220, 145, ' + (0.85 - t * 0.45).toFixed(3) + ')';
      }
      ctx.fill();
    });
  }

  function drawFood() {
    const food = game.food;
    if (!food) return;
    const ctx = game.ctx;
    const c = cellCenter(food);
    ctx.font = '800 ' + Math.max(12, Math.round(game.cell * 0.5)) + 'px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const w = ctx.measureText(food.text).width + 14;
    const h = game.cell * 0.86;

    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') ctx.roundRect(c.x - w / 2, c.y - h / 2, w, h, 8);
    else ctx.rect(c.x - w / 2, c.y - h / 2, w, h);
    ctx.fillStyle = 'rgba(30,28,66,.95)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,.5)';
    ctx.stroke();
    ctx.fillStyle = '#f4f1ff';
    ctx.fillText(food.text, c.x, c.y + 1);
  }

  // ---------- HUD та оверлеї ----------
  function updateHud() {
    const dom = game.dom;
    if (!dom.score) return;
    dom.score.textContent = game.score;
    dom.target.textContent = TARGETS[game.targetKind].label;
    dom.lives.textContent = '❤'.repeat(Math.max(0, game.lives)) || '—';
    if (dom.task) dom.task.textContent = 'З’їж лише ' + TARGETS[game.targetKind].label.toUpperCase();
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
    if (game.rafId) { cancelAnimationFrame(game.rafId); game.rafId = 0; }
    const buttons = KINDS.map(kind => ({
      label: TARGETS[kind].label + ' (' + TARGETS[kind].short + ')',
      className: kind === game.targetKind ? 'green' : '',
      onClick: () => start(kind)
    }));
    showOverlay(
      '🐍 Змійка-мовознавець',
      'Обери завдання. З’їж правильні слова — отримаєш бали. З’їж зайве слово — втратиш життя. Керуй стрілками, WASD або свайпом.',
      buttons
    );
  }

  function gameOver() {
    game.running = false;
    if (game.rafId) { cancelAnimationFrame(game.rafId); game.rafId = 0; }
    game.reward = Math.floor(game.score / 10);
    saveResult();
    showOverlay(
      'Гру завершено',
      'Рахунок: ' + game.score + ' · Нагорода: +' + game.reward + ' ₴ · З’їдено: ' +
        game.eaten + ' · Помилок: ' + game.wrong,
      [
        { label: '🔁 Ще раз', className: 'green', onClick: () => start(game.targetKind) },
        { label: '🎯 Інша ціль', onClick: startScreen }
      ]
    );
  }

  function saveResult() {
    if (typeof user === 'undefined' || !user || !user.uid) return;
    const reward = game.reward || 0;
    user.points = (user.points || 0) + reward;
    user.points_earned = (user.points_earned || 0) + reward;
    const record = {
      kind: game.targetKind,
      label: TARGETS[game.targetKind].label,
      score: game.score,
      reward: reward,
      eaten: game.eaten,
      wrong: game.wrong,
      date: new Date().toISOString()
    };
    if (!user.games) user.games = {};
    user.games.snake = record;
    if (typeof save === 'function') save();
    const monEl = document.getElementById('mon');
    if (monEl) monEl.innerText = user.points.toLocaleString();
  }

  // ---------- Ввід ----------
  function setDir(x, y) {
    if (!game.running || game.paused) return;
    game.nextDir = { x: x, y: y };
  }

  function onKeyDown(e) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { e.preventDefault(); setDir(-1, 0); }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { e.preventDefault(); setDir(1, 0); }
    else if (k === 'ArrowUp' || k === 'w' || k === 'W') { e.preventDefault(); setDir(0, -1); }
    else if (k === 'ArrowDown' || k === 's' || k === 'S') { e.preventDefault(); setDir(0, 1); }
    else if (k === 'p' || k === 'P' || k === 'Escape') togglePause();
  }

  function bindInput() {
    document.addEventListener('keydown', onKeyDown);

    let sx = 0, sy = 0;
    game.canvas.addEventListener('touchstart', e => {
      const t = e.touches[0];
      sx = t.clientX; sy = t.clientY;
    }, { passive: true });
    game.canvas.addEventListener('touchend', e => {
      const t = e.changedTouches[0];
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
      if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 1 : -1, 0);
      else setDir(0, dy > 0 ? 1 : -1);
    }, { passive: true });
  }

  function togglePause() {
    if (!game.running) return;
    game.paused = !game.paused;
    if (game.paused) {
      showOverlay('Пауза', 'Гра зупинена. Продовж, коли будеш готовий.', [
        { label: '▶ Продовжити', className: 'green', onClick: togglePause }
      ]);
    } else {
      hideOverlay();
    }
  }

  // ---------- Публічний API ----------
  window.openSnakeGame = function () {
    if (typeof show === 'function') show('snake-game');
    startScreen();
  };

  document.addEventListener('visibilitychange', function () {
    if (document.hidden && game.running && !game.paused) togglePause();
  });
})();
