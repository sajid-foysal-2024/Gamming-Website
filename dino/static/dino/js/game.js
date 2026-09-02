// ===== Dino Run — vanilla JS Chrome-dino-style game =====

// These are set in dino.html BEFORE this script loads, e.g.:
//   <script>
//     const IMAGE_BASE = "{% static 'dino/images/' %}";
//     const AUDIO_BASE = "{% static 'dino/audio/' %}";
//   </script>
//   <script src="{% static 'dino/js/game.js' %}"></script>
//
// If they aren't defined (e.g. opening this as plain HTML/CSS/JS with no Django),
// fall back to simple relative folders so the game still runs.
const IMG_BASE = typeof IMAGE_BASE !== 'undefined' ? IMAGE_BASE : 'images/';
const SND_BASE = typeof AUDIO_BASE !== 'undefined' ? AUDIO_BASE : 'audio/';

const gameContainer = document.getElementById('gameContainer');
const dino = document.getElementById('dino');
const ground = document.getElementById('ground');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const gameOverPanel = document.getElementById('gameOverPanel');
const restartBtn = document.getElementById('restartBtn');
const startMessage = document.getElementById('startMessage');
const clouds = [document.getElementById('cloud1'), document.getElementById('cloud2'), document.getElementById('cloud3')];

const DINO_IMAGES = {
  run1: IMG_BASE + 'dinosaur-run1.png',
  run2: IMG_BASE + 'dinosaur-run2.png',
  jump: IMG_BASE + 'dinosaur-jump.png',
  dead: IMG_BASE + 'dinosaur-dead.png',
};

const sounds = {
  jump: new Audio(SND_BASE + 'jump.wav'),
  point: new Audio(SND_BASE + 'point.wav'),
  gameOver: new Audio(SND_BASE + 'gameover.wav'),
  button: new Audio(SND_BASE + 'button-press.wav'),
};
Object.values(sounds).forEach(a => { a.volume = 0.5; });

function playSound(sound) {
  // clone so rapid repeats (e.g. fast jumps) don't cut each other off
  const s = sound.cloneNode();
  s.volume = sound.volume;
  s.play().catch(() => { /* ignore autoplay-blocked errors before first interaction */ });
}

const OBSTACLE_TYPES = [
  { img: IMG_BASE + 'cactus-small.png', width: 100,  height: 100,  type: 'ground' },
  { img: IMG_BASE + 'cactus-big.png',   width: 150,  height: 150,  type: 'ground' },
  { img: IMG_BASE + 'bird1.png',        width: 100,  height: 100,  type: 'air', altBottom: 77 },
];

const GROUND_HEIGHT = 40;
const GRAVITY = 0.0025;      // px per ms^2
const JUMP_VELOCITY = -1.4;  // px per ms
const DINO_BOTTOM_REST = 40;

let containerWidth = gameContainer.clientWidth;

let state = {
  running: false,
  gameOver: false,
  speed: 0.32,          // px per ms, increases over time
  score: 0,
  highScore: Number(localStorage.getItem('dinoHighScore') || 0),
  lastTime: null,
  obstacles: [],
  nextObstacleIn: 0,
  dinoY: 0,             // offset above rest position
  dinoVelocity: 0,
  isJumping: false,
  isDucking: false,
  runFrame: 0,
  runFrameTimer: 0,
  night: false,
  distanceSinceNight: 0,
};

highScoreEl.textContent = 'HI ' + String(state.highScore).padStart(5, '0');

