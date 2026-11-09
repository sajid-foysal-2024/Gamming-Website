const foodSound = new Audio(STATIC_AUDIO_PATH + 'food.mp3');
const gameOverSound = new Audio(STATIC_AUDIO_PATH + 'gameover.mp3');
const moveSound = new Audio(STATIC_AUDIO_PATH + 'move.mp3');

const board = document.getElementById('board');
const scoreBox = document.getElementById('scoreBox');
const highScoreBox = document.getElementById('highScoreBox');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');

const GRID_SIZE = 18; // must match grid-template-rows/columns in style.css
const START_SNAKE = [
    { x: 13, y: 15 },
    { x: 13, y: 16 },
    { x: 13, y: 17 }
];

let score = 0;
let speed = 7;
let lastPaintTime = 0;
let snakeArr = START_SNAKE.map(part => ({ ...part }));
let food = { x: 6, y: 7 };
let inputDir = { x: 0, y: 0 };
let lastMoveDir = { x: 0, y: -1 };
let facingLeft = false;
let gameOver = false;

function playSound(sound) {
    sound.currentTime = 0;
    // browsers block audio until the first key press; ignore that error
    sound.play().catch(() => {});
}

// game function
function main(ctime) {
    window.requestAnimationFrame(main);

    if ((ctime - lastPaintTime) / 1000 < 1 / speed) {
        return;
    }

    lastPaintTime = ctime;
    gameEngine();
}

function isCollide(snakeArr) {

    // if snake collides with itself
    for (let i = 1; i < snakeArr.length; i++) {
        if (
            snakeArr[i].x === snakeArr[0].x &&
            snakeArr[i].y === snakeArr[0].y
        ) {
            return true;
        }
    }

    // if snake hits the wall (grid cells are 1..GRID_SIZE)
    return (
        snakeArr[0].x > GRID_SIZE ||
        snakeArr[0].x < 1 ||
        snakeArr[0].y > GRID_SIZE ||
        snakeArr[0].y < 1
    );
}

function randomFood() {
    let a = 2;
    let b = 16;
    let newFood;

    // don't place food on top of the snake
    do {
        newFood = {
            x: Math.round(a + (b - a) * Math.random()),
            y: Math.round(a + (b - a) * Math.random())
        };
    } while (snakeArr.some(part => part.x === newFood.x && part.y === newFood.y));

    return newFood;
}

function showOverlay(title, text) {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    overlay.classList.remove('hidden');
}

function endGame() {
    playSound(gameOverSound);
    gameOver = true;
    inputDir = { x: 0, y: 0 };
    showOverlay('Game Over!', 'তোমার score: ' + score + ' — আবার খেলতে arrow key চাপো');
}

function resetGame() {
    snakeArr = START_SNAKE.map(part => ({ ...part }));
    food = randomFood();
    score = 0;
    speed = 7;
    lastMoveDir = { x: 0, y: -1 };
    facingLeft = false;
    gameOver = false;
    scoreBox.innerHTML = "Score: " + score;
}

// game engine
function gameEngine() {

    // waiting for the first key press, just draw the board
    if (inputDir.x === 0 && inputDir.y === 0) {
        draw();
        return;
    }

    // Moving the snake
    for (let i = snakeArr.length - 2; i >= 0; i--) {
        snakeArr[i + 1] = { ...snakeArr[i] };
    }

    snakeArr[0].x += inputDir.x;
    snakeArr[0].y += inputDir.y;
    lastMoveDir = { ...inputDir };

    if (isCollide(snakeArr)) {
        endGame();
        return;
    }

    // if you have eaten the food, increment score, grow and regenerate food
    if (snakeArr[0].y === food.y && snakeArr[0].x === food.x) {

        playSound(foodSound);
        score += 1;

        // a little faster every 5 points
        if (score % 5 === 0) {
            speed += 1;
        }

        if (score > highScoreVal) {
            highScoreVal = score;
            localStorage.setItem("hiScore", JSON.stringify(highScoreVal));
            highScoreBox.innerHTML = "HighScore: " + highScoreVal;
        }

        scoreBox.innerHTML = "Score: " + score;

        // grow: copy the tail
        snakeArr.push({ ...snakeArr[snakeArr.length - 1] });

        food = randomFood();
    }

    draw();
}

// display the snake girl, her body and the food
function draw() {
    board.innerHTML = "";

    snakeArr.forEach((e, index) => {

        let snakeElement = document.createElement('div');

        snakeElement.style.gridRowStart = e.y;
        snakeElement.style.gridColumnStart = e.x;

        if (index === 0) {
            snakeElement.classList.add('head');
            snakeElement.style.backgroundImage = "url('" + SNAKE_GIRL_IMG + "')";
            if (facingLeft) {
                snakeElement.classList.add('face-left');
            }
        } else {
            snakeElement.classList.add('snake');
            if (index % 2 === 0) {
                snakeElement.classList.add('dark');
            }
            if (index === snakeArr.length - 1) {
                snakeElement.classList.add('tail');
            }
        }

        board.appendChild(snakeElement);
    });

    let foodElement = document.createElement('div');

    foodElement.style.gridRowStart = food.y;
    foodElement.style.gridColumnStart = food.x;
    foodElement.classList.add('food');

    board.appendChild(foodElement);
}

function changeDirection(newDir) {

    if (gameOver) {
        resetGame();
    }

    // snake can't turn straight back into itself
    if (newDir.x === -lastMoveDir.x && newDir.y === -lastMoveDir.y) {
        if (inputDir.x !== 0 || inputDir.y !== 0) {
            return;
        }
        newDir = { ...lastMoveDir }; // first key was backwards: just go forward
    }

    if (newDir.x !== 0) {
        facingLeft = newDir.x < 0;
    }

    inputDir = newDir;
    overlay.classList.add('hidden');
    playSound(moveSound);
}

// main logic start here
let hiScore = localStorage.getItem("hiScore");
let highScoreVal;

if (hiScore === null) {
    highScoreVal = 0;
    localStorage.setItem("hiScore", JSON.stringify(highScoreVal));
} else {
    highScoreVal = JSON.parse(hiScore);
}

highScoreBox.innerHTML = "HighScore: " + highScoreVal;
food = randomFood();

window.requestAnimationFrame(main);

window.addEventListener('keydown', e => {

    let newDir;

    switch (e.key) {

        case "ArrowUp":
            newDir = { x: 0, y: -1 };
            break;

        case "ArrowDown":
            newDir = { x: 0, y: 1 };
            break;

        case "ArrowLeft":
            newDir = { x: -1, y: 0 };
            break;

        case "ArrowRight":
            newDir = { x: 1, y: 0 };
            break;

        default:
            return; // ignore other keys
    }

    e.preventDefault(); // stop arrow keys from scrolling the page
    changeDirection(newDir);
});

// swipe controls for mobile
let touchStart = null;

board.parentElement.addEventListener('touchstart', e => {
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });

board.parentElement.addEventListener('touchend', e => {
    if (!touchStart) return;

    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    touchStart = null;

    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return; // just a tap

    if (Math.abs(dx) > Math.abs(dy)) {
        changeDirection({ x: dx > 0 ? 1 : -1, y: 0 });
    } else {
        changeDirection({ x: 0, y: dy > 0 ? 1 : -1 });
    }
});

// stop the page from scrolling while swiping on the board
board.parentElement.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
