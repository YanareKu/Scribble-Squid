from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import sessionmaker, relationship, backref, scoped_session
import os.path
from os import listdir, getcwd
from IPython.core.display import Image 

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

    def __repr__(self):
    	return "User id = %d, username = %s, password = %s!" % (
        	self.id, self.username, self.password)

def get_user_by_username(username):
    """returns a user by username from database"""
    user = session.query(User).filter(User.username == username).first()
    return user

def add_user_to_db(username, password):
    new_user = User(username=username, password=password)
    session.add(new_user)
    return session.commit()

def main():
    """In case we need this for something"""
    pass

if __name__ == "__main__":
	main()