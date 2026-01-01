import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname, extname } from 'path';
import { existsSync } from 'fs';
import { getDatabase } from '../lib/db/connection';
import { PhotoRepository } from '../lib/db/repositories/PhotoRepository';

// 缩略图尺寸配置
const THUMBNAIL_SIZES = {
  small: 256,
  medium: 1024,
};

export class ThumbnailService {
  private photoRepo: PhotoRepository;
  private dataDir: string;

  constructor() {
    const db = getDatabase();
    this.photoRepo = new PhotoRepository(db);
    this.dataDir = process.env.DATA_DIR || join(process.cwd(), '..', '..', 'data');
  }

  /**
   * 生成缩略图路径
   */
  private getThumbnailPath(photoId: string, size: 'small' | 'medium'): string {
    const sizeDir = size === 'small' ? '256' : '1024';
    return join(this.dataDir, 'thumbnails', sizeDir, `${photoId}.jpg`);
  }

  /**
   * 确保缩略图目录存在
   */
  private async ensureThumbnailDir(size: 'small' | 'medium'): Promise<void> {
    const sizeDir = size === 'small' ? '256' : '1024';
    const dir = join(this.dataDir, 'thumbnails', sizeDir);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }

  /**
   * 检查缩略图是否存在
   */
  private thumbnailExists(photoId: string, size: 'small' | 'medium'): boolean {
    const path = this.getThumbnailPath(photoId, size);
    return existsSync(path);
  }

  /**
   * 生成单个缩略图
   */
  private async generateThumbnail(
    sourcePath: string,
    outputPath: string,
    size: number
  ): Promise<void> {
    try {
      // 读取原始图片
      const image = sharp(sourcePath);
      const metadata = await image.metadata();

      // 计算目标尺寸（保持宽高比）
      let width = size;
      let height = size;

      if (metadata.width && metadata.height) {
        const aspectRatio = metadata.width / metadata.height;
        if (metadata.width > metadata.height) {
          height = Math.round(size / aspectRatio);
        } else {
          width = Math.round(size * aspectRatio);
        }
      }

      // 生成缩略图
      await image
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85, mozjpeg: true })
        .toFile(outputPath);
    } catch (error) {
      console.error(`Error generating thumbnail for ${sourcePath}:`, error);
      throw error;
    }
  }

  /**
   * 处理HEIC格式（转换为JPG）
   */
  private async processHeic(sourcePath: string, outputPath: string): Promise<void> {
    try {
      // sharp支持HEIC，直接转换
      await sharp(sourcePath)
        .jpeg({ quality: 90, mozjpeg: true })
        .toFile(outputPath);
    } catch (error) {
      console.error(`Error processing HEIC file ${sourcePath}:`, error);
      throw error;
    }
  }

  /**
   * 为照片生成所有尺寸的缩略图
   */
  async generateThumbnails(photoId: string): Promise<{
    small: string | null;
    medium: string | null;
  }> {
    const photo = this.photoRepo.findById(photoId);
    if (!photo) {
      throw new Error(`Photo not found: ${photoId}`);
    }

    if (!existsSync(photo.filePath)) {
      throw new Error(`Photo file not found: ${photo.filePath}`);
    }

    const ext = extname(photo.filePath).toLowerCase();
    const isHeic = ext === '.heic' || ext === '.heif';

    const result: { small: string | null; medium: string | null } = {
      small: null,
      medium: null,
    };

    try {
      // 生成小尺寸缩略图
      await this.ensureThumbnailDir('small');
      const smallPath = this.getThumbnailPath(photoId, 'small');
      
      if (!this.thumbnailExists(photoId, 'small')) {
        if (isHeic) {
          // HEIC需要先转换
          await this.processHeic(photo.filePath, smallPath);
        } else {
          await this.generateThumbnail(photo.filePath, smallPath, THUMBNAIL_SIZES.small);
        }
      }
      result.small = smallPath;

      // 生成中等尺寸缩略图
      await this.ensureThumbnailDir('medium');
      const mediumPath = this.getThumbnailPath(photoId, 'medium');
      
      if (!this.thumbnailExists(photoId, 'medium')) {
        if (isHeic) {
          // HEIC需要先转换
          await this.processHeic(photo.filePath, mediumPath);
        } else {
          await this.generateThumbnail(photo.filePath, mediumPath, THUMBNAIL_SIZES.medium);
        }
      }
      result.medium = mediumPath;

      // 更新数据库中的缩略图路径（使用小尺寸作为默认）
      if (!photo.thumbnailPath) {
        this.photoRepo.updateThumbnailPath(photoId, result.small);
      }

      return result;
    } catch (error) {
      console.error(`Error generating thumbnails for photo ${photoId}:`, error);
      throw error;
    }
  }

  /**
   * 批量生成缩略图（用于导入后的处理）
   */
  async generateThumbnailsBatch(photoIds: string[]): Promise<void> {
    for (const photoId of photoIds) {
      try {
        await this.generateThumbnails(photoId);
      } catch (error) {
        console.error(`Failed to generate thumbnails for photo ${photoId}:`, error);
        // 继续处理其他照片
      }
    }
  }

  /**
   * 获取缩略图文件路径（如果不存在则生成）
   */
  async getThumbnail(photoId: string, size: 'small' | 'medium' = 'small'): Promise<string> {
    const thumbnailPath = this.getThumbnailPath(photoId, size);
    
    // 如果缩略图不存在，生成它
    if (!this.thumbnailExists(photoId, size)) {
      await this.generateThumbnails(photoId);
    }
    
    return thumbnailPath;
  }
}

