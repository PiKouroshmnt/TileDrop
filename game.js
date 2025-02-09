document.addEventListener('keydown', (event) => {
    if(event.key === 'Escape' && started){
        if(paused){
            resumeGame();
        }else{
            pauseGame();
        }
    }else if(paused){
        return;
    }
    if(event.key === 'ArrowLeft' && started){
        moveBlock(-1);
    }else if(event.key === 'ArrowRight' && started) {
        moveBlock(1);
    }else if(event.key === 'ArrowUp' && started) {
        rotateBlock();
    }else if(event.key === 'ArrowDown' && event.repeat){
        speedFall();
    }else if(event.key === ' ' && isGameOver === false && started){
        instantDrop();
    }else if(event.key === 'r' && isGameOver){
        init();
        gameLoop();
    }else if(event.key === 'c' && started){
        holdBlock();
    }
});

document.addEventListener('keyup', (event) =>{
    if(event.key === 'ArrowDown'){
        normalFall();
    }
});

let scr = document.getElementById("score");
let mult = document.getElementById("mult");
let diff = document.getElementById("diff");

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const nxtCanvas = document.getElementById('nextCanvas');
const nxtCtx = nxtCanvas.getContext('2d');

const hldCanvas = document.getElementById('holdCanvas');
const hldCtx = hldCanvas.getContext('2d');

const SHAPES = [
    [[0,1],[1,1],[0,1]],   // T shape
    [[1,1],[1,1]],         // square shape
    [[1],[1],[1],[1]],     // The one and only : line piece
    [[1,0],[1,0],[1,1]],   // L shape
    [[0,1],[0,1],[1,1]],   // reverse L shape
    [[1,1,0],[0,1,1]],     // Z shape
    [[0,1,1],[1,1,0]],     // reverse Z shape
];

const COLORS = [
    '#b605fa',
    '#ff005d',
    '#00ffff',
    '#0f02d2',
    '#ff4500',
    '#FFFB00',
    '#21832f',
];

canvas.width = 300;
canvas.height = 600;

const BLOCK_SIZE = 30;
const GAME_WIDTH = canvas.width / BLOCK_SIZE;
const GAME_HEIGHT = canvas.height / BLOCK_SIZE;

const NEXT_WIDTH = nxtCanvas.width / BLOCK_SIZE;
const NEXT_HEIGHT = nxtCanvas.height / BLOCK_SIZE;

const HOLD_WIDTH = hldCanvas.width / BLOCK_SIZE;
const HOLD_HEIGHT = hldCanvas.height / BLOCK_SIZE;

let isGameOver;
let gameLoopId;
let started;
let paused;

let grid;

console.log(grid);

// the current block we want to draw
let currentBlock;

// this will hold the current blocks final position
let finalPos;

// the block that will spawn next
let nextBlock;

// the block in holding... initially none
let holdingBlock;

// variables that decide falling speed
let lastDropTime;
let drop_delay;

function init(){
    document.getElementById("GC").style.display = 'block';
    document.getElementById("MN").style.display = 'none';
    isGameOver = false;
    paused = false;
    started = true;
    holdingBlock = null;
    scr.value = 0;
    mult.value = 1;
    diff.value = 1;
    grid = Array.from({length: GAME_HEIGHT}, () =>
        Array.from(({length: GAME_WIDTH}),() =>({
            isOccupied : 0,
            color : null,
        }))
    );
    nxtCtx.clearRect(0,0,nxtCanvas.width,nxtCanvas.height);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.lineWidth = 1;
    let firstIndex = randomIndex(SHAPES.length);
    let secondIndex = randomIndex(SHAPES.length);
    currentBlock = {
        shape: SHAPES[firstIndex],
        x: (GAME_WIDTH / 2) - 1,
        y: 0,
        color: COLORS[firstIndex],
    };
    let nxtShape = SHAPES[secondIndex]
    let shapeWidth = nxtShape[0].length
    let shapeHeight = nxtShape.length
    nextBlock = {
        shape: nxtShape,
        x: (NEXT_WIDTH - shapeWidth)/ 2 ,
        y: (NEXT_HEIGHT - shapeHeight)/ 2,
        color: COLORS[secondIndex],
    }
    lastDropTime = 0;
    drop_delay = 1000;
}

