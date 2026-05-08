from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
import tempfile

from database import engine, get_db
import models
from services.ai_service import transcribe_audio, generate_realtime_summary, generate_final_analysis

from services.routers import meetings

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Meeting Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meetings.router)

@app.get("/")
def read_root():
    return {"message": "AI Meeting Assistant API is running"}

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

manager = ConnectionManager()

@app.websocket("/ws/meeting/{meeting_id}")
async def websocket_endpoint(websocket: WebSocket, meeting_id: int, db: Session = Depends(get_db)):
    await manager.connect(websocket)
    full_transcript = ""
    try:
        while True:
            # Receive audio chunk from client (expecting bytes)
            data = await websocket.receive_bytes()
            
            # Save bytes to a temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
                temp_audio.write(data)
                temp_audio_path = temp_audio.name
                
            # Transcribe
            transcript_text = await transcribe_audio(temp_audio_path)
            os.remove(temp_audio_path) # Clean up
            
            if transcript_text.strip():
                # Save to database
                db_chunk = models.TranscriptChunk(meeting_id=meeting_id, text=transcript_text)
                db.add(db_chunk)
                db.commit()
                
                full_transcript += " " + transcript_text
                
                # Send back transcript
                await websocket.send_json({"type": "transcript", "text": transcript_text})
                
                # Periodically generate real-time summary (simplification: generate every few chunks)
                # In a real app, do this based on time elapsed or chunk count
                if len(full_transcript) > 50:
                    summary = await generate_realtime_summary(full_transcript)
                    await websocket.send_json({"type": "summary", "text": summary})
                    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        # End of meeting -> Generate final summary
        if full_transcript.strip():
            final_data = await generate_final_analysis(full_transcript)
            
            # Save to meeting
            meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
            if meeting:
                meeting.summary = final_data.get("summary", "")
                
                for item in final_data.get("action_items", []):
                    db_item = models.ActionItem(
                        meeting_id=meeting_id,
                        task=item.get("task", ""),
                        owner=item.get("owner", ""),
                        deadline=item.get("deadline", "")
                    )
                    db.add(db_item)
                db.commit()
