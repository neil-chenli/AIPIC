import { readdir, stat, copyFile, mkdir } from 'fs/promises';
import { join, extname, basename, dirname } from 'path';
import { createHash } from 'crypto';
import { readFile } from 'fs/promises';
import exifr from 'exifr';
import { getDatabase } from '../lib/db/connection';
import { PhotoRepository } from '../lib/db/repositories/PhotoRepository';
import { ImportTaskRepository } from '../lib/db/repositories/ImportTaskRepository';
import { PhotoCreateInput } from '../types/photo';
import { ThumbnailService } from './ThumbnailService';

// 支持的照片格式
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic', '.heif'];
// 黑名单文件
const BLACKLIST = ['Thumbs.db', '.DS_Store', 'desktop.ini'];
// 最大文件大小（100MB）
const MAX_FILE_SIZE = 100 * 1024 * 1024;

export class ImportService {
  private photoRepo: PhotoRepository;
  private importTaskRepo: ImportTaskRepository;
  private thumbnailService: ThumbnailService;
  private dataDir: string;
  private importedPhotoIds: string[] = [];

  constructor() {
    const db = getDatabase();
    this.photoRepo = new PhotoRepository(db);
    this.importTaskRepo = new ImportTaskRepository(db);
    this.thumbnailService = new ThumbnailService();
    this.dataDir = process.env.DATA_DIR || join(process.cwd(), '..', '..', 'data');
  }

  /**
   * 扫描目录，获取所有照片文件
   */
  private async scanDirectory(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          // 递归扫描子目录
          const subFiles = await this.scanDirectory(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          // 检查文件扩展名
          const ext = extname(entry.name).toLowerCase();
          if (SUPPORTED_EXTENSIONS.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error);
    }
    
    return files;
  }

  /**
   * 过滤文件（黑名单、大小检查）
   */
  private async filterFiles(filePaths: string[]): Promise<string[]> {
    const filtered: string[] = [];
    
    for (const filePath of filePaths) {
      const fileName = basename(filePath);
      
      // 检查黑名单
      if (BLACKLIST.includes(fileName)) {
        continue;
      }
      
      try {
        const stats = await stat(filePath);
        
        // 检查文件大小
        if (stats.size > MAX_FILE_SIZE) {
          console.warn(`File too large, skipping: ${filePath}`);
          continue;
        }
        
        // 检查文件是否可读
        if (!stats.isFile()) {
          continue;
        }
        
        filtered.push(filePath);
      } catch (error) {
        console.error(`Error checking file ${filePath}:`, error);
      }
    }
    
    return filtered;
  }

  /**
   * 计算文件hash
   */
  private async calculateHash(filePath: string): Promise<string> {
    const buffer = await readFile(filePath);
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * 解析EXIF数据
   */
  private async parseExif(filePath: string): Promise<{
    captureTime?: Date;
    latitude?: number;
    longitude?: number;
    altitude?: number;
    cameraMake?: string;
    cameraModel?: string;
    iso?: number;
    focalLength?: number;
    aperture?: number;
    shutterSpeed?: string;
    width?: number;
    height?: number;
  }> {
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

      const result: any = {};

      if (exif?.DateTimeOriginal) {
        result.captureTime = new Date(exif.DateTimeOriginal);
      }

      if (exif?.GPSLatitude && exif?.GPSLongitude) {
        result.latitude = exif.GPSLatitude;
        result.longitude = exif.GPSLongitude;
      }

      if (exif?.GPSAltitude !== undefined) {
        result.altitude = exif.GPSAltitude;
      }

      if (exif?.Make) {
        result.cameraMake = exif.Make;
      }

      if (exif?.Model) {
        result.cameraModel = exif.Model;
      }

      if (exif?.ISO) {
        result.iso = exif.ISO;
      }

      if (exif?.FocalLength) {
        result.focalLength = exif.FocalLength;
      }

      if (exif?.FNumber) {
        result.aperture = exif.FNumber;
      }

      if (exif?.ExposureTime) {
        result.shutterSpeed = `1/${Math.round(1 / exif.ExposureTime)}`;
      }

      if (exif?.ImageWidth) {
        result.width = exif.ImageWidth;
      }

      if (exif?.ImageHeight) {
        result.height = exif.ImageHeight;
      }

      return result;
    } catch (error) {
      console.error(`Error parsing EXIF for ${filePath}:`, error);
      return {};
    }
  }

