from flask import Flask, render_template, request, session as flask_session, redirect, url_for, flash, g
from flask.ext.socketio import SocketIO, emit, send
import model, base64, os, uuid, re

UPLOAD_FOLDER = '/Desktop/Hackbright/Hackbright_Project/static/img'

app = Flask(__name__)
app.debug = True
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# should probably hide this secret key at some point?
app.config['SECRET_KEY'] = 'TROLOLOLOLOLO!'
socketio = SocketIO(app)

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
            return "YES"
        else:
            if user.password == password:
                flask_session["user"] = {"username":user.username, "id":user.id}
                return "AWWW YIS"
            else:
                return "AWWW NOO"


# @app.route("/saveImage", methods=["POST"])
# def save_image():
#     """gets image data from AJAX. Decodes base64 png.
#     Assigns a unique filename to png. Joins upload path with
#     filename.  Saves file to disk. Saves url to database."""
#     image_data = str(request.form.get('data'))
#     decoded_data = re.sub('^data:image/.+;base64,', '', image_data).decode('base64')
#     filename = str(uuid.uuid4()) + '.png'
#     fullpath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

#     img_file = open(fullpath, 'wb')
#     for line in decoded_data:
#         img_file.write(line)
#     img_file.close()

#     model.save_image_to_db(fullpath)
#     return redirect("/index.html")

@socketio.on('connection')
def listen_send_all(data):
    emit('new user')

@socketio.on('mousemove')
def brdcast_moving(data):
    emit('moving', data, broadcast=True)

@socketio.on('tigerTime')
def tiger_time(data):
    emit('inferno', data, broadcast=True)

@socketio.on('deleteUnloaded')
def delete_unloaded(data):
    emit('deleteRemoteUser', data, broadcast=True)
    print data

if __name__ == '__main__':
    socketio.run(app, host='127.0.0.1', port=5000)