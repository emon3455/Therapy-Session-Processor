'use client';

import { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import SessionsList from './components/SessionsList';
import SessionDetail from './components/SessionDetail';

interface Session {
  id: string;
  created_at: string;
  filename: string;
  status: string;
  vector_status: string;
  transcript?: string;
  summary?: string;
  speaker_count: number;
}

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
        
        // If we have a selected session, refresh its details too
        if (selectedSession) {
          const updatedSession = data.find((s: Session) => s.id === selectedSession.id);
          if (updatedSession) {
            setSelectedSession(updatedSession);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionUploaded = () => {
    fetchSessions();
  };

  const handleSessionSelected = (session: Session) => {
    setSelectedSession(session);
  };

  useEffect(() => {
    fetchSessions();
    
    // Auto-refresh every 5 seconds if there are processing sessions
    const interval = setInterval(() => {
      const hasProcessingSessions = sessions.some(
        session => session.status === 'processing' || session.vector_status === 'processing'
      );
      if (hasProcessingSessions) {
        fetchSessions();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [sessions.length]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Therapy Session Processor
          </h1>
          <p className="text-lg text-gray-600">
            Upload, transcribe, and analyze therapy session recordings
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Upload and Sessions List */}
          <div className="space-y-6">
            <FileUpload onSessionUploaded={handleSessionUploaded} />
            <SessionsList 
              sessions={sessions} 
              loading={loading}
              onSessionSelected={handleSessionSelected}
              selectedSessionId={selectedSession?.id}
            />
          </div>

          {/* Right Column: Session Detail */}
          <div>
            {selectedSession ? (
              <SessionDetail session={selectedSession} />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                <div className="text-4xl mb-4">📄</div>
                <p>Select a session to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}