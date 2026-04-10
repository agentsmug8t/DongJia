// 文件路径：assets/scripts/modules/home/HomeView.ts

import {
    _decorator, Component, Node, Label, UITransform, Color, Size, Vec3,
    Graphics, Layers, HorizontalTextAlignment, VerticalTextAlignment,
    Overflow, tween, Tween
} from 'cc';
import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { EventManager } from 'db://assets/scripts/core/manager/EventManager';
import { PlayerModel } from 'db://assets/scripts/modules/player/model/PlayerModel';
import { PlayerEvent } from 'db://assets/scripts/core/constants/EventTypes';

const { ccclass } = _decorator;

/** Banner 数据 */
const BANNERS = [
    { title: '📢 新菜品上线', desc: '清蒸鲈鱼现已开放制作', color: new Color(33, 150, 243, 80) },
    { title: '🎉 联盟活动', desc: '本周联盟贸易收益翻倍', color: new Color(76, 175, 80, 80) },
    { title: '🏆 排行榜', desc: '声望榜已更新，快来看看', color: new Color(255, 152, 0, 80) },
];

/** 快捷入口 */
const QUICK_ACTIONS = [
    { icon: '🍜', label: '进入食铺', tabIdx: 1 },
    { icon: '📋', label: '每日任务', tabIdx: -1 },
    { icon: '🏰', label: '联盟动态', tabIdx: 2 },
];

@ccclass('HomeView')
export class HomeView extends Component {

    private _pm = PlayerModel.getInstance();
    private _em = EventManager.getInstance();
    private _bannerIdx: number = 0;
    private _bannerLabel: Label | null = null;
    private _bannerDesc: Label | null = null;
    private _bannerGfx: Graphics | null = null;
    private _newsLabel: Label | null = null;
    private _newsNode: Node | null = null;
    private _welcomeLabel: Label | null = null;
    private _dateLabel: Label | null = null;

    onLoad(): void {
        this._buildUI();
        this._bindEvents();
        // 自动轮播 Banner
        this.schedule(this._nextBanner, 3);
        // 滚动消息
        this._startNewsScroll();
    }

    onDestroy(): void {
        this.unscheduleAllCallbacks();
        this._em.offAll(this);
        if (this._newsNode) Tween.stopAllByTarget(this._newsNode);
    }

    // ─── UI 构建 ──────────────────────────────────────────────

