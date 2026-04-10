// 文件路径：assets/scripts/modules/npc/view/NPCCard.ts

import { _decorator, Component, Node, Sprite, Label, ProgressBar, tween, Vec3 } from 'cc';
import { Logger } from 'db://assets/scripts/core/utils/Logger';

const { ccclass, property } = _decorator;

/**
 * NPC 卡片预制体
 *
 * 节点层级：
 * NPCCard (Node)
 * ├── AvatarFrame (Sprite)         — 头像边框
 * ├── Avatar (Sprite)              — NPC头像，占位：灰色圆形
 * ├── NameLabel (Label)
 * ├── FavorBar (ProgressBar)       — 好感度进度条
 * ├── RedDot (Node)                — 红点提示，默认隐藏
 * └── StatusIcon (Sprite)          — 状态图标（可接单/可闲聊）
 */
@ccclass('NPCCard')
export class NPCCard extends Component {

    // ─── UI 节点 ──────────────────────────────────────────────

    @property(Sprite)
    avatarFrame: Sprite = null!;

    @property(Sprite)
    avatar: Sprite = null!;

    @property(Label)
    nameLabel: Label = null!;

    @property(ProgressBar)
    favorBar: ProgressBar = null!;

    @property(Node)
    redDot: Node = null!;

    @property(Sprite)
    statusIcon: Sprite = null!;

    // ─── 内部数据 ─────────────────────────────────────────────

    private _npcId: string = '';
    private _onClickCallback: ((npcId: string) => void) | null = null;

    // ─── 生命周期 ─────────────────────────────────────────────

    onLoad(): void {
        if (this.redDot) {
            this.redDot.active = false;
        }

        this.node.on(Node.EventType.TOUCH_END, this._onClick, this);
    }

    // ─── 外部调用 ─────────────────────────────────────────────

    /**
     * 初始化卡片数据
     */
    setup(data: {
        npcId: string;
        name: string;
        favorPercent: number;
        hasRedDot?: boolean;
        onClick?: (npcId: string) => void;
    }): void {
        this._npcId = data.npcId;
        this._onClickCallback = data.onClick ?? null;

        if (this.nameLabel) this.nameLabel.string = data.name;
        if (this.favorBar) this.favorBar.progress = data.favorPercent;
        if (this.redDot) this.redDot.active = !!data.hasRedDot;
    }

    /**
     * 显示/隐藏红点
     */
    setRedDot(show: boolean): void {
        if (this.redDot) this.redDot.active = show;
        if (show) {
            this.showRedDot();
        }
    }

    // ─── 点击回调 ─────────────────────────────────────────────

    private _onClick(): void {
        Logger.info('NPCCard', `点击 NPC: ${this._npcId}`);
        if (this._onClickCallback) {
            this._onClickCallback(this._npcId);
        }
    }

    // ─── 动画方法 ─────────────────────────────────────────────

    /** 红点闪烁提示 */
    showRedDot(): void {
        if (!this.redDot || !this.redDot.active) return;
        tween(this.redDot)
            .to(0.5, { scale: new Vec3(1.3, 1.3, 1) })
            .to(0.5, { scale: new Vec3(1, 1, 1) })
            .union()
            .repeatForever()
            .start();
    }
}
