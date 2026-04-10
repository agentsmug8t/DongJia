// 文件路径：assets/scripts/core/manager/LocalStorageManager.ts
// 依赖：core/utils/Singleton.ts, core/utils/Logger.ts, core/utils/CryptoUtils.ts,
//        core/constants/GameConstants.ts

import { Singleton } from 'db://assets/scripts/core/utils/Singleton';
import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { CryptoUtils } from 'db://assets/scripts/core/utils/CryptoUtils';
import { GameConstants } from 'db://assets/scripts/core/constants/GameConstants';

/**
 * 本地存储管理器
 * 封装 localStorage，支持命名空间、自动序列化、加密存储
 *
 * @example
 * const ls = LocalStorageManager.getInstance();
 * ls.set('player_name', '东家掌柜');
 * const name = ls.get<string>('player_name', '默认名');
 * ls.setEncrypted('token', 'secret_value');
 */
export class LocalStorageManager extends Singleton<LocalStorageManager>() {
    private _prefix: string = GameConstants.STORAGE_PREFIX;

    protected init(): void {
        Logger.info('LocalStorageManager', '初始化完成');
    }

    /**
     * 设置命名空间前缀
     */
    setPrefix(prefix: string): void {
        this._prefix = prefix;
    }

    /**
     * 存储数据（自动 JSON 序列化）
     */
    set(key: string, value: unknown): void {
        try {
            const fullKey = this._prefix + key;
            const data = JSON.stringify(value);
            localStorage.setItem(fullKey, data);
        } catch (err) {
            Logger.error('LocalStorageManager', `存储失败: ${key}`, err);
        }
    }

    /**
     * 读取数据（自动 JSON 反序列化）
     */
    get<T>(key: string, defaultValue?: T): T | undefined {
        try {
            const fullKey = this._prefix + key;
            const data = localStorage.getItem(fullKey);
            if (data === null) return defaultValue;
            return JSON.parse(data) as T;
        } catch {
            return defaultValue;
        }
    }

    /**
     * 加密存储（敏感数据）
     */
    setEncrypted(key: string, value: string): void {
        const encrypted = CryptoUtils.xorEncrypt(value);
        this.set(key, encrypted);
    }

    /**
     * 读取加密数据
     */
    getEncrypted(key: string): string {
        const encrypted = this.get<string>(key, '');
        if (!encrypted) return '';
        return CryptoUtils.xorDecrypt(encrypted);
    }

    /**
     * 删除指定 key
     */
    remove(key: string): void {
        localStorage.removeItem(this._prefix + key);
    }

    /**
     * 清空当前命名空间下的所有数据
     */
    clear(): void {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(this._prefix)) {
                keysToRemove.push(key);
            }
        }
        for (const key of keysToRemove) {
            localStorage.removeItem(key);
        }
        Logger.info('LocalStorageManager', `已清空 ${keysToRemove.length} 条数据`);
    }

    /**
     * 检查 key 是否存在
     */
    has(key: string): boolean {
        return localStorage.getItem(this._prefix + key) !== null;
    }

    protected onDestroy(): void {}
}
