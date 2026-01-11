import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsOptional()
  @IsString()
  fileSize?: string;
}

export class SessionResponseDto {
  id: string;
  created_at: string;
  updated_at: string;
  filename: string;
  file_size: number;
  duration_seconds?: number;
  status: string;
  transcript?: string;
  summary?: string;
  speaker_count: number;
  vector_status: string;
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