function resetState() {
  state.running = true;
  state.gameOver = false;
  state.speed = 0.45;
  state.score = 0;
  state.lastTime = null;
  state.obstacles.forEach(o => o.el.remove());
  state.obstacles = [];
  state.nextObstacleIn = randomBetween(700, 1500);
  state.dinoY = 0;
  state.dinoVelocity = 0;
  state.isJumping = false;
  state.runFrame = 0;
  state.runFrameTimer = 0;
  state.night = false;
  state.distanceSinceNight = 0;
  gameContainer.classList.remove('night');
  dino.src = DINO_IMAGES.run1;
  dino.style.bottom = DINO_BOTTOM_REST + 'px';
  gameOverPanel.classList.remove('visible');
  scoreEl.textContent = '00000';
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function spawnObstacle() {
  const def = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
  const el = document.createElement('img');
  el.src = def.img;
  el.className = 'obstacle';
  el.style.width = def.width + 'px';
  el.style.height = def.height + 'px';
  el.style.left = containerWidth + 'px';
  el.style.bottom = (def.type === 'air' ? def.altBottom : DINO_BOTTOM_REST) + 'px';
  gameContainer.appendChild(el);

  state.obstacles.push({
    el,
    x: containerWidth,
    width: def.width,
    height: def.height,
    bottom: def.type === 'air' ? def.altBottom : DINO_BOTTOM_REST,
    passed: false,
    isBird: def.type === 'air',
    birdFrame: 0,
    birdTimer: 0,
    imgA: IMG_BASE + 'bird1.png',
    imgB: IMG_BASE + 'bird2.png',
  });
}

function updateGround(dx) {
  const currentLeft = parseFloat(ground.style.backgroundPositionX || '0');
  ground.style.backgroundPositionX = (currentLeft - dx) + 'px';
}

function updateClouds(dx) {
  clouds.forEach(cloud => {
    let left = parseFloat(cloud.style.left || cloud.offsetLeft);
    left -= dx * 0.25;
    if (left < -60) {
      left = containerWidth + randomBetween(0, 200);
      cloud.style.top = randomBetween(10, 80) + 'px';
    }
    cloud.style.left = left + 'px';
  });
}

function initClouds() {
  clouds.forEach((cloud, i) => {
    cloud.style.left = (containerWidth * 0.3 * (i + 1)) + 'px';
    cloud.style.top = randomBetween(10, 80) + 'px';
  });
}

function jump() {
  if (state.isJumping || !state.running || state.gameOver) return;
  state.isJumping = true;
  state.dinoVelocity = JUMP_VELOCITY;
  dino.classList.add('jumping');
  dino.src = DINO_IMAGES.jump;
  playSound(sounds.jump);
}

function endGame() {
  state.running = false;
  state.gameOver = true;
  dino.src = DINO_IMAGES.dead;
  gameOverPanel.classList.add('visible');
  playSound(sounds.gameOver);
  if (state.score > state.highScore) {
    state.highScore = state.score;
    localStorage.setItem('dinoHighScore', String(state.highScore));
    highScoreEl.textContent = 'HI ' + String(state.highScore).padStart(5, '0');
  }
}

function rectsOverlap(a, b) {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

function checkCollisions() {
  const dinoRect = dino.getBoundingClientRect();
  // shrink hitbox slightly for fairness
  const pad = 6;
  const dinoBox = {
    left: dinoRect.left + pad,
    right: dinoRect.right - pad,
    top: dinoRect.top + pad,
    bottom: dinoRect.bottom - pad,
  };

  for (const obs of state.obstacles) {
    const r = obs.el.getBoundingClientRect();
    const obsBox = { left: r.left + 3, right: r.right - 3, top: r.top + 3, bottom: r.bottom - 3 };
    if (rectsOverlap(dinoBox, obsBox)) {
      endGame();
      return;
    }
  }
}

function loop(timestamp) {
  if (!state.running) return;
  if (state.lastTime === null) state.lastTime = timestamp;
  const dt = Math.min(timestamp - state.lastTime, 40); // clamp for tab-switch lag
  state.lastTime = timestamp;

  const dx = state.speed * dt;

  // ground scroll
  updateGround(dx);
  updateClouds(dx);

  // dino physics
  if (state.isJumping) {
    state.dinoVelocity += GRAVITY * dt;
    state.dinoY -= state.dinoVelocity * dt;
    if (state.dinoY <= 0) {
      state.dinoY = 0;
      state.isJumping = false;
      dino.classList.remove('jumping');
      dino.src = DINO_IMAGES.run1;
    }
    dino.style.bottom = (DINO_BOTTOM_REST + state.dinoY) + 'px';
  } else {
    // running animation
    state.runFrameTimer += dt;
    if (state.runFrameTimer > 110) {
      state.runFrameTimer = 0;
      state.runFrame = state.runFrame === 0 ? 1 : 0;
      dino.src = state.runFrame === 0 ? DINO_IMAGES.run1 : DINO_IMAGES.run2;
    }
  }

  // obstacles movement
  for (let i = state.obstacles.length - 1; i >= 0; i--) {
    const obs = state.obstacles[i];
    obs.x -= dx;
    obs.el.style.left = obs.x + 'px';

    if (obs.isBird) {
      obs.birdTimer += dt;
      if (obs.birdTimer > 200) {
        obs.birdTimer = 0;
        obs.birdFrame = obs.birdFrame === 0 ? 1 : 0;
        obs.el.src = obs.birdFrame === 0 ? obs.imgA : obs.imgB;
      }
    }

    if (obs.x + obs.width < 0) {
      obs.el.remove();
      state.obstacles.splice(i, 1);
      continue;
    }

    if (!obs.passed && obs.x + obs.width < 40) {
      obs.passed = true;
    }
  }

  // spawn new obstacles
  state.nextObstacleIn -= dt;
  if (state.nextObstacleIn <= 0) {
    spawnObstacle();
    const gapShrink = Math.max(0, (state.speed - 0.32) * 400);
    state.nextObstacleIn = randomBetween(900, 1600) - gapShrink;
  }

  // score & speed ramp
  const prevMilestone = Math.floor(state.score / 100);
  state.score += dt * 0.01;
  const newMilestone = Math.floor(state.score / 100);
  if (newMilestone > prevMilestone) {
    playSound(sounds.point);
  }
  scoreEl.textContent = String(Math.floor(state.score)).padStart(5, '0');
  state.speed += dt * 0.0000025;

  // day/night cycle every ~700 score points
  state.distanceSinceNight += dt * 0.01;
  if (state.distanceSinceNight > 700) {
    state.distanceSinceNight = 0;
    state.night = !state.night;
    gameContainer.classList.toggle('night', state.night);
  }

  checkCollisions();

  if (state.running) requestAnimationFrame(loop);
}

function startGame() {
  if (state.running) return;
  playSound(sounds.button);
  startMessage.classList.add('hidden');
  resetState();
  requestAnimationFrame(loop);
}

function handleActionKey(e) {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    if (state.gameOver) {
      startGame();
    } else if (!state.running) {
      startGame();
    } else {
      jump();
    }
  }
}

document.addEventListener('keydown', handleActionKey);

gameContainer.addEventListener('click', () => {
  if (state.gameOver || !state.running) {
    startGame();
  } else {
    jump();
  }
});

restartBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  startGame();
});

window.addEventListener('resize', () => {
  containerWidth = gameContainer.clientWidth;
});

// initial idle setup
initClouds();
dino.src = DINO_IMAGES.run1;