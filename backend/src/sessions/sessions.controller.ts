import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SessionsService } from './sessions.service';
import { SessionResponseDto } from './dto/session.dto';

@Controller('sessions')
export class SessionsController {
  private readonly logger = new Logger(SessionsController.name);

  constructor(private readonly sessionsService: SessionsService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('audio', {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'audio/mpeg',
          'audio/wav',
          'audio/m4a',
          'audio/ogg',
          'audio/webm',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid audio file format'), false);
        }
      },
    }),
  )
  async uploadSession(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No audio file provided');
    }

    this.logger.log(`Uploading session: ${file.originalname} (${file.size} bytes)`);

    try {
      const result = await this.sessionsService.uploadSession(file);
      return result;
    } catch (error) {
      this.logger.error('Upload failed:', error);
      throw new BadRequestException('Failed to upload session');
    }
  }

  @Get()
  async getAllSessions(): Promise<SessionResponseDto[]> {
    try {
      return await this.sessionsService.getAllSessions();
    } catch (error) {
      this.logger.error('Failed to fetch sessions:', error);
      throw new BadRequestException('Failed to fetch sessions');
    }
  }

  @Get(':id')
  async getSession(@Param('id') id: string): Promise<SessionResponseDto> {
    try {
      return await this.sessionsService.getSession(id);
    } catch (error) {
      this.logger.error(`Failed to fetch session ${id}:`, error);
      throw new BadRequestException('Session not found');
    }
  }

  @Delete(':id')
  async deleteSession(@Param('id') id: string) {
    try {
      return await this.sessionsService.deleteSession(id);
    } catch (error) {
      this.logger.error(`Failed to delete session ${id}:`, error);
      throw new BadRequestException('Failed to delete session');
    }
  }
}