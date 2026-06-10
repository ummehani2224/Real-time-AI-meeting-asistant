import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useMeetingSocket } from '../hooks/useMeetingSocket';

export default function MeetingRoom({ isNew }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meetingId, setMeetingId] = useState(id);
  const [meetingDetails, setMeetingDetails] = useState(null);
  const transcriptEndRef = useRef(null);

  const {
    isConnected,
    transcript,
    summary,
    error,
    startRecording,
    stopRecording,
  } = useMeetingSocket(meetingId);

  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    async function initMeeting() {
      if (isNew) {
        try {
          const newMeeting = await api.createMeeting("New Meeting - " + new Date().toLocaleString());
          setMeetingId(newMeeting.id);
          // Don't navigate, just update the ID state so the socket can connect
          window.history.replaceState(null, '', `/meeting/${newMeeting.id}`);
        } catch (err) {
          console.error("Failed to create meeting", err);
        }
      } else if (id) {
        try {
          const details = await api.getMeeting(id);
          setMeetingDetails(details);
        } catch (err) {
          console.error("Failed to fetch meeting", err);
        }
      }
    }
    initMeeting();
  }, [isNew, id]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const toggleRecording = async () => {
    if (!isRecording) {
      await startRecording();
      setIsRecording(true);
    } else {
      stopRecording();
      setIsRecording(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const blob = await api.exportPDF(meetingId || id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Meeting_Summary_${meetingId || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export PDF", err);
      alert("Failed to export PDF");
    }
  };

  const handleSendEmail = async () => {
    const email = window.prompt("Enter email address to send the report:");
    if (!email) return;
    try {
      await api.sendEmail(meetingId || id, email);
      alert("Email sent successfully!");
    } catch (err) {
      console.error("Failed to send email", err);
      alert("Failed to send email");
    }
  };

  // Determine what to show
  const displayTranscript = isNew || isRecording ? transcript : []; 
  const displaySummary = summary || meetingDetails?.summary || "Meeting summary will appear here...";
  const displayActionItems = meetingDetails?.action_items || [];

  return (
    <div className="space-y-lg max-w-container-max mx-auto">
      {/* Header Card */}
      <div className="glass-card p-md rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md">
        <div className="flex items-center gap-sm">
          <button 
            onClick={() => navigate('/')}
            className="material-symbols-outlined text-on-surface-variant hover:bg-white/5 transition-colors p-sm rounded-full active:scale-95 duration-200"
          >
            arrow_back
          </button>
          <div>
            <h2 className="font-headline-sm text-on-surface">
              {isNew || isRecording ? 'Live Meeting' : meetingDetails?.title || `Meeting #${meetingId || id}`}
            </h2>
            <p className="text-xs text-on-surface-variant">
              {meetingDetails?.start_time ? new Date(meetingDetails.start_time).toLocaleString() : 'Active session'}
            </p>
          </div>
          {isRecording && (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-error/10 text-error text-[10px] font-bold rounded-full border border-error/20 ai-pulse">
              <span className="w-1.5 h-1.5 bg-error rounded-full"></span> LIVE
            </span>
          )}
        </div>
        
        <div className="flex gap-sm w-full sm:w-auto">
          {(isNew || isRecording) && (
            <button
              onClick={toggleRecording}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-sm px-6 py-2.5 rounded-xl font-semibold transition-all shadow-sm ${
                isRecording 
                  ? 'bg-error text-on-error hover:opacity-90 active:scale-95' 
                  : 'bg-gradient-to-r from-[#6D5EF7] to-[#00D4FF] text-white primary-glow hover:opacity-90 active:scale-95'
              }`}
            >
              <span className="material-symbols-outlined">
                {isRecording ? 'stop' : 'mic'}
              </span>
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
          )}
          {!isNew && !isRecording && (
            <div className="flex gap-sm w-full sm:w-auto">
              <button 
                onClick={handleSendEmail} 
                className="flex-1 sm:flex-initial glass-card text-primary font-medium px-4 py-2.5 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-sm"
              >
                <span className="material-symbols-outlined">mail</span> Email Report
              </button>
              <button 
                onClick={handleExportPDF} 
                className="flex-1 sm:flex-initial bg-on-surface text-background font-semibold px-4 py-2.5 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-sm"
              >
                <span className="material-symbols-outlined">download</span> PDF Report
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-md bg-error-container/20 text-error rounded-2xl border border-error-container/30 text-sm">
          {error}
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        {/* Transcript Panel */}
        <div className="lg:col-span-2 flex flex-col glass-card rounded-2xl overflow-hidden min-h-[400px] lg:min-h-[500px]">
          <div className="p-md border-b border-white/10 flex items-center gap-sm bg-white/5">
            <span className="material-symbols-outlined text-primary">forum</span>
            <h3 className="font-semibold text-sm">Transcript</h3>
          </div>
          <div className="flex-1 p-md overflow-y-auto space-y-md max-h-[500px]">
            {displayTranscript.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-on-surface-variant italic text-sm p-xl text-center">
                <span className="material-symbols-outlined text-3xl mb-sm not-italic">mic_none</span>
                {isNew ? 'Press "Start Recording" to begin transcribing...' : 'No transcript text was saved for this meeting.'}
              </div>
            ) : (
              displayTranscript.map((item) => (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center gap-sm">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{item.speaker}</span>
                  </div>
                  <div className="p-md bg-white/5 rounded-2xl border border-white/5 inline-block text-sm max-w-[90%] text-on-surface">
                    {item.text}
                  </div>
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>

        {/* AI Insights Sidebar */}
        <div className="flex flex-col gap-md">
          {/* Summary Card */}
          <div className="flex-1 flex flex-col glass-card rounded-2xl overflow-hidden min-h-[200px]">
            <div className="p-md border-b border-white/10 flex items-center gap-sm bg-white/5">
              <span className="material-symbols-outlined text-tertiary">auto_awesome</span>
              <h3 className="font-semibold text-sm">Summary</h3>
            </div>
            <div className="flex-1 p-md overflow-y-auto max-h-[250px]">
              <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                {displaySummary}
              </p>
            </div>
          </div>

          {/* Action Items Card */}
          <div className="flex-1 flex flex-col glass-card rounded-2xl overflow-hidden min-h-[250px]">
            <div className="p-md border-b border-white/10 flex items-center gap-sm bg-white/5">
              <span className="material-symbols-outlined text-secondary">task_alt</span>
              <h3 className="font-semibold text-sm">Action Items</h3>
            </div>
            <div className="flex-1 p-md overflow-y-auto max-h-[300px]">
              {displayActionItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-on-surface-variant italic text-xs p-md text-center">
                  <span className="material-symbols-outlined text-2xl mb-xs not-italic">playlist_add_check</span>
                  No action items extracted yet.
                </div>
              ) : (
                <ul className="space-y-sm">
                  {displayActionItems.map((item, i) => (
                    <li key={i} className="p-md bg-white/5 rounded-xl border border-white/5 flex gap-sm">
                      <span className="material-symbols-outlined text-secondary text-sm shrink-0">check_circle</span>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-on-surface">{item.task}</p>
                        <div className="flex flex-wrap gap-xs">
                          <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded-full text-on-surface-variant font-bold border border-white/5">@{item.owner}</span>
                          <span className="text-[9px] bg-error/10 px-2 py-0.5 rounded-full text-error font-bold border border-error/10">{item.deadline}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

