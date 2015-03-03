$(document).ready(function () {

	// Setting up all the globals
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

    if (ctx === null) {
      alert("You must use a browser that supports HTML5 Canvas to run this demo.");
      return;
    }

	socket.on('moving', function (data) {	
		if(! (data.id in users)){
			cursors[data.id] = $('<p>').appendTo('#cursors');
		}
		
		if (data.id != id) {
			cursors[data.id].css({
				'left' : data.x - this.offsetLeft,
				'top' : data.y - this.offsetTop});
		}

		if(data.paint && users[data.id] && data.id != id && draw === true){
				makeStroke(users[data.id].x, users[data.id].y, data.x, data.y);
		}

		if(data.paint && users[data.id] && data.id != id && draw === false){
				eraser(users[data.id].x, users[data.id].y);
		}

		users[data.id] = data; 
		users[data.id].updated = $.now();
	});

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
				'x': e.pageX - this.offsetLeft,
				'y': e.pageY - this.offsetTop,
				'paint': paint,
				'draw': draw,
				'id': id
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

	setInterval(function(){
		for(var ident in users){
			if($.now() - users[ident].updated > 10000){
				cursors[ident].remove();
				delete users[ident];
				delete cursors[ident];
			}
		}	
	},10000);

    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1873b5';

    function eraser(lastX, lastY){
	    ctx.globalCompositeOperation="destination-out";
	    ctx.beginPath();
		ctx.arc(lastX, lastY, 8, 0, Math.PI*2, false);
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