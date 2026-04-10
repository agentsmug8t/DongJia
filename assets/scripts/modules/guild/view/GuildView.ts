// 文件路径：assets/scripts/modules/guild/view/GuildView.ts

import { _decorator, Component, Node, Sprite, Label, Button, ScrollView, EditBox, tween, Vec3, UIOpacity } from 'cc';
import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { EventManager } from 'db://assets/scripts/core/manager/EventManager';
import { GuildEvent } from 'db://assets/scripts/core/constants/EventTypes';
import { GuildModel } from 'db://assets/scripts/modules/guild/model/GuildModel';
import { NetworkManager } from 'db://assets/scripts/core/manager/NetworkManager';
import { SocketEvent } from 'db://assets/scripts/core/network/Protocol';
import { Toast } from 'db://assets/scripts/core/ui/Toast';

const { ccclass, property } = _decorator;

/**
 * 联盟界面
 *
 * 节点层级：
 * GuildView
 * ├── InfoCard (Node)              — 联盟信息卡片
 * │   ├── Emblem (Sprite)          — 联盟徽章，占位：六边形
 * │   ├── NameLabel (Label)
 * │   ├── LevelLabel (Label)
 * │   ├── MemberCount (Label)      — "12/20"
 * │   └── Announcement (Label)     — 宣言
 * ├── FunctionGrid (Grid)          — 功能入口 2x2
 * │   ├── ShopEntry (Button)       — 联盟商店
 * │   ├── TaskEntry (Button)       — 联盟任务
 * │   ├── TechEntry (Button)       — 联盟科技
 * │   └── CityEntry (Button)       — 大城市
 * ├── MemberTitle (Node)           — "成员列表" + 在线人数
 * ├── MemberList (ScrollView)      — 成员列表
 * └── ChatPanel (Node)             — 聊天区域
 *     ├── MessageScrollView (ScrollView)
 *     ├── InputField (EditBox)
 *     └── SendBtn (Button)
 */
@ccclass('GuildView')
export class GuildView extends Component {

    // ─── 联盟信息 ────────────────────────────────────────────

    @property(Node)
    infoCard: Node = null!;

    @property(Sprite)
    emblem: Sprite = null!;

    @property(Label)
    nameLabel: Label = null!;

    @property(Label)
    levelLabel: Label = null!;

    @property(Label)
    memberCount: Label = null!;

    @property(Label)
    announcement: Label = null!;

    // ─── 功能入口 ────────────────────────────────────────────

    @property(Node)
    functionGrid: Node = null!;

    @property(Button)
    shopEntry: Button = null!;

    @property(Button)
    taskEntry: Button = null!;

    @property(Button)
    techEntry: Button = null!;

    @property(Button)
    cityEntry: Button = null!;

    // ─── 成员列表 ────────────────────────────────────────────

    @property(Node)
    memberTitle: Node = null!;

    @property(ScrollView)
    memberList: ScrollView = null!;

    // ─── 聊天区域 ────────────────────────────────────────────

    @property(Node)
    chatPanel: Node = null!;

    @property(ScrollView)
    messageScrollView: ScrollView = null!;

    @property(EditBox)
    inputField: EditBox = null!;

    @property(Button)
    sendBtn: Button = null!;

    // ─── 生命周期 ─────────────────────────────────────────────

    onLoad(): void {
        // 按钮事件
        this.shopEntry?.node.on('click', () => this._onFunctionEntry('shop'), this);
        this.taskEntry?.node.on('click', () => this._onFunctionEntry('task'), this);
        this.techEntry?.node.on('click', () => this._onFunctionEntry('tech'), this);
        this.cityEntry?.node.on('click', () => this._onFunctionEntry('city'), this);
        this.sendBtn?.node.on('click', this._onSendMessage, this);

        // 网络事件监听
        const em = EventManager.getInstance();
        em.on(GuildEvent.Joined, this._onGuildJoined, this);
        em.on(GuildEvent.Left, this._onGuildLeft, this);
        em.on(GuildEvent.MemberOnline, this._onMemberStatusChanged, this);
        em.on(GuildEvent.MemberOffline, this._onMemberStatusChanged, this);
    }

