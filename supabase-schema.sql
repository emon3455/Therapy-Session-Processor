-- Supabase Schema for Therapy Session Processing

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    duration_seconds INTEGER,
    status VARCHAR(50) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    transcript TEXT,
    summary TEXT,
    speaker_count INTEGER DEFAULT 0,
    vector_status VARCHAR(50) DEFAULT 'pending' CHECK (vector_status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Create speakers table for identified speakers
CREATE TABLE IF NOT EXISTS speakers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    speaker_label VARCHAR(50) NOT NULL,
    total_speaking_time INTEGER DEFAULT 0, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transcript_segments table for speaker-labeled segments
CREATE TABLE IF NOT EXISTS transcript_segments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    speaker_id UUID REFERENCES speakers(id) ON DELETE CASCADE,
    start_time DECIMAL(10,2), -- in seconds
    end_time DECIMAL(10,2), -- in seconds
    text TEXT NOT NULL,
    confidence DECIMAL(5,4), -- transcription confidence score
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create session_vectors table for storing embeddings
CREATE TABLE IF NOT EXISTS session_vectors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('transcript', 'summary', 'segment')),
    segment_id UUID REFERENCES transcript_segments(id) ON DELETE CASCADE NULL, -- for segment vectors
    vector vector(1536), -- OpenAI ada-002 embedding dimension
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_speakers_session_id ON speakers(session_id);
CREATE INDEX IF NOT EXISTS idx_transcript_segments_session_id ON transcript_segments(session_id);
CREATE INDEX IF NOT EXISTS idx_transcript_segments_speaker_id ON transcript_segments(speaker_id);
CREATE INDEX IF NOT EXISTS idx_session_vectors_session_id ON session_vectors(session_id);
CREATE INDEX IF NOT EXISTS idx_session_vectors_content_type ON session_vectors(content_type);

-- Create vector similarity search index
CREATE INDEX IF NOT EXISTS session_vectors_vector_idx ON session_vectors USING ivfflat (vector vector_cosine_ops) WITH (lists = 100);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();