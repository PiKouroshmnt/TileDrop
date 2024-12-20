document.addEventListener('keydown', (event) => {
    if(event.key === 'ArrowLeft'){
        moveBlock(-1);
    }else if(event.key === 'ArrowRight') {
        moveBlock(1);
    }else if(event.key === 'ArrowUp') {
        rotateBlock();
    }else if(event.key === 'ArrowDown' && event.repeat){
        speedFall();
    }
});

document.addEventListener('keyup', (event) =>{
    if(event.key === 'ArrowDown'){
        normalFall();
    }
});

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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

let grid = Array.from({length: GAME_HEIGHT}, () =>
    Array.from(({length: GAME_WIDTH}),() =>({
        isOccupied : 0,
        color : null,
    }))
);

console.log(grid);

let firstIndex = randomIndex(SHAPES.length);

// the current block we want to draw
let currentBlock = {
    shape: SHAPES[firstIndex],
    x: (GAME_WIDTH / 2) - 1,
    y: 0,
    color: COLORS[firstIndex],
}

let lastDropTime = 0;
let drop_delay = 1000;

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
                )
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
    previousBlock = currentBlock;
    let index = randomIndex(SHAPES.length);
    currentBlock = {
        shape: SHAPES[index],
        x : (GAME_WIDTH / 2) - 1,
        y : 0,
        color: COLORS[index],
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

                if(y >= GAME_HEIGHT || y < 0 || x >= GAME_WIDTH || x < 0 || grid[y][x].isOccupied === 1){
                    isnull = true;
                }
            }
        });
    });
    if(isnull)
        return null;
    return nextBlock;
}

function gravity(block) {
    let next = nextPosition(block,block.y + 1,block.x);
    if(next != null){
        block.y++;
    }else{
        placeBlockOnGrid();
        newBlock();
    }
}

function gameLoop(currenTime){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawGrid();
    drawBlock(currentBlock);
    if(currenTime - lastDropTime > drop_delay){
       gravity(currentBlock);
       lastDropTime = currenTime;
    }
    requestAnimationFrame(gameLoop);
}

gameLoop();