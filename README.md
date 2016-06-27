# Scribble-Squid
Scribble Squid is a multi-user drawing application that utilizes the Websocket protocol's full-duplex communication channels
to create a fast, asynchronous, real-time drawing environment ideal for brainstorming ideas, reviewing designs, creating mocks,
group virtual whiteboarding, or simply having fun creating artwork with one another.  

https://scribblesquid.herokuapp.com

**Current Features:**

- Ability to change the color, size, and opacity of brushes for clarity, stressing design aspects, or for artistic purposes.
- Individual settings are local to each user and are independent of the choices of other users.
- Movable, resizable UI that enables the user to choose exactly where they would like the elements to be placed.
- Canvases can be saved at any time as a .PNG for easy access in the future.
- .PNGs are tied to user accounts created when they sign in for the first time.  Information is saved to an SQlite3 database.

**Future Enahncements:**

- Additional brushes such as: Airbrush, Ink-pen, and textured brushes.
- Ability to create 'rooms' each with their own canvases.  The creator of the room is designated the 'master' of the room who
is able set permissions to specifically allow which users allowed to draw and which users are only allowed to spectate.
- Chatroom to allow users to communicate as they draw.
- Functionality that will enable the application to be used with touch so that it can be utilized on tablets and
mobile devices.
- Enable users to save multiple canvases to the server and are able to return at a later date to view all of their saved
work and choose which one they would like to continue wokring on next.
- Photoshop-style layers for even greater ease of use and the ability to work non-destructively upon concepts, ideas, or 
artistic creations.
- Ability to share creations directly on Facebook, Twitter, or Tumblr.

**Technical Details:**

- Asynchronous, real-time capabilities built using the Websocket Protocol.
- Front-end: HTML5, CSS3, Javascript, jQuery, jQuery UI, Bootstrap, and Socket.io
- Back-End: Python (Flask) and SQLite3.

------------------------------------

An individual brushstroke is made by creating small line segments from the previous X/Y value to a new one every time the 
cursor passes a new set of coordinates while the mouse is down and moving.  All of the X/Y coordinates, as well as the user 
iD, several variable settings, and stroke information (opacity, color, width) are emitted from the client to the server 
via the Websocket protocol through Socket.io.  Server-side, the information is recieved by Flask via the Flask-Socketio 
extension and then broadcast to all active users currently utilizing the canvas.

When the broadcast reaches the original user that emited the data in the first place, a single line of code checks to see if 
the user id of the current user matches the user-id of the incoming data.  If there is a match, the stroke information is ignore
so the same line is not drawn twice.

Clicking the 'Save' button will pop up a window containing a .PNG of the users's current creation in order to enable them to 
save their creations to their computers while also saving the .PNG itself to disk and recording the user id, image id, and 
the URL of the image itself to a database.  Users are then free to walk away and return at any time to load up their images and
continue working.

An Open-Source Color Picker was utilized and integrated into the application. 




