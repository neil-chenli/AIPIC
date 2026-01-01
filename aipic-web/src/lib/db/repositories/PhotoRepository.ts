import { Database } from 'better-sqlite3';
import { Photo, PhotoCreateInput, PhotoFilter } from '@/types/photo';
import { randomUUID } from 'crypto';

export class PhotoRepository {
  constructor(private db: Database) {}

  create(input: PhotoCreateInput): Photo {
    const id = randomUUID();
    const now = new Date();

    const stmt = this.db.prepare(`
      INSERT INTO photos (
        id, file_name, original_file_name, file_path, file_size, file_hash,
        mime_type, width, height, capture_time, latitude, longitude, altitude,
        camera_make, camera_model, iso, focal_length, aperture, shutter_speed,
        created_at, updated_at
      ) VALUES (
        @id, @fileName, @originalFileName, @filePath, @fileSize, @fileHash,
        @mimeType, @width, @height, @captureTime, @latitude, @longitude, @altitude,
        @cameraMake, @cameraModel, @iso, @focalLength, @aperture, @shutterSpeed,
        @createdAt, @updatedAt
      )
    `);

    stmt.run({
      id,
      fileName: input.fileName,
      originalFileName: input.originalFileName,
      filePath: input.filePath,
      fileSize: input.fileSize,
      fileHash: input.fileHash,
      mimeType: input.mimeType,
      width: input.width || null,
      height: input.height || null,
      captureTime: input.captureTime?.toISOString() || null,
      latitude: input.latitude || null,
      longitude: input.longitude || null,
      altitude: input.altitude || null,
      cameraMake: input.cameraMake || null,
      cameraModel: input.cameraModel || null,
      iso: input.iso || null,
      focalLength: input.focalLength || null,
      aperture: input.aperture || null,
      shutterSpeed: input.shutterSpeed || null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    return this.findById(id)!;
  }

  findById(id: string): Photo | null {
    const stmt = this.db.prepare(`
      SELECT * FROM photos WHERE id = ? AND deleted_at IS NULL
    `);
    return stmt.get(id) as Photo | null;
  }

  findByHash(hash: string): Photo | null {
    const stmt = this.db.prepare(`
      SELECT * FROM photos WHERE file_hash = ? AND deleted_at IS NULL
    `);
    return stmt.get(hash) as Photo | null;
  }

  findAll(filter: PhotoFilter = {}, limit = 50, offset = 0): Photo[] {
    let query = 'SELECT * FROM photos WHERE deleted_at IS NULL';
    const params: any[] = [];

    if (filter.startDate) {
      query += ' AND capture_time >= ?';
      params.push(filter.startDate.toISOString());
    }

    if (filter.endDate) {
      query += ' AND capture_time <= ?';
      params.push(filter.endDate.toISOString());
    }

    if (filter.hasLocation !== undefined) {
      query += filter.hasLocation
        ? ' AND latitude IS NOT NULL AND longitude IS NOT NULL'
        : ' AND (latitude IS NULL OR longitude IS NULL)';
    }

    if (filter.albumId) {
      query += ` AND id IN (
        SELECT photo_id FROM album_photos WHERE album_id = ?
      )`;
      params.push(filter.albumId);
    }

    if (filter.tagIds && filter.tagIds.length > 0) {
      const placeholders = filter.tagIds.map(() => '?').join(',');
      query += ` AND id IN (
        SELECT photo_id FROM photo_tags WHERE tag_id IN (${placeholders})
      )`;
      params.push(...filter.tagIds);
    }

    if (filter.personId) {
      query += ` AND id IN (
        SELECT photo_id FROM faces WHERE person_id = ?
      )`;
      params.push(filter.personId);
    }

    query += ' ORDER BY capture_time DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as Photo[];
  }

  count(filter: PhotoFilter = {}): number {
    let query = 'SELECT COUNT(*) as count FROM photos WHERE deleted_at IS NULL';
    const params: any[] = [];

    if (filter.startDate) {
      query += ' AND capture_time >= ?';
      params.push(filter.startDate.toISOString());
    }

    if (filter.endDate) {
      query += ' AND capture_time <= ?';
      params.push(filter.endDate.toISOString());
    }

    const stmt = this.db.prepare(query);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  }

  softDelete(id: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE photos SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL
    `);
    const result = stmt.run(new Date().toISOString(), id);
    return result.changes > 0;
  }

  restore(id: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE photos SET deleted_at = NULL WHERE id = ?
    `);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  permanentDelete(id: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM photos WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  updateThumbnailPath(id: string, thumbnailPath: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE photos SET thumbnail_path = ? WHERE id = ?
    `);
    const result = stmt.run(thumbnailPath, id);
    return result.changes > 0;
  }
}
