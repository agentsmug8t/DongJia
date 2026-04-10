// 文件路径：assets/scripts/scenes/LoadingScene.ts

import { _decorator, Component, Node, Sprite, Label, ProgressBar, tween, Tween, Vec3, UIOpacity } from 'cc';

const { ccclass, property } = _decorator;

/**
 * 加载场景
 *
 * 节点层级：
 * Canvas
 * ├── Background (Sprite)          — 纯黑色，铺满全屏
 * ├── LogoContainer (Node)         — 居中偏上，锚点(0.5, 0.6)
 * │   ├── LogoIcon (Sprite)        — 占位：白色圆形，100x100
 * │   └── LogoText (Label)         — "东家"，白色，字号48
 * ├── ProgressBar (ProgressBar)    — 居中，宽400，高20
 * │   ├── Background (Sprite)      — 灰色
 * │   └── Bar (Sprite)             — 白色，初始宽度0
 * ├── TipText (Label)              — 进度条下方，"正在加载资源..."，字号24
 * └── VersionLabel (Label)         — 右下角，"v1.0.0"，字号20，灰色
 */
@ccclass('LoadingScene')
export class LoadingScene extends Component {

    // ─── UI 节点 ──────────────────────────────────────────────

    @property(Sprite)
    background: Sprite = null!;

    @property(Node)
    logoContainer: Node = null!;

    @property(Sprite)
    logoIcon: Sprite = null!;

    @property(Label)
    logoText: Label = null!;

    @property(ProgressBar)
    progressBar: ProgressBar = null!;

    @property(Label)
    tipText: Label = null!;

    @property(Label)
    versionLabel: Label = null!;

    // ─── 生命周期 ─────────────────────────────────────────────

    onLoad(): void {
        this.versionLabel.string = 'v1.0.0';
        this.tipText.string = '正在加载资源...';
        if (this.progressBar) {
            this.progressBar.progress = 0;
        }
    }

    // ─── 内部状态 ─────────────────────────────────────────────

    private _breathTween: Tween<Node> | null = null;

    // ─── 动画方法 ─────────────────────────────────────────────

    /** LogoContainer 循环缩放 1.0 ↔ 1.05 */
    playLogoBreath(): void {
        if (!this.logoContainer) return;
        this._breathTween = tween(this.logoContainer)
            .to(1, { scale: new Vec3(1.05, 1.05, 1) }, { easing: 'sineInOut' })
            .to(1, { scale: new Vec3(1, 1, 1) }, { easing: 'sineInOut' })
            .union()
            .repeatForever()
            .start();
    }

    /** Bar 宽度变化 + TipText 更新 */
    updateProgress(percent: number): void {
        if (this.progressBar) {
            tween(this.progressBar).to(0.3, { progress: percent }).start();
        }
        if (this.tipText) {
            this.tipText.string = `正在加载资源... ${Math.floor(percent * 100)}%`;
        }
    }

    /** 整个 Canvas 淡出 */
    fadeOut(callback?: () => void): void {
        const opacity = this.node.getComponent(UIOpacity) || this.node.addComponent(UIOpacity);
        tween(opacity)
            .to(0.5, { opacity: 0 })
            .call(() => {
                if (callback) callback();
            })
            .start();
    }

    onDestroy(): void {
        this._breathTween?.stop();
    }
}
