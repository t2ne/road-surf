//--Lanes, Position, Obstacles, and Score
let lanes = [150, 300, 450];
let playerPos;
let obstacles = [];
let laneIndex = 1;
let score = 0;

//--Game States
let gamePaused = false;
let gameOver = false;

//--Different Screens
let startScreen = true;
let levelSelectScreen = false;
let endScreen = false;
let winScreen = false;
let showPopup = false;

//--Microphone
let mic;
let minMicLevel = 0.01;
let fft;

//--Game Mechanics
let obstacleTimer = 0;
let obstacleInterval = 1000; // 1 segundo
let gameTimer = 204000; //204000 - 2000;
let gameTime = 0;
let lastKeyPressTime = 0;
let keyPressDelay = 150; // 150ms de atraso entre teclas
let accumulatedScore = 0;
let selectedLevel = 0;

//--Audio
let song;
let backgroundSound;
let winSound;
let loseSound;
let musicPlaying = false;

//--Images
let levelImages = [];
let topScores = [];
let playerImages = [];
let currentPlayerImage;
let obstacleImages = [];
let backgroundImg;

//--Font
let font;

//--Preload Sounds and Images
function preload() {
  //--Load sounds
  song = loadSound("media/sounds/musica.mp3");
  backgroundSound = loadSound("media/sounds/background.mp3");
  winSound = loadSound("media/sounds/win.mp3");
  loseSound = loadSound("media/sounds/lose.mp3");

  //--Load font
  font = loadFont("media/font/upheavtt.ttf");

  //--Load images
  backgroundImg = loadImage("media/other/background.png");

  for (let i = 0; i < 6; i++) {
    playerImages[i] = loadImage(`media/players/player${i + 1}.png`);
  }

  for (let i = 0; i < 3; i++) {
    obstacleImages[i] = loadImage(`media/obstacles/obstacle${i + 1}.png`);
  }
  for (let i = 0; i < 6; i++) {
    levelImages[i] = loadImage(`media/levels/level${i + 1}.jpg`);
  }
}

//--Scene Setup
function setup() {
  createCanvas(600, 600);

  //--Player variables setup
  playerPos = createVector(lanes[laneIndex], height - 100);
  currentPlayerImage = playerImages[0];

  //--Microphone and audio setup
  fft = new p5.FFT();
  mic = new p5.AudioIn();
  mic.start();
  backgroundSound.loop();

  //--Global font setup
  textFont(font);
}

//--Main function for all screens
function draw() {
  if (startScreen) {
    startGameScreen();
  } else if (levelSelectScreen) {
    showLevelSelectScreen();
  } else if (endScreen) {
    endGameScreen();
  } else if (winScreen) {
    winGameScreen();
  } else {
    if (!gamePaused) {
      playGame();
    }
    if (showPopup) {
      pausePopup();
    }
  }
}

//--Game Start Screen
function startGameScreen() {
  //--Screen styling
  background(0);
  tint(255, 39);
  image(backgroundImg, 0, 0, width, height);
  noTint();

  //--Text styling
  fill(255);
  textAlign(CENTER);
  textSize(40);
  textStyle(BOLD);

  //--Text (Part 1)
  text("WELCOME TO", width / 2 + 6, height / 4);
  text("Audio Road Surf!", width / 2, height / 3);

  textSize(20);

  //--Text (Part 2)
  text("CONTROLS:", width / 2, height / 2);
  text(
    "Use the LEFT/RIGHT arrow keys to change lanes.",
    width / 2,
    height / 2 + 60,
  );
  text(
    "Sing along with the music to trigger obstacles",
    width / 2,
    height / 2 + 100,
  );
  text("and earn points!", width / 2, height / 2 + 125);
  text("Press ENTER to start", width / 2, height / 2 + 215);

  textStyle(NORMAL);

  //-Advance to next screen
  if (
    keyIsPressed &&
    key === "Enter" &&
    millis() - lastKeyPressTime > keyPressDelay
  ) {
    startScreen = false;
    levelSelectScreen = true;
    lastKeyPressTime = millis();
  }
}

