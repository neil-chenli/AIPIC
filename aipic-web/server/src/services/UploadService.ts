import { writeFile, readFile, mkdir, unlink } from 'fs/promises';
import { join, extname, basename } from 'path';
import { createHash } from 'crypto';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { getDatabase } from '../lib/db/connection';
import { PhotoRepository } from '../lib/db/repositories/PhotoRepository';
import { ThumbnailService } from './ThumbnailService';
import { ImportService } from './ImportService';
import exifr from 'exifr';
import { stat } from 'fs/promises';

interface UploadSession {
  id: string;
  fileName: string;
  fileSize: number;
  fileHash: string;
  mimeType: string;
  chunks: Map<number, Buffer>;
  uploadedChunks: Set<number>;
  totalChunks: number;
  chunkSize: number;
  tempPath: string;
}

export class UploadService {
  private photoRepo: PhotoRepository;
  private thumbnailService: ThumbnailService;
  private dataDir: string;
  private tempDir: string;
  private sessions: Map<string, UploadSession> = new Map();
  private readonly CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk

  constructor() {
    const db = getDatabase();
    this.photoRepo = new PhotoRepository(db);
    this.thumbnailService = new ThumbnailService();
    this.dataDir = process.env.DATA_DIR || join(process.cwd(), '..', '..', 'data');
    this.tempDir = join(this.dataDir, 'tmp', 'uploads');
    this.ensureTempDir();
  }

  private async ensureTempDir(): Promise<void> {
    if (!existsSync(this.tempDir)) {
      await mkdir(this.tempDir, { recursive: true });
    }
  }

  /**
   * 初始化上传会话
   */
  async initUpload(
    fileName: string,
    fileSize: number,
    fileHash: string,
    mimeType: string
  ): Promise<{ uploadId: string; chunkSize: number; totalChunks: number }> {
    // 检查是否已存在（秒传）
    const existing = this.photoRepo.findByHash(fileHash);
    if (existing) {
      throw new Error('FILE_ALREADY_EXISTS');
    }

    const uploadId = randomUUID();
    const totalChunks = Math.ceil(fileSize / this.CHUNK_SIZE);
    const tempPath = join(this.tempDir, `${uploadId}.tmp`);

    const session: UploadSession = {
      id: uploadId,
      fileName,
      fileSize,
      fileHash,
      mimeType,
      chunks: new Map(),
      uploadedChunks: new Set(),
      totalChunks,
      chunkSize: this.CHUNK_SIZE,
      tempPath,
    };

    this.sessions.set(uploadId, session);

    return {
      uploadId,
      chunkSize: this.CHUNK_SIZE,
      totalChunks,
    };
  }

  /**
   * 上传分片
   */
  async uploadChunk(
    uploadId: string,
    chunkIndex: number,
    chunkData: Buffer
  ): Promise<{ uploaded: number; total: number }> {
    const session = this.sessions.get(uploadId);
    if (!session) {
      throw new Error('Upload session not found');
    }

    if (chunkIndex < 0 || chunkIndex >= session.totalChunks) {
      throw new Error('Invalid chunk index');
    }

    // 保存分片
    session.chunks.set(chunkIndex, chunkData);
    session.uploadedChunks.add(chunkIndex);

    // 如果所有分片都已上传，合并文件
    if (session.uploadedChunks.size === session.totalChunks) {
      await this.mergeChunks(session);
    }

    return {
      uploaded: session.uploadedChunks.size,
      total: session.totalChunks,
    };
  }

  /**
   * 合并分片
   */
  private async mergeChunks(session: UploadSession): Promise<void> {
    const chunks: Buffer[] = [];
    for (let i = 0; i < session.totalChunks; i++) {
      const chunk = session.chunks.get(i);
      if (!chunk) {
        throw new Error(`Missing chunk ${i}`);
      }
      chunks.push(chunk);
    }

    const fileBuffer = Buffer.concat(chunks);
    await writeFile(session.tempPath, fileBuffer);

    // 验证hash
    const hash = createHash('sha256').update(fileBuffer).digest('hex');
    if (hash !== session.fileHash) {
      await unlink(session.tempPath);
      throw new Error('File hash mismatch');
    }
  }

