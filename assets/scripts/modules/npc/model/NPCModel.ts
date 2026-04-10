// 文件路径：assets/scripts/modules/npc/model/NPCModel.ts
// 依赖：core/base/BaseModel.ts, core/utils/Singleton.ts, core/constants/EventTypes.ts

import { Singleton } from 'db://assets/scripts/core/utils/Singleton';
import { BaseModel } from 'db://assets/scripts/core/base/BaseModel';
import { NPCEvent } from 'db://assets/scripts/core/constants/EventTypes';

/** NPC 信息 */
export interface NPCInfo {
    npcId: string;
    name: string;
    avatar: string;
    favorPercent: number;
    hasRedDot: boolean;
    status: 'idle' | 'busy';
    dialogs: string[];
}

/** 消息盒子条目 */
export interface NewsItem {
    newsId: string;
    title: string;
    content: string;
    timestamp: number;
    isRead: boolean;
}

/**
 * NPC 数据模型（全局单例）
 * 管理街坊邻居列表、好感度、消息盒子
 *
 * @example
 * const npc = NPCModel.getInstance();
 * npc.initFromServer(npcList, newsList);
 * const all = npc.getAllNPCs();
 */
export class NPCModel extends Singleton<NPCModel>() {
    private _model: NPCModelData = new NPCModelData();

    get npcs(): ReadonlyArray<NPCInfo> { return this._model.npcs; }
    get news(): ReadonlyArray<NewsItem> { return this._model.news; }
    get unreadCount(): number { return this._model.news.filter(n => !n.isRead).length; }

    /**
     * 从服务器数据初始化
     */
    initFromServer(npcs: NPCInfo[], news?: NewsItem[]): void {
        this._model.npcs = npcs;
        if (news) this._model.news = news;
        this._model.notify(NPCEvent.DataUpdated);
    }

    /**
     * 获取指定 NPC
     */
    getNPC(npcId: string): NPCInfo | null {
        return this._model.npcs.find(n => n.npcId === npcId) ?? null;
    }

    /**
     * 获取所有 NPC
     */
    getAllNPCs(): NPCInfo[] {
        return [...this._model.npcs];
    }

    /**
     * 更新好感度
     */
    updateFavor(npcId: string, favorPercent: number): void {
        const npc = this._model.npcs.find(n => n.npcId === npcId);
        if (!npc) return;
        npc.favorPercent = Math.max(0, Math.min(1, favorPercent));
        this._model.notify(NPCEvent.FavorChanged, npcId, npc.favorPercent);
    }

    /**
     * 设置红点
     */
    setRedDot(npcId: string, show: boolean): void {
        const npc = this._model.npcs.find(n => n.npcId === npcId);
        if (!npc) return;
        npc.hasRedDot = show;
        this._model.notify(NPCEvent.RedDotChanged, npcId, show);
    }

    /**
     * 添加消息
     */
    addNews(item: NewsItem): void {
        this._model.news.unshift(item);
        this._model.notify(NPCEvent.DataUpdated);
    }

    /**
     * 标记消息已读
     */
    markNewsRead(newsId: string): void {
        const item = this._model.news.find(n => n.newsId === newsId);
        if (item) item.isRead = true;
    }

    /**
     * 重置
     */
    reset(): void {
        this._model.reset();
    }
}

/** 内部数据类 */
class NPCModelData extends BaseModel {
    npcs: NPCInfo[] = [];
    news: NewsItem[] = [];

    override notify(event: string, ...args: unknown[]): void {
        super.notify(event, ...args);
    }

    override reset(): void {
        this.npcs = [];
        this.news = [];
    }
}
