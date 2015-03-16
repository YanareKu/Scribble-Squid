$(document).ready(function () {

    /*-----------------------------------------------------------
                   Set Globals, Canvas, and Stroke
    -------------------------------------------------------------*/

    //Later need to find way to limit the number of globals I use
    //to optimize code

    var canvasUpper = document.getElementById('upper'),
    canvasLower = document.getElementById('lower'),
    ctxUpper = canvasUpper.getContext('2d'),
    ctxLower = canvasLower.getContext('2d') ? canvasLower.getContext('2d') : null,
    url = 'http://localhost:5000',
    socket = io.connect(url),
    id = Math.round($.now()*Math.random()),
    lastEmit = $.now(),
    draw = false,
    airbrush = false,
    pencil = true,
    dragging = false,
    defaultLineColor = "#000000",
    defaultLineWidth = 15,
    defaultLineOpacity = 1.0,
    killOpacity = 0.0,
    localLineColor = defaultLineColor,
    localLineWidth = defaultLineWidth,
    localLineOpacity = defaultLineOpacity,
    loadOpacity = 1.0,
    users = {},
    cursors = {},
    lastPoint,
    colorStopBegin = 'rgba(0,0,0,1)',
    colorStopMid = 'rgba(0,0,0,0.3)',
    colorStopEnd = 'rgba(0,0,0,0)',
    mouseX,
    mouseY;

    ctxLower.fillStyle = "white";
    ctxLower.fillRect(0, 0, canvasLower.width, canvasLower.height);
    ctxLower.lineJoin = ctxUpper.lineJoin = 'round';
    ctxLower.lineCap = ctxUpper.lineCap = 'round';

    if (ctxLower === null) {
      alert("Whoops! You need a browser that supports HTML5 Canvas for this to work!");
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
                'left' : data.remote_mouseX - this.offsetLeft,
                'top' : data.remote_mouseY - this.offsetTop});
        }

        if(data.remote_draw && 
            users[data.remote_id] && 
            data.remote_id != id && 
            data.remote_pencil === true){
                ctxUpper.clearRect(0, 0, canvasLower.width, canvasLower.height);
                makeStroke(ctxUpper,
                    data.remote_color || defaultLineColor,
                    data.remote_width || defaultLineWidth,
                    data.remote_opacity || defaultLineOpacity, 
                    data.remote_mouseX, 
                    data.remote_mouseY);

        // } else if(data.remote_draw &&
        //     users[data.remote_id] &&
        //     data.remote_id != id &&
        //     data.remote_airbrush === true){ 
        //         var dist = distanceBetween(data.remote_lastPoint, data.remote_currentPoint),
        //         angle = angleBetween(data.remote_lastPoint, data.remote_currentPoint);
              
        //         for (var i = 0; i < dist; i+=5) {
                
        //             airX = data.remote_lastPoint.x + (Math.sin(angle) * i);
        //             airY = data.remote_lastPoint.y + (Math.cos(angle) * i);
                    
        //             var softbrush = ctxLower.createRadialGradient(airX, airY, 1, airX, airY, 30);
                    
        //             softbrush.addColorStop(0, data.remote_colorStopBegin);
        //             softbrush.addColorStop(0.0, data.remote_colorStopMid);
        //             softbrush.addColorStop(1, data.remote_colorStopEnd);
                    
        //             ctxLower.fillStyle = softbrush;
        //             ctxLower.fillRect(airX-40, airY-40, 80, 80);
        //         }

        } else if(data.remote_draw &&
            users[data.remote_id] &&
            data.remote_id != id &&
            data.remote_pencil === false &&
            data.remote_airbrush === false){
                ctxUpper.clearRect(0, 0, canvasLower.width, canvasLower.height);
                makeStroke(ctxUpper, 
                    "#FFFFFF",
                    data.remote_width || defaultLineWidth,
                    data.remote_opacity || defaultLineOpacity,
                    data.remote_mouseX, 
                    data.remote_mouseY);
        }

        users[data.remote_id] = data; 
    
    });

    socket.on('stopping', function(data) {
        if(data.remote_draw === false && 
            users[data.remote_id] && 
            data.remote_id != id && 
            data.remote_pencil &&
            data.remote_airbrush === false){
                ctxUpper.clearRect(0, 0, canvasLower.width, canvasLower.height);
                makeStroke(ctxLower,
                    data.remote_color || defaultLineColor,
                    data.remote_width || defaultLineWidth,
                    data.remote_opacity || defaultLineOpacity,
                    data.remote_mouseX, 
                    data.remote_mouseY);
        }

        if(data.remote_draw === false &&
            users[data.remote_id] &&
            data.remote_id != id &&
            data.remote_pencil === false &&
            data.remote_airbrush === false){
                ctxUpper.clearRect(0, 0, canvasLower.width, canvasLower.height);
                makeStroke(ctxLower, 
                    "#FFFFFF",
                    data.remote_width || defaultLineWidth,
                    data.remote_opacity || defaultLineOpacity,
                    data.remote_mouseX, 
                    data.remote_mouseY);
        }
        users[data.remote_id] = data; 
    });

    socket.on('loadImage', function (data) {
        load(canvasLower, data.remote_username);
    });

    socket.on('deleteRemoteUser', function (data) {
        cursors[data.remote_id].remove();
        delete users[data.remote_id];
        delete cursors[data.remote_id];
    });

    /*----------------------------------------------
                    Mouse Events
    ------------------------------------------------*/

    $(canvasUpper).mousedown(function(e){
        mouseX = [e.pageX - this.offsetLeft];
        mouseY = [e.pageY - this.offsetTop];
        lastPoint = { x: e.pageX - this.offsetLeft, y: e.pageY - this.offsetTop};
        draw = true;
    });

    $(canvasUpper).mouseleave(function(e){
        draw = false ;
    });

    $(canvasUpper).mousemove(function(e){
        if($.now() - lastEmit > 10){
            socket.emit('mousemove', {
                'remote_mouseX': mouseX,
                'remote_mouseY': mouseY,
                'remote_draw': draw,
                'remote_pencil': pencil,
                'remote_airbrush': airbrush,
                'remote_id': id,
                'remote_color': localLineColor,
                'remote_width': localLineWidth,
                'remote_opacity': localLineOpacity,
                'remote_currentPoint': currentPoint,
                'remote_lastPoint': lastPoint,
                'remote_colorStopBegin': colorStopBegin,
                'remote_colorStopMid': colorStopMid,
                'remote_colorStopEnd': colorStopEnd
            }); 
            lastEmit = $.now();
        }
        
        if(draw){
            mouseX.push(e.pageX - this.offsetLeft);
            mouseY.push(e.pageY - this.offsetTop);

            if(pencil){
                ctxUpper.clearRect(0, 0, canvasLower.width, canvasLower.height);
                makeStroke(ctxUpper, 
                    localLineColor, 
                    localLineWidth, 
                    localLineOpacity, 
                    mouseX, mouseY);

            } else if(airbrush) {
                var currentPoint = {x: e.pageX - this.offsetLeft, y: e.pageY - this.offsetTop},
                dist = distanceBetween(lastPoint, currentPoint),
                angle = angleBetween(lastPoint, currentPoint);
              
                for (var i = 0; i < dist; i+=5) {
                
                    airX = lastPoint.x + (Math.sin(angle) * i);
                    airY = lastPoint.y + (Math.cos(angle) * i);
                    
                    var softbrush = ctxLower.createRadialGradient(airX, airY, 1, airX, airY, 30);
                    
                    softbrush.addColorStop(0, colorStopBegin);
                    softbrush.addColorStop(0.0, colorStopMid);
                    softbrush.addColorStop(1, colorStopEnd);
                    
                    ctxLower.fillStyle = softbrush;
                    ctxLower.fillRect(airX-40, airY-40, 80, 80);
                }
              
              lastPoint = currentPoint;

            } else if(pencil === false && airbrush === false) {
                ctxUpper.clearRect(0, 0, canvasLower.width, canvasLower.height);
                makeStroke(ctxUpper, 
                    "#FFFFFF", 
                    localLineWidth, 
                    localLineOpacity, 
                    mouseX, mouseY);
            }
        }
    });

    $(canvasUpper).mouseup(function(e){
        draw = false;
            socket.emit('mouseup', {
                'remote_mouseX': mouseX,
                'remote_mouseY': mouseY,
                'remote_draw': draw,
                'remote_pencil': pencil,
                'remote_id': id,
                'remote_color': localLineColor,
                'remote_width': localLineWidth,
                'remote_opacity': localLineOpacity
            });

        if(pencil){
            ctxUpper.clearRect(0, 0, canvasLower.width, canvasLower.height);
            makeStroke(ctxLower, 
                localLineColor, 
                localLineWidth, 
                localLineOpacity, 
                mouseX, mouseY);

        } else if(pencil === false && airbrush === false) {
            ctxUpper.clearRect(0, 0, canvasLower.width, canvasLower.height);
            makeStroke(ctxLower, 
                "#FFFFFF", 
                localLineWidth, 
                localLineOpacity, 
                mouseX, mouseY);
        } 
    });

    $("#pencil").click(function(){ 
        pencil = true; 
        airbrush = false;
    });

    $("#eraser").click(function(){ 
        pencil = false;
        airbrush = false;
    });

    $("#airbrush").click(function(){ 
        pencil = false;
        airbrush = true;
    });

    $("#save").click(function(){
        save(canvasLower, users.username + ".png");
    });

    $("#load").click(function(){
        socket.emit('broadcastImage', {
            'remote_username' : users.username,
        });
    });

    $("#brush_size").on("change", function() {
        localLineWidth = this.value;});

    $("#opacity").on("change", function() {
        localLineOpacity = this.value;});

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
                    //----- Think of solution more elegant than alert in future ----
                    alert("Whoops! Looks like you've got the wrong username and password combination!");}
                });
        });
    });

    $('#signInModal').modal({backdrop: 'static', show: true});

    /*----------------------------------------------
                Tool Functions
    ------------------------------------------------*/

    function save(canvas, filename) {  
        var data = ctxLower.getImageData(0, 0, 800, 800);  
        var canvasData = canvasLower.toDataURL("image/png");
        userArt = window.open(canvasData, "Right click to Save!", "width=500, height=500");
        //Splits metadata from the image data. Decodes base64 image data.
        var decodedImg = atob(canvasData.split(',')[1]);
        var array = [];
        //decoded data converted to unicode and pushed into array
        for( var i=0; i<decodedImg.length; ++i ) {
            array.push( decodedImg.charCodeAt(i));}
        //array turned into bytes and then made into a Blob object.
        var file = new Blob([new Uint8Array(array)], {type: 'image/png'});
        //'fake' form data sent as ajax to flask server
        formData = new FormData();
        formData.append('image', file, filename);
        var callback = function(data) {};
        $.ajax({
            url : '/save',
            type : 'POST',
            processData : false,
            contentType : false,
            data : formData
        });
    }
    
    function load(canvas, username) {
        ctxLower.clearRect(0, 0, 800, 800);
        ctxLower.globalAlpha = loadOpacity;
        var image = new Image();
        image.onload = function() {ctxLower.pencilImage(this, 0, 0);};
        image.src = "static/img/" + username + ".png";
        console.log(image.src);
    }

    function makeStroke(ctx, color, width, opacity, x, y){
        ctx.strokeStyle = color;
        ctx.lineWidth   = width;
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.moveTo(x[0],y[0]);
        for (i=1; i < x.length; i++){
            ctx.lineTo(x[i],y[i]);}
        ctx.stroke();
    }

    function distanceBetween(point1, point2) {
        return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
    }

    function angleBetween(point1, point2) {
         return Math.atan2( point2.x - point1.x, point2.y - point1.y );
    }

    /*--------------------------------------------------
      Mini-Sphere Copyright (c) 2010-2015 Michael Deal. 
                   All rights reserved.
    ---------------------------------------------------*/
    /* http://www.colorjack.com/software/dhtml+color+sphere.html */

    function _(v,o) { return((typeof(o)=='object'?o:document).getElementById(v)); }
    function _S(o) { o=_(o); if(o) return(o.style); }
    function abPos(o) { var o=(typeof(o)=='object'?o:_(o)), z={X:0,Y:0}; while(o!=null) { z.X+=o.offsetLeft; z.Y+=o.offsetTop; o=o.offsetParent; }; return(z); }
    function agent(v) { return(Math.max(navigator.userAgent.toLowerCase().indexOf(v),0)); }
    function isset(v) { return((typeof(v)=='undefined' || v.length==0)?false:true); }
    function toggle(i,t,xy) { var v=_S(i); v.display=t?t:(v.display=='none'?'block':'none'); if(xy) { v.left=xy[0]; v.top=xy[1]; } }
    function XY(e,v) { var o=agent('msie')?{'X':e.clientX+document.body.scrollLeft,'Y':e.clientY+document.body.scrollTop}:{'X':e.pageX,'Y':e.pageY}; return(v?o[v]:o); }
    function zero(n) { return(!isNaN(n=parseFloat(n))?n:0); }
    function zindex(d) { d.style.zIndex=zINDEX++; }

    /* COLOR PICKER */

    Picker={};

    Picker.stop=1;

    Picker.core=function(o,e,xy,z,fu) {

        function point(a,b,e) { eZ=XY(e); commit([eZ.X+a,eZ.Y+b]); }
        function M(v,a,z) { return(Math.max(!isNaN(z)?z:0,!isNaN(a)?Math.min(a,v):v)); }

        function commit(v) { if(fu) fu(v);
        
            if(o=='mCur') { var W=parseInt(_S('mSpec').width), W2=W/2, W3=W2/2; 

                var x=v[0]-W2-3, y=W-v[1]-W2+21, SV=Math.sqrt(Math.pow(x,2)+Math.pow(y,2)), hue=Math.atan2(x,y)/(Math.PI*2);

                hsv={'H':hue>0?(hue*360):((hue*360)+360), 'S':SV<W3?(SV/W3)*100:100, 'V':SV>=W3?Math.max(0,1-((SV-W3)/(W2-W3)))*100:100};

                _('mHEX').innerHTML=color.HSV_HEX(hsv); 
                _S('plugID').background='#'+_('mHEX').innerHTML;
                color.cords(W);
                localLineColor = '#'+_('mHEX').innerHTML;
            }

            else if(o=='mSize') { var b=Math.max(Math.max(v[0],v[1])+oH,75); color.cords(b);

                _S('mini').height=(b+28)+'px'; _S('mini').width=(b+20)+'px';
                _S('mSpec').height=b+'px'; _S('mSpec').width=b+'px';

            } else {
            
                if(xy) v=[M(v[0],xy[0],xy[2]), M(v[1],xy[1],xy[3])]; // XY LIMIT

                if(!xy || xy[0]) d.left=v[0]+'px'; if(!xy || xy[1]) d.top=v[1]+'px';

            }
        }

        if(Picker.stop) { Picker.stop=''; var d=_S(o), eZ=XY(e); if(!z) zindex(_(o));

            if(o=='mCur') { var ab=abPos(_(o).parentNode); point(-(ab.X-5),-(ab.Y-28),e); }
            
            if(o=='mSize') { var oH=parseInt(_S('mSpec').height), oX=-XY(e).X, oY=-XY(e).Y; }
            
            else { var oX=zero(d.left)-eZ.X, oY=zero(d.top)-eZ.Y; }

            document.onmousemove=function(e){ if(!Picker.stop) point(oX,oY,e); };
            document.onmouseup=function(){ Picker.stop=1; document.onmousemove=''; document.onmouseup=''; };

        }
    };

    Picker.hsv={H:0, S:0, V:100};

    zINDEX=2;


    /* COLOR LIBRARY */

    color={};

    color.cords=function(W) {

        var W2=W/2, rad=(hsv.H/360)*(Math.PI*2), hyp=(hsv.S+(100-hsv.V))/100*(W2/2);

        _S('mCur').left=Math.round(Math.abs(Math.round(Math.sin(rad)*hyp)+W2+3))+'px';
        _S('mCur').top=Math.round(Math.abs(Math.round(Math.cos(rad)*hyp)-W2-21))+'px';

    };

    color.HEX=function(o) { o=Math.round(Math.min(Math.max(0,o),255));

        return("0123456789ABCDEF".charAt((o-o%16)/16)+"0123456789ABCDEF".charAt(o%16));

    };

    color.RGB_HEX=function(o) { var fu=color.HEX; return(fu(o.R)+fu(o.G)+fu(o.B)); };

    color.HSV_RGB=function(o) {
        
        var R, G, A, B, C, S=o.S/100, V=o.V/100, H=o.H/360;

        if(S>0) { if(H>=1) H=0;

            H=6*H; F=H-Math.floor(H);
            A=Math.round(255*V*(1-S));
            B=Math.round(255*V*(1-(S*F)));
            C=Math.round(255*V*(1-(S*(1-F))));
            V=Math.round(255*V); 

            switch(Math.floor(H)) {

                case 0: R=V; G=C; B=A; break;
                case 1: R=B; G=V; B=A; break;
                case 2: R=A; G=V; B=C; break;
                case 3: R=A; G=B; B=V; break;
                case 4: R=C; G=A; B=V; break;
                case 5: R=V; G=A; B=B; break;

            }
 // ------------------------------------------ASK FOR HELP IN INSERTING THESE!
            console.log({'R':R?R:0, 'G':G?G:0, 'B':B?B:0, 'A':1});
            //only prints out R value
            console.log("rgba(" + R?R:0 + ", " + G?G:0 + ", " + B?B:0 + ", " + 1 + ")");
            colorStopBegin = "rgba(" + R?R:0 + ", " + G?G:0 + ", " + B?B:0 + ", " + 1 + ")";
            colorStopMid = "rgba(" + R?R:0 + ", " + G?G:0 + ", " + B?B:0 + ", " + 0.3 + ")";
            colorStopEnd = "rgba(" + R?R:0 + ", " + G?G:0 + ", " + B?B:0 + ", " + 0 + ")";

            return({'R':R?R:0, 'G':G?G:0, 'B':B?B:0, 'A':1});
        }

        else {
            colorStopBegin = "rgba(" + (V=Math.round(V*255)) + ", " + V + ", " + V + ", " + 1 + ")";
            colorStopMid = "rgba(" + (V=Math.round(V*255)) + ", " + V + ", " + V + ", " + 0.3 + ")";
            colorStopEnd = "rgba(" + (V=Math.round(V*255)) + ", " + V + ", " + V + ", " + 0 + ")";
            return({'R':(V=Math.round(V*255)), 'G':V, 'B':V, 'A':1});
        }
    };

    color.HSV_HEX=function(o) { return(color.RGB_HEX(color.HSV_RGB(o))); };


});