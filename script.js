const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("bestScore");
const startBtn = document.getElementById("startBtn");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

let player;
let meteors;
let stars;
let keys;
let score;
let bestScore = Number(localStorage.getItem("bestScore_D1114182036")) || 0;
let gameRunning = false;
let animationId;
let spawnTimer;
let lastTime;

bestScoreEl.textContent = bestScore;

function resetGame() {
  player = {
    x: canvas.width / 2 - 22,
    y: canvas.height - 78,
    width: 44,
    height: 54,
    speed: 5
  };

  meteors = [];
  stars = Array.from({ length: 70 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 0.5,
    speed: Math.random() * 1.4 + 0.4
  }));

  keys = {};
  score = 0;
  spawnTimer = 0;
  lastTime = performance.now();
  scoreEl.textContent = score;
}

function startGame() {
  cancelAnimationFrame(animationId);
  resetGame();
  gameRunning = true;
  startBtn.textContent = "重新開始";
  gameLoop(performance.now());
}

function endGame() {
  gameRunning = false;
  cancelAnimationFrame(animationId);

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("bestScore_D1114182036", bestScore);
    bestScoreEl.textContent = bestScore;
  }

  drawOverlay("遊戲結束", "按「重新開始」再玩一次");
}

function drawPlayer() {
  const x = player.x;
  const y = player.y;

  ctx.save();
  ctx.shadowColor = "#70e0ff";
  ctx.shadowBlur = 18;

  ctx.fillStyle = "#7df9ff";
  ctx.beginPath();
  ctx.moveTo(x + player.width / 2, y);
  ctx.lineTo(x + player.width, y + player.height);
  ctx.lineTo(x + player.width / 2, y + player.height - 12);
  ctx.lineTo(x, y + player.height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x + player.width / 2, y + 22, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawMeteor(meteor) {
  ctx.save();
  ctx.translate(meteor.x, meteor.y);
  ctx.rotate(meteor.angle);

  ctx.fillStyle = "#ff9566";
  ctx.shadowColor = "#ff5d3d";
  ctx.shadowBlur = 12;

  ctx.beginPath();
  ctx.arc(0, 0, meteor.size, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  ctx.beginPath();
  ctx.arc(-meteor.size * 0.25, -meteor.size * 0.25, meteor.size * 0.28, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawStars() {
  ctx.fillStyle = "#ffffff";
  for (const star of stars) {
    ctx.globalAlpha = 0.4 + Math.random() * 0.6;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();

    star.y += star.speed;
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }
  }
  ctx.globalAlpha = 1;
}

function spawnMeteor() {
  const size = Math.random() * 16 + 16;
  meteors.push({
    x: Math.random() * (canvas.width - size * 2) + size,
    y: -size,
    size,
    speed: Math.random() * 2.2 + 2.8 + score * 0.004,
    angle: Math.random() * Math.PI,
    rotateSpeed: (Math.random() - 0.5) * 0.08
  });
}

function updatePlayer() {
  if ((keys.ArrowLeft || keys.a || keys.A) && player.x > 0) {
    player.x -= player.speed;
  }

  if ((keys.ArrowRight || keys.d || keys.D) && player.x + player.width < canvas.width) {
    player.x += player.speed;
  }
}

function updateMeteors() {
  for (const meteor of meteors) {
    meteor.y += meteor.speed;
    meteor.angle += meteor.rotateSpeed;
  }

  meteors = meteors.filter(meteor => meteor.y - meteor.size < canvas.height);
}

function isColliding(meteor) {
  const closestX = Math.max(player.x, Math.min(meteor.x, player.x + player.width));
  const closestY = Math.max(player.y, Math.min(meteor.y, player.y + player.height));
  const dx = meteor.x - closestX;
  const dy = meteor.y - closestY;
  return dx * dx + dy * dy < meteor.size * meteor.size;
}

function drawOverlay(title, subtitle) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "bold 42px Microsoft JhengHei";
  ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 20);

  ctx.font = "20px Microsoft JhengHei";
  ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 24);
}

function gameLoop(now) {
  if (!gameRunning) return;

  const delta = now - lastTime;
  lastTime = now;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStars();

  updatePlayer();
  updateMeteors();

  spawnTimer += delta;
  const spawnInterval = Math.max(360, 950 - score * 2);
  if (spawnTimer > spawnInterval) {
    spawnMeteor();
    spawnTimer = 0;
  }

  for (const meteor of meteors) {
    drawMeteor(meteor);
    if (isColliding(meteor)) {
      endGame();
      return;
    }
  }

  drawPlayer();

  score += Math.floor(delta / 16);
  scoreEl.textContent = score;

  animationId = requestAnimationFrame(gameLoop);
}

startBtn.addEventListener("click", startGame);

window.addEventListener("keydown", event => {
  keys[event.key] = true;
});

window.addEventListener("keyup", event => {
  keys[event.key] = false;
});

function holdButton(button, directionKey) {
  button.addEventListener("touchstart", event => {
    event.preventDefault();
    keys[directionKey] = true;
  });

  button.addEventListener("touchend", event => {
    event.preventDefault();
    keys[directionKey] = false;
  });

  button.addEventListener("mousedown", () => {
    keys[directionKey] = true;
  });

  button.addEventListener("mouseup", () => {
    keys[directionKey] = false;
  });

  button.addEventListener("mouseleave", () => {
    keys[directionKey] = false;
  });
}

holdButton(leftBtn, "ArrowLeft");
holdButton(rightBtn, "ArrowRight");

resetGame();
drawOverlay("星際閃避", "按「開始遊戲」開始");
