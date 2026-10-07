// js/space-game.js — міні-гра «Космічний мисливець»
// Космічний корабель летить унизу, а зверху падають українські слова.
// Треба збивати лише слова заданої частини мови. Стріляти — тап по кораблю або пробіл.
//
// Правила гри навмисно прості: за правильне влучання +очки, за пропущене
// правильне слово -життя, за підбите зайве слово -життя і -очки. Наприкінці
// гри нараховується ігрова валюта (1 ₴ за кожні 10 очок), а результат
// зберігається у профіль гравця (ігри/{uid}) і показується у кабінеті.

(function () {
  'use strict';

  // ---------- Банк слів ----------
  // kind: 'noun' (іменник), 'adj' (прикметник), 'num' (числівник), 'pron' (займенник)
  const WORD_BANK = [
    // Іменники
    { w: 'книга', kind: 'noun' }, { w: 'стіл', kind: 'noun' }, { w: 'земля', kind: 'noun' },
    { w: 'ніч', kind: 'noun' }, { w: 'море', kind: 'noun' }, { w: 'сонце', kind: 'noun' },
    { w: 'дитина', kind: 'noun' }, { w: 'дерево', kind: 'noun' }, { w: 'квітка', kind: 'noun' },
    { w: 'учитель', kind: 'noun' }, { w: 'калина', kind: 'noun' }, { w: 'пісня', kind: 'noun' },
    { w: 'вітер', kind: 'noun' }, { w: 'дорога', kind: 'noun' }, { w: 'серце', kind: 'noun' },
    { w: 'родина', kind: 'noun' }, { w: 'зошит', kind: 'noun' }, { w: 'молоко', kind: 'noun' },
    { w: 'школа', kind: 'noun' }, { w: 'місто', kind: 'noun' },

    // Прикметники
    { w: 'весняний', kind: 'adj' }, { w: 'синій', kind: 'adj' }, { w: 'новий', kind: 'adj' },
    { w: 'солодкий', kind: 'adj' }, { w: 'дерев’яний', kind: 'adj' }, { w: 'гарний', kind: 'adj' },
    { w: 'швидкий', kind: 'adj' }, { w: 'тихий', kind: 'adj' }, { w: 'сміливий', kind: 'adj' },
    { w: 'теплий', kind: 'adj' }, { w: 'золотий', kind: 'adj' }, { w: 'розумний', kind: 'adj' },
    { w: 'високий', kind: 'adj' }, { w: 'радісний', kind: 'adj' }, { w: 'добрий', kind: 'adj' },

    // Числівники
    { w: 'п’ять', kind: 'num' }, { w: 'третій', kind: 'num' }, { w: 'двоє', kind: 'num' },
    { w: 'сто', kind: 'num' }, { w: 'двадцять', kind: 'num' }, { w: 'сьомий', kind: 'num' },
    { w: 'п’ятдесят', kind: 'num' }, { w: 'сорок', kind: 'num' }, { w: 'перший', kind: 'num' },

    // Займенники
    { w: 'я', kind: 'pron' }, { w: 'ти', kind: 'pron' }, { w: 'він', kind: 'pron' },
    { w: 'вона', kind: 'pron' }, { w: 'ми', kind: 'pron' }, { w: 'вони', kind: 'pron' },
    { w: 'хтось', kind: 'pron' }, { w: 'мій', kind: 'pron' }, { w: 'ніхто', kind: 'pron' }
  ];

  // Частини мови, які можна «ловити». Решта слів — хибні цілі, їх чіпати не можна.
  const TARGETS = {
    noun: { label: 'Іменники', hint: 'Збивай лише ІМЕННИКИ — слова, що відповідають на питання хто? що?' },
    adj: { label: 'Прикметники', hint: 'Збивай лише ПРИКМЕТНИКИ — слова, що відповідають на питання який? яка? яке?' },
    num: { label: 'Числівники', hint: 'Збивай лише ЧИСЛІВНИКИ — слова, що означають кількість або порядок.' },
    pron: { label: 'Займенники', hint: 'Збивай лише ЗАЙМЕННИКИ — слова, що вказують на предмет, але не називають його.' }
  };

  const DECOYS = ['adj', 'num', 'pron', 'noun'];
  const HUD_HEIGHT = 54;
  const STAR_COUNT = 70;

  // ---------- Стан гри ----------
  const game = {
    canvas: null, ctx: null,
    running: false, paused: false, rafId: 0, lastTs: 0,
    width: 0, height: 0, dpr: 1,
    targetKind: 'noun',
    words: [], shots: [], particles: [], stars: [],
    ship: { x: 0, y: 0, vx: 0, cooldown: 0, invuln: 0 },
    input: { left: false, right: false },
    pointer: { active: false, x: 0 },
    score: 0, lives: 3, hits: 0, misses: 0, wrongHits: 0,
    streak: 0, maxStreak: 0, level: 1,
    spawnTimer: 0, spawnInterval: 1.15,
    elapsed: 0,
    dom: {}
  };

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // ---------- Побудова DOM ----------
  function buildDom() {
    const canvas = game.canvas;
    const stage = canvas.parentElement;
    const hud = document.createElement('div');
    hud.className = 'sg-hud';
    hud.innerHTML =
      '<div class="sg-hud-item"><span class="sg-hud-label">Рахунок</span><b id="sgScore">0</b></div>' +
      '<div class="sg-hud-item sg-hud-target"><span class="sg-hud-label">Ціль</span><b id="sgTarget">Іменники</b></div>' +
      '<div class="sg-hud-item"><span class="sg-hud-label">Життя</span><b id="sgLives">❤❤❤</b></div>';
    stage.appendChild(hud);

    const overlay = document.createElement('div');
    overlay.className = 'sg-overlay';
    overlay.id = 'sgOverlay';
    overlay.innerHTML =
      '<div class="sg-panel">' +
        '<h3 class="sg-panel-title" id="sgPanelTitle">Космічний мисливець</h3>' +
        '<p class="sg-panel-text" id="sgPanelText">Збивай українські слова потрібної частини мови, поки вони не долетіли до корабля.</p>' +
        '<div class="sg-panel-actions" id="sgPanelActions"></div>' +
      '</div>';
    stage.appendChild(overlay);

    const pauseBtn = document.createElement('button');
    pauseBtn.className = 'sg-pause';
    pauseBtn.type = 'button';
    pauseBtn.textContent = '⏸';
    pauseBtn.setAttribute('aria-label', 'Пауза');
    pauseBtn.addEventListener('click', togglePause);
    stage.appendChild(pauseBtn);

    game.dom = {
      stage,
      hud,
      score: hud.querySelector('#sgScore'),
      target: hud.querySelector('#sgTarget'),
      lives: hud.querySelector('#sgLives'),
      overlay,
      panelTitle: overlay.querySelector('#sgPanelTitle'),
      panelText: overlay.querySelector('#sgPanelText'),
      panelActions: overlay.querySelector('#sgPanelActions'),
      pauseBtn
    };
  }

  // ---------- Канвас ----------
  function resize() {
    const canvas = game.canvas;
    const rect = canvas.parentElement.getBoundingClientRect();
    const width = Math.max(260, Math.round(rect.width));
    const height = Math.max(320, Math.round(rect.height));
    game.dpr = Math.min(window.devicePixelRatio || 1, 2);
    game.width = width;
    game.height = height;
    canvas.width = Math.round(width * game.dpr);
    canvas.height = Math.round(height * game.dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    game.ctx.setTransform(game.dpr, 0, 0, game.dpr, 0, 0);
    game.ship.y = height - 54;
    if (!game.ship.x) game.ship.x = width / 2;
    game.ship.x = Math.min(Math.max(game.ship.x, 26), width - 26);
    buildStars();
  }

  function buildStars() {
    game.stars = Array.from({ length: STAR_COUNT }, () => ({
      x: rand(0, game.width),
      y: rand(0, game.height),
      r: rand(0.5, 1.8),
      s: rand(6, 26)
    }));
  }

  // ---------- Цикл гри ----------
  function start(kind) {
    game.targetKind = kind || game.targetKind;
    game.words = []; game.shots = []; game.particles = [];
    game.score = 0; game.lives = 3; game.hits = 0; game.misses = 0; game.wrongHits = 0;
    game.streak = 0; game.maxStreak = 0; game.level = 1;
    game.spawnTimer = 0; game.spawnInterval = 1.15; game.elapsed = 0;
    game.ship.x = game.width / 2; game.ship.cooldown = 0; game.ship.invuln = 0;
    game.paused = false; game.running = true;
    game.lastTs = 0;
    hideOverlay();
    updateHud();
    if (!game.rafId) game.rafId = requestAnimationFrame(loop);
  }

  function loop(ts) {
    if (!game.running) { game.rafId = 0; return; }
    // Якщо гравець пішов з екрана гри — зупиняємо цикл, щоб не витрачати ресурси.
    if (game.canvas.offsetParent === null) { stopGame(); return; }
    if (!game.lastTs) game.lastTs = ts;
    let dt = (ts - game.lastTs) / 1000;
    game.lastTs = ts;
    if (dt > 0.05) dt = 0.05; // захист від стрибків після згортання вкладки
    if (!game.paused) update(dt);
    render();
    game.rafId = requestAnimationFrame(loop);
  }

  function stopGame() {
    game.running = false;
    if (game.rafId) { cancelAnimationFrame(game.rafId); game.rafId = 0; }
    hideOverlay();
  }

  function update(dt) {
    game.elapsed += dt;
    // Рівень зростає кожні 20 секунд: слова падають частіше й швидше.
    game.level = 1 + Math.floor(game.elapsed / 20);
    game.spawnInterval = Math.max(0.55, 1.15 - (game.level - 1) * 0.09);

    // Керування кораблем: клавіші або перетягування пальцем.
    if (game.pointer.active) {
      game.ship.x += (game.pointer.x - game.ship.x) * Math.min(1, dt * 14);
    } else {
      const dir = (game.input.right ? 1 : 0) - (game.input.left ? 1 : 0);
      game.ship.x += dir * 420 * dt;
    }
    game.ship.x = Math.min(Math.max(game.ship.x, 26), game.width - 26);
    if (game.ship.cooldown > 0) game.ship.cooldown -= dt;
    if (game.ship.invuln > 0) game.ship.invuln -= dt;

    // Спавн нових слів
    game.spawnTimer -= dt;
    if (game.spawnTimer <= 0) {
      game.spawnTimer = game.spawnInterval * rand(0.8, 1.2);
      spawnWord();
    }

    // Падіння слів
    for (let i = game.words.length - 1; i >= 0; i--) {
      const word = game.words[i];
      word.y += word.speed * dt;
      if (word.y >= game.ship.y - 18) {
        if (word.kind === game.targetKind) {
          // Пропущена правильна ціль — втрачаємо життя.
          game.misses++;
          game.streak = 0;
          game.lives--;
          spawnParticles(word.x, word.y, '#ff5b6f', 14);
          updateHud();
          if (game.lives <= 0) { gameOver(); return; }
        }
        game.words.splice(i, 1);
      }
    }

    // Постріли
    for (let i = game.shots.length - 1; i >= 0; i--) {
      const shot = game.shots[i];
      shot.y -= 620 * dt;
      if (shot.y < -20) { game.shots.splice(i, 1); continue; }
      for (let j = game.words.length - 1; j >= 0; j--) {
        const word = game.words[j];
        if (Math.abs(shot.x - word.x) < word.w / 2 + 4 && Math.abs(shot.y - word.y) < 18) {
          hitWord(word, j);
          game.shots.splice(i, 1);
          break;
        }
      }
    }

    // Частинки
    for (let i = game.particles.length - 1; i >= 0; i--) {
      const p = game.particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += 240 * dt;
      p.life -= dt;
      if (p.life <= 0) game.particles.splice(i, 1);
    }

    // Зірки тла
    for (const star of game.stars) {
      star.y += star.s * dt;
      if (star.y > game.height) { star.y = 0; star.x = rand(0, game.width); }
    }
  }

  function spawnWord() {
    // Приблизно половина слів — цілі, решта — «пастки».
    const wantTarget = Math.random() < 0.5;
    let kind = game.targetKind;
    if (!wantTarget) {
      const options = DECOYS.filter(k => k !== game.targetKind);
      kind = pick(options);
    }
    const source = WORD_BANK.filter(item => item.kind === kind);
    const entry = pick(source);
    const ctx = game.ctx;
    ctx.font = '800 19px "Segoe UI", system-ui, sans-serif';
    const w = ctx.measureText(entry.w).width + 24;
    game.words.push({
      text: entry.w,
      kind: entry.kind,
      x: rand(w / 2 + 8, game.width - w / 2 - 8),
      y: -20,
      w: w,
      h: 34,
      speed: (46 + game.level * 9) * rand(0.85, 1.2)
    });
  }

  function hitWord(word, index) {
    const correct = word.kind === game.targetKind;
    if (correct) {
      game.hits++;
      game.streak++;
      if (game.streak > game.maxStreak) game.maxStreak = game.streak;
      const points = 20 + Math.min(game.streak, 10) * 2;
      game.score += points;
      spawnParticles(word.x, word.y, '#46dc91', 16);
      showFloating(word.x, word.y, '+' + points, '#46dc91');
    } else {
      // Влучання в зайве слово знімає життя, а не лише бали.
      game.wrongHits++;
      game.streak = 0;
      game.score = Math.max(0, game.score - 50);
      game.lives--;
      spawnParticles(word.x, word.y, '#ff5b6f', 16);
      showFloating(word.x, word.y, '−50 ❤', '#ff5b6f');
    }
    game.words.splice(index, 1);
    updateHud();
    if (game.lives <= 0) gameOver();
  }

  function shoot() {
    if (!game.running || game.paused) return;
    if (game.ship.cooldown > 0) return;
    game.ship.cooldown = 0.16;
    game.shots.push({ x: game.ship.x, y: game.ship.y - 20 });
  }

  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      game.particles.push({
        x, y,
        vx: rand(-140, 140), vy: rand(-160, 40),
        life: rand(0.3, 0.7), color, r: rand(1.5, 3.5)
      });
    }
  }

  function showFloating(x, y, text, color) {
    game.particles.push({ float: true, x, y, text, color, life: 0.9, vy: -46 });
  }

  // ---------- Малювання ----------
  function render() {
    const ctx = game.ctx;
    ctx.clearRect(0, 0, game.width, game.height);

    // Тло: темний космос із градієнтом
    const grad = ctx.createLinearGradient(0, 0, 0, game.height);
    grad.addColorStop(0, '#0b0a24');
    grad.addColorStop(1, '#161a3d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, game.width, game.height);

    ctx.fillStyle = 'rgba(255,255,255,.75)';
    for (const star of game.stars) {
      ctx.globalAlpha = 0.35 + (star.r / 1.8) * 0.6;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Усі слова виглядають однаково — підказок немає.
    for (const word of game.words) {
      ctx.font = '800 19px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const x = word.x, y = word.y, w = word.w, h = word.h;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') ctx.roundRect(x - w / 2, y - h / 2, w, h, 12);
      else ctx.rect(x - w / 2, y - h / 2, w, h);
      ctx.fillStyle = 'rgba(30,28,66,.92)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,255,255,.35)';
      ctx.stroke();
      ctx.fillStyle = '#f4f1ff';
      ctx.fillText(word.text, x, y + 1);
    }

    // Постріли
    ctx.fillStyle = '#8ff0c0';
    for (const shot of game.shots) {
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(shot.x - 1, shot.y, 2, 12);
    }

    // Частинки та спливаючі бали
    for (const p of game.particles) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.6));
      if (p.float) {
        ctx.fillStyle = p.color;
        ctx.font = '800 15px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    drawShip();
  }

  function drawShip() {
    const ctx = game.ctx;
    const x = game.ship.x, y = game.ship.y;
    if (game.ship.invuln > 0 && Math.floor(game.ship.invuln * 10) % 2 === 0) return;
    ctx.save();
    ctx.translate(x, y);
    // Полум'я двигуна
    const flame = 10 + Math.random() * 8;
    const fg = ctx.createLinearGradient(0, 14, 0, 14 + flame);
    fg.addColorStop(0, 'rgba(255,210,90,.95)');
    fg.addColorStop(1, 'rgba(255,90,60,0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(-6, 14); ctx.lineTo(0, 14 + flame); ctx.lineTo(6, 14);
    ctx.closePath(); ctx.fill();
    // Корпус
    ctx.beginPath();
    ctx.moveTo(0, -20); ctx.lineTo(16, 14); ctx.lineTo(0, 7); ctx.lineTo(-16, 14);
    ctx.closePath();
    ctx.fillStyle = '#c9d6ff';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#7f9dff';
    ctx.stroke();
    // Кабіна
    ctx.beginPath();
    ctx.arc(0, -3, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#4ee69b';
    ctx.fill();
    ctx.restore();
  }

  // ---------- HUD та оверлеї ----------
  function updateHud() {
    const dom = game.dom;
    if (!dom.score) return;
    dom.score.textContent = game.score;
    dom.target.textContent = TARGETS[game.targetKind].label;
    dom.lives.textContent = '❤'.repeat(Math.max(0, game.lives)) || '—';
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
    game.running = false;
    if (game.rafId) { cancelAnimationFrame(game.rafId); game.rafId = 0; }
    const buttons = Object.keys(TARGETS).map(kind => ({
      label: TARGETS[kind].label,
      className: kind === game.targetKind ? 'green' : '',
      onClick: () => start(kind)
    }));
    showOverlay(
      '🚀 Космічний мисливець',
      'Обери, які слова ловити. Рухай корабель пальцем, а щоб вистрелити — тапни по кораблю. На клавіатурі: стрілки — рух, пробіл — постріл.',
      buttons
    );
  }

  function gameOver() {
    game.running = false;
    if (game.rafId) { cancelAnimationFrame(game.rafId); game.rafId = 0; }
    // Нагорода за гру: 1 ₴ за кожні 10 очок.
    game.reward = Math.floor(game.score / 10);
    saveResult();
    const total = game.hits + game.wrongHits;
    const accuracy = total > 0 ? Math.round((game.hits / total) * 100) : 0;
    showOverlay(
      'Гру завершено',
      `Рахунок: ${game.score} · Нагорода: +${game.reward} ₴ · Влучань: ${game.hits} · Помилок: ${game.wrongHits} · Точність: ${accuracy}% · Серія: ${game.maxStreak}`,
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
      hits: game.hits,
      wrongHits: game.wrongHits,
      misses: game.misses,
      maxStreak: game.maxStreak,
      level: game.level,
      date: new Date().toISOString()
    };
    if (!user.games) user.games = {};
    user.games.space = record;
    if (typeof save === 'function') save();
    const monEl = document.getElementById('mon');
    if (monEl) monEl.innerText = user.points.toLocaleString();
  }

  function togglePause() {
    if (!game.running) return;
    game.paused = !game.paused;
    if (game.dom.pauseBtn) game.dom.pauseBtn.textContent = game.paused ? '▶' : '⏸';
    if (game.paused) {
      showOverlay('Пауза', 'Гра зупинена. Продовж, коли будеш готовий.', [
        { label: '▶ Продовжити', className: 'green', onClick: togglePause }
      ]);
    } else {
      hideOverlay();
    }
  }

  // ---------- Ввід ----------
  function onPointerDown(e) {
    if (!game.running || game.paused) return;
    const rect = game.canvas.getBoundingClientRect();
    const clientX = e.clientX !== undefined ? e.clientX : e.touches[0].clientX;
    const clientY = e.clientY !== undefined ? e.clientY : e.touches[0].clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    game.pointer.active = true;
    game.pointer.x = x;
    // Стріляємо лише коли натиснули на сам корабель — решта жестів рухає його.
    if (Math.abs(x - game.ship.x) < 30 && Math.abs(y - game.ship.y) < 34) {
      shoot();
    }
  }
  function onPointerMove(e) {
    if (!game.pointer.active) return;
    const rect = game.canvas.getBoundingClientRect();
    game.pointer.x = (e.clientX !== undefined ? e.clientX : e.touches[0].clientX) - rect.left;
  }
  function onPointerUp() { game.pointer.active = false; }

  function onKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') game.input.left = true;
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') game.input.right = true;
    else if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); shoot(); }
    else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') togglePause();
  }
  function onKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') game.input.left = false;
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') game.input.right = false;
  }

  // ---------- Публічний API ----------
  window.openSpaceGame = function () {
    if (typeof show === 'function') show('space-game');
    if (!game.canvas) {
      game.canvas = document.getElementById('spaceCanvas');
      if (!game.canvas) return;
      game.ctx = game.canvas.getContext('2d');
      buildDom();
      bindInput();
      window.addEventListener('resize', resize);
      resize();
    }
    startScreen();
  };

  function bindInput() {
    const canvas = game.canvas;
    canvas.addEventListener('mousedown', onPointerDown);
    canvas.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    canvas.addEventListener('touchstart', onPointerDown, { passive: true });
    canvas.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
  }

  // Зупиняємо цикл, коли гравець виходить з екрана гри — щоб не палити CPU у фоні.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && game.running && !game.paused) togglePause();
  });
})();
