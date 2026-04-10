// 文件路径：assets/scripts/startup/Main.ts
// 依赖：core/utils/Logger.ts, startup/Bootstrap.ts

import { _decorator, Component, Node, Layers, Camera, Vec3, UITransform, Size, Canvas as CCCanvas } from 'cc';
import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { Bootstrap } from 'db://assets/scripts/startup/Bootstrap';
import { Loading } from 'db://assets/scripts/core/ui/Loading';
import { ShopUIComponent } from 'db://assets/scripts/modules/shop/ShopUIComponent';

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
            this._createShopUI();
        } catch (err) {
            Logger.error('Main', '启动失败', err);
        } finally {
            Loading.forceHide();
        }
    }

    /**
     * 创建商铺 UI（Bootstrap 完成后调用）
     * Canvas(RenderRoot2D) 提供 2D 渲染管线，手动 Camera 确保正交渲染
     */
    private _createShopUI(): void {
        const scene = this.node.scene;

        // 1. 创建 Canvas 根节点（Canvas 继承 RenderRoot2D，是 2D 渲染必需的）
        const canvasNode = new Node('Canvas');
        canvasNode.layer = Layers.Enum.UI_2D;
        scene.addChild(canvasNode);

        // 2. 添加 UITransform
        const ut = canvasNode.addComponent(UITransform);
        ut.setContentSize(new Size(960, 640));

        // 3. 手动创建 2D 正交摄像机
        const cameraNode = new Node('UICamera');
        cameraNode.layer = Layers.Enum.UI_2D;
        cameraNode.setPosition(new Vec3(0, 0, 1000));
        canvasNode.addChild(cameraNode);

        const camera = cameraNode.addComponent(Camera);
        camera.projection = 1;  // ORTHO
        camera.near = 1;
        camera.far = 2000;
        camera.orthoHeight = 320; // 640 / 2
        camera.clearFlags = 6;  // DEPTH | STENCIL（不清除颜色）
        camera.priority = 1;
        camera.visibility = Layers.BitMask.UI_2D;

        // 4. 添加 Canvas 组件（继承 RenderRoot2D，启用 2D 渲染管线）
        //    将手动创建的摄像机绑定到 Canvas
        const canvas = canvasNode.addComponent(CCCanvas);
        canvas.cameraComponent = camera;
        canvas.alignCanvasWithScreen = true;

        // 5. 创建商铺 UI 子节点
        const shopNode = new Node('ShopUI');
        shopNode.layer = Layers.Enum.UI_2D;
        canvasNode.addChild(shopNode);
        shopNode.addComponent(ShopUIComponent);

        Logger.info('Main', '商铺 UI 已创建');
    }
}
