$(document).ready(function () {

    /*-----------------------------------------------------------
                   Set Globals, Canvas, and Stroke
    -------------------------------------------------------------*/
    
    var canvas = document.getElementById('paper'),
    ctx = canvas.getContext('2d') ? canvas.getContext('2d') : null,
    url = 'http://localhost:5000',
    socket = io.connect(url),
    id = Math.round($.now()*Math.random()),
    paint = false,
    draw = true,
    users = {},
    cursors = {},
    last_coord = {},
    lastEmit = $.now(); 

    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1873b5';

    if (ctx === null) {
      alert("You must use a browser that supports HTML5 Canvas to run this demo.");
      return;
    }

    /*-----------------------------------------------------------
                    Socket Events // Remote Users
    -------------------------------------------------------------*/
    socket.on('moving', function (data) {
       
        if(!(data.remote_id in users)){
            cursors[data.remote_id] = $('<p>').appendTo('#cursors');
        }
        
        if (data.remote_id != id) {
            cursors[data.remote_id].css({
                'left' : data.remote_x - this.offsetLeft,
                'top' : data.remote_y - this.offsetTop});
        }

        if(data.remote_paint && 
            users[data.remote_id] && 
            data.remote_id != id && 
            data.remote_draw === true){
                makeStroke(
                    users[data.remote_id].remote_x, 
                    users[data.remote_id].remote_y, 
                    data.remote_x, 
                    data.remote_y);
        }

        if(data.remote_paint &&
            users[data.remote_id] &&
            data.remote_id != id &&
            data.remote_draw === false){
                eraser(
                    data.remote_x, 
                    data.remote_y);
        }

        users[data.remote_id] = data; 
        users[data.remote_id].updated = $.now();
    });

    socket.on('deleteRemoteUser', function (data) {
        cursors[data.remote_id].remove();
        delete users[data.remote_id];
        delete cursors[data.remote_id];
    });

    /*----------------------------------------------
                    Mouse Events
    ------------------------------------------------*/
    $(canvas).mousedown(function(e){
        paint = true;
        last_coord.x = e.pageX - this.offsetLeft;
        last_coord.y = e.pageY - this.offsetTop;
    });

    $(canvas).mouseup(function(e){
        paint = false;
    });

    $(canvas).mouseleave(function(e){
        paint = false;
    });

    $(canvas).mousemove(function(e){
        if($.now() - lastEmit > 30){
            socket.emit('mousemove',{
                'remote_x': e.pageX - this.offsetLeft,
                'remote_y': e.pageY - this.offsetTop,
                'remote_paint': paint,
                'remote_draw': draw,
                'remote_id': id
            }); 
            lastEmit = $.now();
        }
        
        if(paint){
            if(draw){
                makeStroke(last_coord.x, last_coord.y, e.pageX - this.offsetLeft, e.pageY - this.offsetTop); 
            } else if(draw === false) {
                eraser(last_coord.x, last_coord.y);
            }
            last_coord.x = e.pageX - this.offsetLeft;
            last_coord.y = e.pageY - this.offsetTop; 
        }
    });

    $("#draw").click(function(){ 
        draw = true; 
    });

    $("#eraser").click(function(){ 
        draw = false;
    });

    /*----------------------------------------------
             Remove User if They Close Or 
              Navigate Away from Window
    ------------------------------------------------*/  

    window.onunload = function(e) {
        socket.emit('deleteUnloaded', {
            'remote_id': id
        });
    };

    /*----------------------------------------------
                Tool Functions
    ------------------------------------------------*/  


    function eraser(mouseX, mouseY){
        ctx.globalCompositeOperation="destination-out";
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 8, 0, Math.PI*2, false);
        ctx.fill();
    }

    function makeStroke(lastX, lastY, newX, newY){
        ctx.globalCompositeOperation = "source-over";
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(newX, newY);
        ctx.stroke(); 
    }

});