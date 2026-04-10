// 文件路径：assets/scripts/core/constants/EventTypes.ts
// 依赖：无

/**
 * 网络事件
 * 用于监听网络连接状态变化
 */
export enum NetworkEvent {
    Connected = 'network:connected',
    Disconnected = 'network:disconnected',
    Reconnecting = 'network:reconnecting',
    ReconnectFailed = 'network:reconnect:failed',
    MessageReceived = 'network:message:received',
    Error = 'network:error',
}

/**
 * 玩家事件
 * 用于监听玩家数据变更
 */
export enum PlayerEvent {
    DataUpdated = 'player:data:updated',
    LevelUp = 'player:level:up',
    CopperChanged = 'player:copper:changed',
    SilverChanged = 'player:silver:changed',
    PrestigeChanged = 'player:prestige:changed',
    LoggedIn = 'player:logged:in',
    LoggedOut = 'player:logged:out',
}

/**
 * 商铺事件
 * 用于监听商铺业务状态变更
 */
export enum ShopEvent {
    OrderTaken = 'shop:order:taken',
    OrderCompleted = 'shop:order:completed',
    OrderFailed = 'shop:order:failed',
    WorkerHired = 'shop:worker:hired',
    WorkerFired = 'shop:worker:fired',
    ShopUpgraded = 'shop:upgraded',
    GoodsUpdated = 'shop:goods:updated',
}

/**
 * UI 事件
 * 用于监听界面生命周期和通用 UI 交互
 */
export enum UIEvent {
    ViewOpened = 'ui:view:opened',
    ViewClosed = 'ui:view:closed',
    ToastShow = 'ui:toast:show',
    DialogConfirm = 'ui:dialog:confirm',
    DialogCancel = 'ui:dialog:cancel',
    LoadingShow = 'ui:loading:show',
    LoadingHide = 'ui:loading:hide',
}

/**
 * 联盟事件
 * 用于监听联盟社交相关状态变更
 */
export enum GuildEvent {
    Joined = 'guild:joined',
    Left = 'guild:left',
    MemberOnline = 'guild:member:online',
    MemberOffline = 'guild:member:offline',
    TradeRequest = 'guild:trade:request',
}

/**
 * 任务事件
 * 用于监听任务进度和奖励领取
 */
export enum TaskEvent {
    ProgressUpdated = 'task:progress:updated',
    Completed = 'task:completed',
    RewardClaimed = 'task:reward:claimed',
}

/**
 * NPC 事件
 * 用于监听 NPC 交互和好感度变化
 */
export enum NPCEvent {
    DataUpdated = 'npc:data:updated',
    FavorChanged = 'npc:favor:changed',
    DialogStart = 'npc:dialog:start',
    DialogEnd = 'npc:dialog:end',
    RedDotChanged = 'npc:reddot:changed',
}

/**
 * 系统事件
 * 用于监听应用生命周期和全局系统状态
 */
export enum SystemEvent {
    AppPause = 'system:app:pause',
    AppResume = 'system:app:resume',
    ConfigLoaded = 'system:config:loaded',
    ResourceLoaded = 'system:resource:loaded',
}
