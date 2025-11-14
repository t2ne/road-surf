//--Faixas, Posição, Obstáculos e Score
let lanes = [150, 300, 450];
let playerPos;
let obstacles = [];
let laneIndex = 1;
let score = 0;

//--Estados do Jogo
let gamePaused = false;
let gameOver = false;

//--Diferentes Ecrâs
let startScreen = true;
let levelSelectScreen = false;
let endScreen = false;
let winScreen = false;
let showPopup = false;

//--Microfone
let mic;
let minMicLevel = 0.01;
let fft;

//--Mecânicas do Jogo
let obstacleTimer = 0;
let obstacleInterval = 1000; // 1 segundo
let gameTimer = 204000; //204000 - 2000;
let gameTime = 0;
let lastKeyPressTime = 0;
let keyPressDelay = 150; // 150ms de atraso entre teclas
let accumulatedScore = 0;
let selectedLevel = 0;

//--Áudio
let song;
let backgroundSound;
let winSound;
let loseSound;
let musicPlaying = false;

//--Imagens
let levelImages = [];
let topScores = [];
let playerImages = [];
let currentPlayerImage;
let obstacleImages = [];
let backgroundImg;

//--Fonte
let font;

//--Preload dos Sons e Imagens
function preload() {

  //--Carregar sons
  song = loadSound('media/sounds/musica.mp3');
  backgroundSound = loadSound('media/sounds/background.mp3');
  winSound = loadSound('media/sounds/win.mp3');
  loseSound = loadSound('media/sounds/lose.mp3');

  //--Carregar fonte
  font = loadFont('media/font/upheavtt.ttf');

  //--Carregar Imagens
  backgroundImg = loadImage('media/other/background.png');

  for (let i = 0; i < 6; i++) {
    playerImages[i] = loadImage(`media/players/player${i+1}.png`);
  }

  for (let i = 0; i < 3; i++) {
    obstacleImages[i] = loadImage(`media/obstacles/obstacle${i+1}.png`);
  }
  for (let i = 0; i < 6; i++) {
    levelImages[i] = loadImage(`media/levels/level${i+1}.jpg`);
  }
}

//--Setup do Cenário
function setup() {

  createCanvas(600, 600);

  //--Setup de Variáveis do player
  playerPos = createVector(lanes[laneIndex], height - 100);
  currentPlayerImage = playerImages[0];

  //--Setup de Microfone e Som
  fft = new p5.FFT();
  mic = new p5.AudioIn();
  mic.start();
  backgroundSound.loop();

  //--Setup da Fonte Global
  textFont(font);
}

//--Função Principal de todos os ecrâs
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

//--Primeiro Ecrâ do Jogo
function startGameScreen() {

  //--Estilo do Ecrâ
  background(0);
  tint(255, 39);
  image(backgroundImg, 0, 0, width, height);
  noTint();

  //--Estilo do Texto
  fill(255);
  textAlign(CENTER);
  textSize(40);
  textStyle(BOLD);

  //--1ª Parte de Texto
  text("BEM-VINDO AO ", width / 2 + 6, height / 4);
  text("Audio Road Surf!", width / 2, height / 3);

  textSize(20);

  //--2ª Parte de Texto
  text("CONTROLOS: ", width / 2, height / 2);
  text("Use as setas esquerda/direita para mudar de faixa.", width / 2, height / 2 + 60);
  text("Canta com a música para ativar obstáculos", width / 2, height / 2 + 100);
  text("e ganhar Pontos!", width / 2, height / 2 + 125);
  text("Prima ENTER para começar", width / 2, height / 2 + 215);

  textStyle(NORMAL);
  
  //-Avançar de Ecrâ
  if (keyIsPressed && key === 'Enter' && millis() - lastKeyPressTime > keyPressDelay) {
    startScreen = false;
    levelSelectScreen = true;
    lastKeyPressTime = millis();
  }
}

