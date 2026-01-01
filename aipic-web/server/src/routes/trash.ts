import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getDatabase } from '../lib/db/connection';
import { PhotoRepository } from '../lib/db/repositories/PhotoRepository';
import { authenticate, requireRole } from '../middleware/auth';

export async function trashRoutes(fastify: FastifyInstance) {
  const db = getDatabase();
  const photoRepo = new PhotoRepository(db);

  // 获取回收站列表
  fastify.get(
    '/',
    { preHandler: [authenticate, requireRole(['owner'])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const query = request.query as any;
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 50;
        const offset = (page - 1) * limit;

        // 获取已删除的照片（需要修改Repository支持查询deleted_at不为null的记录）
        // 这里简化处理，实际应该在Repository中添加findDeleted方法
        const stmt = db.prepare(`
          SELECT * FROM photos 
          WHERE deleted_at IS NOT NULL 
          ORDER BY deleted_at DESC 
          LIMIT ? OFFSET ?
        `);
        const rows = stmt.all(limit, offset) as any[];
        
        // 转换格式
        const photos = rows.map((row: any) => ({
          id: row.id,
          fileName: row.file_name,
          originalFileName: row.original_file_name,
          filePath: row.file_path,
          thumbnailPath: row.thumbnail_path,
          fileSize: row.file_size,
          fileHash: row.file_hash,
          mimeType: row.mime_type,
          width: row.width,
          height: row.height,
          captureTime: row.capture_time ? new Date(row.capture_time) : null,
          deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        }));

        const countStmt = db.prepare(`SELECT COUNT(*) as count FROM photos WHERE deleted_at IS NOT NULL`);
        const total = (countStmt.get() as any).count;

        return {
          photos,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );
}

