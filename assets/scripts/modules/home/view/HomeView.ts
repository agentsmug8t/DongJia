// 文件路径：assets/scripts/modules/home/view/HomeView.ts

import { _decorator, Component, Node, Sprite, Label, Button, ProgressBar, ScrollView, PageView, RichText, tween, Vec3, UIOpacity } from 'cc';
import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { EventManager } from 'db://assets/scripts/core/manager/EventManager';
import { PlayerEvent, ShopEvent } from 'db://assets/scripts/core/constants/EventTypes';
import { PlayerModel } from 'db://assets/scripts/modules/player/model/PlayerModel';
import { ShopModel } from 'db://assets/scripts/modules/shop/model/ShopModel';
import { NetworkManager } from 'db://assets/scripts/core/manager/NetworkManager';
import { SocketEvent } from 'db://assets/scripts/core/network/Protocol';
import { Toast } from 'db://assets/scripts/core/ui/Toast';

const { ccclass, property } = _decorator;

/**
 * 主界面（放在 ContentContainer 下）
 *
 * 节点层级：
 * HomeView
 * ├── ScrollView (ScrollView)
 * │   └── Content (Node)
 * │       ├── HeaderCard (Node)          — 顶部玩家卡片
 * │       │   ├── AvatarFrame (Sprite)
 * │       │   ├── Avatar (Sprite)        — 占位：灰色圆形
 * │       │   ├── NameLabel (Label)
 * │       │   ├── ExpBar (ProgressBar)
 * │       │   └── StatsRow (Node)        — 铜钱/银两/声望三列
 * │       ├── CurrentOrderCard (Node)    — 当前订单卡片，无订单时隐藏
 * │       │   ├── TitleLabel (Label)     — "进行中的订单"
 * │       │   ├── OrderName (Label)
 * │       │   ├── ProgressBar (ProgressBar)
 * │       │   ├── TimeLabel (Label)      — 剩余时间
 * │       │   └── DeliverBtn (Button)    — 交付按钮
 * │       ├── QuickEntryGrid (Grid)      — 快捷入口 3x2
 * │       │   ├── Entry1~6 (Button)
 * │       ├── BannerCarousel (PageView)  — 活动轮播
 * │       └── StreetNews (RichText)      — 街坊动态
 */
@ccclass('HomeView')
export class HomeView extends Component {

    // ─── 滚动视图 ────────────────────────────────────────────

    @property(ScrollView)
    scrollView: ScrollView = null!;

    // ─── 头部玩家卡片 ────────────────────────────────────────

    @property(Node)
    headerCard: Node = null!;

    @property(Sprite)
    avatarFrame: Sprite = null!;

    @property(Sprite)
    avatar: Sprite = null!;

    @property(Label)
    nameLabel: Label = null!;

    @property(ProgressBar)
    expBar: ProgressBar = null!;

    @property(Node)
    statsRow: Node = null!;

    // ─── 当前订单卡片 ────────────────────────────────────────

    @property(Node)
    currentOrderCard: Node = null!;

    @property(Label)
    orderTitleLabel: Label = null!;

    @property(Label)
    orderName: Label = null!;

    @property(ProgressBar)
    orderProgressBar: ProgressBar = null!;

    @property(Label)
    timeLabel: Label = null!;

    @property(Button)
    deliverBtn: Button = null!;

    // ─── 快捷入口 ────────────────────────────────────────────

    @property(Node)
    quickEntryGrid: Node = null!;

    @property(Button)
    entry1: Button = null!;

    @property(Button)
    entry2: Button = null!;

    @property(Button)
    entry3: Button = null!;

    @property(Button)
    entry4: Button = null!;

    @property(Button)
    entry5: Button = null!;

    @property(Button)
    entry6: Button = null!;

    // ─── 活动轮播与动态 ──────────────────────────────────────

    @property(PageView)
    bannerCarousel: PageView = null!;

    @property(RichText)
    streetNews: RichText = null!;

    // ─── 生命周期 ─────────────────────────────────────────────

    onLoad(): void {
        // 默认隐藏当前订单卡片
        if (this.currentOrderCard) {
            this.currentOrderCard.active = false;
        }

        // 按钮事件
        this.deliverBtn?.node.on('click', this._onDeliverClick, this);
        this.entry1?.node.on('click', () => this._onQuickEntry('order_hall'), this);
        this.entry2?.node.on('click', () => this._onQuickEntry('worker_manage'), this);
        this.entry3?.node.on('click', () => this._onQuickEntry('shop_upgrade'), this);
        this.entry4?.node.on('click', () => this._onQuickEntry('gossip'), this);
        this.entry5?.node.on('click', () => this._onQuickEntry('guild'), this);
        this.entry6?.node.on('click', () => this._onQuickEntry('ranking'), this);

        // 网络事件监听
        const em = EventManager.getInstance();
        em.on(PlayerEvent.CopperChanged, this._refreshStats, this);
        em.on(PlayerEvent.DataUpdated, this._refreshHeader, this);
        em.on(ShopEvent.OrderTaken, this._onOrderTaken, this);
        em.on(ShopEvent.OrderCompleted, this._onOrderCompleted, this);

        // 初始化显示
        this._refreshHeader();
        this._refreshStats();
        this._checkCurrentOrder();
        this.autoScrollBanner();
    }

    onDestroy(): void {
        EventManager.getInstance().offAll(this);
    }