    private _buildUI(): void {
        const root = this.node;

        // ── 欢迎区域 ──
        const welcomeArea = this._makeNode('WelcomeArea', root);
        welcomeArea.setPosition(new Vec3(0, 220, 0));
        welcomeArea.addComponent(UITransform).setContentSize(new Size(900, 60));

        this._welcomeLabel = this._makeLabel(welcomeArea, 'Welcome',
            `欢迎回来，${this._pm.nickname || '掌柜'}！`, 22,
            new Color(255, 240, 200), new Vec3(-200, 8, 0));

        const now = new Date();
        const dateStr = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;
        this._dateLabel = this._makeLabel(welcomeArea, 'Date',
            dateStr, 14,
            new Color(120, 120, 140), new Vec3(-200, -16, 0));

        // 等级信息
        this._makeLabel(welcomeArea, 'LevelInfo',
            `Lv.${this._pm.level} | 💰${this._pm.copper} | ⭐${this._pm.prestige}`,
            14, new Color(180, 180, 200), new Vec3(250, 0, 0));

        // ── Banner 轮播 ──
        const bannerNode = this._makeNode('Banner', root);
        bannerNode.setPosition(new Vec3(0, 140, 0));
        bannerNode.addComponent(UITransform).setContentSize(new Size(860, 100));

        this._bannerGfx = bannerNode.addComponent(Graphics);
        this._drawBannerBg(BANNERS[0].color);

        this._bannerLabel = this._makeLabel(bannerNode, 'BannerTitle',
            BANNERS[0].title, 20,
            new Color(255, 255, 255), new Vec3(0, 15, 0));
        this._bannerDesc = this._makeLabel(bannerNode, 'BannerDesc',
            BANNERS[0].desc, 14,
            new Color(200, 200, 220), new Vec3(0, -15, 0));

        // 指示器
        for (let i = 0; i < BANNERS.length; i++) {
            const dot = this._makeNode(`Dot${i}`, bannerNode);
            dot.setPosition(new Vec3(-20 + i * 20, -40, 0));
            dot.addComponent(UITransform).setContentSize(new Size(10, 10));
            const dGfx = dot.addComponent(Graphics);
            dGfx.fillColor = i === 0 ? new Color(255, 215, 0) : new Color(100, 100, 120);
            dGfx.circle(0, 0, 4);
            dGfx.fill();
        }

        // ── 快捷入口（3个卡片）──
        for (let i = 0; i < QUICK_ACTIONS.length; i++) {
            const qa = QUICK_ACTIONS[i];
            const x = -280 + i * 280;
            const card = this._makeNode(`QuickCard_${i}`, root);
            card.setPosition(new Vec3(x, 30, 0));
            card.addComponent(UITransform).setContentSize(new Size(250, 100));
            const cGfx = card.addComponent(Graphics);
            cGfx.fillColor = new Color(40, 40, 70, 180);
            cGfx.roundRect(-125, -50, 250, 100, 10);
            cGfx.fill();
            cGfx.strokeColor = new Color(80, 80, 120, 80);
            cGfx.lineWidth = 1;
            cGfx.roundRect(-125, -50, 250, 100, 10);
            cGfx.stroke();

            this._makeLabel(card, 'Icon', qa.icon, 30,
                Color.WHITE, new Vec3(0, 15, 0));
            this._makeLabel(card, 'Lbl', qa.label, 14,
                new Color(200, 200, 220), new Vec3(0, -22, 0));

            const tabIdx = qa.tabIdx;
            card.on(Node.EventType.TOUCH_END, () => {
                if (tabIdx >= 0) {
                    Logger.info('HomeView', `快捷入口: ${qa.label} → Tab ${tabIdx}`);
                    // 通知 MainScene 切换 Tab
                    this._em.emit('home:switch_tab', tabIdx);
                } else {
                    Logger.info('HomeView', `快捷入口: ${qa.label} (功能开发中)`);
                }
            }, this);
        }

        // ── 公告板 ──
        const noticeBoard = this._makeNode('NoticeBoard', root);
        noticeBoard.setPosition(new Vec3(0, -90, 0));
        noticeBoard.addComponent(UITransform).setContentSize(new Size(860, 120));
        const nbGfx = noticeBoard.addComponent(Graphics);
        nbGfx.fillColor = new Color(35, 35, 60, 160);
        nbGfx.roundRect(-430, -60, 860, 120, 10);
        nbGfx.fill();

        this._makeLabel(noticeBoard, 'NoticeTitle', '📋 公告', 16,
            new Color(255, 220, 100), new Vec3(-370, 40, 0));

        this._makeLabel(noticeBoard, 'Notice1', '• 服务器已更新至v1.2，新增联盟贸易功能', 13,
            new Color(180, 180, 200), new Vec3(0, 12, 0));
        this._makeLabel(noticeBoard, 'Notice2', '• 新菜品「清蒸鲈鱼」已上线，声望≥200可解锁', 13,
            new Color(180, 180, 200), new Vec3(0, -10, 0));
        this._makeLabel(noticeBoard, 'Notice3', '• 每日任务奖励已提升50%', 13,
            new Color(180, 180, 200), new Vec3(0, -32, 0));

        // ── 滚动消息条 ──
        const newsBar = this._makeNode('NewsBar', root);
        newsBar.setPosition(new Vec3(0, -175, 0));
        newsBar.addComponent(UITransform).setContentSize(new Size(860, 28));
        const newsBgGfx = newsBar.addComponent(Graphics);
        newsBgGfx.fillColor = new Color(255, 215, 0, 15);
        newsBgGfx.roundRect(-430, -14, 860, 28, 4);
        newsBgGfx.fill();

        this._makeLabel(newsBar, 'NewsIcon', '📢', 14,
            Color.WHITE, new Vec3(-410, 0, 0));

        this._newsNode = this._makeNode('NewsText', newsBar);
        this._newsNode.setPosition(new Vec3(500, 0, 0));
        this._newsNode.addComponent(UITransform).setContentSize(new Size(800, 28));
        this._newsLabel = this._newsNode.addComponent(Label);
        this._newsLabel.string = '掌柜「李大厨」完成了10单订单！  |  联盟「美食同盟」成功完成一次贸易  |  新活动即将开始…';
        this._newsLabel.fontSize = 13;
        this._newsLabel.color = new Color(200, 200, 200);
        this._newsLabel.horizontalAlign = HorizontalTextAlignment.LEFT;
        this._newsLabel.verticalAlign = VerticalTextAlignment.CENTER;
        this._newsLabel.overflow = Overflow.NONE;
    }

