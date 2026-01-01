import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import staticFiles from '@fastify/static';
import jwt from '@fastify/jwt';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { authenticate } from './middleware/auth';
import { authRoutes } from './routes/auth';
import { importRoutes } from './routes/imports';
import { thumbnailRoutes } from './routes/thumbnails';
import { photoRoutes } from './routes/photos';
import { albumRoutes } from './routes/albums';
import { tagRoutes } from './routes/tags';
import { mapRoutes } from './routes/map';
import { trashRoutes } from './routes/trash';
import { auditLogRoutes } from './routes/audit-logs';
import { uploadRoutes } from './routes/uploads';
import { settingsRoutes } from './routes/settings';
import { personRoutes } from './routes/persons';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport:
      process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
});

// Register plugins
async function build() {
  // CORS
  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production' 
      ? false 
      : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  });

  // Multipart (for file uploads)
  await fastify.register(multipart, {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB
    },
  });

  // JWT
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  });

  // 注册认证中间件（作为preHandler使用）
  // 注意：这里不直接decorate，而是在路由中使用authenticate函数

  // Static files (for serving photos and thumbnails)
  await fastify.register(staticFiles, {
    root: join(process.cwd(), 'data'),
    prefix: '/data/',
  });

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // API routes
  fastify.register(async function (fastify) {
    fastify.get('/', async () => {
      return { 
        message: 'AIPIC API v1',
        version: '0.1.0',
      };
    });

    // 认证路由
    await fastify.register(authRoutes, { prefix: '/auth' });
    
    // 导入路由
    await fastify.register(importRoutes, { prefix: '/imports' });
    
    // 缩略图路由
    await fastify.register(thumbnailRoutes, { prefix: '/thumbnails' });
    
    // 照片路由
    await fastify.register(photoRoutes, { prefix: '/photos' });
    
    // 相册路由
    await fastify.register(albumRoutes, { prefix: '/albums' });
    
    // 标签路由
    await fastify.register(tagRoutes, { prefix: '/tags' });
    
    // 地图路由
    await fastify.register(mapRoutes, { prefix: '/map' });
    
    // 回收站路由
    await fastify.register(trashRoutes, { prefix: '/trash' });
    
    // 审计日志路由
    await fastify.register(auditLogRoutes, { prefix: '/audit-logs' });
    
    // 上传路由
    await fastify.register(uploadRoutes, { prefix: '/uploads' });
    
    // 设置路由
    await fastify.register(settingsRoutes, { prefix: '/settings' });
    
    // 人物路由
    await fastify.register(personRoutes, { prefix: '/persons' });
  }, { prefix: '/api/v1' });

  return fastify;
}

// Start server
async function start() {
  try {
    const app = await build();
    
    const port = Number(process.env.PORT) || 3001;
    const host = process.env.HOST || '0.0.0.0';

    await app.listen({ port, host });
    
    console.log(`🚀 Server running at http://${host}:${port}`);
    console.log(`📋 API available at http://${host}:${port}/api/v1`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await fastify.close();
  process.exit(0);
});

start();

