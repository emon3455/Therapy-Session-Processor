export interface Session {
  id: string;
  created_at: string;
  updated_at: string;
  filename: string;
  file_size: number;
  duration_seconds?: number;
  status: 'processing' | 'completed' | 'failed';
  transcript?: string;
  summary?: string;
  speaker_count: number;
  vector_status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface Speaker {
  id: string;
  session_id: string;
  speaker_label: string;
  total_speaking_time: number;
  created_at: string;
}

export interface TranscriptSegment {
  id: string;
  session_id: string;
  speaker_id: string;
  start_time: number;
  end_time: number;
  text: string;
  confidence?: number;
  created_at: string;
}

export interface SessionVector {
  id: string;
  session_id: string;
  content_type: 'transcript' | 'summary' | 'segment';
  segment_id?: string;
  vector: number[];
  metadata?: Record<string, any>;
  created_at: string;
}