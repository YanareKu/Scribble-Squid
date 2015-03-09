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
    lastEmit = $.now(),
    lastX,
    lastY,
    currentX,
    currentY;

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
                    users[data.remote_id].remote_x, 
                    users[data.remote_id].remote_y,
                    data.remote_x, 
                    data.remote_y);
        }
        users[data.remote_id] = data; 
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
        currentX = e.pageX - this.offsetLeft;
        currentY = e.pageY - this.offsetTop;
        if($.now() - lastEmit > 10){
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
                makeStroke(lastX, lastY, currentX, currentY); 
            } else if(draw === false) {
                eraser(lastX, lastY, currentX, currentY); 
            }
            lastX = currentX;
            lastY = currentY; 
        }
    });

    $("#draw").click(function(){ 
        draw = true; 
    });

    $("#eraser").click(function(){ 
        draw = false;
    });

    $("#save").click(save);

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

    //saves the canvas into a string as a base64 png image.   
    //jsvalue is sent to the server by an html form

    //Saving image to database currently bugged.

    function save(){            
        var img = canvas.toDataURL("image/png"); 
        userArt = window.open(img, "Right click to Save!", "width=500, height=500");

        // $.post("/saveImage", {imgBase64: img});  
        }

    function signUpLogIn(){
    return '<div class="modal fade" id="signInModal">' +
    '<div class="modal-dialog">' +
    '<div class="modal-content">' +
    '<div class="modal-header">' +
    '<h3 class="modal-title">Sign Up or Log In!</h3>' +
    '</div>' +
    '<div class="modal-body">' + 
    '<p>Username: <input type="text" size="30" name="username" class="userNameInput"></p>' +
    '<p>Password: <input type="password" size="60" name="password" class="userPassInput">' +
    '</div>' +
    '<div class="modal-footer">' +
    '<button type="button" class="btn btn-confirm" data-dismiss="modal">Confirm</button>' +
    '</div>' + // footer
    '</div>' + // content
    '</div>' + // dialog
    '<div>';
    } 

    $("body").append(signUpLogIn());
    $('#signInModal').on('shown.bs.modal', function () {
        $(".confirm").click(function () {
            users[username] = $(".userNameInput").val().trim();
            users[password] = $(".userPassInput").val();
        });
    });

    $('#signInModal').modal("show");

    function eraser(lastX, lastY, newX, newY){
        ctx.globalCompositeOperation="destination-out";
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(newX, newY);
        ctx.stroke(); 
    }

    function makeStroke(lastX, lastY, newX, newY){
        ctx.globalCompositeOperation = "source-over";
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(newX, newY);
        ctx.stroke(); 
    }

});