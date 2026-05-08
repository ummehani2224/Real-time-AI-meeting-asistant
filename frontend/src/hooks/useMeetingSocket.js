import { useState, useRef, useEffect, useCallback } from 'react';

export function useMeetingSocket(meetingId) {
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState(null);
  
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  const connect = useCallback(() => {
    if (!meetingId) return;

    // Use ws:// for local dev, wss:// in production
    const wsBase = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
    const wsUrl = `${wsBase}/meeting/${meetingId}`;
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onopen = () => {
      setIsConnected(true);
      setError(null);
      console.log('WebSocket connected');
    };

    socketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'transcript') {
          setTranscript((prev) => [...prev, { id: Date.now(), text: data.text, speaker: 'Speaker' }]);
        } else if (data.type === 'summary') {
          setSummary(data.text);
        }
      } catch (err) {
        console.error("Failed to parse websocket message", err);
      }
    };

    socketRef.current.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };

    socketRef.current.onerror = (err) => {
      setError('WebSocket error occurred');
      console.error('WebSocket error:', err);
    };
  }, [meetingId]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    stopRecording();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Use webm for broad browser support and small size
      const options = { mimeType: 'audio/webm' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socketRef.current?.readyState === WebSocket.OPEN) {
          // Send raw audio blob to backend
          socketRef.current.send(event.data);
        }
      };

      // Request data every 3 seconds (3000ms)
      mediaRecorder.start(3000);
      
      if (!isConnected) {
        connect();
      }
    } catch (err) {
      setError('Could not access microphone');
      console.error('Microphone error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    transcript,
    summary,
    error,
    startRecording,
    stopRecording,
    connect,
    disconnect
  };
}
