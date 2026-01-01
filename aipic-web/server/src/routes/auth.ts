import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getDatabase } from '../lib/db/connection';
import { UserRepository } from '../lib/db/repositories/UserRepository';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';

// 请求验证schema
const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const initSchema = z.object({
  username: z.string().min(1),
  email: z.string().email().optional(),
  password: z.string().min(6),
});

export async function authRoutes(fastify: FastifyInstance) {
  const db = getDatabase();
  const userRepo = new UserRepository(db);

  // 初始化Owner账户（首次运行）
  fastify.post('/init', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // 检查是否已有Owner
      if (userRepo.hasOwner()) {
        return reply.code(400).send({ 
          error: 'Owner already exists. Please use login endpoint.' 
        });
      }

      const body = initSchema.parse(request.body);
      
      // 检查用户名是否已存在
      if (userRepo.findByUsername(body.username)) {
        return reply.code(400).send({ error: 'Username already exists' });
      }

      // 创建Owner用户
      const user = await userRepo.create({
        username: body.username,
        email: body.email,
        password: body.password,
        role: 'owner',
      });

      // 生成JWT token
      const token = fastify.jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        { expiresIn: '7d' }
      );

      // 创建会话
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      userRepo.createSession(
        user.id,
        token,
        expiresAt,
        request.ip,
        request.headers['user-agent']
      );

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        token,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid input', details: error.errors });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // 登录
  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = loginSchema.parse(request.body);
      
      const user = userRepo.findByUsername(body.username);
      if (!user) {
        return reply.code(401).send({ error: 'Invalid username or password' });
      }

      // 验证密码
      const isValid = await userRepo.verifyPassword(user, body.password);
      if (!isValid) {
        return reply.code(401).send({ error: 'Invalid username or password' });
      }

      // 生成JWT token
      const token = fastify.jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        { expiresIn: '7d' }
      );

      // 创建会话
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      userRepo.createSession(
        user.id,
        token,
        expiresAt,
        request.ip,
        request.headers['user-agent']
      );

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        token,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Invalid input', details: error.errors });
      }
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // 登出
  fastify.post('/logout', { preHandler: [authenticate] }, async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        userRepo.deleteSession(token);
      }
      return { message: 'Logged out successfully' };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // 获取当前用户信息
  fastify.get('/me', { preHandler: [authenticate] }, async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      if (!request.user) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const user = userRepo.findById(request.user.id);
      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}