//--Level Select Screen
function showLevelSelectScreen() {
  //--Screen styling
  background(0);
  tint(255, 128);
  image(backgroundImg, 0, 0, width, height);
  noTint();

  //--Text styling
  fill(255);
  textAlign(CENTER);
  textSize(30);
  textStyle(BOLD);

  //--Screen text
  text("Choose your level", width / 2, 50);
  textSize(15);
  text("Press ENTER to confirm", width / 2, height - 50);
  textStyle(NORMAL);

  //--Layout level images
  for (let i = 0; i < 6; i++) {
    let row = floor(i / 3);
    let col = i % 3;
    image(levelImages[i], 35 + col * 191, 150 + row * 170, 150, 110);
    if (i === selectedLevel) {
      //--Selection rectangle styling
      noFill();
      stroke(255);
      strokeWeight(1.5);
      rect(30 + col * 191, 145 + row * 170, 160, 120);

      //--Draw selection arrow
      fill(255);
      let arrowX = 110 + col * 191;
      let arrowY = 273 + row * 170;
      triangle(
        arrowX,
        arrowY,
        arrowX - 20,
        arrowY + 20,
        arrowX + 20,
        arrowY + 20,
      );
      stroke(0);
    }
  }

  //--Level selection logic
  if (keyIsPressed && millis() - lastKeyPressTime > keyPressDelay) {
    if (keyCode === LEFT_ARROW && selectedLevel % 3 > 0) {
      selectedLevel--;
    } else if (keyCode === RIGHT_ARROW && selectedLevel % 3 < 2) {
      selectedLevel++;
    } else if (keyCode === UP_ARROW && selectedLevel > 2) {
      selectedLevel -= 3;
    } else if (keyCode === DOWN_ARROW && selectedLevel < 3) {
      selectedLevel += 3;
    } else if (key === "Enter") {
      levelSelectScreen = false;
      resetGame();
      backgroundSound.stop();
      song.play();
      musicPlaying = true;

      currentPlayerImage = playerImages[selectedLevel];
    }
    lastKeyPressTime = millis();
  }
}

//--Game Over Screen
function endGameScreen() {
  //--Screen styling
  background(0);
  tint(255, 39);
  image(backgroundImg, 0, 0, width, height);
  noTint();

  //--Text styling
  fill(255, 0, 0);
  textAlign(CENTER);
  textSize(40);
  textStyle(BOLD);
  strokeWeight(0.5);
  stroke(0);

  text("Game Over!", width / 2, height / 4);

  textSize(20);

  text("Final Score: " + score, width / 2, height / 3 - 10);

  // Show top scores
  text("Top Scores:", width / 2, height / 2 - 15);
  for (let i = 0; i < Math.min(topScores.length, 3); i++) {
    text(i + 1 + ". " + topScores[i], width / 2, height / 2 + 25 + i * 30);
  }

  text("Press ENTER to return to the start", width / 2, height - 80);

  textStyle(NORMAL);

  //--Return to start screen
  if (
    keyIsPressed &&
    key === "Enter" &&
    millis() - lastKeyPressTime > keyPressDelay
  ) {
    startScreen = true;
    endScreen = false;
    backgroundSound.loop();
    lastKeyPressTime = millis();
  }
}

//--Win Screen
function winGameScreen() {
  //--Screen styling
  background(0);
  tint(255, 39);
  image(backgroundImg, 0, 0, width, height);
  noTint();

  //--Text styling
  fill(0, 255, 0);
  textAlign(CENTER);
  textSize(40);
  textStyle(BOLD);
  strokeWeight(0.5);
  stroke(0);

  text("You Win!", width / 2, height / 4);

  textSize(20);

  text("Final Score: " + score, width / 2, height / 3 - 10);

  // Show top scores
  text("Top Scores:", width / 2, height / 2 - 15);
  for (let i = 0; i < Math.min(topScores.length, 3); i++) {
    text(i + 1 + ". " + topScores[i], width / 2, height / 2 + 25 + i * 30);
  }

  text("Press ENTER to return to the start", width / 2, height - 80);

  textStyle(NORMAL);

  //--Return to start screen
  if (
    keyIsPressed &&
    key === "Enter" &&
    millis() - lastKeyPressTime > keyPressDelay
  ) {
    startScreen = true;
    endScreen = false;
    backgroundSound.loop();
    lastKeyPressTime = millis();
  }
}

