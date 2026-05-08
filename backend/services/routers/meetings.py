from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
import models
import io
from pydantic import BaseModel
from services.email_service import send_meeting_summary
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import simpleSplit

router = APIRouter(
    prefix="/api/meetings",
    tags=["meetings"],
)

@router.post("/")
def create_meeting(title: str = "Untitled Meeting", db: Session = Depends(get_db)):
    db_meeting = models.Meeting(title=title)
    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)
    return db_meeting

@router.get("/")
def get_meetings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    meetings = db.query(models.Meeting).order_by(models.Meeting.start_time.desc()).offset(skip).limit(limit).all()
    return meetings

@router.get("/{meeting_id}")
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Get action items
    action_items = db.query(models.ActionItem).filter(models.ActionItem.meeting_id == meeting_id).all()
    
    return {
        "id": meeting.id,
        "title": meeting.title,
        "start_time": meeting.start_time,
        "end_time": meeting.end_time,
        "summary": meeting.summary,
        "action_items": action_items
    }

@router.get("/{meeting_id}/export/pdf")
def export_meeting_pdf(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    action_items = db.query(models.ActionItem).filter(models.ActionItem.meeting_id == meeting_id).all()
    
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 50
    
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, y, f"Meeting Summary: {meeting.title}")
    y -= 30
    
    p.setFont("Helvetica", 12)
    p.drawString(50, y, f"Date: {meeting.start_time}")
    y -= 40
    
    p.setFont("Helvetica-Bold", 14)
    p.drawString(50, y, "Summary:")
    y -= 20
    
    p.setFont("Helvetica", 12)
    summary_text = meeting.summary or "No summary available."
    lines = simpleSplit(summary_text, "Helvetica", 12, width - 100)
    for line in lines:
        if y < 50:
            p.showPage()
            y = height - 50
            p.setFont("Helvetica", 12)
        p.drawString(50, y, line)
        y -= 15
        
    y -= 20
    p.setFont("Helvetica-Bold", 14)
    p.drawString(50, y, "Action Items:")
    y -= 20
    
    p.setFont("Helvetica", 12)
    for item in action_items:
        if y < 50:
            p.showPage()
            y = height - 50
            p.setFont("Helvetica", 12)
        p.drawString(50, y, f"- {item.task} (Owner: {item.owner}, Deadline: {item.deadline})")
        y -= 15
        
    p.showPage()
    p.save()
    
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=meeting_{meeting_id}_summary.pdf"})


class EmailRequest(BaseModel):
    email: str

@router.post("/{meeting_id}/email")
def send_meeting_email(meeting_id: int, req: EmailRequest, db: Session = Depends(get_db)):
    meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    action_items_db = db.query(models.ActionItem).filter(models.ActionItem.meeting_id == meeting_id).all()
    action_items = [{"task": item.task, "owner": item.owner, "deadline": item.deadline} for item in action_items_db]
    
    summary_text = meeting.summary or "No summary available."
    success = send_meeting_summary(req.email, summary_text, action_items)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send email")
        
    return {"message": "Email sent successfully"}
