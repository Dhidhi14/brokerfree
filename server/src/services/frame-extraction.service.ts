import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { AppError } from '@/utils/app-error';
import { logger } from '@/utils/logger';

if (!ffmpegStatic) {
  throw new Error('ffmpeg-static binary path is unavailable');
}

if (!ffprobeStatic.path) {
  throw new Error('ffprobe-static binary path is unavailable');
}

ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

const DEFAULT_FRAME_COUNT = 6;

async function safeUnlink(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== 'ENOENT') {
      logger.warn('Failed to clean up temp file', { filePath, error: err.message });
    }
  }
}

function probeDurationSeconds(videoPath: string): Promise<number | null> {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        resolve(null);
        return;
      }

      const duration = metadata.format.duration;
      if (typeof duration === 'number' && Number.isFinite(duration) && duration > 0) {
        resolve(duration);
        return;
      }

      resolve(null);
    });
  });
}

function buildEvenTimestamps(durationSeconds: number, count: number): string[] {
  return Array.from({ length: count }, (_, index) => {
    const seconds = ((index + 1) / (count + 1)) * durationSeconds;
    return seconds.toFixed(3);
  });
}

function takeScreenshots(
  videoPath: string,
  outputFolder: string,
  filenamePattern: string,
  options: { timestamps: string[] } | { count: number }
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const filenames: string[] = [];

    const command = ffmpeg(videoPath).on('filenames', (generated: string[]) => {
      filenames.push(...generated);
    });

    if ('timestamps' in options) {
      command.screenshots({
        timestamps: options.timestamps,
        folder: outputFolder,
        filename: filenamePattern,
      });
    } else {
      command.screenshots({
        count: options.count,
        folder: outputFolder,
        filename: filenamePattern,
      });
    }

    command
      .on('end', () => resolve(filenames.map((name) => path.join(outputFolder, name))))
      .on('error', (error: Error) => reject(error));
  });
}

/**
 * Extract evenly spaced JPEG frames from a video buffer.
 * Always cleans up temp video + frame files, including on error.
 */
export async function extractFrames(
  videoBuffer: Buffer,
  count: number = DEFAULT_FRAME_COUNT
): Promise<Buffer[]> {
  if (count < 1) {
    throw new AppError('Frame count must be at least 1', 400, 'INVALID_FRAME_COUNT');
  }

  const jobId = randomUUID();
  const tempDir = os.tmpdir();
  const videoPath = path.join(tempDir, `brokerfree-video-${jobId}.mp4`);
  const frameFilenamePattern = `brokerfree-frame-${jobId}-%i.jpg`;
  let framePaths: string[] = [];

  try {
    await fs.writeFile(videoPath, videoBuffer);

    const duration = await probeDurationSeconds(videoPath);

    try {
      if (duration !== null) {
        framePaths = await takeScreenshots(videoPath, tempDir, frameFilenamePattern, {
          timestamps: buildEvenTimestamps(duration, count),
        });
      } else {
        framePaths = await takeScreenshots(videoPath, tempDir, frameFilenamePattern, {
          count,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown ffmpeg error';
      throw new AppError(
        `Unable to extract frames from video. The file may be corrupt or unsupported. (${message})`,
        400,
        'FRAME_EXTRACTION_FAILED'
      );
    }

    if (!framePaths.length) {
      throw new AppError(
        'Unable to extract frames from video. The file may be corrupt or unsupported.',
        400,
        'FRAME_EXTRACTION_FAILED'
      );
    }

    const frames: Buffer[] = [];
    for (const framePath of framePaths) {
      frames.push(await fs.readFile(framePath));
    }

    return frames;
  } finally {
    await safeUnlink(videoPath);
    await Promise.all(framePaths.map((framePath) => safeUnlink(framePath)));
  }
}
