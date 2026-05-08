from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
import datetime
from database import Base

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, default="Untitled Meeting")
    start_time = Column(DateTime, default=datetime.datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    summary = Column(Text, nullable=True)
    
    transcripts = relationship("TranscriptChunk", back_populates="meeting")
    action_items = relationship("ActionItem", back_populates="meeting")

class TranscriptChunk(Base):
    __tablename__ = "transcript_chunks"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"))
    text = Column(Text)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    speaker = Column(String, default="Speaker 1")

    meeting = relationship("Meeting", back_populates="transcripts")

class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"))
    task = Column(String)
    owner = Column(String)
    deadline = Column(String)

    meeting = relationship("Meeting", back_populates="action_items")
