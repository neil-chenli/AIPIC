import { Database } from 'better-sqlite3';
import { randomUUID } from 'crypto';

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  userId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: Date;
}

export interface AuditLogCreateInput {
  action: string;
  entityType: string;
  entityId?: string;
  userId?: string;
  details?: string;
  ipAddress?: string;
}

function rowToAuditLog(row: any): AuditLog {
  return {
    id: row.id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    userId: row.user_id,
    details: row.details,
    ipAddress: row.ip_address,
    createdAt: new Date(row.created_at),
  };
}

export class AuditLogRepository {
  constructor(private db: Database) {}

  create(input: AuditLogCreateInput): AuditLog {
    const id = randomUUID();
    const now = new Date();

    const stmt = this.db.prepare(`
      INSERT INTO audit_logs (
        id, action, entity_type, entity_id, user_id, details, ip_address, created_at
      ) VALUES (
        @id, @action, @entityType, @entityId, @userId, @details, @ipAddress, @createdAt
      )
    `);

    stmt.run({
      id,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId || null,
      userId: input.userId || null,
      details: input.details || null,
      ipAddress: input.ipAddress || null,
      createdAt: now.toISOString(),
    });

    return this.findById(id)!;
  }

  findById(id: string): AuditLog | null {
    const stmt = this.db.prepare(`SELECT * FROM audit_logs WHERE id = ?`);
    const row = stmt.get(id) as any;
    return row ? rowToAuditLog(row) : null;
  }

  findAll(filter?: {
    entityType?: string;
    entityId?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }, limit = 100, offset = 0): AuditLog[] {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];

    if (filter?.entityType) {
      query += ' AND entity_type = ?';
      params.push(filter.entityType);
    }
    if (filter?.entityId) {
      query += ' AND entity_id = ?';
      params.push(filter.entityId);
    }
    if (filter?.userId) {
      query += ' AND user_id = ?';
      params.push(filter.userId);
    }
    if (filter?.startDate) {
      query += ' AND created_at >= ?';
      params.push(filter.startDate.toISOString());
    }
    if (filter?.endDate) {
      query += ' AND created_at <= ?';
      params.push(filter.endDate.toISOString());
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];
    return rows.map(rowToAuditLog);
  }
}

