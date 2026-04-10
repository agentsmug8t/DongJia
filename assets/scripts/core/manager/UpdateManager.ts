// 文件路径：assets/scripts/core/manager/UpdateManager.ts
// 依赖：core/utils/Singleton.ts, core/utils/Logger.ts, core/utils/PlatformUtils.ts

import { Singleton } from 'db://assets/scripts/core/utils/Singleton';
import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { PlatformUtils } from 'db://assets/scripts/core/utils/PlatformUtils';

/** 热更新状态 */
export enum HotUpdateState {
    IDLE = 'idle',
    CHECKING = 'checking',
    DOWNLOADING = 'downloading',
    FINISHED = 'finished',
    FAILED = 'failed',
    UP_TO_DATE = 'up_to_date',
}

/** 热更新进度回调 */
export type UpdateProgressCallback = (
    state: HotUpdateState,
    progress: number,
    message: string
) => void;

/**
 * 热更新管理器
 * 封装 Cocos 原生热更新（jsb.AssetsManager），Web/小游戏平台跳过
 *
 * @example
 * const um = UpdateManager.getInstance();
 * um.onProgress = (state, progress, msg) => { updateUI(progress); };
 * await um.checkAndUpdate();
 */
export class UpdateManager extends Singleton<UpdateManager>() {
    private _state: HotUpdateState = HotUpdateState.IDLE;
    onProgress: UpdateProgressCallback | null = null;

    get state(): HotUpdateState { return this._state; }

    protected init(): void {
        Logger.info('UpdateManager', '初始化完成');
    }

    /**
     * 检查并执行热更新
     * 非原生平台直接返回（Web/小游戏不需要热更）
     */
    async checkAndUpdate(): Promise<boolean> {
        if (!PlatformUtils.isNative()) {
            Logger.info('UpdateManager', '非原生平台，跳过热更新');
            this._setState(HotUpdateState.UP_TO_DATE, 1, '无需更新');
            return true;
        }

        return this._doHotUpdate();
    }

    private async _doHotUpdate(): Promise<boolean> {
        this._setState(HotUpdateState.CHECKING, 0, '检查更新中...');

        try {
            // Cocos 原生热更新流程
            // 需要在项目中配置 project.manifest 和 version.manifest
            const hasUpdate = await this._checkVersion();

            if (!hasUpdate) {
                this._setState(HotUpdateState.UP_TO_DATE, 1, '已是最新版本');
                return true;
            }

            this._setState(HotUpdateState.DOWNLOADING, 0, '下载更新中...');
            const success = await this._downloadUpdate();

            if (success) {
                this._setState(HotUpdateState.FINISHED, 1, '更新完成，即将重启');
                return true;
            } else {
                this._setState(HotUpdateState.FAILED, 0, '更新失败');
                return false;
            }
        } catch (err) {
            Logger.error('UpdateManager', '热更新异常', err);
            this._setState(HotUpdateState.FAILED, 0, '更新异常');
            return false;
        }
    }

    private _checkVersion(): Promise<boolean> {
        return new Promise((resolve) => {
            // TODO: 接入 jsb.AssetsManager 检查版本
            // 示例：对比本地 manifest 与远程 manifest
            Logger.debug('UpdateManager', 'TODO: 实现版本检查');
            resolve(false); // 默认无更新
        });
    }

    private _downloadUpdate(): Promise<boolean> {
        return new Promise((resolve) => {
            // TODO: 接入 jsb.AssetsManager 下载更新
            // 下载过程中通过 onProgress 回调报告进度
            Logger.debug('UpdateManager', 'TODO: 实现资源下载');
            resolve(true);
        });
    }

    private _setState(state: HotUpdateState, progress: number, message: string): void {
        this._state = state;
        this.onProgress?.(state, progress, message);
    }

    protected onDestroy(): void {
        this.onProgress = null;
    }
}
