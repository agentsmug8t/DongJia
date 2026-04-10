// 文件路径：assets/scripts/core/manager/ResourceManager.ts
// 依赖：core/utils/Singleton.ts, core/utils/Logger.ts

import { assetManager, resources, AssetManager, Prefab, SpriteFrame, AudioClip, JsonAsset } from 'cc';
import { Singleton } from 'db://assets/scripts/core/utils/Singleton';
import { Logger } from 'db://assets/scripts/core/utils/Logger';

/**
 * 资源管理器
 * 统一管理 Bundle 加载、资源加载、缓存和引用计数
 *
 * @example
 * const rm = ResourceManager.getInstance();
 * const prefab = await rm.loadPrefab('common/Toast');
 * const sprite = await rm.loadSprite('textures/shop/bg');
 */
export class ResourceManager extends Singleton<ResourceManager>() {
    private _bundleCache: Map<string, AssetManager.Bundle> = new Map();
    private _assetCache: Map<string, unknown> = new Map();
    private _refCount: Map<string, number> = new Map();

    protected init(): void {
        Logger.info('ResourceManager', '初始化完成');
    }

    /**
     * 加载 Bundle（已加载则直接返回缓存）
     */
    loadBundle(bundleName: string): Promise<AssetManager.Bundle> {
        const cached = this._bundleCache.get(bundleName);
        if (cached) return Promise.resolve(cached);

        return new Promise((resolve, reject) => {
            assetManager.loadBundle(bundleName, (err, bundle) => {
                if (err) {
                    Logger.error('ResourceManager', `Bundle 加载失败: ${bundleName}`, err);
                    reject(err);
                    return;
                }
                this._bundleCache.set(bundleName, bundle);
                Logger.info('ResourceManager', `Bundle 加载成功: ${bundleName}`);
                resolve(bundle);
            });
        });
    }

    /** 从 resources 加载 Prefab */
    loadPrefab(path: string): Promise<Prefab> {
        return this._loadAsset(path, Prefab);
    }

    /** 从 resources 加载 SpriteFrame */
    loadSprite(path: string): Promise<SpriteFrame> {
        return this._loadAsset(path, SpriteFrame);
    }

    /** 从 resources 加载 AudioClip */
    loadAudio(path: string): Promise<AudioClip> {
        return this._loadAsset(path, AudioClip);
    }

    /** 加载配置 JSON */
    async loadConfig(configName: string): Promise<Record<string, unknown>> {
        const asset = await this._loadAsset<JsonAsset>(`configs/${configName}`, JsonAsset);
        return asset.json as Record<string, unknown>;
    }

    /** 批量预加载 */
    preload(paths: string[]): Promise<void> {
        return new Promise((resolve) => {
            resources.preloadDir('', (err) => {
                if (err) {
                    Logger.warn('ResourceManager', '预加载部分失败', err);
                }
                resolve();
            });
        });
    }

    /** 释放单个资源（引用计数归零才真正释放） */
    release(path: string): void {
        const count = (this._refCount.get(path) ?? 1) - 1;
        if (count <= 0) {
            this._refCount.delete(path);
            this._assetCache.delete(path);
            Logger.debug('ResourceManager', `资源已释放: ${path}`);
        } else {
            this._refCount.set(path, count);
        }
    }

    /** 释放整个 Bundle */
    releaseBundle(bundleName: string): void {
        const bundle = this._bundleCache.get(bundleName);
        if (bundle) {
            bundle.releaseAll();
            this._bundleCache.delete(bundleName);
            Logger.info('ResourceManager', `Bundle 已释放: ${bundleName}`);
        }
    }

    private _loadAsset<T>(path: string, type: new (...args: unknown[]) => T): Promise<T> {
        const cached = this._assetCache.get(path);
        if (cached) {
            this._refCount.set(path, (this._refCount.get(path) ?? 0) + 1);
            return Promise.resolve(cached as T);
        }

        return new Promise((resolve, reject) => {
            resources.load(path, type as never, (err: Error | null, asset: T) => {
                if (err) {
                    Logger.error('ResourceManager', `资源加载失败: ${path}`, err);
                    reject(err);
                    return;
                }
                this._assetCache.set(path, asset);
                this._refCount.set(path, 1);
                resolve(asset);
            });
        });
    }

    protected onDestroy(): void {
        this._bundleCache.clear();
        this._assetCache.clear();
        this._refCount.clear();
    }
}
