document.addEventListener('keydown', (event) => {
    if(event.key === 'ArrowLeft'){
        moveBlock(-1);
    }else if(event.key === 'ArrowRight') {
        moveBlock(1);
    }else if(event.key === 'ArrowUp') {
        rotateBlock();
    }else if(event.key === 'ArrowDown' && event.repeat){
        speedFall();
    }else if(event.key === 'r' && isGameOver){
        init();
        gameLoop();
    }
});

document.addEventListener('keyup', (event) =>{
    if(event.key === 'ArrowDown'){
        normalFall();
    }
});

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const nxtCanvas = document.getElementById('nextCanvas');
const nxtCtx = nxtCanvas.getContext('2d');

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
    '#f3f810',
    '#21832f',
];

canvas.width = 300;
canvas.height = 600;

const BLOCK_SIZE = 30;
const GAME_WIDTH = canvas.width / BLOCK_SIZE;
const GAME_HEIGHT = canvas.height / BLOCK_SIZE;

const NEXT_WIDTH = nxtCanvas.width / BLOCK_SIZE;
const NEXT_HEIGHT = nxtCanvas.height / BLOCK_SIZE;

let isGameOver;
let gameLoopId;

let grid;

console.log(grid);

// the current block we want to draw
let currentBlock;


let nextBlock;

let lastDropTime;
let drop_delay;

function init(){
    isGameOver = false;
    grid = Array.from({length: GAME_HEIGHT}, () =>
        Array.from(({length: GAME_WIDTH}),() =>({
            isOccupied : 0,
            color : null,
        }))
    );
    nxtCtx.clearRect(0,0,nxtCanvas.width,nxtCanvas.height);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let firstIndex = randomIndex(SHAPES.length);
    let secondIndex = randomIndex(SHAPES.length);
    currentBlock = {
        shape: SHAPES[firstIndex],
        x: (GAME_WIDTH / 2) - 1,
        y: 0,
        color: COLORS[firstIndex],
    };
    nextBlock = {
        shape: SHAPES[secondIndex],
        x: (NEXT_WIDTH / 2) - 1,
        y: (NEXT_HEIGHT / 2) - 1,
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

function drawNextGrid() {
    for(let y = 0;y < NEXT_HEIGHT;y++) {
        for(let x = 0;x < NEXT_WIDTH;x++){
            nxtCtx.strokeStyle = "#d3d3d3";
            nxtCtx.strokeRect(x * BLOCK_SIZE,y * BLOCK_SIZE,BLOCK_SIZE,BLOCK_SIZE);
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

function moveBlock(direction) {
    let width = currentBlock.shape[0].length;
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
    // the rotation center is not the same for each shape, i have to implement that as well...
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
    nextBlock = {
        shape: SHAPES[index],
        x: (NEXT_WIDTH / 2) - 1,
        y: (NEXT_HEIGHT / 2) - 1,
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
    drop_delay = 1000;
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

function clearFullLines(){
    let lines = numFullLines();
    for(let i = 0;i < lines.length;i++){
        let index = lines[i];
        let rowOut = grid.splice(index,1)[0];
        rowOut.forEach((obj, colIndex) => {
            obj.isOccupied = 0;
            obj.color = null;
        });
        grid.reverse().push(rowOut);
        grid.reverse();
    }
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
    drawNextGrid();
    drawBlock(currentBlock);
    drawNextBlock();
    if(currenTime - lastDropTime > drop_delay){
       gravity(currentBlock);
       lastDropTime = currenTime;
    }
    gameLoopId = requestAnimationFrame(gameLoop);
}

function gameOver(){
    isGameOver = true;

    cancelAnimationFrame(gameLoopId);

    nxtCtx.clearRect(0,0,nxtCanvas.width,nxtCanvas.height);

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    nxtCtx.fillStyle = "rgba(255,255,255,0.5)";

    let offset = 50;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0,(canvas.height / 2) - offset,canvas.width,2 * offset);

    nxtCtx.fillRect(0,0,nxtCanvas.width,nxtCanvas.height);

    ctx.fillStyle = "rgb(255,0,0)";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Game over",canvas.width / 2,canvas.height / 2);

    ctx.fillStyle = "#d3d3d3";
    ctx.font = "15px Arial";
    ctx.fillText("press R to restart",canvas.width / 2,(canvas.height / 2) + 20);
}

init();
gameLoop();