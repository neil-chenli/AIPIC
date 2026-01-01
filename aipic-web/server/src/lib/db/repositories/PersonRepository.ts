import { Database } from 'better-sqlite3';
import { Person, PersonCreateInput, PersonWithStats, Face } from '../../types/person';
import { randomUUID } from 'crypto';

function rowToPerson(row: any): Person {
  return {
    id: row.id,
    name: row.name,
    coverFaceId: row.cover_face_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function rowToFace(row: any): Face {
  return {
    id: row.id,
    photoId: row.photo_id,
    boundingBox: row.bounding_box,
    descriptor: row.descriptor,
    quality: row.quality,
    personId: row.person_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class PersonRepository {
  constructor(private db: Database) {}

  create(input: PersonCreateInput): Person {
    const id = randomUUID();
    const now = new Date();

    const stmt = this.db.prepare(`
      INSERT INTO persons (
        id, name, created_at, updated_at
      ) VALUES (
        @id, @name, @createdAt, @updatedAt
      )
    `);

    stmt.run({
      id,
      name: input.name || null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    return this.findById(id)!;
  }

  findById(id: string): Person | null {
    const stmt = this.db.prepare(`SELECT * FROM persons WHERE id = ?`);
    const row = stmt.get(id) as any;
    return row ? rowToPerson(row) : null;
  }

  findAll(): Person[] {
    const stmt = this.db.prepare(`SELECT * FROM persons ORDER BY name, created_at`);
    const rows = stmt.all() as any[];
    return rows.map(rowToPerson);
  }

  findWithStats(): PersonWithStats[] {
    const stmt = this.db.prepare(`
      SELECT 
        p.*,
        COUNT(DISTINCT f.id) as faceCount,
        COUNT(DISTINCT f.photo_id) as photoCount
      FROM persons p
      LEFT JOIN faces f ON p.id = f.person_id
      GROUP BY p.id
      ORDER BY p.name, p.created_at
    `);
    const rows = stmt.all() as any[];
    return rows.map((row: any) => ({
      ...rowToPerson(row),
      faceCount: row.faceCount,
      photoCount: row.photoCount,
    }));
  }

  update(id: string, updates: Partial<PersonCreateInput>): boolean {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }

    if (fields.length === 0) return false;

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const query = `UPDATE persons SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(query);
    const result = stmt.run(...values);
    return result.changes > 0;
  }

  updateCoverFace(personId: string, faceId: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE persons SET cover_face_id = ?, updated_at = ? WHERE id = ?
    `);
    const result = stmt.run(faceId, new Date().toISOString(), personId);
    return result.changes > 0;
  }

  delete(id: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM persons WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Face管理
  createFace(face: {
    photoId: string;
    boundingBox: string;
    descriptor: string;
    quality: number;
    personId?: string;
  }): Face {
    const id = randomUUID();
    const now = new Date();

    const stmt = this.db.prepare(`
      INSERT INTO faces (
        id, photo_id, bounding_box, descriptor, quality, person_id, created_at, updated_at
      ) VALUES (
        @id, @photoId, @boundingBox, @descriptor, @quality, @personId, @createdAt, @updatedAt
      )
    `);

    stmt.run({
      id,
      photoId: face.photoId,
      boundingBox: face.boundingBox,
      descriptor: face.descriptor,
      quality: face.quality,
      personId: face.personId || null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    return this.findFaceById(id)!;
  }

  findFaceById(id: string): Face | null {
    const stmt = this.db.prepare(`SELECT * FROM faces WHERE id = ?`);
    const row = stmt.get(id) as any;
    return row ? rowToFace(row) : null;
  }

  findFacesByPhoto(photoId: string): Face[] {
    const stmt = this.db.prepare(`SELECT * FROM faces WHERE photo_id = ? ORDER BY quality DESC`);
    const rows = stmt.all(photoId) as any[];
    return rows.map(rowToFace);
  }

  findFacesByPerson(personId: string): Face[] {
    const stmt = this.db.prepare(`SELECT * FROM faces WHERE person_id = ? ORDER BY quality DESC`);
    const rows = stmt.all(personId) as any[];
    return rows.map(rowToFace);
  }

  updateFacePerson(faceId: string, personId: string | null): boolean {
    const stmt = this.db.prepare(`
      UPDATE faces SET person_id = ?, updated_at = ? WHERE id = ?
    `);
    const result = stmt.run(personId, new Date().toISOString(), faceId);
    return result.changes > 0;
  }

  deleteFace(id: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM faces WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // 合并人物（将所有faces从sourcePersonId移动到targetPersonId）
  mergePersons(targetPersonId: string, sourcePersonId: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE faces SET person_id = ?, updated_at = ? WHERE person_id = ?
    `);
    const result = stmt.run(targetPersonId, new Date().toISOString(), sourcePersonId);
    
    // 删除源人物
    this.delete(sourcePersonId);
    
    return result.changes > 0;
  }
}

