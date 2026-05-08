import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, Square, Download, ChevronLeft, Send, CheckCircle, Mail } from 'lucide-react';
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
  const displayTranscript = isNew || isRecording ? transcript : []; // Real app would fetch past transcripts
  const displaySummary = summary || meetingDetails?.summary || "Meeting summary will appear here...";
  const displayActionItems = meetingDetails?.action_items || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">
            {isNew || isRecording ? 'Live Meeting' : `Meeting Details #${meetingId || id}`}
          </h2>
          {isRecording && (
            <span className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 text-sm font-medium rounded-full animate-pulse">
              <span className="w-2 h-2 bg-red-600 rounded-full"></span> Live
            </span>
          )}
        </div>
        
        <div className="flex gap-3">
          {(isNew || isRecording) && (
            <button
              onClick={toggleRecording}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all shadow-sm ${
                isRecording 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isRecording ? <Square size={20} /> : <Mic size={20} />}
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
          )}
          {!isNew && !isRecording && (
             <div className="flex gap-2">
               <button onClick={handleSendEmail} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-medium">
                 <Mail size={20} /> Email Report
               </button>
               <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium">
                 <Download size={20} /> PDF Report
               </button>
             </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        {/* Live Transcript Panel */}
        <div className="lg:col-span-2 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/80">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Mic size={18} className="text-indigo-500" /> Transcript
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white scroll-smooth">
            {displayTranscript.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 italic">
                {isNew ? 'Press "Start Recording" to begin...' : 'No transcript available.'}
              </div>
            ) : (
              displayTranscript.map((item) => (
                <div key={item.id} className="animate-fade-in-up">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{item.speaker}</span>
                  </div>
                  <p className="text-lg leading-relaxed p-3 rounded-xl inline-block text-gray-800 bg-indigo-50/50">
                    {item.text}
                  </p>
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>

        {/* AI Analysis Panel */}
        <div className="flex flex-col gap-6">
          <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-4 border-b border-gray-100 bg-gray-50/80">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Send size={18} className="text-indigo-500" /> Summary
              </h3>
            </div>
            <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-white to-gray-50/30">
               <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{displaySummary}</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/80">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <CheckCircle size={18} className="text-indigo-500" /> Action Items
              </h3>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
               {displayActionItems.length === 0 ? (
                 <p className="text-gray-500 italic text-sm">No action items detected yet...</p>
               ) : (
                 <ul className="space-y-3">
                   {displayActionItems.map((item, i) => (
                     <li key={i} className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100/50">
                       <div className="mt-0.5"><CheckCircle size={16} className="text-blue-500" /></div>
                       <div>
                         <p className="text-sm font-medium text-gray-900">{item.task}</p>
                         <div className="flex gap-2 mt-1">
                           <span className="text-xs bg-white px-2 py-0.5 rounded text-gray-600 font-medium shadow-sm border border-gray-100">@{item.owner}</span>
                           <span className="text-xs bg-white px-2 py-0.5 rounded text-red-600 font-medium shadow-sm border border-gray-100">{item.deadline}</span>
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
