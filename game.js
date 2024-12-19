const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 300;
canvas.height = 600;

function drawGrid() {
    for(let x = 0;x < canvas.width;x += 30){
        for(let y = 0;y < canvas.height;y += 30){
            ctx.strokeStyle = '#333';
            ctx.strokeRect(x,y,30,30);
        }
    }
}

function gameLoop(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawGrid();
    requestAnimationFrame(gameLoop);
}

gameLoop();