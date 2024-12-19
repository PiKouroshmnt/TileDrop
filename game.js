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

// the current block we want to draw
let currentBlock = {
    shape: SHAPES[0],
    x: 4,
    y: 0,
    color: COLORS[0],
}

canvas.width = 300;
canvas.height = 600;

const BLOCK_SIZE = 30;
const GAME_WIDTH = canvas.width / BLOCK_SIZE;
const GAME_HEIGHT = canvas.height / BLOCK_SIZE;

function drawGrid() {
    for(let x = 0;x < canvas.width;x += 30){
        for(let y = 0;y < canvas.height;y += 30){
            ctx.strokeStyle = '#d3d3d3';
            ctx.strokeRect(x,y,30,30);
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

function randomIndex(arrayLength) {
    const randomArray = new Uint32Array(1); // Create a 32-bit array
    window.crypto.getRandomValues(randomArray); // Fill with cryptographically secure random numbers
    return randomArray[0] % arrayLength; // Use modulo to ensure it's within bounds
}

function newBlock(){
    let index = randomIndex(SHAPES.length);
    currentBlock = {
        shape: SHAPES[index],
        x : (GAME_WIDTH / 2) - 1,
        y : 0,
        color: COLORS[index],
    }
}

function gravity(block) {
    let height = block.shape.length;
    block.y++;
    if (block.y + height > GAME_HEIGHT){
        block.y = GAME_HEIGHT - 1;
        newBlock();
    }
}

function gameLoop(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawGrid();
    drawBlock(currentBlock);
    gravity(currentBlock);
    setTimeout(() => {
        requestAnimationFrame(gameLoop); // Call the next frame after a delay for now. i will ofcourse change this later
    }, 1000); // Wait 1 second before the next frame
}

gameLoop();