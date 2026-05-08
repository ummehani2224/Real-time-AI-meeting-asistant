const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = {
  async getMeetings() {
    const res = await fetch(`${API_BASE_URL}/meetings/`);
    if (!res.ok) throw new Error('Failed to fetch meetings');
    return res.json();
  },
  
  async getMeeting(id) {
    const res = await fetch(`${API_BASE_URL}/meetings/${id}`);
    if (!res.ok) throw new Error('Failed to fetch meeting details');
    return res.json();
  },

  async createMeeting(title) {
    const res = await fetch(`${API_BASE_URL}/meetings/?title=${encodeURIComponent(title)}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to create meeting');
    return res.json();
  },

  async exportPDF(id) {
    const res = await fetch(`${API_BASE_URL}/meetings/${id}/export/pdf`);
    if (!res.ok) throw new Error('Failed to export PDF');
    return await res.blob();
  },

  async sendEmail(id, email) {
    const res = await fetch(`${API_BASE_URL}/meetings/${id}/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    if (!res.ok) throw new Error('Failed to send email');
    return res.json();
  }
};
