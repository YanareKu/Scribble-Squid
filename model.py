from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import sessionmaker, relationship, backref, scoped_session

ENGINE = create_engine("sqlite:///users.db", echo=True)
session = scoped_session(sessionmaker(bind=ENGINE, 
	autocommit = False, 
	autoflush = False))

Base = declarative_base()
Base.query = session.query_property()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key = True)
    username = Column(String(30))
    password = Column(String(64))

    def is_authenticated(self):
        return True

    def is_anonymous(self):
        return False

    def get_id(self):
        return unicode(self.id)

    def __repr__(self):
    	return "User id = %d, username = %s, password = %s" % (
        	self.id, self.username, self.password)


class Image(Base):
    __tablename__ = 'images'
    id = Column(Integer, primary_key = True)
    user_id = Column(Integer, ForeignKey('users.id'))
    filepath = Column(String(200), nullable = False) 

    user = relationship('User', backref = backref('images'))

    def __repr__(self):
        return "Image id=%r User_id=%r Filepath=%s" % (
            self.id, self.user_id, self.filepath)


def get_user_by_username(username):
    """returns a user by username from database"""
    user = session.query(User).filter(User.username == username).first()
    return user

def save_user_to_db(username, password):
    new_user = User(username=username, password=password)
    session.add(new_user)
    return session.commit()

def save_image_to_db(filepath):
    new_image = Image(filepath=filepath)
    session.add(new_image)
    return session.commit()

def main():
    """In case we need this for something"""
    pass

if __name__ == "__main__":
	main()