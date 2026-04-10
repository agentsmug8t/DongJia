// 文件路径：assets/scripts/startup/Main.ts
// 依赖：core/utils/Logger.ts, startup/Bootstrap.ts

import { _decorator, Component } from 'cc';
import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { Bootstrap } from 'db://assets/scripts/startup/Bootstrap';
import { Loading } from 'db://assets/scripts/core/ui/Loading';

const { ccclass } = _decorator;

/**
 * 入口脚本（挂载在 main.scene 的根节点上）
 * Cocos 场景加载后自动执行 onLoad → start
 */
@ccclass('Main')
export class Main extends Component {
    private _bootstrap: Bootstrap = new Bootstrap();

    onLoad(): void {
        Logger.info('Main', '游戏启动');
    }

    async start(): Promise<void> {
        Loading.show('正在加载...');

        this._bootstrap.onProgress = (step, progress) => {
            Loading.setProgress(progress, step);
        };

        try {
            await this._bootstrap.start();
        } catch (err) {
            Logger.error('Main', '启动失败', err);
            // TODO: 显示错误界面，提供重试按钮
        } finally {
            Loading.forceHide();
        }
    }
}
