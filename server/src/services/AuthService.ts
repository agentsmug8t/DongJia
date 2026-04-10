import jwt from 'jsonwebtoken';
import { config } from '../config';
import { Player, IPlayer } from '../models/Player';
import { Shop } from '../models/Shop';
import { redisUtil } from '../utils/redis';
import { logger } from '../utils/logger';

export class AuthService {
    /**
     * 登录（简化版：token 即 playerId，生产环境应接入第三方 OAuth）
     */
    async login(token: string, platform: string, version: string): Promise<{
        playerId: string;
        nickname: string;
        level: number;
        serverTime: number;
        jwtToken: string;
    }> {
        // 简化：用 token 作为玩家标识，查找或创建玩家
        let player = await Player.findOne({ playerId: token });

        if (!player) {
            // 新玩家注册
            player = await Player.create({
                playerId: token,
                nickname: `掌柜${token.slice(-4)}`,
            });

            // 创建初始商铺
            const shopId = `shop_${player.playerId}`;
            await Shop.create({
                shopId,
                ownerId: player.playerId,
                name: '路边小摊',
            });
            player.shopId = shopId;
            await player.save();

            logger.info(`[Auth] 新玩家注册: ${player.playerId} (${platform})`);
        }

        // 更新登录时间
        player.lastLoginAt = new Date();
        await player.save();

        // 生成 JWT
        const jwtToken = jwt.sign(
            { playerId: player.playerId },
            config.jwt.secret,
            { expiresIn: 604800 } // 7 天（秒）
        );

        // 存入 Redis
        await redisUtil.setSession(jwtToken, player.playerId);
        await redisUtil.setOnline(player.playerId);

        logger.info(`[Auth] 登录成功: ${player.playerId} v${version}`);

        return {
            playerId: player.playerId,
            nickname: player.nickname,
            level: player.level,
            serverTime: Date.now(),
            jwtToken,
        };
    }

    /** 验证 JWT token */
    async verifyToken(token: string): Promise<string | null> {
        try {
            const decoded = jwt.verify(token, config.jwt.secret) as { playerId: string };
            return decoded.playerId;
        } catch {
            return null;
        }
    }

    /** 登出 */
    async logout(playerId: string, token: string): Promise<void> {
        await redisUtil.removeSession(token);
        await redisUtil.setOffline(playerId);
        logger.info(`[Auth] 登出: ${playerId}`);
    }
}

export const authService = new AuthService();
