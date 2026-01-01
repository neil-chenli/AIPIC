import { Database } from 'better-sqlite3';
import { Tag, TagCreateInput, TagWithStats } from '../../types/tag';
import { randomUUID } from 'crypto';

function rowToTag(row: any): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    parentId: row.parent_id,
    sortOrder: row.sort_order,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class TagRepository {
  constructor(private db: Database) {}

  create(input: TagCreateInput): Tag {
    const id = randomUUID();
    const now = new Date();

    const stmt = this.db.prepare(`
      INSERT INTO tags (
        id, name, color, parent_id, sort_order, created_at, updated_at
      ) VALUES (
        @id, @name, @color, @parentId, @sortOrder, @createdAt, @updatedAt
      )
    `);

    stmt.run({
      id,
      name: input.name,
      color: input.color || null,
      parentId: input.parentId || null,
      sortOrder: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    return this.findById(id)!;
  }

  findById(id: string): Tag | null {
    const stmt = this.db.prepare(`SELECT * FROM tags WHERE id = ?`);
    const row = stmt.get(id) as any;
    return row ? rowToTag(row) : null;
  }

  findByName(name: string): Tag | null {
    const stmt = this.db.prepare(`SELECT * FROM tags WHERE name = ?`);
    const row = stmt.get(name) as any;
    return row ? rowToTag(row) : null;
  }

  findAll(): Tag[] {
    const stmt = this.db.prepare(`SELECT * FROM tags ORDER BY sort_order, name`);
    const rows = stmt.all() as any[];
    return rows.map(rowToTag);
  }

  findChildren(parentId: string | null): Tag[] {
    const query = parentId
      ? 'SELECT * FROM tags WHERE parent_id = ? ORDER BY sort_order, name'
      : 'SELECT * FROM tags WHERE parent_id IS NULL ORDER BY sort_order, name';
    
    const stmt = this.db.prepare(query);
    const rows = parentId ? (stmt.all(parentId) as any[]) : (stmt.all() as any[]);
    return rows.map(rowToTag);
  }

  findWithStats(): TagWithStats[] {
    const stmt = this.db.prepare(`
      SELECT 
        t.*,
        COUNT(pt.photo_id) as photoCount
      FROM tags t
      LEFT JOIN photo_tags pt ON t.id = pt.tag_id
      GROUP BY t.id
      ORDER BY t.sort_order, t.name
    `);
    const rows = stmt.all() as any[];
    return rows.map((row: any) => ({
      ...rowToTag(row),
      photoCount: row.photoCount,
    }));
  }

  update(id: string, updates: Partial<TagCreateInput>): boolean {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.color !== undefined) {
      fields.push('color = ?');
      values.push(updates.color);
    }
    if (updates.parentId !== undefined) {
      fields.push('parent_id = ?');
      values.push(updates.parentId);
    }

    if (fields.length === 0) return false;

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const query = `UPDATE tags SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(query);
    const result = stmt.run(...values);
    return result.changes > 0;
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM tags WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // 照片标签关联
  addTagToPhoto(photoId: string, tagId: string, source: 'manual' | 'auto' = 'manual', confidence?: number): boolean {
    const id = randomUUID();
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO photo_tags (
        id, photo_id, tag_id, source, confidence, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      id,
      photoId,
      tagId,
      source,
      confidence || null,
      new Date().toISOString()
    );
    return result.changes > 0;
  }

  removeTagFromPhoto(photoId: string, tagId: string): boolean {
    const stmt = this.db.prepare(`
      DELETE FROM photo_tags WHERE photo_id = ? AND tag_id = ?
    `);
    const result = stmt.run(photoId, tagId);
    return result.changes > 0;
  }

  getPhotoTags(photoId: string): Tag[] {
    const stmt = this.db.prepare(`
      SELECT t.* FROM tags t
      INNER JOIN photo_tags pt ON t.id = pt.tag_id
      WHERE pt.photo_id = ?
      ORDER BY t.name
    `);
    const rows = stmt.all(photoId) as any[];
    return rows.map(rowToTag);
  }

  getTagPhotos(tagId: string): string[] {
    const stmt = this.db.prepare(`
      SELECT photo_id FROM photo_tags WHERE tag_id = ?
    `);
    const rows = stmt.all(tagId) as any[];
    return rows.map((row: any) => row.photo_id);
  }
}

