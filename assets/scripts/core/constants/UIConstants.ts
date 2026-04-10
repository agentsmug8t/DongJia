// 文件路径：assets/scripts/core/constants/UIConstants.ts
// 依赖：无

/**
 * UI 层级（z-index / layer order）
 */
export enum UILayer {
    Background = 0,   // 背景层（地图、场景）
    Normal = 100,     // 普通界面层
    Popup = 200,      // 弹窗层
    Toast = 300,      // 提示层
    Loading = 400,    // 加载遮罩层
    Top = 500,        // 顶层（系统公告、强更提示）
}

/**
 * 界面路径常量（对应 resources/prefabs/ 下的路径）
 */
export const ViewPath = {
    // 主界面
    MAIN: 'ui/main/MainView',
    // 商铺
    SHOP_MAIN: 'ui/shop/ShopMainView',
    SHOP_ORDER_DETAIL: 'ui/shop/OrderDetailView',
    // 联盟
    GUILD_MAIN: 'ui/guild/GuildMainView',
    GUILD_TRADE: 'ui/guild/TradeView',
    // 玩家
    PLAYER_INFO: 'ui/player/PlayerInfoView',
    // 系统
    SETTINGS: 'ui/system/SettingsView',
    NOTICE: 'ui/system/NoticeView',
    // 通用
    TOAST: 'common/Toast',
    DIALOG: 'common/Dialog',
    LOADING: 'common/Loading',
} as const;

export type ViewPathKey = keyof typeof ViewPath;

/**
 * 动画时长常量（毫秒）
 */
export const AnimDuration = {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
} as const;
