// 文件路径：assets/scripts/modules/shop/view/ShopView.ts

import { _decorator, Component, Node, Toggle, Button, Label, ScrollView, Sprite, ProgressBar, tween, Vec3, UIOpacity } from 'cc';
import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { EventManager } from 'db://assets/scripts/core/manager/EventManager';
import { ShopEvent, PlayerEvent } from 'db://assets/scripts/core/constants/EventTypes';
import { ShopModel } from 'db://assets/scripts/modules/shop/model/ShopModel';
import { OrderModel } from 'db://assets/scripts/modules/shop/model/OrderModel';
import { NetworkManager } from 'db://assets/scripts/core/manager/NetworkManager';
import { SocketEvent } from 'db://assets/scripts/core/network/Protocol';
import { Toast } from 'db://assets/scripts/core/ui/Toast';

const { ccclass, property } = _decorator;

/**
 * 商铺管理界面（带页签切换）
 *
 * 节点层级：
 * ShopView
 * ├── TabBar (Node)
 * │   ├── OrderTab (Toggle)        — 订单大厅
 * │   ├── WorkerTab (Toggle)       — 我的伙计
 * │   └── UpgradeTab (Toggle)      — 商铺升级
 * └── PageContainer (Node)
 *     ├── OrderPage (Node)         — 订单大厅页
 *     │   ├── CurrentOrderCard (Node)
 *     │   ├── RefreshBtn (Button)
 *     │   ├── RefreshCountLabel (Label)
 *     │   └── OrderList (ScrollView)
 *     ├── WorkerPage (Node)        — 伙计页
 *     │   ├── WorkerScrollView (ScrollView)
 *     │   └── RecruitBtn (Button)
 *     └── UpgradePage (Node)       — 升级页
 *         ├── ShopPreview (Sprite)
 *         ├── CurrentLevel (Label)
 *         ├── NextLevelPreview (Node)
 *         │   ├── UnlockList (RichText)
 *         │   └── CostContainer (Node)
 *         └── UpgradeBtn (Button)
 */
@ccclass('ShopView')
export class ShopView extends Component {

    // ─── Tab 栏 ──────────────────────────────────────────────

    @property(Node)
    tabBar: Node = null!;

    @property(Toggle)
    orderTab: Toggle = null!;

    @property(Toggle)
    workerTab: Toggle = null!;

    @property(Toggle)
    upgradeTab: Toggle = null!;

    // ─── 页面容器 ────────────────────────────────────────────

    @property(Node)
    pageContainer: Node = null!;

    // ─── 订单大厅页 ──────────────────────────────────────────

    @property(Node)
    orderPage: Node = null!;

    @property(Node)
    currentOrderCard: Node = null!;

    @property(Button)
    refreshBtn: Button = null!;

    @property(Label)
    refreshCountLabel: Label = null!;

    @property(ScrollView)
    orderList: ScrollView = null!;

    // ─── 伙计页 ──────────────────────────────────────────────

    @property(Node)
    workerPage: Node = null!;

    @property(ScrollView)
    workerScrollView: ScrollView = null!;

    @property(Button)
    recruitBtn: Button = null!;

    // ─── 升级页 ──────────────────────────────────────────────

    @property(Node)
    upgradePage: Node = null!;

    @property(Sprite)
    shopPreview: Sprite = null!;

    @property(Label)
    currentLevel: Label = null!;

    @property(Node)
    nextLevelPreview: Node = null!;

    @property(Node)
    costContainer: Node = null!;

    @property(Button)
    upgradeBtn: Button = null!;

    // ─── 内部状态 ─────────────────────────────────────────────

    private _currentPageIndex: number = 0;
    private _pages: Node[] = [];

    // ─── 生命周期 ─────────────────────────────────────────────

    onLoad(): void {
        // 收集页面引用
        this._pages = [this.orderPage, this.workerPage, this.upgradePage];

        // 默认显示订单大厅
        this._showPage(0);

        // Tab 切换
        this.orderTab?.node.on('toggle', () => this._onTabSwitch(0), this);
        this.workerTab?.node.on('toggle', () => this._onTabSwitch(1), this);
        this.upgradeTab?.node.on('toggle', () => this._onTabSwitch(2), this);

        // 按钮事件
        this.refreshBtn?.node.on('click', this._onRefreshClick, this);
        this.recruitBtn?.node.on('click', this._onRecruitClick, this);
        this.upgradeBtn?.node.on('click', this._onUpgradeClick, this);

        // 网络事件
        const em = EventManager.getInstance();
        em.on(ShopEvent.OrderTaken, this._onOrderTaken, this);
        em.on(ShopEvent.OrderCompleted, this._onOrderCompleted, this);
        em.on(ShopEvent.WorkerHired, this._onWorkerHired, this);
        em.on(ShopEvent.ShopUpgraded, this._onShopUpgraded, this);
    }

