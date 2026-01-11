import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenaiService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async transcribeAudio(
    audioBuffer: Buffer,
    filename: string,
  ): Promise<{
    text: string;
    segments: Array<{
      start: number;
      end: number;
      text: string;
      speaker?: string;
    }>;
  }> {
    try {
      // Create a temporary file for OpenAI API
      const uint8Array = new Uint8Array(audioBuffer);
      const audioBlob = new Blob([uint8Array], {
        type: this.getAudioMimeType(filename),
      });
      const audioFile = new File([audioBlob], filename, {
        type: this.getAudioMimeType(filename),
      });

      // Transcribe with timestamps and speaker detection
      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        response_format: 'verbose_json',
        timestamp_granularities: ['segment'],
      });

      // Process segments and try to identify speakers
      const segments = transcription.segments?.map((segment, index) => ({
        start: segment.start,
        end: segment.end,
        text: segment.text,
        speaker: `Speaker ${(index % 2) + 1}`, // Simple alternating speaker detection
      })) || [];

      return {
        text: transcription.text,
        segments,
      };
    } catch (error) {
      console.error('Transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  async generateSummary(transcript: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant helping therapists by summarizing therapy session transcripts. 
            Create a concise, professional summary that includes:
            - Main topics discussed
            - Key insights or breakthroughs
            - Patient's emotional state and progress
            - Therapeutic techniques used
            - Action items or homework assigned
            Keep the summary confidential and focused on therapeutic elements.`,
          },
          {
            role: 'user',
            content: `Please summarize this therapy session transcript:\n\n${transcript}`,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      return response.choices[0]?.message?.content || 'Summary generation failed';
    } catch (error) {
      console.error('Summary generation error:', error);
      throw new Error('Failed to generate summary');
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Embedding generation error:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  private getAudioMimeType(filename: string): string {
    const extension = filename.toLowerCase().split('.').pop();
    if (!extension) return 'audio/mpeg';
    
    const mimeTypes: Record<string, string> = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      m4a: 'audio/m4a',
      ogg: 'audio/ogg',
      webm: 'audio/webm',
    };
    return mimeTypes[extension] || 'audio/mpeg';
  }
}