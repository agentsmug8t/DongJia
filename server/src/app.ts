import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { config } from './config';
import { connectMongoDB } from './config/database';
import { initSocketHandlers } from './socket';
import { apiRouter } from './routes/api';
import { logger } from './utils/logger';

async function main(): Promise<void> {
    // 1. Express
    const app = express();
    app.use(cors({ origin: true, credentials: true }));
    app.use(express.json());

    // 2. HTTP 路由
    app.use('/api', apiRouter);

    // 健康检查
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', timestamp: Date.now() });
    });

    // 3. HTTP Server
    const httpServer = createServer(app);

    // 4. Socket.IO
    const io = new Server(httpServer, {
        cors: {
            origin: true,
            methods: ['GET', 'POST'],
            credentials: true,
        },
        allowEIO3: true,
        transports: ['polling', 'websocket'],
        pingInterval: 30000,
        pingTimeout: 10000,
    });

    // 5. 注册 Socket 事件处理器
    initSocketHandlers(io);

    // 6. 连接 MongoDB
    await connectMongoDB();

    // 7. 启动服务
    httpServer.listen(config.port, '0.0.0.0', () => {
        logger.info(`========================================`);
        logger.info(`  东家游戏服务器已启动`);
        logger.info(`  HTTP: http://localhost:${config.port}`);
        logger.info(`  Socket.IO: ws://localhost:${config.port}`);
        logger.info(`  环境: ${config.nodeEnv}`);
        logger.info(`========================================`);
    });

    // 优雅关闭
    const shutdown = async (): Promise<void> => {
        logger.info('[Server] 正在关闭...');
        io.close();
        httpServer.close();
        const { disconnectAll } = await import('./config/database');
        await disconnectAll();
        logger.info('[Server] 已关闭');
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

main().catch((err) => {
    logger.error('[Server] 启动失败', err);
    process.exit(1);
});
