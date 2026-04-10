// 文件路径：assets/scripts/modules/player/view/PlayerInfoViewComp.ts
// 注意：与 PlayerInfoView.ts（BaseView 版本）共存，此为 Component 版本

import { _decorator, Component, Node, Sprite, Label, Toggle, ProgressBar, ScrollView, Button, tween, Vec3, UIOpacity } from 'cc';
import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { EventManager } from 'db://assets/scripts/core/manager/EventManager';
import { PlayerEvent, TaskEvent } from 'db://assets/scripts/core/constants/EventTypes';
import { PlayerModel } from 'db://assets/scripts/modules/player/model/PlayerModel';
import { Toast } from 'db://assets/scripts/core/ui/Toast';

const { ccclass, property } = _decorator;

/**
 * 玩家信息界面
 *
 * 节点层级：
 * PlayerInfoView
 * ├── Header (Node)
 * │   ├── Avatar (Sprite)          — 大头像，120x120
 * │   ├── NameLabel (Label)
 * │   ├── IDLabel (Label)          — "ID: 12345"
 * │   ├── LevelLabel (Label)
 * │   └── ExpBar (ProgressBar)
 * ├── AssetBar (Node)              — 资产栏
 * │   ├── CopperRow (Node)
 * │   ├── SilverRow (Node)
 * │   ├── PrestigeRow (Node)
 * │   └── GemRow (Node)
 * ├── TabBar (Node)
 * │   ├── BagTab (Toggle)          — 背包
 * │   ├── AchievementTab (Toggle)  — 成就
 * │   └── StatisticsTab (Toggle)   — 统计
 * └── PageContainer (Node)
 *     ├── BagPage (ScrollView)     — 背包页（网格 ItemSlot）
 *     ├── AchievementPage (ScrollView)
 *     └── StatisticsPage (ScrollView)
 */
@ccclass('PlayerInfoViewComp')
export class PlayerInfoViewComp extends Component {

    // ─── 头部信息 ────────────────────────────────────────────

    @property(Node)
    header: Node = null!;

    @property(Sprite)
    avatar: Sprite = null!;

    @property(Label)
    nameLabel: Label = null!;

    @property(Label)
    idLabel: Label = null!;

    @property(Label)
    levelLabel: Label = null!;

    @property(ProgressBar)
    expBar: ProgressBar = null!;

    // ─── 资产栏 ──────────────────────────────────────────────

    @property(Node)
    assetBar: Node = null!;

    @property(Node)
    copperRow: Node = null!;

    @property(Node)
    silverRow: Node = null!;

    @property(Node)
    prestigeRow: Node = null!;

    @property(Node)
    gemRow: Node = null!;

    // ─── Tab 栏 ──────────────────────────────────────────────

    @property(Node)
    tabBar: Node = null!;

    @property(Toggle)
    bagTab: Toggle = null!;

    @property(Toggle)
    achievementTab: Toggle = null!;

    @property(Toggle)
    statisticsTab: Toggle = null!;

    // ─── 页面 ────────────────────────────────────────────────

    @property(Node)
    pageContainer: Node = null!;

    @property(ScrollView)
    bagPage: ScrollView = null!;

    @property(ScrollView)
    achievementPage: ScrollView = null!;

    @property(ScrollView)
    statisticsPage: ScrollView = null!;

    // ─── 内部状态 ─────────────────────────────────────────────

    private _currentPage: number = 0;
    private _pages: Node[] = [];

    // ─── 生命周期 ─────────────────────────────────────────────

