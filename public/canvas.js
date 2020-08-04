const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const form = document.getElementById("form");

let inputCanv = document.getElementById("inputCanv");

ctx.strokeStyle = "#0000FF";
ctx.lineWidth = 3;
let mouseBoolean = false;
let horizmouseDown = 0;
let vertmouseDown = 0;
let horizmouseMove = 0;
let vertmouseMove = 0;

canvas.addEventListener("mousedown", mousedown);

canvas.addEventListener("mousemove", mousemove);

canvas.addEventListener("mouseup", mouseup);

function mousedown(event) {
    mouseBoolean = true;
    horizmouseDown = event.clientX;
    vertmouseDown = event.clientY;
    ctx.beginPath();
}

function mousemove(event) {
    if (mouseBoolean == true) {
        horizmouseMove = event.offsetX;
        vertmouseMove = event.offsetY;
        ctx.lineTo(horizmouseMove, vertmouseMove);
        ctx.stroke();
    }
}

function mouseup(event) {
    mouseBoolean = false;
}

form.addEventListener("submit", function () {
    const dataURL = canvas.toDataURL();
    inputCanv.value = dataURL;
});
