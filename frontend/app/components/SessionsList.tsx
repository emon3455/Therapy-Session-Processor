'use client';

import { formatDistanceToNow } from 'date-fns';

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

interface SessionsListProps {
  sessions: Session[];
  loading: boolean;
  onSessionSelected: (session: Session) => void;
  selectedSessionId?: string;
}

export default function SessionsList({ 
  sessions, 
  loading, 
  onSessionSelected, 
  selectedSessionId 
}: SessionsListProps) {

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVectorStatusIcon = (vectorStatus: string) => {
    switch (vectorStatus) {
      case 'completed': return '✅';
      case 'processing': return '⏳';
      case 'failed': return '❌';
      default: return '⏸️';
    }
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Sessions</h2>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading sessions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        Sessions ({sessions.length})
      </h2>
      
      {sessions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">📭</div>
          <p>No sessions uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedSessionId === session.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => onSessionSelected(session)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {session.filename}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(session.status)}`}
                  >
                    {session.status}
                  </span>
                  <span 
                    title={`Vector status: ${session.vector_status}`}
                    className="text-lg"
                  >
                    {getVectorStatusIcon(session.vector_status)}
                  </span>
                </div>
              </div>
              
              {session.status === 'completed' && (
                <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600">
                  {session.speaker_count > 0 && (
                    <span className="flex items-center">
                      👥 {session.speaker_count} speakers
                    </span>
                  )}
                  {session.transcript && (
                    <span className="flex items-center">
                      📝 Transcribed
                    </span>
                  )}
                  {session.summary && (
                    <span className="flex items-center">
                      📋 Summarized
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {loading && sessions.length > 0 && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Refreshing...
          </div>
        </div>
      )}
    </div>
  );
}