//--Gameplay Screen
function playGame() {
  //--Draw background
  image(backgroundImg, 0, 0, width, height);
  image(backgroundImg, 0, -height, width, height);
  backgroundImg.y = (backgroundImg.y + 5) % height;

  //--Microphone
  let micLevel = mic.getLevel();

  gameTime += deltaTime;

  //--Win condition (time runs out)
  if (gameTime >= gameTimer) {
    winScreen = true;
    song.stop();
    winSound.play();
    updateTopScores(score);
    return;
  }

  //--Voice/singing mechanic: spawn obstacles and increase score
  if (micLevel > minMicLevel) {
    obstacleTimer += deltaTime;
    accumulatedScore += deltaTime / 1000;
    score = floor(accumulatedScore);

    if (obstacleTimer >= obstacleInterval) {
      for (let i = 0; i < 3; i++) {
        let lane = floor(random(3));
        let obstacle = createVector(lanes[lane], -50 - i * 100);
        obstacle.imageIndex = floor(random(obstacleImages.length));
        obstacles.push(obstacle);
      }
      obstacleTimer = 0;
    }
  }

  //--Draw player
  fill(0, 255, 0, 0);
  noStroke();
  rect(playerPos.x - 25, playerPos.y - 25, 50, 50);
  image(currentPlayerImage, playerPos.x - 25, playerPos.y - 25, 50, 50);

  //--Draw obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    //--Obstacle styling
    fill(255, 0, 0, 0);
    rect(obstacles[i].x - 25, obstacles[i].y - 25, 50, 70);
    image(
      obstacleImages[obstacles[i].imageIndex],
      obstacles[i].x - 30,
      obstacles[i].y - 40,
      60,
      80,
    );
    obstacles[i].y += 5;
    noStroke();

    //--Check collisions between player and obstacle
    if (checkCollision(playerPos, obstacles[i])) {
      obstacles.splice(i, 1);
      endScreen = true;
      song.stop();
      loseSound.play();
      updateTopScores(score);
      return;
    }

    //--Remove obstacle when it leaves the screen
    if (obstacles[i].y > height) {
      obstacles.splice(i, 1);
    }
  }

  //--Score/time text styling
  stroke(0);
  fill(255);
  textSize(20);
  textAlign(LEFT);
  textStyle(BOLD);

  text("Score: " + score, 35, 30);
  textAlign(RIGHT);

  let remainingTime = gameTimer - gameTime;
  let seconds = floor((remainingTime / 1000) % 60);
  let minutes = floor(remainingTime / 1000 / 60);

  if (minutes > 0) {
    text("Time: " + minutes + "m" + seconds + "s", width - 30, 30);
  } else {
    text("Time: " + seconds + "s", width - 30, 30);
  }

  //--Footer hint styling
  textAlign(RIGHT);
  textSize(12);
  fill(200);

  //--Hint text
  text("ESC for Pause Menu", width / 4 + 24, height - 10);
  textStyle(NORMAL);

  //--Handle lane changes
  handlePlayerMovement();
}

//--Lane changes
function handlePlayerMovement() {
  if (keyIsPressed && millis() - lastKeyPressTime > keyPressDelay) {
    if (keyCode === LEFT_ARROW && laneIndex > 0) {
      laneIndex--;
      lastKeyPressTime = millis();
    } else if (keyCode === RIGHT_ARROW && laneIndex < 2) {
      laneIndex++;
      lastKeyPressTime = millis();
    }
  }

  let targetX = lanes[laneIndex];
  playerPos.x = lerp(playerPos.x, targetX, 0.2);
}

//--Collision check between player and obstacle using both positions
function checkCollision(player, obstacle) {
  return (
    player.x - 25 < obstacle.x + 25 &&
    player.x + 25 > obstacle.x - 25 &&
    player.y - 25 < obstacle.y + 25 &&
    player.y + 25 > obstacle.y - 25
  );
}

//--Pause Menu Popup
function pausePopup() {
  //--Text and rectangle styling
  fill(50, 50, 50, 200);
  rect(width / 4, height / 3, width / 2, height / 3);
  fill(255);
  textAlign(CENTER);
  textSize(20);
  textStyle(BOLD);

  //--Menu text
  text("Game Paused", width / 2, height / 2 - 50);
  text("Press:", width / 2, height / 2 - 5);
  text("- P to continue", width / 2 - 5, height / 2 + 35);
  text("- S to quit", width / 2 - 5, height / 2 + 60);
  textStyle(NORMAL);

  //--Check for quitting or resuming
  if (keyIsPressed && millis() - lastKeyPressTime > keyPressDelay) {
    if (key === "p") {
      gamePaused = false;
      showPopup = false;
      song.play();
      lastKeyPressTime = millis();
    } else if (key === "s") {
      startScreen = true;
      gamePaused = false;
      showPopup = false;
      song.stop();
      backgroundSound.loop();
      lastKeyPressTime = millis();
    }
  }
}

//--Reset the game
function resetGame() {
  song.stop();
  score = 0;
  accumulatedScore = 0;
  gameTime = 0;
  laneIndex = 1;
  obstacles = [];
  endScreen = false;
  winScreen = false;
  gameOver = false;
  showPopup = false;
  gamePaused = false;
  playerPos.x = lanes[laneIndex];
  obstacleTimer = 0;
}

//--Pause toggle when the user presses ESC
function keyPressed() {
  if (
    keyCode === ESCAPE &&
    !startScreen &&
    !levelSelectScreen &&
    !endScreen &&
    !winScreen
  ) {
    gamePaused = !gamePaused;
    showPopup = !showPopup;
    if (gamePaused) {
      song.pause();
    } else {
      song.play();
    }
  }
}

//--Update top scores for this session
function updateTopScores(newScore) {
  topScores.push(newScore);
  topScores.sort((a, b) => b - a);
  topScores = topScores.slice(0, 3);
}
//---------------------------------------Made by no-tone-------------------------------------
