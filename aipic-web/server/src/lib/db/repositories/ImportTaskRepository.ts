import { Database } from 'better-sqlite3';
import { ImportTask, ImportTaskCreateInput, ImportTaskStatus } from '../../types/import';
import { randomUUID } from 'crypto';

function rowToImportTask(row: any): ImportTask {
  return {
    id: row.id,
    sourcePath: row.source_path,
    status: row.status as ImportTaskStatus,
    totalFiles: row.total_files,
    processedFiles: row.processed_files,
    successCount: row.success_count,
    failedCount: row.failed_count,
    errorMessage: row.error_message,
    startedAt: row.started_at ? new Date(row.started_at) : null,
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class ImportTaskRepository {
  constructor(private db: Database) {}

  create(input: ImportTaskCreateInput): ImportTask {
    const id = randomUUID();
    const now = new Date();

    const stmt = this.db.prepare(`
      INSERT INTO import_tasks (
        id, source_path, status, total_files, processed_files,
        success_count, failed_count, created_at, updated_at
      ) VALUES (
        @id, @sourcePath, @status, @totalFiles, @processedFiles,
        @successCount, @failedCount, @createdAt, @updatedAt
      )
    `);

    stmt.run({
      id,
      sourcePath: input.sourcePath,
      status: 'queued',
      totalFiles: 0,
      processedFiles: 0,
      successCount: 0,
      failedCount: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    return this.findById(id)!;
  }

  findById(id: string): ImportTask | null {
    const stmt = this.db.prepare(`
      SELECT * FROM import_tasks WHERE id = ?
    `);
    const row = stmt.get(id) as any;
    return row ? rowToImportTask(row) : null;
  }

  findAll(limit = 50, offset = 0): ImportTask[] {
    const stmt = this.db.prepare(`
      SELECT * FROM import_tasks 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    const rows = stmt.all(limit, offset) as any[];
    return rows.map(rowToImportTask);
  }

  updateStatus(
    id: string,
    status: ImportTaskStatus,
    updates?: {
      totalFiles?: number;
      processedFiles?: number;
      successCount?: number;
      failedCount?: number;
      errorMessage?: string;
      startedAt?: Date;
      completedAt?: Date;
    }
  ): boolean {
    const fields: string[] = ['status = ?'];
    const values: any[] = [status];

    if (updates?.totalFiles !== undefined) {
      fields.push('total_files = ?');
      values.push(updates.totalFiles);
    }
    if (updates?.processedFiles !== undefined) {
      fields.push('processed_files = ?');
      values.push(updates.processedFiles);
    }
    if (updates?.successCount !== undefined) {
      fields.push('success_count = ?');
      values.push(updates.successCount);
    }
    if (updates?.failedCount !== undefined) {
      fields.push('failed_count = ?');
      values.push(updates.failedCount);
    }
    if (updates?.errorMessage !== undefined) {
      fields.push('error_message = ?');
      values.push(updates.errorMessage);
    }
    if (updates?.startedAt !== undefined) {
      fields.push('started_at = ?');
      values.push(updates.startedAt.toISOString());
    }
    if (updates?.completedAt !== undefined) {
      fields.push('completed_at = ?');
      values.push(updates.completedAt.toISOString());
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const query = `UPDATE import_tasks SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = this.db.prepare(query);
    const result = stmt.run(...values);
    return result.changes > 0;
  }

  cancel(id: string): boolean {
    return this.updateStatus(id, 'cancelled', {
      completedAt: new Date(),
    });
  }
}

