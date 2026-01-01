import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UploadService } from '../services/UploadService';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';
import { createHash } from 'crypto';
import { readFile } from 'fs/promises';

const initUploadSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().positive(),
  fileHash: z.string().min(1),
  mimeType: z.string().min(1),
});

export async function uploadRoutes(fastify: FastifyInstance) {
  const uploadService = new UploadService();

  // 初始化上传会话
  fastify.post(
    '/init',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = initUploadSchema.parse(request.body);
        
        try {
          const result = await uploadService.initUpload(
            body.fileName,
            body.fileSize,
            body.fileHash,
            body.mimeType
          );
          return result;
        } catch (error: any) {
          if (error.message === 'FILE_ALREADY_EXISTS') {
            return reply.code(200).send({ 
              message: 'File already exists',
              exists: true,
            });
          }
          throw error;
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: 'Invalid input', details: error.errors });
        }
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // 上传分片
  fastify.put(
    '/:uploadId/part',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { uploadId } = request.params as { uploadId: string };
        const data = await request.file();
        
        if (!data) {
          return reply.code(400).send({ error: 'No file data provided' });
        }

        const chunkIndex = Number((request.query as any).chunkIndex);
        if (isNaN(chunkIndex) || chunkIndex < 0) {
          return reply.code(400).send({ error: 'Invalid chunk index' });
        }

        const buffer = await data.toBuffer();
        const progress = await uploadService.uploadChunk(uploadId, chunkIndex, buffer);

        return progress;
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: error.message || 'Internal server error' });
      }
    }
  );

  // 完成上传
  fastify.post(
    '/:uploadId/complete',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { uploadId } = request.params as { uploadId: string };
        const result = await uploadService.completeUpload(uploadId);
        return result;
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: error.message || 'Internal server error' });
      }
    }
  );

  // 取消上传
  fastify.delete(
    '/:uploadId',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { uploadId } = request.params as { uploadId: string };
        await uploadService.cancelUpload(uploadId);
        return { message: 'Upload cancelled' };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: error.message || 'Internal server error' });
      }
    }
  );

  // 获取上传进度
  fastify.get(
    '/:uploadId/progress',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { uploadId } = request.params as { uploadId: string };
        const progress = uploadService.getUploadProgress(uploadId);
        
        if (!progress) {
          return reply.code(404).send({ error: 'Upload session not found' });
        }

        return progress;
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({ error: error.message || 'Internal server error' });
      }
    }
  );
}