function drawGrid() {
    for(let y = 0;y < GAME_HEIGHT;y++){
        for(let x = 0;x < GAME_WIDTH;x++){
            if(grid[y][x].isOccupied === 1) {
                ctx.strokeStyle = '#000';
                ctx.fillStyle = grid[y][x].color;
                ctx.fillRect(x * BLOCK_SIZE,y * BLOCK_SIZE,BLOCK_SIZE,BLOCK_SIZE);
                ctx.strokeRect(x * BLOCK_SIZE,y * BLOCK_SIZE,BLOCK_SIZE,BLOCK_SIZE);
            } else {
                ctx.strokeStyle = '#d3d3d3';
                ctx.strokeRect(x * BLOCK_SIZE,y * BLOCK_SIZE,BLOCK_SIZE,BLOCK_SIZE);
            }
        }
    }
}

// draw the block in input, the input will be currentBlock
function drawBlock(block) {
    block.shape.forEach((row,rowIndex) => {
        row.forEach((cell,colIndex) => {
            if(cell) {
                ctx.fillStyle = block.color;
                ctx.strokeStyle = '#000';
                ctx.fillRect(
                    (block.x + colIndex) * BLOCK_SIZE,
                    (block.y + rowIndex) * BLOCK_SIZE,
                    BLOCK_SIZE,
                    BLOCK_SIZE
                );
                ctx.strokeRect(
                    (block.x + colIndex) * BLOCK_SIZE,
                    (block.y + rowIndex) * BLOCK_SIZE,
                    BLOCK_SIZE,
                    BLOCK_SIZE
                );
            }
        });
    });
}

function drawFinalBlock(){
    let finalBlock = currentBlock;
    for(let temp = finalBlock;temp != null;temp = nextPosition(temp,temp.y + 1,temp.x)){
        finalBlock = temp;
    }
    finalPos = finalBlock;
    finalBlock.shape.forEach((row,rowIndex) =>{
        row.forEach((cell,colIndex) =>{
            if(cell){
                ctx.strokeStyle = finalBlock.color;
                ctx.lineWidth = 2;
                ctx.strokeRect(
                    (finalBlock.x + colIndex) * BLOCK_SIZE,
                    (finalBlock.y + rowIndex) * BLOCK_SIZE,
                    BLOCK_SIZE,
                    BLOCK_SIZE
                )
                ctx.lineWidth = 1;
            }
        });
    });
}

function drawNextBlock(){
    nextBlock.shape.forEach((row,rowIndex) => {
        row.forEach((cell,colIndex) => {
            if(cell){
                nxtCtx.strokeStyle = '#000';
                nxtCtx.fillStyle = nextBlock.color;
                nxtCtx.fillRect(
                    (nextBlock.x + colIndex) * BLOCK_SIZE,
                    (nextBlock.y + rowIndex) * BLOCK_SIZE,
                    BLOCK_SIZE,
                    BLOCK_SIZE,
                );
                nxtCtx.strokeRect(
                    (nextBlock.x + colIndex) * BLOCK_SIZE,
                    (nextBlock.y + rowIndex) * BLOCK_SIZE,
                    BLOCK_SIZE,
                    BLOCK_SIZE,
                );
            }
        });
    });
}

function drawHoldBlock(){
    if(holdingBlock != null) {
        holdingBlock.shape.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (cell) {
                    hldCtx.strokeStyle = '#000';
                    hldCtx.fillStyle = holdingBlock.color;
                    hldCtx.fillRect(
                        (holdingBlock.x + colIndex) * BLOCK_SIZE,
                        (holdingBlock.y + rowIndex) * BLOCK_SIZE,
                        BLOCK_SIZE,
                        BLOCK_SIZE,
                    );
                    hldCtx.strokeRect(
                        (holdingBlock.x + colIndex) * BLOCK_SIZE,
                        (holdingBlock.y + rowIndex) * BLOCK_SIZE,
                        BLOCK_SIZE,
                        BLOCK_SIZE,
                    );
                }
            });
        });
    }
}

function moveBlock(direction) {
    let next = nextPosition(currentBlock,currentBlock.y,currentBlock.x + direction);
    if(next != null)
        currentBlock = next;
}

function rotateMatrix(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            rotated[col][rows - 1 - row] = matrix[row][col]; // Clockwise rotation
        }
    }

    return rotated;
}

function isRotationValid(shape, x, y) {
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const newX = x + col;
                const newY = y + row;

                // Check bounds
                if (newX < 0 || newX >= GAME_WIDTH || newY >= GAME_HEIGHT) {
                    return false; // Out of bounds
                }

                // Check collision with existing blocks (e.g., on the grid)
                if (grid[newY] && grid[newY][newX].isOccupied === 1) {
                    return false; // Collision
                }
            }
        }
    }
    return true;
}