  /**
   * 生成库文件路径（originals/YYYY/MM/{hash}.{ext}）
   */
  private generateLibraryPath(hash: string, originalExt: string, captureTime?: Date): string {
    const date = captureTime || new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    return join(this.dataDir, 'originals', String(year), month, `${hash}${originalExt}`);
  }

  /**
   * 确保目录存在
   */
  private async ensureDirectoryExists(filePath: string): Promise<void> {
    const dir = dirname(filePath);
    await mkdir(dir, { recursive: true });
  }

  /**
   * 处理单个文件
   */
  private async processFile(
    filePath: string,
    taskId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 计算hash
      const hash = await this.calculateHash(filePath);
      
      // 检查是否已存在（去重）
      const existing = this.photoRepo.findByHash(hash);
      if (existing) {
        return { success: true }; // 已存在，跳过
      }

      // 获取文件信息
      const stats = await stat(filePath);
      const ext = extname(filePath).toLowerCase();
      const mimeType = this.getMimeType(ext);
      
      // 解析EXIF
      const exifData = await this.parseExif(filePath);
      
      // 生成库文件路径
      const libraryPath = this.generateLibraryPath(hash, ext, exifData.captureTime);
      
      // 确保目录存在
      await this.ensureDirectoryExists(libraryPath);
      
      // 复制文件到库目录
      await copyFile(filePath, libraryPath);
      
      // 创建照片记录
      const photoInput: PhotoCreateInput = {
        fileName: basename(libraryPath),
        originalFileName: basename(filePath),
        filePath: libraryPath,
        fileSize: stats.size,
        fileHash: hash,
        mimeType,
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
      };
      
      const photo = this.photoRepo.create(photoInput);
      this.importedPhotoIds.push(photo.id);
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /**
   * 获取MIME类型
   */
  private getMimeType(ext: string): string {
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp',
      '.heic': 'image/heic',
      '.heif': 'image/heif',
    };
    return mimeTypes[ext.toLowerCase()] || 'image/jpeg';
  }

  /**
   * 执行导入任务
   */
  async executeImport(taskId: string): Promise<void> {
    const task = this.importTaskRepo.findById(taskId);
    if (!task) {
      throw new Error(`Import task not found: ${taskId}`);
    }

    if (task.status !== 'queued') {
      throw new Error(`Import task is not in queued status: ${task.status}`);
    }

    // 更新状态为running
    this.importTaskRepo.updateStatus(taskId, 'running', {
      startedAt: new Date(),
    });

    // 重置导入的照片ID列表
    this.importedPhotoIds = [];

    try {
      // 扫描目录
      const allFiles = await this.scanDirectory(task.sourcePath);
      
      // 过滤文件
      const filteredFiles = await this.filterFiles(allFiles);
      
      // 更新总文件数
      this.importTaskRepo.updateStatus(taskId, 'running', {
        totalFiles: filteredFiles.length,
      });

      let successCount = 0;
      let failedCount = 0;

      // 处理每个文件
      for (let i = 0; i < filteredFiles.length; i++) {
        const filePath = filteredFiles[i];
        
        // 检查任务是否被取消
        const currentTask = this.importTaskRepo.findById(taskId);
        if (currentTask?.status === 'cancelled') {
          break;
        }

        const result = await this.processFile(filePath, taskId);
        
        if (result.success) {
          successCount++;
        } else {
          failedCount++;
          console.error(`Failed to import ${filePath}: ${result.error}`);
        }

        // 更新进度
        this.importTaskRepo.updateStatus(taskId, 'running', {
          processedFiles: i + 1,
          successCount,
          failedCount,
        });
      }

      // 更新状态为完成
      this.importTaskRepo.updateStatus(taskId, 'succeeded', {
        completedAt: new Date(),
      });

      // 异步生成缩略图（不阻塞导入完成）
      if (this.importedPhotoIds.length > 0) {
        this.thumbnailService.generateThumbnailsBatch(this.importedPhotoIds).catch((error) => {
          console.error(`Error generating thumbnails for import task ${taskId}:`, error);
        });
      }
    } catch (error: any) {
      // 更新状态为失败
      this.importTaskRepo.updateStatus(taskId, 'failed', {
        errorMessage: error.message || 'Unknown error',
        completedAt: new Date(),
      });
      throw error;
    }
  }
}

