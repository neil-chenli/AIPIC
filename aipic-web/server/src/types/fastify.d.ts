import { FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../middleware/auth';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}

