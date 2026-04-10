// 文件路径：assets/scripts/core/base/BaseManager.ts
// 依赖：core/utils/Singleton.ts, core/utils/Logger.ts

import { Singleton } from 'db://assets/scripts/core/utils/Singleton';
import { Logger } from 'db://assets/scripts/core/utils/Logger';

/**
 * 管理器基类
 * 所有 Manager 继承此类，获得统一的生命周期和日志支持
 */
export abstract class BaseManager extends Singleton<BaseManager>() {
    protected readonly TAG: string = this.constructor.name;

    protected init(): void {
        Logger.info(this.TAG, '初始化完成');
    }

    protected onDestroy(): void {
        Logger.info(this.TAG, '已销毁');
    }

    protected log(message: string, data?: unknown): void {
        Logger.debug(this.TAG, message, data);
    }

    protected warn(message: string, data?: unknown): void {
        Logger.warn(this.TAG, message, data);
    }

    protected error(message: string, data?: unknown): void {
        Logger.error(this.TAG, message, data);
    }
}
