from flask import Flask, render_template, request, session as flask_session, g, send_from_directory
from flask.ext.socketio import SocketIO, emit, send
from werkzeug import secure_filename
import model, base64, os, uuid, re

UPLOAD_FOLDER = '/static/img'

app = Flask(__name__)
app.debug = True
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# should probably hide this secret key at some point?
app.config['SECRET_KEY'] = 'TROLOLOLOLOLO!'
socketio = SocketIO(app)

@app.before_request
def global_variables():
    if "user" in flask_session:
        g.user_id = flask_session["user"]["id"]

@app.route('/', methods=['GET', 'POST'])
def sign_up_log_in():
    if request.method == 'GET':
        return render_template('index.html')
    # if user already in session how to stop modal from popping up?
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        print username, password

        user = model.get_user_by_username(username)

        if user == None:
            model.save_user_to_db(username=username, password=password)
            return "User entered into database."
        else:
            if user.password == password:
                flask_session["user"] = {"username":user.username, "id":user.id}
                return "AWWW YIS"
            else:
                return "AWWW NOO"

# ----------------- array method that is terrifying as shit
# @app.route('/saveImage', methods=['POST'])
# def save():
#     if request.method == 'POST':
#         imgDataArray = request.form['imgDataArray']
#         model.save_image_to_db(user_id=g.user_id, img_array=imgDataArray)
#         return "FUCK YEAH CHECK THE DB!"
#     return "OH FUCK SOMETHING WENT WRONG!"





@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['image']
    if file:
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        return "Success"
    return "Failure"

# @app.route('/img/<path:path>')
# def send_js(path):
#    return send_from_directory('img', path)

# @app.route('/save', methods=['POST'])
# def save():
#     img_data = request.files['image']
#     if img_data:
#         filename = str(uuid.uuid4()) + '.png'
#         fullpath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
#         model.save_image_to_db()
#         img_data.save(fullpath)
#         return "Success"
#     return "Failure"

@socketio.on('connection')
def listen_send_all(data):
    emit('new user')

@socketio.on('mousemove')
def brdcast_moving(data):
    emit('moving', data, broadcast=True)

# ------------------- TESTING UPLOAD -----------------------

@socketio.on('tigerTime')
def tiger_time(data):
    emit('inferno', data, broadcast=True)

@socketio.on('deleteUnloaded')
def delete_unloaded(data):
    emit('deleteRemoteUser', data, broadcast=True)
    print data

if __name__ == '__main__':
    socketio.run(app, host='127.0.0.1', port=5000)