function rotateBlock() {
    // the rotation center is not the same for each shape, I have to implement that as well...
    let rotated = rotateMatrix(currentBlock.shape);
    if(isRotationValid(rotated,currentBlock.x,currentBlock.y)){
        currentBlock.shape = rotated;
    }
}

function randomIndex(arrayLength) {
    const randomArray = new Uint32Array(1); // Create a 32-bit array
    window.crypto.getRandomValues(randomArray); // Fill with cryptographically secure random numbers
    return randomArray[0] % arrayLength; // Use modulo to ensure it's within bounds
}

function newBlock(){
    let index = randomIndex(SHAPES.length);
    currentBlock = nextBlock;
    currentBlock.x = (GAME_WIDTH / 2) - 1;
    currentBlock.y = (-1 * currentBlock.shape.length) + 1;
    let nxtShape = SHAPES[index]
    let shapeWidth = nxtShape[0].length
    let shapeHeight = nxtShape.length
    nextBlock = {
        shape: nxtShape,
        x: (NEXT_WIDTH - shapeWidth)/ 2,
        y: (NEXT_HEIGHT - shapeHeight)/ 2,
        color: COLORS[index],
    }
}

function spawnNewBlock() {
    newBlock();
    if(nextPosition(currentBlock,currentBlock.y,currentBlock.x) === null){
        gameOver();
    }
}

function speedFall(){
    drop_delay = 15;
}

function normalFall(){
    let difficulty = parseInt(diff.value);
    if(difficulty <= 5){
        drop_delay = 1000 - ((difficulty - 1) * 150);
    }else{
        drop_delay = 400 - ((difficulty - 5) * 70);
    }
}

function holdBlock(){
    hldCtx.clearRect(0,0,hldCanvas.width,hldCanvas.height);
    if(holdingBlock == null){
        holdingBlock = currentBlock;
        spawnNewBlock();
    }else{
        let tempBlock = currentBlock;
        currentBlock = holdingBlock;
        holdingBlock = tempBlock;
        currentBlock.x = tempBlock.x;
        currentBlock.y = tempBlock.y;
    }
    let width = holdingBlock.shape[0].length;
    let height = holdingBlock.shape.length;
    holdingBlock.x = (HOLD_WIDTH - width) / 2;
    holdingBlock.y = (HOLD_HEIGHT - height) / 2;
}

function instantDrop(){
    currentBlock = finalPos;
    placeBlockOnGrid();
    spawnNewBlock();
    clearFullLines();
}

function pauseGame(){
    paused = true;
    cancelAnimationFrame(gameLoopId);
    document.getElementById("PM").style.display = 'block';

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    hldCtx.fillStyle = "rgba(255,255,255,0.5)";
    nxtCtx.fillStyle = "rgba(255,255,255,0.5)";
    
    ctx.fillRect(0,0,canvas.width,canvas.height);
    hldCtx.fillRect(0,0,hldCanvas.width,hldCanvas.height);
    nxtCtx.fillRect(0,0,nxtCanvas.width,nxtCanvas.height);
}

function resumeGame(){
    paused = false;
    document.getElementById("PM").style.display = 'none';
    gameLoop();
}

function placeBlockOnGrid() {
    currentBlock.shape.forEach((blockRow, rowIndex) => {
        blockRow.forEach((cell, colIndex) => {
            if (cell) {
                const x = currentBlock.x + colIndex;
                const y = currentBlock.y + rowIndex;
                if(y < 0)
                    return;
                grid[y][x].isOccupied = 1;
                grid[y][x].color = currentBlock.color;
            }
        });
    });
}

function nextPosition(block,newY,newX) {
    let nextBlock = {
        shape: block.shape,
        x: newX,
        y: newY,
        color: block.color,
    }
    let isnull = false;
    nextBlock.shape.forEach((row,rowIndex) => {
        row.forEach((cell,colIndex) => {
            if(cell) {
                const x = nextBlock.x + colIndex;
                const y = nextBlock.y + rowIndex;
                
                if(y < 0) {
                    return;
                }
                
                if(y >= GAME_HEIGHT || x >= GAME_WIDTH || x < 0 || grid[y][x].isOccupied === 1){
                    isnull = true;
                }
            }
        });
    });
    if(isnull)
        return null;
    return nextBlock;
}

