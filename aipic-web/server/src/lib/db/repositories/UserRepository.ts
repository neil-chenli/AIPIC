import { Database } from 'better-sqlite3';
import { User, UserCreateInput, Session } from '../../types/user';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';

// 将数据库行转换为User对象
function rowToUser(row: any): User {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role as 'owner' | 'member',
    isActive: Boolean(row.is_active),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// 将数据库行转换为Session对象
function rowToSession(row: any): Session {
  return {
    id: row.id,
    userId: row.user_id,
    token: row.token,
    expiresAt: new Date(row.expires_at),
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: new Date(row.created_at),
  };
}

export class UserRepository {
  constructor(private db: Database) {}

  async create(input: UserCreateInput): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    
    // 哈希密码
    const passwordHash = await bcrypt.hash(input.password, 10);

    const stmt = this.db.prepare(`
      INSERT INTO users (
        id, username, email, password_hash, role, is_active,
        created_at, updated_at
      ) VALUES (
        @id, @username, @email, @passwordHash, @role, @isActive,
        @createdAt, @updatedAt
      )
    `);

    stmt.run({
      id,
      username: input.username,
      email: input.email || null,
      passwordHash,
      role: input.role || 'member',
      isActive: 1,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    return this.findById(id)!;
  }

  findById(id: string): User | null {
    const stmt = this.db.prepare(`
      SELECT * FROM users WHERE id = ? AND is_active = 1
    `);
    const row = stmt.get(id) as any;
    return row ? rowToUser(row) : null;
  }

  findByUsername(username: string): User | null {
    const stmt = this.db.prepare(`
      SELECT * FROM users WHERE username = ? AND is_active = 1
    `);
    const row = stmt.get(username) as any;
    return row ? rowToUser(row) : null;
  }

  findByEmail(email: string): User | null {
    const stmt = this.db.prepare(`
      SELECT * FROM users WHERE email = ? AND is_active = 1
    `);
    const row = stmt.get(email) as any;
    return row ? rowToUser(row) : null;
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.passwordHash);
  }

  async updatePassword(userId: string, newPassword: string): Promise<boolean> {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const stmt = this.db.prepare(`
      UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?
    `);
    const result = stmt.run(passwordHash, new Date().toISOString(), userId);
    return result.changes > 0;
  }

  hasOwner(): boolean {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE role = 'owner' AND is_active = 1
    `);
    const result = stmt.get() as { count: number };
    return result.count > 0;
  }

  // Session管理
  createSession(userId: string, token: string, expiresAt: Date, ipAddress?: string, userAgent?: string): Session {
    const id = randomUUID();
    const stmt = this.db.prepare(`
      INSERT INTO sessions (
        id, user_id, token, expires_at, ip_address, user_agent, created_at
      ) VALUES (
        @id, @userId, @token, @expiresAt, @ipAddress, @userAgent, @createdAt
      )
    `);

    stmt.run({
      id,
      userId,
      token,
      expiresAt: expiresAt.toISOString(),
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      createdAt: new Date().toISOString(),
    });

    return this.findSessionByToken(token)!;
  }

  findSessionByToken(token: string): Session | null {
    const stmt = this.db.prepare(`
      SELECT * FROM sessions 
      WHERE token = ? AND expires_at > datetime('now')
    `);
    const row = stmt.get(token) as any;
    return row ? rowToSession(row) : null;
  }

  deleteSession(token: string): boolean {
    const stmt = this.db.prepare(`
      DELETE FROM sessions WHERE token = ?
    `);
    const result = stmt.run(token);
    return result.changes > 0;
  }

  deleteUserSessions(userId: string): boolean {
    const stmt = this.db.prepare(`
      DELETE FROM sessions WHERE user_id = ?
    `);
    const result = stmt.run(userId);
    return result.changes > 0;
  }

  // 清理过期会话
  cleanupExpiredSessions(): number {
    const stmt = this.db.prepare(`
      DELETE FROM sessions WHERE expires_at <= datetime('now')
    `);
    const result = stmt.run();
    return result.changes;
  }
}

