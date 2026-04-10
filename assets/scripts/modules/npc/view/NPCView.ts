// 文件路径：assets/scripts/modules/npc/view/NPCView.ts

import { _decorator, Component, Node, Toggle, ScrollView, tween, Vec3, UIOpacity, Label } from 'cc';
import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { EventManager } from 'db://assets/scripts/core/manager/EventManager';
import { NPCEvent } from 'db://assets/scripts/core/constants/EventTypes';
import { NPCModel } from 'db://assets/scripts/modules/npc/model/NPCModel';

const { ccclass, property } = _decorator;

/**
 * 消息/八卦界面
 *
 * 节点层级：
 * NPCView
 * ├── TopTab (Node)
 * │   ├── StreetTab (Toggle)       — 街坊邻居
 * │   └── NewsTab (Toggle)         — 消息盒子
 * └── PageContainer (Node)
 *     ├── StreetPage (ScrollView)  — 街坊邻居页
 *     │   └── Content (Grid)       — 网格布局，每行3个 NPCCard
 *     └── NewsPage (ScrollView)    — 消息页
 *         └── Content              — NewsItem 列表
 */
@ccclass('NPCView')
export class NPCView extends Component {

    // ─── Tab 栏 ──────────────────────────────────────────────

    @property(Node)
    topTab: Node = null!;

    @property(Toggle)
    streetTab: Toggle = null!;

    @property(Toggle)
    newsTab: Toggle = null!;

    // ─── 页面 ────────────────────────────────────────────────

    @property(Node)
    pageContainer: Node = null!;

    @property(ScrollView)
    streetPage: ScrollView = null!;

    @property(ScrollView)
    newsPage: ScrollView = null!;

    // 用于动态实例化的预制体引用
    @property(Node)
    npcCardPrefab: Node = null!;

    @property(Node)
    newsItemPrefab: Node = null!;

    // ─── 内部状态 ─────────────────────────────────────────────

    private _currentPage: number = 0;

    // ─── 生命周期 ─────────────────────────────────────────────

    onLoad(): void {
        // 默认显示街坊邻居
        this._showPage(0);

        // Tab 切换
        this.streetTab?.node.on('toggle', () => this._onTabSwitch(0), this);
        this.newsTab?.node.on('toggle', () => this._onTabSwitch(1), this);

        // 网络事件
        const em = EventManager.getInstance();
        em.on(NPCEvent.DataUpdated, this._refreshNPCList, this);
        em.on(NPCEvent.FavorChanged, this._onFavorChanged, this);
        em.on(NPCEvent.RedDotChanged, this._onRedDotChanged, this);

        // 初始加载
        this._refreshNPCList();
        this.playNPCEntry();
    }

    onDestroy(): void {
        EventManager.getInstance().offAll(this);
    }

    // ─── 数据刷新 ─────────────────────────────────────────

    private _refreshNPCList(): void {
        const npcs = NPCModel.getInstance().getAllNPCs();
        Logger.debug('NPCView', `刷新 NPC 列表: ${npcs.length} 个`);
        // 清空现有卡片并重新生成
        if (this.streetPage?.content) {
            this.streetPage.content.removeAllChildren();
            for (const npc of npcs) {
                if (this.npcCardPrefab) {
                    const card = this.npcCardPrefab.clone();
                    card.active = true;
                    this.streetPage.content.addChild(card);
                    // 如果有 NPCCard 组件则初始化
                    const comp = card.getComponent('NPCCard') as any;
                    if (comp?.setup) {
                        comp.setup({
                            npcId: npc.npcId,
                            name: npc.name,
                            favorPercent: npc.favorPercent,
                            hasRedDot: npc.hasRedDot,
                            onClick: (id: string) => this.openNPCDialog(id),
                        });
                    }
                }
            }
        }
    }

    private _onFavorChanged(npcId: string, favor: number): void {
        this.playFavorIncrease(Math.floor(favor * 100));
    }

    private _onRedDotChanged(npcId: string, show: boolean): void {
        // 找到对应卡片并刷新红点
        if (!this.streetPage?.content) return;
        for (const child of this.streetPage.content.children) {
            const comp = child.getComponent('NPCCard') as any;
            if (comp?._npcId === npcId) {
                comp.setRedDot(show);
                break;
            }
        }
    }

    // ─── Tab 切换 ─────────────────────────────────────────────

    private _onTabSwitch(index: number): void {
        if (this._currentPage === index) return;
        this._currentPage = index;
        this._showPage(index);
    }

    private _showPage(index: number): void {
        if (this.streetPage) this.streetPage.node.active = (index === 0);
        if (this.newsPage) this.newsPage.node.active = (index === 1);
    }

    // ─── 外部交互 ─────────────────────────────────────────────

    /**
     * 点击 NPC 后打开对话界面
     */
    openNPCDialog(npcId: string): void {
        Logger.info('NPCView', `打开 NPC 对话: ${npcId}`);
        // TODO: 打开 NPCDialogView
    }

    // ─── 动画方法 ─────────────────────────────────────────────

    /** 对话逐字显示 */
    playTypewriter(text: string, label?: Label): void {
        if (!label) return;
        let idx = 0;
        label.string = '';
        this.schedule(() => {
            if (idx < text.length) {
                label.string += text[idx];
                idx++;
            }
        }, 0.05, text.length - 1);
    }

    /** 心形飘出（好感度增加） */
    playFavorIncrease(value: number): void {
        // 在 pageContainer 上播放一个向上飘出的文字
        if (!this.pageContainer) return;
        const heart = new Node('HeartFloat');
        heart.parent = this.pageContainer;
        const lbl = heart.addComponent(Label);
        lbl.string = `+${value} ❤`;
        lbl.fontSize = 28;
        heart.setPosition(0, 0, 0);
        const opacity = heart.addComponent(UIOpacity);
        tween(heart)
            .to(0.8, { position: new Vec3(0, 100, 0) })
            .start();
        tween(opacity)
            .delay(0.4)
            .to(0.4, { opacity: 0 })
            .call(() => heart.destroy())
            .start();
    }

    /** 红点闪烁提示 */
    showRedDot(card: Node): void {
        if (!card) return;
        tween(card)
            .to(0.4, { scale: new Vec3(1.3, 1.3, 1) })
            .to(0.4, { scale: new Vec3(1, 1, 1) })
            .union()
            .repeatForever()
            .start();
    }

    /** NPC立绘淡入 */
    playNPCEntry(): void {
        if (!this.pageContainer) return;
        const opacity = this.pageContainer.getComponent(UIOpacity) || this.pageContainer.addComponent(UIOpacity);
        opacity.opacity = 0;
        tween(opacity).to(0.4, { opacity: 255 }).start();
    }
}
