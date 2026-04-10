// 文件路径：assets/scripts/startup/Bootstrap.ts
// 依赖：所有 Manager

import { Logger, LogLevel } from 'db://assets/scripts/core/utils/Logger';
import { director, Node, Layers, find } from 'cc';
import { MainScene } from 'db://assets/scripts/startup/MainScene';
import { EventManager } from 'db://assets/scripts/core/manager/EventManager';
import { ResourceManager } from 'db://assets/scripts/core/manager/ResourceManager';
import { ConfigManager } from 'db://assets/scripts/core/manager/ConfigManager';
import { UIManager } from 'db://assets/scripts/core/manager/UIManager';
import { NetworkManager } from 'db://assets/scripts/core/manager/NetworkManager';
import { PoolManager } from 'db://assets/scripts/core/manager/PoolManager';
import { TimerManager } from 'db://assets/scripts/core/manager/TimerManager';
import { LocalStorageManager } from 'db://assets/scripts/core/manager/LocalStorageManager';
import { AudioManager } from 'db://assets/scripts/core/manager/AudioManager';
import { GameManager } from 'db://assets/scripts/core/manager/GameManager';
import { UpdateManager } from 'db://assets/scripts/core/manager/UpdateManager';
import { PlayerModel } from 'db://assets/scripts/modules/player/model/PlayerModel';
import { SocketEvent, LoginRequest, LoginResponse, PlayerBaseInfo } from 'db://assets/scripts/core/network/Protocol';

/** 启动步骤 */
enum BootStep {
    INIT_LOGGER = '初始化日志系统',
    CHECK_UPDATE = '检查热更新',
    INIT_MANAGERS = '初始化管理器',
    LOAD_CONFIGS = '加载配置表',
    INIT_UI = '初始化UI系统',
    CONNECT_SERVER = '连接服务器',
    LOGIN = '用户登录',
    LOAD_PLAYER_DATA = '加载玩家数据',
    ENTER_MAIN = '进入主界面',
}

/** 进度回调 */
export type BootProgressCallback = (step: string, progress: number) => void;

/**
 * 启动引导类
 * 按依赖顺序初始化各系统，支持步骤追踪和失败重试
 *
 * @example
 * const boot = new Bootstrap();
 * boot.onProgress = (step, progress) => updateLoadingBar(progress);
 * await boot.start();
 */
export class Bootstrap {
    onProgress: BootProgressCallback | null = null;

    private _steps: BootStep[] = [
        BootStep.INIT_LOGGER,
        BootStep.CHECK_UPDATE,
        BootStep.INIT_MANAGERS,
        BootStep.LOAD_CONFIGS,
        BootStep.INIT_UI,
        BootStep.CONNECT_SERVER,
        BootStep.LOGIN,
        BootStep.LOAD_PLAYER_DATA,
        BootStep.ENTER_MAIN,
    ];

    /**
     * 执行启动流程
     */
    async start(): Promise<void> {
        Logger.info('Bootstrap', '========== 启动流程开始 ==========');
        const startTime = Date.now();

        for (let i = 0; i < this._steps.length; i++) {
            const step = this._steps[i];
            const progress = (i + 1) / this._steps.length;

            this.onProgress?.(step, progress);
            Logger.info('Bootstrap', `[${i + 1}/${this._steps.length}] ${step}`);

            await this._executeStep(step);
        }

        const elapsed = Date.now() - startTime;
        Logger.info('Bootstrap', `========== 启动完成 (${elapsed}ms) ==========`);
    }

