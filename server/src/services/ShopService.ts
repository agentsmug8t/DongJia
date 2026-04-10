import { Shop, IShop } from '../models/Shop';

export class ShopService {
    /** 获取商铺信息 */
    async getShopInfo(shopId: string): Promise<{
        shop: { shopId: string; name: string; level: number; maxWorkers: number; maxOrders: number };
        workers: IShop['workers'];
    } | null> {
        const shop = await Shop.findOne({ shopId }).lean();
        if (!shop) return null;
        return {
            shop: {
                shopId: shop.shopId,
                name: shop.name,
                level: shop.level,
                maxWorkers: shop.maxWorkers,
                maxOrders: shop.maxOrders,
            },
            workers: shop.workers,
        };
    }

    /** 升级商铺 */
    async upgradeShop(shopId: string): Promise<{ success: boolean; newLevel: number; cost: number }> {
        const shop = await Shop.findOne({ shopId });
        if (!shop) return { success: false, newLevel: 0, cost: 0 };

        const cost = shop.level * 1000;
        shop.level += 1;
        shop.maxWorkers = Math.min(shop.level + 1, 10);
        shop.maxOrders = Math.min(shop.level * 2 + 1, 20);
        await shop.save();

        return { success: true, newLevel: shop.level, cost };
    }

    /** 雇佣伙夫 */
    async hireWorker(shopId: string, workerId: string): Promise<{
        success: boolean;
        worker?: { workerId: string; name: string; level: number; skill: number; status: number };
    }> {
        const shop = await Shop.findOne({ shopId });
        if (!shop) return { success: false };
        if (shop.workers.length >= shop.maxWorkers) return { success: false };

        const worker = {
            workerId,
            name: `伙夫${shop.workers.length + 1}`,
            level: 1,
            skill: 1,
            status: 0,
        };
        shop.workers.push(worker);
        await shop.save();

        return { success: true, worker };
    }

    /** 解雇伙夫 */
    async fireWorker(shopId: string, workerId: string): Promise<boolean> {
        const result = await Shop.updateOne(
            { shopId },
            { $pull: { workers: { workerId } } }
        );
        return result.modifiedCount > 0;
    }
}

export const shopService = new ShopService();