//--Ecrâ de showcase dos níveis
function showLevelSelectScreen() {

  //--Estilo do Ecrâ
  background(0);
  tint(255, 128);
  image(backgroundImg, 0, 0, width, height);
  noTint();

  //--Estilo do Texto
  fill(255);
  textAlign(CENTER);
  textSize(30);
  textStyle(BOLD);

  //--Texto do Ecrâ
  text("Escolha o seu nível", width / 2, 50);
  textSize(15);
  text("ENTER para confirmar", width / 2, height -50);
  textStyle(NORMAL);

  //--Organização das Imagens para os Níveis
  for (let i = 0; i < 6; i++) {
    let row = floor(i / 3);
    let col = i % 3;
    image(levelImages[i], 35 + col * 191, 150 + row * 170, 150, 110);
    if (i === selectedLevel) {

      //--Estilo do retângulo de Escolha
      noFill();
      stroke(255);
      strokeWeight(1.5);
      rect(30 + col * 191, 145 + row * 170, 160, 120);
      
      //--Desenhar seta de Escolha do Nível
      fill(255);
      let arrowX = 110 + col * 191;
      let arrowY = 273 + row * 170;
      triangle(arrowX, arrowY, arrowX - 20, arrowY + 20, arrowX + 20, arrowY + 20);
      stroke(0);

    }
  }

  //--Lógica para escolha do Nível
  if (keyIsPressed && millis() - lastKeyPressTime > keyPressDelay) {
    if (keyCode === LEFT_ARROW && selectedLevel % 3 > 0) {
      selectedLevel--;
    } else if (keyCode === RIGHT_ARROW && selectedLevel % 3 < 2) {
      selectedLevel++;
    } else if (keyCode === UP_ARROW && selectedLevel > 2) {
      selectedLevel -= 3;
    } else if (keyCode === DOWN_ARROW && selectedLevel < 3) {
      selectedLevel += 3;
    } else if (key === 'Enter') {
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

//--Ecrâ de Game Over
function endGameScreen() {

  //--Estilo do Ecrâ
  background(0);
  tint(255, 39);
  image(backgroundImg, 0, 0, width, height);
  noTint();

  //--Estilo do Texto
  fill(255, 0, 0);
  textAlign(CENTER);
  textSize(40);
  textStyle(BOLD);
  strokeWeight(0.5)
  stroke(0);

  text("Game Over!", width / 2, height / 4);
  
  textSize(20);

  text("Pontuação Final: " + score, width / 2, height / 3 - 10);
  
  // Mostrar pontuações mais altas
  text("Top Pontuações:", width / 2, height / 2 - 15);
  for (let i = 0; i < Math.min(topScores.length, 3); i++) {
    text((i + 1) + ". " + topScores[i], width / 2, height / 2 + 25 + i * 30);
  }
  
  text("Prima ENTER para voltar ao início", width / 2, height - 80);

  textStyle(NORMAL);

  //--Voltar para o ecrâ principal
  if (keyIsPressed && key === 'Enter' && millis() - lastKeyPressTime > keyPressDelay) {
    startScreen = true;
    endScreen = false;
    backgroundSound.loop();
    lastKeyPressTime = millis();
  }
}

//--Ecrâ de Vitória do jogador
function winGameScreen() {

  //--Estilo do Ecrâ
  background(0);
  tint(255, 39);
  image(backgroundImg, 0, 0, width, height);
  noTint();

  //--Estilo do Texto
  fill(0, 255, 0);
  textAlign(CENTER);
  textSize(40);
  textStyle(BOLD);
  strokeWeight(0.5)
  stroke(0);

  text("You Win!", width / 2, height / 4);
  
  textSize(20);

  text("Pontuação Final: " + score, width / 2, height / 3 - 10);
  
  // Mostrar pontuações mais altas
  text("Top Pontuações:", width / 2, height / 2 - 15);
  for (let i = 0; i < Math.min(topScores.length, 3); i++) {
    text((i + 1) + ". " + topScores[i], width / 2, height / 2 + 25 + i * 30);
  }
  
  text("Prima ENTER para voltar ao início", width / 2, height - 80);

  textStyle(NORMAL);

  //--Voltar para o ecrâ principal
  if (keyIsPressed && key === 'Enter' && millis() - lastKeyPressTime > keyPressDelay) {
    startScreen = true;
    endScreen = false;
    backgroundSound.loop();
    lastKeyPressTime = millis();
  }
}

//--Ecrâ do Jogo em si
function playGame() {

  //--Desenhar fundo
  image(backgroundImg, 0, 0, width, height);
  image(backgroundImg, 0, -height, width, height);
  backgroundImg.y = (backgroundImg.y + 5) % height;
  
  //--Microfone
  let micLevel = mic.getLevel();
  
  gameTime += deltaTime;
  
  //--Condições para o Jogador ganhar (Tempo acabar)
  if (gameTime >= gameTimer) {
    winScreen = true;
    song.stop();
    winSound.play();
    updateTopScores(score);
    return;
  }
  
  //--Mecânica de falar para criar obstáculos e aumentar score
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
  
  //--Desenhar o Player
  fill(0, 255, 0, 0);
  noStroke();
  rect(playerPos.x - 25, playerPos.y - 25, 50, 50);
  image(currentPlayerImage, playerPos.x - 25, playerPos.y - 25, 50, 50);
  
  //--Desenhar os obstáculos
  for (let i = obstacles.length - 1; i >= 0; i--) {

    //--Estilo de um obstáculo
    fill(255, 0, 0, 0);
    rect(obstacles[i].x - 25, obstacles[i].y - 25, 50, 70);
    image(obstacleImages[obstacles[i].imageIndex], obstacles[i].x - 30, obstacles[i].y - 40, 60, 80);
    obstacles[i].y += 5;
    noStroke();

    //--Check para colisões entre o player e um obstáculo
    if (checkCollision(playerPos, obstacles[i])) {
      obstacles.splice(i, 1);
      endScreen = true;
      song.stop();
      loseSound.play();
      updateTopScores(score);
      return;
    }
    
    //--Remoção de um obstáculo do ecrâ
    if (obstacles[i].y > height) {
      obstacles.splice(i, 1);
    }
  }

  //--Estilo de texto para score e tempo
  stroke(0);
  fill(255);
  textSize(20);
  textAlign(LEFT);
  textStyle(BOLD);

  text("Pontuação: " + score, 35, 30);
  textAlign(RIGHT);

  let remainingTime = gameTimer - gameTime;
  let seconds = floor((remainingTime / 1000) % 60);
  let minutes = floor((remainingTime / 1000) / 60);

  if (minutes > 0) {
    text("Tempo: " + minutes + "m" + seconds + "s", width - 30, 30);
  } else {
    text("Tempo: " + seconds + "s", width - 30, 30);
  }
  
  //--Estilo para o autor
  textAlign(RIGHT);
  textSize(12);
  fill(200);

  //--Informação do autor
  text("ESC para Menu de Pausa", width/4 + 24, height - 10);
  textStyle(NORMAL);

  //--Função para a mudança de faixas
  handlePlayerMovement();
}

//--Mudança de faixas
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

//--Verificação de Colisões entre o Player e um Obstáculo através da posição de ambos
function checkCollision(player, obstacle) {
  return (
    player.x - 25 < obstacle.x + 25 &&
    player.x + 25 > obstacle.x - 25 &&
    player.y - 25 < obstacle.y + 25 &&
    player.y + 25 > obstacle.y - 25
  );
}

//--Popup de Menu de Pausa
function pausePopup() {

  //--Estilo de Texto e Retângulo
  fill(50, 50, 50, 200);
  rect(width / 4, height / 3, width / 2, height / 3);
  fill(255);
  textAlign(CENTER);
  textSize(20);
  textStyle(BOLD);

  //--Texto do Menu
  text("Jogo Pausado", width / 2, height / 2 - 50);
  text("Pressione:", width / 2, height / 2 - 5);
  text("- P para continuar", width / 2 - 5, height / 2 + 35);
  text("- S para sair", width / 2 - 5, height / 2 + 60);
  textStyle(NORMAL);
  
  //--Verificação da saída ou continuação do jogo
  if (keyIsPressed && millis() - lastKeyPressTime > keyPressDelay) {
    if (key === 'p') {
      gamePaused = false;
      showPopup = false;
      song.play();
      lastKeyPressTime = millis();
    } else if (key === 's') {
      startScreen = true;
      gamePaused = false;
      showPopup = false;
      song.stop();
      backgroundSound.loop();
      lastKeyPressTime = millis();
    }
  }
  
}

//--Função para reiniciar o jogo
function resetGame() {
  song.stop();
  score = 0;
  accumulatedScore = 0;
  gameTime  = 0;
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

//--Função usada para pausar quando o utilizador carrega no ESC
function keyPressed() {

  if (keyCode === ESCAPE && !startScreen && !levelSelectScreen && !endScreen && !winScreen) {
    gamePaused = !gamePaused;
    showPopup = !showPopup;
    if (gamePaused) {
      song.pause();
    } else {
      song.play();
    }
  }
}

//--Update dos Top Scores da Sessão de Jogo da altura
function updateTopScores(newScore) {
  topScores.push(newScore);
  topScores.sort((a, b) => b - a);
  topScores = topScores.slice(0, 3);
}
//---------------------------------------Made by t2ne-------------------------------------
