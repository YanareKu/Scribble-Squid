$(document).ready(function () {

    /*-----------------------------------------------------------
                   Set Globals, Canvas, and Stroke
    -------------------------------------------------------------*/

    var canvas = document.getElementById('paper'),
    ctx = canvas.getContext('2d') ? canvas.getContext('2d') : null,
    paint = false,
    draw = true,
    lastX,
    lastY,
    currentX,
    currentY;

    var pixelDataRef = new Firebase('https://vivid-heat-9597.firebaseio.com/');

    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1873b5';

    if (ctx === null) {
      alert("You must use a browser that supports HTML5 Canvas to run this demo.");
      return;
    }

    /*----------------------------------------------
                    Mouse Events
    ------------------------------------------------*/

    $("#draw").click(function(){ 
        draw = true; 
    });

    $("#eraser").click(function(){ 
        draw = false;
    });

    $(canvas).mousedown(function(e){
        lastX = e.pageX - this.offsetLeft;
        lastY  = e.pageY - this.offsetTop;
        paint = true;
    });

    $(canvas).mouseup(function(e){
        paint = false;
    });

    $(canvas).mouseleave(function(e){
        paint = false;
    });

    $(canvas).mousemove(function(e){
        if (paint) {
        currentX = e.pageX - this.offsetLeft;
        currentY = e.pageY - this.offsetTop;
        pixelDataRef.child(lastX + ":" + lastY).set(draw === false ? "destination-out" : "source-over");
        lastX = currentX;
        lastY = currentY; 
    }
    });

     /*----------------------------------------------
            Firebase Snapshot Function
    ------------------------------------------------*/

    var drawTime = function(snapshot) {
        var lastCoords = snapshot.key().split(":");
        ctx.globalCompositeOperation = snapshot.val();
        ctx.beginPath();
            if(draw === false) {
                ctx.strokeStyle = 'rgba(0,0,0,1)';
            }
        ctx.moveTo(lastCoords[0], lastCoords[1]);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
    };

    pixelDataRef.on('child_added', drawTime);
    pixelDataRef.on('child_changed', drawTime);
});

