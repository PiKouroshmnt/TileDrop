const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let index = 0;  //with this index i will go through every shape in SHAPES ans COLORS

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
                    (block.x + colIndex) * 30,
                    (block.y + rowIndex) * 30,
                    30,
                    30
                );
                ctx.strokeRect(
                    (block.x + colIndex) * 30,
                    (block.y + rowIndex) * 30,
                    30,
                    30
                )
            }
        });
    });
}

function gameLoop(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawGrid();
    drawBlock(currentBlock);
    index = (index+1) % 7;
    currentBlock.shape = SHAPES[index];
    currentBlock.color = COLORS[index];

    setTimeout(() => {
        requestAnimationFrame(gameLoop); // Call the next frame after a delay for now i will ofcourse change this later
    }, 1000); // Wait 1 second before the next frame
}

gameLoop();