function numFullLines(){
    let fullLines = [];
    let compare = Array(GAME_WIDTH).fill(1);
    for (let y = 0;y < GAME_HEIGHT;y++){
        let values = [];
        for(let x = 0;x < GAME_WIDTH;x++){
            values.push(grid[y][x].isOccupied);
        }
        if(JSON.stringify(values) === JSON.stringify(compare)){
            fullLines.push(y);
        }
    }
    return fullLines;
}

// temporary... have to factor difficulty in as well
function calculateScore(num){
    // 1 line = 100 * multiplier(level) ---- 2 lines = 300 * multiplier ---- 3 lines = 500 * multiplier ---- 4 lines = 800 * multiplier
    let score = parseInt(mult.value);
    if(num < 1){
        score = 0;
    }else if(num !== 4){
        score *= ((2 * num - 1) * 100);
    }else{
        score *= 800;
    }
    return score;
}

function increaseLevel(){
    let threshold = 0;
    let multiplier = parseInt(mult.value);
    for (let i = 0;i <= multiplier;i++){
        threshold += (i * 2000);
    }
    let currentScore = parseInt(scr.value);
    while(currentScore >= threshold){
        multiplier++;
        threshold += (multiplier * 2000);
    }
    mult.value = multiplier;
}

function increaseDifficulty(){
    let difficulty = parseInt(diff.value);
    if(difficulty === 10){
        return;
    }
    let multiplier = parseInt(mult.value);
    let threshold = difficulty * 3;
    while(multiplier >= threshold){
        difficulty++;
        threshold += 3; 
    }
    diff.value = (difficulty > 10) ? 10 : difficulty;
    normalFall();
}

function clearFullLines(){
    let lines = numFullLines();
    for(let i = 0;i < lines.length;i++){
        let index = lines[i];
        let rowOut = grid.splice(index,1)[0];
        rowOut.forEach((obj) => {
            obj.isOccupied = 0;
            obj.color = null;
        });
        grid.reverse().push(rowOut);
        grid.reverse();
    }
    let score = parseInt(scr.value);
    score += calculateScore(lines.length);
    scr.value = score;
    increaseLevel();
    increaseDifficulty();
}

function gravity(block) {
    let next = nextPosition(block,block.y + 1,block.x);
    if(next != null){
        block.y++;
    }else{
        placeBlockOnGrid();
        spawnNewBlock();
        clearFullLines();
    }
}

function gameLoop(currenTime){
    if(isGameOver) return;
    nxtCtx.clearRect(0,0,nxtCanvas.width,nxtCanvas.height);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawGrid();
    drawFinalBlock();
    drawBlock(currentBlock);
    drawNextBlock();
    drawHoldBlock();
    if(currenTime - lastDropTime > drop_delay){
       gravity(currentBlock);
       lastDropTime = currenTime;
    }
    gameLoopId = requestAnimationFrame(gameLoop);
}

function gameOver(){
    isGameOver = true;
    started = false;
    
    cancelAnimationFrame(gameLoopId);

    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawGrid();
    
    hldCtx.clearRect(0,0,hldCanvas.width,hldCanvas.height);
    nxtCtx.clearRect(0,0,nxtCanvas.width,nxtCanvas.height);

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    nxtCtx.fillStyle = "rgba(255,255,255,0.5)";
    hldCtx.fillStyle = "rgba(255,255,255,0.5)";
    
    let offset = 50;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0,(canvas.height / 2) - offset,canvas.width,2 * offset);

    nxtCtx.fillRect(0,0,nxtCanvas.width,nxtCanvas.height);
    hldCtx.fillRect(0,0,hldCanvas.width,hldCanvas.height);
    
    ctx.fillStyle = "rgb(255,0,0)";
    ctx.font = "30px GamePausedDEMO";
    ctx.textAlign = "center";
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    ctx.strokeText("Game over",canvas.width / 2,canvas.height / 2);
    ctx.fillText("Game over",canvas.width / 2,canvas.height / 2);

    ctx.font = "15px GamePausedDEMO";
    ctx.strokeText("press R to restart",canvas.width / 2,(canvas.height / 2) + 20);
    ctx.fillStyle = "#d3d3d3";
    ctx.fillText("press R to restart",canvas.width / 2,(canvas.height / 2) + 20);
}

function startGame(){
    init();
    gameLoop();
}

function showInstructions(){
    document.getElementById("IS").style.display = 'block';
}

function closeInstructions(){
    document.getElementById("IS").style.display = 'none';
}

function showCredits(){
    // will implement this later
    // this function will show a list of assets and people who helped me create this project
}