import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { OpenaiService } from '../openai/openai.service';
import {
  Session,
  Speaker,
  TranscriptSegment,
  SessionVector,
} from './session.interface';
import { SessionResponseDto } from './dto/session.dto';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    private supabaseService: SupabaseService,
    private openaiService: OpenaiService,
  ) {}

  async uploadSession(
    file: Express.Multer.File,
  ): Promise<{ sessionId: string; message: string }> {
    const supabase = this.supabaseService.getClient();

    try {
      // Create initial session record
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          filename: file.originalname,
          file_size: file.size,
          status: 'processing',
          speaker_count: 0,
          vector_status: 'pending',
        })
        .select()
        .single();

      if (sessionError) {
        this.logger.error('Failed to create session:', sessionError);
        throw new Error('Failed to create session record');
      }

      // Start processing in the background
      this.processSession(session.id, file.buffer).catch((error) => {
        this.logger.error('Session processing failed:', error);
        this.updateSessionStatus(session.id, 'failed');
      });

      return {
        sessionId: session.id,
        message: 'Session uploaded successfully. Processing started.',
      };
    } catch (error) {
      this.logger.error('Upload session error:', error);
      throw error;
    }
  }

  private async processSession(sessionId: string, audioBuffer: Buffer) {
    const supabase = this.supabaseService.getClient();

    try {
      this.logger.log(`Starting processing for session ${sessionId}`);

      // Get session info
      const { data: session } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (!session) {
        throw new Error('Session not found');
      }

      // Step 1: Transcribe audio
      this.logger.log('Transcribing audio...');
      const transcriptionResult = await this.openaiService.transcribeAudio(
        audioBuffer,
        session.filename,
      );

      // Step 2: Process speakers and segments
      this.logger.log('Processing speakers and segments...');
      const speakers = await this.processSpeakers(
        sessionId,
        transcriptionResult.segments,
      );

      // Step 3: Generate summary
      this.logger.log('Generating summary...');
      const summary = await this.openaiService.generateSummary(
        transcriptionResult.text,
      );

      // Step 4: Update session with results
      await supabase
        .from('sessions')
        .update({
          transcript: transcriptionResult.text,
          summary: summary,
          speaker_count: speakers.length,
          status: 'completed',
          duration_seconds: this.calculateDuration(transcriptionResult.segments),
        })
        .eq('id', sessionId);

      // Step 5: Generate and store vectors
      await this.generateAndStoreVectors(
        sessionId,
        transcriptionResult.text,
        summary,
        transcriptionResult.segments,
      );

      this.logger.log(`Session ${sessionId} processed successfully`);
    } catch (error) {
      this.logger.error(`Processing failed for session ${sessionId}:`, error);
      await this.updateSessionStatus(sessionId, 'failed');
      throw error;
    }
  }

  private async processSpeakers(
    sessionId: string,
    segments: Array<{ start: number; end: number; text: string; speaker?: string }>,
  ): Promise<Speaker[]> {
    const supabase = this.supabaseService.getClient();
    const speakerMap = new Map<string, { totalTime: number; segments: any[] }>();

    // Group segments by speaker
    segments.forEach((segment) => {
      const speaker = segment.speaker || 'Speaker 1';
      if (!speakerMap.has(speaker)) {
        speakerMap.set(speaker, { totalTime: 0, segments: [] });
      }
      const speakerData = speakerMap.get(speaker)!;
      speakerData.totalTime += segment.end - segment.start;
      speakerData.segments.push(segment);
    });

    // Create speaker records
    const speakers: Speaker[] = [];
    for (const [label, data] of speakerMap.entries()) {
      const { data: speaker, error } = await supabase
        .from('speakers')
        .insert({
          session_id: sessionId,
          speaker_label: label,
          total_speaking_time: Math.round(data.totalTime),
        })
        .select()
        .single();

      if (error) {
        this.logger.error('Failed to create speaker:', error);
        continue;
      }

      speakers.push(speaker);

      // Create transcript segments for this speaker
      for (const segment of data.segments) {
        await supabase.from('transcript_segments').insert({
          session_id: sessionId,
          speaker_id: speaker.id,
          start_time: segment.start,
          end_time: segment.end,
          text: segment.text,
          confidence: 0.9, // Default confidence
        });
      }
    }

    return speakers;
  }

  private async generateAndStoreVectors(
    sessionId: string,
    transcript: string,
    summary: string,
    segments: Array<{ text: string }>,
  ) {
    const supabase = this.supabaseService.getClient();

    try {
      // Update vector status to processing
      await supabase
        .from('sessions')
        .update({ vector_status: 'processing' })
        .eq('id', sessionId);

      // Generate transcript embedding
      const transcriptVector = await this.openaiService.generateEmbedding(transcript);
      await supabase.from('session_vectors').insert({
        session_id: sessionId,
        content_type: 'transcript',
        vector: transcriptVector,
        metadata: { content_length: transcript.length },
      });

      // Generate summary embedding
      const summaryVector = await this.openaiService.generateEmbedding(summary);
      await supabase.from('session_vectors').insert({
        session_id: sessionId,
        content_type: 'summary',
        vector: summaryVector,
        metadata: { content_length: summary.length },
      });

      // Update vector status to completed
      await supabase
        .from('sessions')
        .update({ vector_status: 'completed' })
        .eq('id', sessionId);

      this.logger.log(`Vector generation completed for session ${sessionId}`);
    } catch (error) {
      this.logger.error('Vector generation failed:', error);
      await supabase
        .from('sessions')
        .update({ vector_status: 'failed' })
        .eq('id', sessionId);
      throw error;
    }
  }

  private calculateDuration(segments: Array<{ start: number; end: number }>): number {
    if (!segments.length) return 0;
    const lastSegment = segments[segments.length - 1];
    return Math.round(lastSegment.end);
  }

  private async updateSessionStatus(sessionId: string, status: string) {
    const supabase = this.supabaseService.getClient();
    await supabase.from('sessions').update({ status }).eq('id', sessionId);
  }

  async getSession(id: string): Promise<SessionResponseDto> {
    const supabase = this.supabaseService.getClient();

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (sessionError || !session) {
      throw new Error('Session not found');
    }

    // Get speakers
    const { data: speakers } = await supabase
      .from('speakers')
      .select('*')
      .eq('session_id', id)
      .order('created_at');

    // Get segments with speaker labels
    const { data: segments } = await supabase
      .from('transcript_segments')
      .select(`
        id,
        start_time,
        end_time,
        text,
        confidence,
        speakers!inner(speaker_label)
      `)
      .eq('session_id', id)
      .order('start_time');

    return {
      ...session,
      speakers: speakers || [],
      segments: segments?.map((segment: any) => ({
        id: segment.id,
        speaker_label: segment.speakers.speaker_label,
        start_time: segment.start_time,
        end_time: segment.end_time,
        text: segment.text,
        confidence: segment.confidence,
      })) || [],
    };
  }

  async getAllSessions(): Promise<SessionResponseDto[]> {
    const supabase = this.supabaseService.getClient();

    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Failed to fetch sessions:', error);
      throw new Error('Failed to fetch sessions');
    }

    return sessions.map(session => ({
      ...session,
      speakers: [],
      segments: [],
    }));
  }

  async deleteSession(id: string): Promise<{ message: string }> {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error('Failed to delete session:', error);
      throw new Error('Failed to delete session');
    }

    return { message: 'Session deleted successfully' };
  }
}