    private async _executeStep(step: BootStep): Promise<void> {
        const maxRetry = 3;
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetry; attempt++) {
            try {
                switch (step) {
                    case BootStep.INIT_LOGGER:
                        await this._initLogger();
                        break;
                    case BootStep.CHECK_UPDATE:
                        await this._checkUpdate();
                        break;
                    case BootStep.INIT_MANAGERS:
                        await this._initManagers();
                        break;
                    case BootStep.LOAD_CONFIGS:
                        await this._loadConfigs();
                        break;
                    case BootStep.INIT_UI:
                        await this._initUI();
                        break;
                    case BootStep.CONNECT_SERVER:
                        await this._connectServer();
                        break;
                    case BootStep.LOGIN:
                        await this._login();
                        break;
                    case BootStep.LOAD_PLAYER_DATA:
                        await this._loadPlayerData();
                        break;
                    case BootStep.ENTER_MAIN:
                        await this._enterMain();
                        break;
                }
                return; // 成功则退出重试循环
            } catch (err) {
                lastError = err instanceof Error ? err : new Error(String(err));
                Logger.warn('Bootstrap', `步骤失败 [${step}] 第${attempt}次`, lastError);
                if (attempt < maxRetry) {
                    await this._wait(1000 * attempt); // 递增等待
                }
            }
        }

        throw new Error(`启动步骤失败: ${step} - ${lastError?.message}`);
    }

    private async _checkUpdate(): Promise<void> {
        const um = UpdateManager.getInstance();
        um.onProgress = (_state, progress, message) => {
            this.onProgress?.(message, progress);
        };
        const success = await um.checkAndUpdate();
        if (!success) {
            Logger.warn('Bootstrap', '热更新失败，继续启动');
        }
    }

    private async _initLogger(): Promise<void> {
        // 生产环境只输出 WARN 以上
        // TODO: 通过构建配置判断环境
        Logger.setLevel(LogLevel.DEBUG);
    }

    private async _initManagers(): Promise<void> {
        // 按依赖顺序初始化（getInstance 会触发 init）
        EventManager.getInstance();
        LocalStorageManager.getInstance();
        ResourceManager.getInstance();
        ConfigManager.getInstance();
        PoolManager.getInstance();
        TimerManager.getInstance();
        AudioManager.getInstance();
        NetworkManager.getInstance();
        UIManager.getInstance();
        GameManager.getInstance();
    }

    private async _loadConfigs(): Promise<void> {
        await ConfigManager.getInstance().loadAll([
            'item',
            'order',
            'shop',
        ]);
    }

    private async _initUI(): Promise<void> {
        // TODO: FairyGUI 初始化
        // TODO: 注入 UIManager.viewFactory
        Logger.info('Bootstrap', 'UI 系统初始化（TODO: FairyGUI）');
    }

    private async _connectServer(): Promise<void> {
        const serverUrl = 'http://localhost:4100';
        await NetworkManager.getInstance().connect(serverUrl);
    }

    private async _login(): Promise<void> {
        // TODO: 从平台 SDK 获取 token
        const request: LoginRequest = {
            token: 'placeholder_token',
            platform: 'web',
            version: '1.0.0',
        };

        const response = await NetworkManager.getInstance().request<LoginResponse>(
            SocketEvent.LOGIN,
            request
        );

        Logger.info('Bootstrap', `登录成功: ${response.nickname} (Lv.${response.level})`);
    }

    private async _loadPlayerData(): Promise<void> {
        const playerData = await NetworkManager.getInstance().request<PlayerBaseInfo>(
            SocketEvent.PLAYER_INFO,
            {}
        );
        PlayerModel.getInstance().initFromServer(playerData);
    }

    private async _enterMain(): Promise<void> {
        // 启动游戏主循环
        GameManager.getInstance().startGame();

        // 在场景的 Canvas 下挂载 MainScene 组件
        const scene = director.getScene();
        if (scene) {
            // 尝试找已有 Canvas，找不到就创建
            let canvasNode = scene.getChildByName('Canvas');
            if (!canvasNode) {
                // 备选：直接挂在场景根节点
                canvasNode = scene;
            }
            const mainNode = new Node('MainSceneRoot');
            mainNode.layer = Layers.Enum.UI_2D;
            canvasNode.addChild(mainNode);
            mainNode.addComponent(MainScene);
            Logger.info('Bootstrap', '主界面 UI 已创建');
        } else {
            Logger.error('Bootstrap', '无法获取当前场景');
        }

        Logger.info('Bootstrap', '进入主界面');
    }

    private _wait(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
