import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Video, Calendar, Clock, FileText } from 'lucide-react';

import { api } from '../services/api';

export default function Dashboard() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMeetings() {
      try {
        const data = await api.getMeetings();
        setMeetings(data);
      } catch (err) {
        console.error("Failed to fetch meetings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMeetings();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Meeting Dashboard</h2>
        <Link 
          to="/meeting/new" 
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={20} />
          New Meeting
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Calendar size={20} className="text-indigo-500"/>
            Recent Meetings
          </h3>
        </div>
        
        {meetings.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Video size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-lg">No meetings recorded yet.</p>
            <p className="text-sm mt-1">Click "New Meeting" to start your first recording.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {meetings.map((meeting) => (
              <li key={meeting.id} className="p-6 hover:bg-gray-50 transition-colors group">
                <Link to={`/meeting/${meeting.id}`} className="block">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xl font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{meeting.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                      <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md"><Calendar size={14} /> {new Date(meeting.start_time).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md"><Clock size={14} /> {new Date(meeting.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mt-2 flex items-start gap-2 line-clamp-2">
                     <FileText size={16} className="mt-0.5 text-gray-400 shrink-0" />
                     {meeting.summary || "No summary available yet."}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
