// 文件路径：assets/scripts/modules/player/model/PlayerModel.ts
// 依赖：core/base/BaseModel.ts, core/utils/Singleton.ts, core/constants/EventTypes.ts,
//        core/constants/GameConstants.ts

import { Singleton } from 'db://assets/scripts/core/utils/Singleton';
import { BaseModel } from 'db://assets/scripts/core/base/BaseModel';
import { PlayerEvent } from 'db://assets/scripts/core/constants/EventTypes';
import { GameConstants } from 'db://assets/scripts/core/constants/GameConstants';

/**
 * 玩家数据模型（全局单例）
 * 存储玩家核心数据，数据变更时自动派发事件
 *
 * @example
 * const player = PlayerModel.getInstance();
 * player.addCopper(100);
 * console.log(player.nickname, player.level);
 */
export class PlayerModel extends Singleton<PlayerModel>() {
    private _model: PlayerModelData = new PlayerModelData();

    get id(): string { return this._model.id; }
    get nickname(): string { return this._model.nickname; }
    get level(): number { return this._model.level; }
    get avatar(): string { return this._model.avatar; }
    get copper(): number { return this._model.copper; }
    get silver(): number { return this._model.silver; }
    get prestige(): number { return this._model.prestige; }
    get title(): string { return this._model.title; }
    get exp(): number { return this._model.exp; }

    /**
     * 从服务器数据初始化
     */
    initFromServer(data: PlayerBaseInfo): void {
        this._model.fromJSON(data as unknown as Record<string, unknown>);
        this._model.notify(PlayerEvent.DataUpdated);
    }

    /**
     * 增加铜钱
     */
    addCopper(amount: number): void {
        this._model.copper = Math.min(this._model.copper + amount, GameConstants.MAX_COPPER);
        this._model.notify(PlayerEvent.CopperChanged, this._model.copper);
        this._model.markDirty();
    }

    /**
     * 消耗铜钱
     */
    spendCopper(amount: number): boolean {
        if (this._model.copper < amount) return false;
        this._model.copper -= amount;
        this._model.notify(PlayerEvent.CopperChanged, this._model.copper);
        this._model.markDirty();
        return true;
    }

    /**
     * 增加银两
     */
    addSilver(amount: number): void {
        this._model.silver = Math.min(this._model.silver + amount, GameConstants.MAX_SILVER);
        this._model.notify(PlayerEvent.SilverChanged, this._model.silver);
        this._model.markDirty();
    }

    /**
     * 增加声望
     */
    addPrestige(amount: number): void {
        this._model.prestige += amount;
        this._model.notify(PlayerEvent.PrestigeChanged, this._model.prestige);
        this._model.markDirty();
    }

    /**
     * 升级
     */
    levelUp(newLevel: number): void {
        this._model.level = newLevel;
        this._model.notify(PlayerEvent.LevelUp, newLevel);
        this._model.markDirty();
    }

    /**
     * 是否有脏数据需要存档
     */
    get isDirty(): boolean { return this._model.isDirty; }

    /**
     * 清除脏标记（存档后调用）
     */
    clearDirty(): void { this._model.clearDirty(); }

    /**
     * 导出存档数据
     */
    toSaveData(): Record<string, unknown> {
        return this._model.toJSON();
    }

    /**
     * 重置
     */
    reset(): void {
        this._model.reset();
    }
}

/** 内部数据类（不对外暴露 setter） */
class PlayerModelData extends BaseModel {
    id: string = '';
    nickname: string = '';
    level: number = 1;
    avatar: string = '';
    copper: number = 0;
    silver: number = 0;
    prestige: number = 0;
    title: string = '';
    exp: number = 0;

    private _dirty: boolean = false;

    get isDirty(): boolean { return this._dirty; }
    markDirty(): void { this._dirty = true; }
    clearDirty(): void { this._dirty = false; }

    // 暴露 notify 给 PlayerModel 调用
    override notify(event: string, ...args: unknown[]): void {
        super.notify(event, ...args);
    }

    override reset(): void {
        this.id = '';
        this.nickname = '';
        this.level = 1;
        this.avatar = '';
        this.copper = 0;
        this.silver = 0;
        this.prestige = 0;
        this.title = '';
        this.exp = 0;
        this._dirty = false;
    }
}
