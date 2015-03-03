from flask import Flask, render_template, request
from flask.ext.socketio import SocketIO, emit, send

app = Flask(__name__)
app.debug = True
app.config['SECRET_KEY'] = 'TROLOLOLOLOLO!'
socketio = SocketIO(app)

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connection')
def listen_send_all(data):
    emit('new user')

@socketio.on('mousemove')
def brdcast_moving(data):
    emit('moving', data, broadcast=True)

@socketio.on('erase')
def eraser_time(data):
    emit('erase_on', data, broadcast=True)

@socketio.on('draw')
def paint_time(data):
    emit('erase_off', data, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, host='127.0.0.1', port=5000)
    