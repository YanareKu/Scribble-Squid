from flask import Flask, render_template, request, session as flask_session, g, send_from_directory
from flask.ext.socketio import SocketIO, emit, send
from werkzeug import secure_filename
import model, base64, re
# import os

UPLOAD_FOLDER = 'static/img'

app = Flask(__name__, static_folder='static', static_url_path='/static')
app.debug = True
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# should probably hide this secret key at some point?
app.config['SECRET_KEY'] = 'TROLOLOLOLOLO!'
socketio = SocketIO(app)

@app.before_request
def global_variables():
    if "user" in flask_session:
        g.user_id = flask_session["user"]["id"]
        g.username = flask_session["user"]["username"]
        print flask_session

@app.route('/', methods=['GET', 'POST'])
def sign_up_log_in():
    if request.method == 'GET':
        return render_template('index.html')
    #----------------------------------------------------------------------
    # Find way to prevent modal from popping up if user already in session.
    #----------------------------------------------------------------------
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        user = model.get_user_by_username(username)

        if user == None:
            model.save_user_to_db(username, password)
            return "User entered into database."
        else:
            if user.password == password:
                flask_session["user"] = {"username":user.username, "id":user.id}
                return "AWWW YIS"
            else:
                return "AWWW NOO"

@app.route('/save', methods=['POST'])
def save_image():
    file = request.files['image']
    if file:
#        NOTE: Cant use os.path because WINDOWS doesn't agree on \ vs /
#        fullpath = os.path.join(app.config['UPLOAD_FOLDER'], filename) 
        fullpath = app.config['UPLOAD_FOLDER'] + "/" + g.username + ".png"
        file.save(fullpath)

        image = model.get_image_by_user_id(g.user_id)

        if image == None:
            model.save_image_to_db(g.user_id, fullpath)
            return "Image URL entered into database."
        else:
            return 
    return "Failure"

@socketio.on('broadcastImage')
def broadcast_image(data):
    emit('loadImage', data, broadcast=True)

@app.route('/static/img/<path:path>')
def send_js(path):
    fullpath = g.username + ".png"
    return send_from_directory('static/img', fullpath)

@socketio.on('connection')
def listen_send_all(data):
    emit('new user')

@socketio.on('mousemove')
def brdcast_moving(data):
    emit('moving', data, broadcast=True)

@socketio.on('deleteUnloaded')
def delete_unloaded(data):
    emit('deleteRemoteUser', data, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, host='127.0.0.1', port=5000)