// 文件路径：assets/scripts/startup/Preload.ts
// 依赖：core/manager/ResourceManager.ts, core/utils/Logger.ts

import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { ResourceManager } from 'db://assets/scripts/core/manager/ResourceManager';

/**
 * 预加载逻辑
 * 在启动流程中或进入特定模块前，预加载所需资源
 */
export class Preload {
    /**
     * 预加载核心资源（启动时调用）
     */
    static async core(): Promise<void> {
        Logger.info('Preload', '开始预加载核心资源');

        const rm = ResourceManager.getInstance();

        // 预加载通用 UI 预制体
        await rm.preload([
            'prefabs/common/Toast',
            'prefabs/common/Dialog',
            'prefabs/common/Loading',
        ]);

        // 预加载核心 Bundle
        await rm.loadBundle('core');

        Logger.info('Preload', '核心资源预加载完成');
    }

    /**
     * 预加载商铺模块资源
     */
    static async shopModule(): Promise<void> {
        Logger.info('Preload', '开始预加载商铺模块');

        const rm = ResourceManager.getInstance();
        await rm.loadBundle('module-shop');

        await rm.preload([
            'prefabs/ui/shop/ShopMainView',
            'prefabs/ui/shop/OrderItem',
            'prefabs/ui/shop/WorkerItem',
        ]);

        Logger.info('Preload', '商铺模块预加载完成');
    }

    /**
     * 预加载联盟模块资源
     */
    static async guildModule(): Promise<void> {
        Logger.info('Preload', '开始预加载联盟模块');

        const rm = ResourceManager.getInstance();
        await rm.loadBundle('module-guild');

        Logger.info('Preload', '联盟模块预加载完成');
    }
}