    onDestroy(): void {
        EventManager.getInstance().offAll(this);
    }

    // ─── Tab/Page 切换 ────────────────────────────────────────

    private _onTabSwitch(index: number): void {
        if (this._currentPageIndex === index) return;
        this._currentPageIndex = index;
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

    // ─── 按钮回调 ─────────────────────────────────────────────

    private _onRefreshClick(): void {
        Logger.info('ShopView', '刷新订单列表');
        NetworkManager.getInstance().request(SocketEvent.SHOP_INFO, {}).then((res: unknown) => {
            const data = res as { orders?: Array<{ orderId: number; configId: number; name: string; difficulty: number; reward: RewardInfo; expireAt: number }> };
            if (data?.orders) {
                const orderModel = new OrderModel();
                orderModel.refreshOrders(data.orders);
            }
            Toast.success('订单列表已刷新');
        }).catch((err: Error) => {
            Toast.error(err.message || '刷新失败');
        });
    }

    private _onRecruitClick(): void {
        Logger.info('ShopView', '招募伙计');
        NetworkManager.getInstance().request(SocketEvent.HIRE_WORKER, {}).then(() => {
            Toast.success('招募成功！');
        }).catch((err: Error) => {
            Toast.error(err.message || '招募失败');
        });
    }

    private _onUpgradeClick(): void {
        Logger.info('ShopView', '商铺升级');
        NetworkManager.getInstance().request(SocketEvent.SHOP_UPGRADE, {}).then(() => {
            Toast.success('升级成功！');
            EventManager.getInstance().emit(ShopEvent.ShopUpgraded);
        }).catch((err: Error) => {
            Toast.error(err.message || '升级失败');
        });
    }

    // ─── 事件回调 ─────────────────────────────────────────────

    private _onOrderTaken(): void {
        Logger.debug('ShopView', '订单接取');
        const shop = ShopModel.getInstance();
        if (shop.hasActiveOrder && this.currentOrderCard) {
            this.currentOrderCard.active = true;
            this.playTakeOrderAnim(this.currentOrderCard);
        }
    }

    private _onOrderCompleted(): void {
        Logger.debug('ShopView', '订单完成');
        if (this.currentOrderCard) this.currentOrderCard.active = false;
        this.playCoinRain();
    }

    private _onWorkerHired(): void {
        Logger.debug('ShopView', '伙计招募');
        Toast.success('新伙计已加入！');
    }

    private _onShopUpgraded(): void {
        Logger.debug('ShopView', '商铺升级');
        if (this.currentLevel) {
            this.currentLevel.string = `Lv.${(parseInt(this.currentLevel.string.replace('Lv.', '')) || 1) + 1}`;
        }
    }

    // ─── 动画方法 ─────────────────────────────────────────────

    /** 页面切换滑动 */
    switchTab(index: number): void {
        const tabs = [this.orderTab, this.workerTab, this.upgradeTab];
        for (let i = 0; i < tabs.length; i++) {
            if (!tabs[i]) continue;
            if (i === index) {
                tween(tabs[i]!.node)
                    .to(0.15, { scale: new Vec3(1.15, 1.15, 1) }, { easing: 'backOut' })
                    .to(0.1, { scale: new Vec3(1, 1, 1) })
                    .start();
            }
        }
    }

    /** 卡片飞入进行中区域 */
    playTakeOrderAnim(card: Node): void {
        if (!card) return;
        const opacity = card.getComponent(UIOpacity) || card.addComponent(UIOpacity);
        opacity.opacity = 128;
        tween(card)
            .to(0.3, { scale: new Vec3(0.95, 0.95, 1) })
            .to(0.2, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .start();
        tween(opacity)
            .to(0.3, { opacity: 255 })
            .start();
    }

    /** 进度条填充 */
    playProgressFill(percent: number): void {
        // 代理给当前活跃的 OrderCard
    }

    /** 交付成功铜钱雨 */
    playCoinRain(): void {
        if (!this.pageContainer) return;
        // 简易铜钱飘落：创建几个临时节点从上方飘下
        for (let i = 0; i < 8; i++) {
            this.scheduleOnce(() => {
                const coin = new Node('CoinFx');
                this.pageContainer.addChild(coin);
                const startX = (Math.random() - 0.5) * 400;
                coin.setPosition(startX, 300, 0);
                const opacity = coin.addComponent(UIOpacity);
                tween(coin)
                    .to(1.2, {
                        position: new Vec3(startX + (Math.random() - 0.5) * 100, -300, 0)
                    }, { easing: 'sineIn' })
                    .call(() => coin.destroy())
                    .start();
                tween(opacity)
                    .delay(0.8)
                    .to(0.4, { opacity: 0 })
                    .start();
            }, i * 0.1);
        }
    }
}