  /**
   * 完成上传
   */
  async completeUpload(uploadId: string): Promise<{ photoId: string }> {
    const session = this.sessions.get(uploadId);
    if (!session) {
      throw new Error('Upload session not found');
    }

    if (!existsSync(session.tempPath)) {
      // 如果文件不存在，尝试合并分片
      if (session.uploadedChunks.size === session.totalChunks) {
        await this.mergeChunks(session);
      } else {
        throw new Error('Upload not complete');
      }
    }

    // 检查是否已存在（秒传）
    const existing = this.photoRepo.findByHash(session.fileHash);
    if (existing) {
      await unlink(session.tempPath);
      this.sessions.delete(uploadId);
      return { photoId: existing.id };
    }

    // 解析EXIF
    const exifData = await this.parseExif(session.tempPath);

    // 生成库文件路径
    const ext = extname(session.fileName).toLowerCase();
    const libraryPath = this.generateLibraryPath(session.fileHash, ext, exifData.captureTime);
    await this.ensureDirectoryExists(libraryPath);

    // 移动文件到库目录
    const fileBuffer = await readFile(session.tempPath);
    await writeFile(libraryPath, fileBuffer);
    await unlink(session.tempPath);

    // 获取文件信息
    const stats = await stat(libraryPath);

    // 创建照片记录
    const photo = this.photoRepo.create({
      fileName: basename(libraryPath),
      originalFileName: session.fileName,
      filePath: libraryPath,
      fileSize: stats.size,
      fileHash: session.fileHash,
      mimeType: session.mimeType,
      width: exifData.width,
      height: exifData.height,
      captureTime: exifData.captureTime,
      latitude: exifData.latitude,
      longitude: exifData.longitude,
      altitude: exifData.altitude,
      cameraMake: exifData.cameraMake,
      cameraModel: exifData.cameraModel,
      iso: exifData.iso,
      focalLength: exifData.focalLength,
      aperture: exifData.aperture,
      shutterSpeed: exifData.shutterSpeed,
    });

    // 异步生成缩略图
    this.thumbnailService.generateThumbnails(photo.id).catch((error) => {
      console.error(`Error generating thumbnails for uploaded photo ${photo.id}:`, error);
    });

    // 清理会话
    this.sessions.delete(uploadId);

    return { photoId: photo.id };
  }

  /**
   * 取消上传
   */
  async cancelUpload(uploadId: string): Promise<void> {
    const session = this.sessions.get(uploadId);
    if (!session) {
      return;
    }

    // 删除临时文件
    if (existsSync(session.tempPath)) {
      await unlink(session.tempPath);
    }

    // 清理会话
    this.sessions.delete(uploadId);
  }

  /**
   * 获取上传进度
   */
  getUploadProgress(uploadId: string): { uploaded: number; total: number } | null {
    const session = this.sessions.get(uploadId);
    if (!session) {
      return null;
    }

    return {
      uploaded: session.uploadedChunks.size,
      total: session.totalChunks,
    };
  }

  private async parseExif(filePath: string): Promise<any> {
    try {
      const exif = await exifr.parse(filePath, {
        pick: [
          'DateTimeOriginal',
          'GPSLatitude',
          'GPSLongitude',
          'GPSAltitude',
          'Make',
          'Model',
          'ISO',
          'FocalLength',
          'FNumber',
          'ExposureTime',
          'ImageWidth',
          'ImageHeight',
        ],
      });

      return {
        captureTime: exif?.DateTimeOriginal ? new Date(exif.DateTimeOriginal) : undefined,
        latitude: exif?.GPSLatitude,
        longitude: exif?.GPSLongitude,
        altitude: exif?.GPSAltitude,
        cameraMake: exif?.Make,
        cameraModel: exif?.Model,
        iso: exif?.ISO,
        focalLength: exif?.FocalLength,
        aperture: exif?.FNumber,
        shutterSpeed: exif?.ExposureTime ? `1/${Math.round(1 / exif.ExposureTime)}` : undefined,
        width: exif?.ImageWidth,
        height: exif?.ImageHeight,
      };
    } catch (error) {
      return {};
    }
  }

  private generateLibraryPath(hash: string, ext: string, captureTime?: Date): string {
    const date = captureTime || new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return join(this.dataDir, 'originals', String(year), month, `${hash}${ext}`);
  }

  private async ensureDirectoryExists(filePath: string): Promise<void> {
    const { dirname } = await import('path');
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }
}

