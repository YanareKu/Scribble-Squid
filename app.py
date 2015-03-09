from flask import Flask, render_template, request, session, redirect, url_for, flash, g
from flask.ext.socketio import SocketIO, emit, send
from flask.ext.login import LoginManager, login_user, logout_user, current_user, login_required
from model import User
import base64, os, uuid, re

UPLOAD_FOLDER = '/Desktop/Hackbright/Hackbright_Project/static/img'

app = Flask(__name__)
app.debug = True
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# should probably hide this secret key at some point?
app.config['SECRET_KEY'] = 'TROLOLOLOLOLO!'
socketio = SocketIO(app)
login_manager = LoginManager()
login_manager.init_app(app)

@app.route('/')
def index():
    # if g.user is not None and g.user.is_authenticated():
    #     return redirect(url_for('index'))

    # username = request.form.get("username")
    # password = request.form.get("password")

    # user = model.get_user_by_username(username)

    # if user == None:
    #     model.add_user_to_db()
    #     flash("Please login using your new user information.")
    #     return redirect("/login_route")
    # else:
    #     flash("This email is already registered to a user")
    #     return redirect("/signup")

    return render_template('index.html')


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

@socketio.on('deleteUnloaded')
def delete_unloaded(data):
    emit('deleteRemoteUser', data, broadcast=True)
    print data

if __name__ == '__main__':
    socketio.run(app, host='127.0.0.1', port=5000)