    onDestroy(): void {
        EventManager.getInstance().offAll(this);
    }

    // ─── 按钮回调 ─────────────────────────────────────────────

    private _onFunctionEntry(func: string): void {
        Logger.info('GuildView', `功能入口: ${func}`);
        EventManager.getInstance().emit('ui:navigate', `guild_${func}`);
    }

    private _onSendMessage(): void {
        if (!this.inputField) return;
        const text = this.inputField.string.trim();
        if (!text) return;

        Logger.info('GuildView', `发送消息: ${text}`);
        this.inputField.string = '';
        NetworkManager.getInstance().request(SocketEvent.GUILD_CHAT, { message: text }).then(() => {
            this.playMessageScroll();
        }).catch((err: Error) => {
            Toast.error(err.message || '发送失败');
        });
    }

    // ─── 事件回调 ─────────────────────────────────────────────

    private _onGuildJoined(): void {
        Logger.debug('GuildView', '加入联盟');
        this._refreshGuildInfo();
    }

    private _onGuildLeft(): void {
        Logger.debug('GuildView', '离开联盟');
        if (this.nameLabel) this.nameLabel.string = '未加入联盟';
        if (this.levelLabel) this.levelLabel.string = '';
        if (this.memberCount) this.memberCount.string = '';
        if (this.announcement) this.announcement.string = '加入联盟解锁更多功能';
    }

    private _onMemberStatusChanged(): void {
        Logger.debug('GuildView', '成员状态变化');
        this._refreshMemberList();
    }

    /** 刷新联盟信息 */
    private _refreshGuildInfo(): void {
        const guild = new GuildModel();
        const info = guild.guildInfo;
        if (!info) return;
        if (this.nameLabel) this.nameLabel.string = info.name;
        if (this.levelLabel) this.levelLabel.string = `Lv.${info.level}`;
        if (this.memberCount) this.memberCount.string = `${info.memberCount}/${info.maxMembers}`;
        if (this.announcement) this.announcement.string = info.notice || '暂无公告';
    }

    /** 刷新成员列表 */
    private _refreshMemberList(): void {
        const guild = new GuildModel();
        const onlineCount = guild.members.filter(m => m.isOnline).length;
        this.showMemberOnline(onlineCount > 0);
    }

    // ─── 动画方法 ─────────────────────────────────────────────

    /** 新消息自动滚动到底部 */
    playMessageScroll(): void {
        if (!this.messageScrollView) return;
        this.messageScrollView.scrollToBottom(0.3);
    }

    /** 联盟升级特效 */
    playUpgradeEffect(): void {
        if (!this.infoCard) return;
        // 卡片闪亮弹跳
        tween(this.infoCard)
            .to(0.15, { scale: new Vec3(1.08, 1.08, 1) }, { easing: 'backOut' })
            .to(0.15, { scale: new Vec3(1, 1, 1) })
            .start();
        // 等级 label 闪烁
        if (this.levelLabel) {
            const opacity = this.levelLabel.node.getComponent(UIOpacity) || this.levelLabel.node.addComponent(UIOpacity);
            tween(opacity)
                .to(0.15, { opacity: 100 })
                .to(0.15, { opacity: 255 })
                .union()
                .repeat(3)
                .start();
        }
    }

    /** 在线状态切换 */
    showMemberOnline(online: boolean): void {
        if (!this.memberTitle) return;
        const opacity = this.memberTitle.getComponent(UIOpacity) || this.memberTitle.addComponent(UIOpacity);
        tween(opacity)
            .to(0.2, { opacity: online ? 255 : 120 })
            .start();
    }
}
