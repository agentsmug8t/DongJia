// 文件路径：assets/scripts/startup/LoadingScene.ts

import {
    _decorator, Component, Node, Label, UITransform, Color, Size, Vec3,
    Graphics, Layers, director, HorizontalTextAlignment, VerticalTextAlignment,
    Overflow, tween, Tween
} from 'cc';
import { Logger } from 'db://assets/scripts/core/utils/Logger';

const { ccclass, property } = _decorator;

@ccclass('LoadingScene')
export class LoadingScene extends Component {

    private _progressFill: Graphics | null = null;
    private _progressLabel: Label | null = null;
    private _tipLabel: Label | null = null;
    private _logoNode: Node | null = null;

    private readonly _tips: string[] = [
        '小二正在备菜中…',
        '掌柜，灶火已生好~',
        '食材从产地直送而来…',
        '伙夫们正在磨刀…',
        '碗筷已经洗好啦！',
    ];

    private _tickCount: number = 0;
    private _tipIndex: number = 0;

    onLoad() {
        this._buildUI();
        this._simulateLoading();
    }

    private _buildUI() {
        const root = this.node;

        // --- Dark background ---
        const bg = this._makeNode('Background', root);
        const bgTransform = bg.addComponent(UITransform);
        bgTransform.setContentSize(new Size(960, 640));
        bg.setPosition(new Vec3(0, 0, 0));
        const bgGfx = bg.addComponent(Graphics);
        bgGfx.fillColor = new Color(26, 26, 46, 255);
        bgGfx.rect(-480, -320, 960, 640);
        bgGfx.fill();

        // --- Logo (golden roundRect 160×160) ---
        const logo = this._makeNode('Logo', root);
        logo.setPosition(new Vec3(0, 100, 0));
        logo.addComponent(UITransform).setContentSize(new Size(160, 160));
        const logoGfx = logo.addComponent(Graphics);
        logoGfx.fillColor = new Color(255, 215, 0, 255);
        logoGfx.roundRect(-80, -80, 160, 160, 20);
        logoGfx.fill();
        this._logoNode = logo;

        // "東" label inside logo
        const dongLabel = this._makeNode('DongChar', logo);
        dongLabel.addComponent(UITransform).setContentSize(new Size(160, 70));
        const dl = dongLabel.addComponent(Label);
        dl.string = '東';
        dl.fontSize = 60;
        dl.color = new Color(139, 90, 0, 255);
        dl.horizontalAlign = HorizontalTextAlignment.CENTER;
        dl.verticalAlign = VerticalTextAlignment.CENTER;
        dl.overflow = Overflow.CLAMP;

        // Logo breathing animation (looping)
        tween(logo)
            .repeatForever(
                tween()
                    .to(0.75, { scale: new Vec3(1.08, 1.08, 1.08) }, { easing: 'sineInOut' })
                    .to(0.75, { scale: new Vec3(1.0, 1.0, 1.0) }, { easing: 'sineInOut' })
            )
            .start();

        // --- Title ---
        this._makeLabel(root, 'Title', '东 家', 48, new Color(255, 215, 0, 255), new Vec3(0, -10, 0));

        // --- Progress bar background ---
        const barBg = this._makeNode('ProgressBarBg', root);
        barBg.setPosition(new Vec3(0, -80, 0));
        barBg.addComponent(UITransform).setContentSize(new Size(400, 20));
        const barBgGfx = barBg.addComponent(Graphics);
        barBgGfx.fillColor = new Color(60, 60, 60, 255);
        barBgGfx.roundRect(-200, -10, 400, 20, 10);
        barBgGfx.fill();

        // --- Progress bar fill ---
        const barFill = this._makeNode('ProgressBarFill', root);
        barFill.setPosition(new Vec3(0, -80, 0));
        barFill.addComponent(UITransform).setContentSize(new Size(400, 20));
        this._progressFill = barFill.addComponent(Graphics);

        // --- Progress text ---
        this._progressLabel = this._makeLabel(root, 'ProgressText', '加载中… 0%', 20, new Color(200, 200, 200, 255), new Vec3(0, -115, 0));

        // --- Tip text ---
        this._tipLabel = this._makeLabel(root, 'TipText', this._tips[0], 18, new Color(160, 160, 160, 255), new Vec3(0, -250, 0));

        // --- Version ---
        this._makeLabel(root, 'Version', 'v1.0.0', 14, new Color(100, 100, 100, 255), new Vec3(400, -290, 0));
    }

    private _simulateLoading() {
        const totalTicks = 60;
        this._tickCount = 0;
        this._tipIndex = 0;

        this.schedule(() => {
            this._tickCount++;
            const progress = Math.min(this._tickCount / totalTicks, 1.0);
            this._updateProgress(progress);

            // Cycle tips every 10 ticks (0.5 seconds)
            if (this._tickCount % 10 === 0) {
                this._tipIndex = (this._tipIndex + 1) % this._tips.length;
                if (this._tipLabel) {
                    this._tipLabel.string = this._tips[this._tipIndex];
                }
            }

            if (this._tickCount >= totalTicks) {
                this.unscheduleAllCallbacks();
                this._onLoadComplete();
            }
        }, 0.05, totalTicks - 1, 0);
    }

    private _updateProgress(progress: number) {
        const percent = Math.floor(progress * 100);

        // Update progress bar fill
        if (this._progressFill) {
            this._progressFill.clear();
            this._progressFill.fillColor = new Color(0, 200, 80, 255);
            const width = 400 * progress;
            this._progressFill.roundRect(-200, -10, width, 20, 10);
            this._progressFill.fill();
        }

        // Update step text
        let stepText = '加载配置中...';
        if (percent >= 80) {
            stepText = '即将进入...';
        } else if (percent >= 50) {
            stepText = '初始化系统...';
        } else if (percent >= 20) {
            stepText = '加载纹理中...';
        }

        if (this._progressLabel) {
            this._progressLabel.string = `${stepText} ${percent}%`;
        }
    }

    private _onLoadComplete() {
        Logger.info('LoadingScene', '加载完成，进入登录场景');
        director.loadScene('login');
    }

    private _makeNode(name: string, parent: Node): Node {
        const n = new Node(name);
        n.layer = Layers.Enum.UI_2D;
        parent.addChild(n);
        return n;
    }

    private _makeLabel(parent: Node, name: string, text: string, fontSize: number, color: Color, pos: Vec3): Label {
        const n = this._makeNode(name, parent);
        n.setPosition(pos);
        n.addComponent(UITransform).setContentSize(new Size(400, fontSize + 10));
        const lbl = n.addComponent(Label);
        lbl.string = text;
        lbl.fontSize = fontSize;
        lbl.color = color;
        lbl.horizontalAlign = HorizontalTextAlignment.CENTER;
        lbl.verticalAlign = VerticalTextAlignment.CENTER;
        lbl.overflow = Overflow.CLAMP;
        return lbl;
    }

    onDestroy() {
        this.unscheduleAllCallbacks();
        if (this._logoNode) {
            Tween.stopAllByTarget(this._logoNode);
        }
    }
}