    // ─── Banner 轮播 ──────────────────────────────────────────

    private _nextBanner(): void {
        this._bannerIdx = (this._bannerIdx + 1) % BANNERS.length;
        const b = BANNERS[this._bannerIdx];
        if (this._bannerLabel) this._bannerLabel.string = b.title;
        if (this._bannerDesc) this._bannerDesc.string = b.desc;
        if (this._bannerGfx) this._drawBannerBg(b.color);

        // 更新指示器
        const bannerParent = this._bannerGfx?.node;
        if (bannerParent) {
            for (let i = 0; i < BANNERS.length; i++) {
                const dot = bannerParent.getChildByName(`Dot${i}`);
                if (dot) {
                    const dGfx = dot.getComponent(Graphics);
                    if (dGfx) {
                        dGfx.clear();
                        dGfx.fillColor = i === this._bannerIdx
                            ? new Color(255, 215, 0) : new Color(100, 100, 120);
                        dGfx.circle(0, 0, 4);
                        dGfx.fill();
                    }
                }
            }
        }
    }

    private _drawBannerBg(color: Color): void {
        if (!this._bannerGfx) return;
        this._bannerGfx.clear();
        this._bannerGfx.fillColor = color;
        this._bannerGfx.roundRect(-430, -50, 860, 100, 10);
        this._bannerGfx.fill();
        this._bannerGfx.strokeColor = new Color(100, 100, 150, 60);
        this._bannerGfx.lineWidth = 1;
        this._bannerGfx.roundRect(-430, -50, 860, 100, 10);
        this._bannerGfx.stroke();
    }

    // ─── 滚动消息 ─────────────────────────────────────────────

    private _startNewsScroll(): void {
        if (!this._newsNode) return;
        tween(this._newsNode)
            .repeatForever(
                tween()
                    .to(15, { position: new Vec3(-800, 0, 0) }, { easing: 'linear' })
                    .call(() => { this._newsNode!.setPosition(500, 0, 0); })
            )
            .start();
    }

    // ─── 事件 ─────────────────────────────────────────────────

    private _bindEvents(): void {
        this._em.on(PlayerEvent.DataUpdated, this._refreshWelcome, this);
        this._em.on(PlayerEvent.CopperChanged, this._refreshWelcome, this);
    }

    private _refreshWelcome(): void {
        if (this._welcomeLabel) {
            this._welcomeLabel.string = `欢迎回来，${this._pm.nickname || '掌柜'}！`;
        }
    }

    // ─── 工具方法 ──────────────────────────────────────────────

    private _makeNode(name: string, parent: Node): Node {
        const n = new Node(name);
        n.layer = Layers.Enum.UI_2D;
        parent.addChild(n);
        return n;
    }

    private _makeLabel(parent: Node, name: string, text: string,
        fontSize: number, color: Color, pos: Vec3): Label {
        const n = this._makeNode(name, parent);
        n.setPosition(pos);
        n.addComponent(UITransform).setContentSize(new Size(500, fontSize + 10));
        const lbl = n.addComponent(Label);
        lbl.string = text;
        lbl.fontSize = fontSize;
        lbl.color = color;
        lbl.horizontalAlign = HorizontalTextAlignment.CENTER;
        lbl.verticalAlign = VerticalTextAlignment.CENTER;
        lbl.overflow = Overflow.CLAMP;
        return lbl;
    }
}
