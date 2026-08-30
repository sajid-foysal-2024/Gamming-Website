const foodSound = new Audio(STATIC_AUDIO_PATH + 'food.mp3');
const gameOverSound = new Audio(STATIC_AUDIO_PATH + 'gameover.mp3');
const moveSound = new Audio(STATIC_AUDIO_PATH + 'move.mp3');
const musicSound = new Audio(STATIC_AUDIO_PATH + 'music.mp3');

let score = 0;
let speed = 7;
let lastPaintTime = 0;
let snakeArr = [
    { x: 13, y: 15 }
];

let food = { x: 6, y: 7 };
let inputDir = { x: 0, y: 0 };

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

    // if snake hits the wall
    if (
        snakeArr[0].x >= 18 ||
        snakeArr[0].x <= 0 ||
        snakeArr[0].y >= 18 ||
        snakeArr[0].y <= 0
    ) {
        return true;
    }

    return false;
}

// game engine
function gameEngine() {

    // part 1: updating the snake variable
    if (isCollide(snakeArr)) {
        gameOverSound.play();
        musicSound.pause();
        inputDir = { x: 0, y: 0 };

        alert("Game Over! Press any key to play again.");

        snakeArr = [{ x: 13, y: 15 }];

        musicSound.play();
        score = 0;
    }

    // if you have eaten the food, increment score and regenerate food
    if (snakeArr[0].y === food.y && snakeArr[0].x === food.x) {

        foodSound.play();
        score += 1;

        if (score > highScoreVal) {
            highScoreVal = score;

            localStorage.setItem(
                "hiScore",
                JSON.stringify(highScoreVal)
            );

            highScoreBox.innerHTML = "HighScore: " + highScoreVal;
        }

        scoreBox.innerHTML = "Score: " + score;

        snakeArr.unshift({
            x: snakeArr[0].x + inputDir.x,
            y: snakeArr[0].y + inputDir.y
        });

        let a = 2;
        let b = 16;

        food = {
            x: Math.round(a + (b - a) * Math.random()),
            y: Math.round(a + (b - a) * Math.random())
        };
    }

    // Moving the snake
    for (let i = snakeArr.length - 2; i >= 0; i--) {
        snakeArr[i + 1] = { ...snakeArr[i] };
    }

    snakeArr[0].x += inputDir.x;
    snakeArr[0].y += inputDir.y;

    // part 2: display the snake and food
    board.innerHTML = "";

    snakeArr.forEach((e, index) => {

        let snakeElement = document.createElement('div');

        snakeElement.style.gridRowStart = e.y;
        snakeElement.style.gridColumnStart = e.x;

        if (index === 0) {
            snakeElement.classList.add('head');
        } else {
            snakeElement.classList.add('snake');
        }

        board.appendChild(snakeElement);
    });

    // display the food element
    let foodElement = document.createElement('div');

    foodElement.style.gridRowStart = food.y;
    foodElement.style.gridColumnStart = food.x;

    foodElement.classList.add('food');

    board.appendChild(foodElement);
}

// main logic start here
let hiScore = localStorage.getItem("hiScore");
let highScoreVal;

if (hiScore === null) {

    highScoreVal = 0;

    localStorage.setItem(
        "hiScore",
        JSON.stringify(highScoreVal)
    );

} else {

    highScoreVal = JSON.parse(hiScore);

    highScoreBox.innerHTML = "HighScore: " + highScoreVal;
}

window.requestAnimationFrame(main);

window.addEventListener('keydown', e => {

    inputDir = { x: 0, y: 1 }; // Start game

    moveSound.play();

    switch (e.key) {

        case "ArrowUp":
            inputDir.x = 0;
            inputDir.y = -1;
            break;

        case "ArrowDown":
            inputDir.x = 0;
            inputDir.y = 1;
            break;

        case "ArrowLeft":
            inputDir.x = -1;
            inputDir.y = 0;
            break;

        case "ArrowRight":
            inputDir.x = 1;
            inputDir.y = 0;
            break;

        default:
            break;
    }
});