    onLoad(): void {
        this._pages = [
            this.bagPage?.node,
            this.achievementPage?.node,
            this.statisticsPage?.node,
        ].filter(Boolean) as Node[];

        // 默认显示背包
        this._showPage(0);

        // Tab 切换
        this.bagTab?.node.on('toggle', () => this._onTabSwitch(0), this);
        this.achievementTab?.node.on('toggle', () => this._onTabSwitch(1), this);
        this.statisticsTab?.node.on('toggle', () => this._onTabSwitch(2), this);

        // 网络事件
        const em = EventManager.getInstance();
        em.on(PlayerEvent.DataUpdated, this._refreshAll, this);
        em.on(PlayerEvent.LevelUp, this._onLevelUp, this);
        em.on(PlayerEvent.CopperChanged, this._refreshAssets, this);
        em.on(PlayerEvent.SilverChanged, this._refreshAssets, this);
        em.on(PlayerEvent.PrestigeChanged, this._refreshAssets, this);
        em.on(TaskEvent.RewardClaimed, this._onRewardClaimed, this);

        // 初始化显示
        this._refreshAll();
    }

    onDestroy(): void {
        EventManager.getInstance().offAll(this);
    }

    // ─── Tab 切换 ─────────────────────────────────────────────

    private _onTabSwitch(index: number): void {
        if (this._currentPage === index) return;
        this._currentPage = index;
        this._showPage(index);
        this.switchTab(index);
    }

    private _showPage(index: number): void {
        for (let i = 0; i < this._pages.length; i++) {
            if (this._pages[i]) {
                this._pages[i].active = (i === index);
            }
        }
    }

    // ─── 事件回调 ─────────────────────────────────────────────

    private _refreshAll(): void {
        const player = PlayerModel.getInstance();
        if (this.nameLabel) this.nameLabel.string = player.nickname || '掌柜';
        if (this.idLabel) this.idLabel.string = `ID: ${player.id}`;
        if (this.levelLabel) this.levelLabel.string = `Lv.${player.level}`;
        if (this.expBar) this.expBar.progress = player.exp / 100;
        this._refreshAssets();
    }

    private _onLevelUp(level: number): void {
        if (this.levelLabel) {
            this.levelLabel.string = `Lv.${level}`;
        }
        this.playClaimReward();
    }

    private _refreshAssets(): void {
        const player = PlayerModel.getInstance();
        const rows = [this.copperRow, this.silverRow, this.prestigeRow, this.gemRow];
        const values = [player.copper, player.silver, player.prestige, 0];
        for (let i = 0; i < rows.length; i++) {
            if (rows[i]) {
                const label = rows[i]!.getComponentInChildren(Label);
                if (label) label.string = String(values[i]);
            }
        }
    }

    private _onRewardClaimed(): void {
        this._refreshAll();
        this.playClaimReward();
        Toast.success('奖励已领取！');
    }

    // ─── 动画方法 ─────────────────────────────────────────────

    /** 页面切换动画 */
    switchTab(index: number): void {
        // 当前页面淡入
        const page = this._pages[index];
        if (!page) return;
        const opacity = page.getComponent(UIOpacity) || page.addComponent(UIOpacity);
        opacity.opacity = 0;
        tween(opacity).to(0.2, { opacity: 255 }).start();

        // Tab 弹跳
        const tabs = [this.bagTab, this.achievementTab, this.statisticsTab];
        const tab = tabs[index];
        if (tab) {
            tween(tab.node)
                .to(0.1, { scale: new Vec3(1.15, 1.15, 1) }, { easing: 'backOut' })
                .to(0.1, { scale: new Vec3(1, 1, 1) })
                .start();
        }
    }

    /** 道具点击反馈 */
    playItemClick(): void {
        // 对当前选中 page 的 content 做一个小脉冲
        const page = this._pages[this._currentPage];
        if (!page) return;
        tween(page)
            .to(0.08, { scale: new Vec3(0.95, 0.95, 1) })
            .to(0.12, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .start();
    }

    /** 领取奖励闪光 */
    playClaimReward(): void {
        if (!this.header) return;
        const opacity = this.header.getComponent(UIOpacity) || this.header.addComponent(UIOpacity);
        tween(opacity)
            .to(0.1, { opacity: 180 })
            .to(0.1, { opacity: 255 })
            .union()
            .repeat(2)
            .start();
        // 头部弹跳
        tween(this.header)
            .to(0.15, { scale: new Vec3(1.05, 1.05, 1) }, { easing: 'backOut' })
            .to(0.1, { scale: new Vec3(1, 1, 1) })
            .start();
    }
}
