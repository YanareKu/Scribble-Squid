$(document).ready(function () {

    /*-----------------------------------------------------------
                   Set Globals, Canvas, and Stroke
    -------------------------------------------------------------*/

    //Later need to find way to limit the number of globals I use
    //to optimize code

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

//------------------- TESTING UPLOAD -----------------------//

    socket.on('inferno', function (data) {
        if(data.remote_id != id) {
            fireTiger();
        }
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

//------------------- TESTING UPLOAD -----------------------//

    $("#FIRE").click(function() {
        fireTiger();
        socket.emit('tigerTime', {
            'remote_id': id
        });
    });

    $("#draw").click(function(){ 
        draw = true; 
    });

    $("#eraser").click(function(){ 
        draw = false;
    });

    $("#save").click(function(){
        save(canvas, "butts" + ".png");
    });

    $("#load").click(function(){
        load(canvas);
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
                Sign Up and Log in
    ------------------------------------------------*/

    function signUpLogIn(){
    return '<div class="modal fade" id="signInModal">' +
    '<div class="modal-dialog">' +
    '<div class="modal-content">' +
    '<div class="modal-header">' +
    '<h3 class="modal-title">Sign Up or Log In!</h3>' +
    '</div>' +
    '<div class="modal-body">' + 
    '<p>Username: <input type="text" size="30" class="loginInput" id="username"></p>' +
    '<p>Password: <input type="password" size="60" class="loginInput" id="password"></p>' +
    '</div>' +
    '<div class="modal-footer">' +
    '<input type="submit" id="submitBtn">' +
    '</div>' + // footer
    '</div>' + // content
    '</div>' + // dialog
    '<div>';
    } 

    $("body").append(signUpLogIn());
    $('#signInModal').on('shown.bs.modal', function () {
        $('#submitBtn').attr('disabled', 'disabled');

        $('input[type=text], input[type=password]').keyup(function() {      
            if ($('#username').val() !=='' && $('#password').val() !== '') {    
                $('#submitBtn').removeAttr('disabled');
            } else {
                $('#submitBtn').attr('disabled', 'disabled');
            }
        });

        $("#submitBtn").click(function (evt) {
            users.username = $("#username").val().trim();
            users.password = $("#password").val();
            $.post("/", 
                {'username': users.username,
                'password': users.password},
                function (result, error) { 
                    if (result == "AWWW YIS") {
                        $('#signInModal').modal('hide');
                    } else if (result == "AWWW NOO") { 
                    alert("Whoops! Looks like you've got the wrong username and password combination!");}
                });
        });
    });

    $('#signInModal').modal({backdrop: 'static', show: true});

    /*----------------------------------------------
                Tool Functions
    ------------------------------------------------*/
// TERRIFYING ARRAY METHOD

    // function save(){            
    //     var img = canvas.toDataURL("image/png");
    //     userArt = window.open(img, "Right click to Save!", "width=500, height=500");

    //     var imgData=ctx.getImageData(0, 0, canvas.width, canvas.height);
    //     var imgDataArray = JSON.stringify(imgData);

    //     $.post("/saveImage", {'imgDataArray' : imgDataArray}, 
    //         function(result) { alert("ARRAY HAS BEEN SENT!"); });  
    // }

    function save(canvas, filename) {
        console.log("BUTTON HIT!" + filename);     
        var data = ctx.getImageData( 0, 0, 800, 800 );  
        for( var i=0; i<2400; i+=4 )
        {
            data.data[i]=255;
        }
        ctx.putImageData( data, 0, 0 );    
        var canvasData = canvas.toDataURL("image/png");
        //userArt = window.open(canvasData, "Right click to Save!", "width=500, height=500");
        //Splits metadata from the image data. Decodes base64 image data.
        var decodedImg = atob(canvasData.split(',')[1]);
        var array = [];
        //decoded data converted to unicode and pushed into array
        for( var i=0; i<decodedImg.length; ++i ) {
            array.push( decodedImg.charCodeAt(i) );
        }
        //array turned into bytes and then made into a Blob object.
        var file = new Blob([new Uint8Array(array)], {type: 'image/png'});
        //'fake' form data sent as ajax to flask server
        formData = new FormData();
        formData.append('image', file, filename);
        var callback = function(data) {};
        $.ajax({
            url : '/upload',
            type : 'POST',
            processData : false,
            contentType : false,
            data : formData,
            success : callback
        });
    }
    
    function load(canvas) {
        var image = new Image();
        image.onload = function() { ctx.drawImage(this, 0, 0); };
        image.src = "static/img/fish.png";
    }

    function makeStroke(lastX, lastY, newX, newY){
        ctx.globalCompositeOperation = "source-over";
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(newX, newY);
        ctx.stroke();
    }

    function eraser(lastX, lastY, newX, newY){
        ctx.globalCompositeOperation="destination-out";
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(newX, newY);
        ctx.stroke(); 
    }

//------------------- TESTING UPLOAD -----------------------//

    function fireTiger() {
        ctx.globalCompositeOperation = "source-over";
        var base_image = new Image();
        base_image.src = "http://yanareku.com/illustration/FireElemental.jpg";
        base_image.onload = function(){
            ctx.drawImage(base_image, 0, 0);
        };
    }
});