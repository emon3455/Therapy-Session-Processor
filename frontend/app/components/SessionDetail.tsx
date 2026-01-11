'use client';

import { useState, useEffect } from 'react';
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

interface SessionDetailProps {
  session: Session;
}

interface DetailedSession extends Session {
  speakers?: Array<{
    id: string;
    speaker_label: string;
    total_speaking_time: number;
  }>;
  segments?: Array<{
    id: string;
    speaker_label: string;
    start_time: number;
    end_time: number;
    text: string;
    confidence?: number;
  }>;
}

export default function SessionDetail({ session }: SessionDetailProps) {
  const [detailedSession, setDetailedSession] = useState<DetailedSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'transcript' | 'segments'>('overview');

  useEffect(() => {
    fetchSessionDetails();
    
    // Auto-refresh every 3 seconds if session is processing
    const interval = setInterval(() => {
      if (session.status === 'processing' || session.vector_status === 'processing') {
        fetchSessionDetails();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [session.id, session.status, session.vector_status]);

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/${session.id}`);
      if (response.ok) {
        const data = await response.json();
        setDetailedSession(data);
      }
    } catch (error) {
      console.error('Failed to fetch session details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading session details...</span>
        </div>
      </div>
    );
  }

  const sessionData = detailedSession || session;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          {sessionData.filename}
        </h2>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>{formatDistanceToNow(new Date(sessionData.created_at), { addSuffix: true })}</span>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(sessionData.status)}`}
          >
            {sessionData.status}
          </span>
          <span>Vector: {sessionData.vector_status}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'transcript', label: 'Conversation' },
          { key: 'segments', label: 'Segments' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <>
            {/* Summary */}
            {sessionData.summary && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Summary</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {sessionData.summary}
                  </p>
                </div>
              </div>
            )}

            {/* Speakers */}
            {(sessionData as DetailedSession).speakers && (sessionData as DetailedSession).speakers!.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Speakers</h3>
                <div className="grid gap-3">
                  {(sessionData as DetailedSession).speakers!.map((speaker) => (
                    <div key={speaker.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          {speaker.speaker_label}
                        </h4>
                        <span className="text-sm text-gray-600">
                          {formatTime(speaker.total_speaking_time)} speaking time
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Processing Status */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Processing Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span>Transcription</span>
                  <span className={sessionData.transcript ? 'text-green-600' : 'text-gray-400'}>
                    {sessionData.transcript ? '✅ Complete' : '⏸️ Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span>Summarization</span>
                  <span className={sessionData.summary ? 'text-green-600' : 'text-gray-400'}>
                    {sessionData.summary ? '✅ Complete' : '⏸️ Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span>Vectorization</span>
                  <span className={
                    sessionData.vector_status === 'completed' ? 'text-green-600' :
                    sessionData.vector_status === 'processing' ? 'text-yellow-600' :
                    sessionData.vector_status === 'failed' ? 'text-red-600' : 'text-gray-400'
                  }>
                    {sessionData.vector_status === 'completed' ? '✅ Complete' :
                     sessionData.vector_status === 'processing' ? '⏳ Processing' :
                     sessionData.vector_status === 'failed' ? '❌ Failed' : '⏸️ Pending'}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'transcript' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Conversation</h3>
            {sessionData.segments && sessionData.segments.length > 0 ? (
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="space-y-4">
                  {(sessionData as DetailedSession).segments!.map((segment, index) => {
                    const isFirstSpeaker = segment.speaker_label === 'Speaker 1';
                    const speakerColors = isFirstSpeaker 
                      ? { bg: 'bg-blue-600', text: 'text-white', accent: 'text-blue-100', accent2: 'text-blue-200' }
                      : { bg: 'bg-green-600', text: 'text-white', accent: 'text-green-100', accent2: 'text-green-200' };
                    
                    return (
                      <div
                        key={segment.id}
                        className={`flex ${isFirstSpeaker ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm ${
                          speakerColors.bg
                        } ${speakerColors.text} ${
                          isFirstSpeaker ? 'rounded-bl-sm' : 'rounded-br-sm'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-medium ${speakerColors.accent}`}>
                              {segment.speaker_label}
                            </span>
                            <span className={`text-xs ${speakerColors.accent2}`}>
                              {formatTime(segment.start_time)}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">
                            {segment.text.trim()}
                          </p>
                          {segment.confidence && (
                            <div className={`mt-1 text-xs ${speakerColors.accent2}`}>
                              {(segment.confidence * 100).toFixed(0)}% confidence
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : sessionData.transcript ? (
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {sessionData.transcript}
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">💬</div>
                <p>Conversation not available yet</p>
                {sessionData.status === 'processing' && (
                  <p className="text-sm mt-2">Processing in progress...</p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'segments' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Speaker Segments</h3>
            {(sessionData as DetailedSession).segments && (sessionData as DetailedSession).segments!.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {(sessionData as DetailedSession).segments!.map((segment) => (
                  <div key={segment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-blue-600">
                        {segment.speaker_label}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatTime(segment.start_time)} - {formatTime(segment.end_time)}
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {segment.text}
                    </p>
                    {segment.confidence && (
                      <div className="mt-2 text-xs text-gray-500">
                        Confidence: {(segment.confidence * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">💬</div>
                <p>Speaker segments not available yet</p>
                {sessionData.status === 'processing' && (
                  <p className="text-sm mt-2">Processing in progress...</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}