    // ─── 按钮事件 ─────────────────────────────────────────────

    private _onDeliverClick(): void {
        Logger.info('HomeView', '点击交付按钮');
        const shop = ShopModel.getInstance();
        if (!shop.hasActiveOrder) {
            Toast.warning('当前没有进行中的订单');
            return;
        }
        if (!shop.isProductionComplete()) {
            Toast.warning('订单尚未完成，请等待...');
            return;
        }
        NetworkManager.getInstance().request(SocketEvent.DELIVER_ORDER, {
            orderId: shop.currentOrder!.orderId,
        }).then((res: unknown) => {
            const data = res as { reward?: RewardInfo };
            const reward = data?.reward;
            if (reward?.copper) {
                PlayerModel.getInstance().addCopper(reward.copper);
            }
            shop.clearCurrentOrder();
            this.playDeliverEffect();
            Toast.success('交付成功！');
        }).catch((err: Error) => {
            Logger.error('HomeView', '交付失败', err);
            Toast.error(err.message || '交付失败');
        });
    }

    private _onQuickEntry(entry: string): void {
        Logger.info('HomeView', `快捷入口: ${entry}`);
        EventManager.getInstance().emit('ui:navigate', entry);
    }

    // ─── 事件回调 ─────────────────────────────────────────────

    private _refreshStats(): void {
        const player = PlayerModel.getInstance();
        if (this.statsRow) {
            const labels = this.statsRow.getComponentsInChildren(Label);
            if (labels.length >= 3) {
                labels[0].string = String(player.copper);
                labels[1].string = String(player.silver);
                labels[2].string = String(player.prestige);
            }
        }
    }

    private _refreshHeader(): void {
        const player = PlayerModel.getInstance();
        if (this.nameLabel) this.nameLabel.string = player.nickname || '掌柜';
        if (this.expBar) {
            this.expBar.progress = player.exp / 100;
        }
    }

    private _onOrderTaken(): void {
        this._checkCurrentOrder();
    }

    /** 检查当前进行中的订单 */
    private _checkCurrentOrder(): void {
        const shop = ShopModel.getInstance();
        if (!shop.hasActiveOrder) {
            if (this.currentOrderCard) this.currentOrderCard.active = false;
            return;
        }
        if (this.currentOrderCard) this.currentOrderCard.active = true;
        const order = shop.currentOrder!;
        if (this.orderName) this.orderName.string = order.name;
        if (this.orderTitleLabel) this.orderTitleLabel.string = '进行中的订单';
        this.updateOrderProgress(shop.getProgress());
        // 定时更新进度
        this.unschedule(this._tickProgress);
        this.schedule(this._tickProgress, 1);
    }

    private _tickProgress(): void {
        const shop = ShopModel.getInstance();
        if (!shop.hasActiveOrder) {
            this.unschedule(this._tickProgress);
            return;
        }
        this.updateOrderProgress(shop.getProgress());
        const remaining = shop.getRemainingTime();
        if (this.timeLabel) this.timeLabel.string = `${remaining}s`;
        if (remaining <= 0) {
            this.unschedule(this._tickProgress);
            if (this.deliverBtn) this.deliverBtn.interactable = true;
        }
    }

    private _onOrderCompleted(): void {
        if (this.currentOrderCard) {
            this.currentOrderCard.active = false;
        }
    }

    // ─── 内部状态 ─────────────────────────────────────────────

    private _bannerTimer: number = 0;
    private _bannerIndex: number = 0;

    // ─── 动画方法 ─────────────────────────────────────────────

    /** 进度条平滑更新 */
    updateOrderProgress(percent: number): void {
        if (!this.orderProgressBar) return;
        tween(this.orderProgressBar).to(0.3, { progress: percent }).start();
        if (this.timeLabel) {
            const remaining = Math.max(0, Math.floor((1 - percent) * 100));
            this.timeLabel.string = `${remaining}s`;
        }
    }

    /** 铜钱数字跳动 */
    playCoinJump(value: number): void {
        if (!this.statsRow) return;
        tween(this.statsRow)
            .to(0.1, { scale: new Vec3(1.15, 1.15, 1) })
            .to(0.15, { scale: new Vec3(1, 1, 1) }, { easing: 'bounceOut' })
            .start();
    }

    /** 交付成功特效 */
    playDeliverEffect(): void {
        if (!this.currentOrderCard) return;
        const opacity = this.currentOrderCard.getComponent(UIOpacity) || this.currentOrderCard.addComponent(UIOpacity);
        tween(this.currentOrderCard)
            .to(0.15, { scale: new Vec3(1.05, 1.05, 1) })
            .to(0.3, { scale: new Vec3(1, 1, 1) })
            .start();
        tween(opacity)
            .delay(0.3)
            .to(0.3, { opacity: 0 })
            .call(() => {
                this.currentOrderCard.active = false;
                opacity.opacity = 255;
            })
            .start();
    }

    /** Banner自动轮播 */
    autoScrollBanner(): void {
        if (!this.bannerCarousel) return;
        this.schedule(() => {
            const pages = this.bannerCarousel.getPages();
            if (pages.length <= 1) return;
            this._bannerIndex = (this._bannerIndex + 1) % pages.length;
            this.bannerCarousel.scrollToPage(this._bannerIndex, 0.5);
        }, 4);
    }
}
