import { Database } from 'better-sqlite3';
import { Album, AlbumCreateInput, AlbumWithStats } from '@/types/album';
import { randomUUID } from 'crypto';

export class AlbumRepository {
  constructor(private db: Database) {}

  create(input: AlbumCreateInput): Album {
    const id = randomUUID();
    const now = new Date();

    const stmt = this.db.prepare(`
      INSERT INTO albums (
        id, name, description, parent_id, is_smart_album, smart_rules,
        sort_order, created_at, updated_at
      ) VALUES (
        @id, @name, @description, @parentId, @isSmartAlbum, @smartRules,
        @sortOrder, @createdAt, @updatedAt
      )
    `);

    stmt.run({
      id,
      name: input.name,
      description: input.description || null,
      parentId: input.parentId || null,
      isSmartAlbum: input.isSmartAlbum ? 1 : 0,
      smartRules: input.smartRules || null,
      sortOrder: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    return this.findById(id)!;
  }

  findById(id: string): Album | null {
    const stmt = this.db.prepare(`
      SELECT * FROM albums WHERE id = ? AND deleted_at IS NULL
    `);
    return stmt.get(id) as Album | null;
  }

  findAll(): Album[] {
    const stmt = this.db.prepare(`
      SELECT * FROM albums WHERE deleted_at IS NULL ORDER BY sort_order, name
    `);
    return stmt.all() as Album[];
  }

  findWithStats(): AlbumWithStats[] {
    const stmt = this.db.prepare(`
      SELECT 
        a.*,
        COUNT(ap.photo_id) as photoCount
      FROM albums a
      LEFT JOIN album_photos ap ON a.id = ap.album_id
      WHERE a.deleted_at IS NULL
      GROUP BY a.id
      ORDER BY a.sort_order, a.name
    `);
    return stmt.all() as AlbumWithStats[];
  }

  findChildren(parentId: string | null): Album[] {
    const query = parentId
      ? 'SELECT * FROM albums WHERE parent_id = ? AND deleted_at IS NULL ORDER BY sort_order, name'
      : 'SELECT * FROM albums WHERE parent_id IS NULL AND deleted_at IS NULL ORDER BY sort_order, name';
    
    const stmt = this.db.prepare(query);
    return parentId ? (stmt.all(parentId) as Album[]) : (stmt.all() as Album[]);
  }

  update(id: string, updates: Partial<AlbumCreateInput>): boolean {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.parentId !== undefined) {
      fields.push('parent_id = ?');
      values.push(updates.parentId);
    }

    if (fields.length === 0) return false;

    values.push(id);
    const query = `UPDATE albums SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(query);
    const result = stmt.run(...values);
    return result.changes > 0;
  }

  addPhoto(albumId: string, photoId: string): boolean {
    const id = randomUUID();
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO album_photos (id, album_id, photo_id, added_at)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(id, albumId, photoId, new Date().toISOString());
    return result.changes > 0;
  }

  removePhoto(albumId: string, photoId: string): boolean {
    const stmt = this.db.prepare(`
      DELETE FROM album_photos WHERE album_id = ? AND photo_id = ?
    `);
    const result = stmt.run(albumId, photoId);
    return result.changes > 0;
  }

  getPhotoCount(albumId: string): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM album_photos WHERE album_id = ?
    `);
    const result = stmt.get(albumId) as { count: number };
    return result.count;
  }

  softDelete(id: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE albums SET deleted_at = ? WHERE id = ?
    `);
    const result = stmt.run(new Date().toISOString(), id);
    return result.changes > 0;
  }
}
