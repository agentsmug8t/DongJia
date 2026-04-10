// 文件路径：assets/scripts/core/utils/PlatformUtils.ts
// 依赖：无（Cocos sys 模块在运行时注入）

/**
 * 平台适配工具
 * 在 Cocos 环境中 sys 由引擎注入，此处做安全降级处理
 */

/** 平台枚举（与 Cocos sys.Platform 对应） */
export enum Platform {
    UNKNOWN = 'unknown',
    ANDROID = 'android',
    IOS = 'ios',
    WEB = 'web',
    WECHAT_MINI_GAME = 'wechat_mini_game',
    DESKTOP = 'desktop',
}

export class PlatformUtils {
    private static _platform: Platform | null = null;

    /** 获取当前平台 */
    static getPlatform(): Platform {
        if (PlatformUtils._platform) return PlatformUtils._platform;

        // Cocos 运行时通过 sys 判断
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sys = (globalThis as Record<string, unknown>)['cc']
            ? ((globalThis as Record<string, unknown>)['cc'] as Record<string, unknown>)['sys']
            : null;

        if (sys) {
            const s = sys as Record<string, unknown>;
            if (s['isNative'] && s['os'] === 'Android') return (PlatformUtils._platform = Platform.ANDROID);
            if (s['isNative'] && s['os'] === 'iOS') return (PlatformUtils._platform = Platform.IOS);
            if (s['isMiniGame']) return (PlatformUtils._platform = Platform.WECHAT_MINI_GAME);
            if (s['isBrowser']) return (PlatformUtils._platform = Platform.WEB);
        }

        return (PlatformUtils._platform = Platform.UNKNOWN);
    }

    static isAndroid(): boolean { return PlatformUtils.getPlatform() === Platform.ANDROID; }
    static isIOS(): boolean { return PlatformUtils.getPlatform() === Platform.IOS; }
    static isWeb(): boolean { return PlatformUtils.getPlatform() === Platform.WEB; }
    static isWechatMiniGame(): boolean { return PlatformUtils.getPlatform() === Platform.WECHAT_MINI_GAME; }
    static isMobile(): boolean {
        const p = PlatformUtils.getPlatform();
        return p === Platform.ANDROID || p === Platform.IOS;
    }
    static isNative(): boolean { return PlatformUtils.isAndroid() || PlatformUtils.isIOS(); }

    /**
     * 获取安全区域（刘海屏适配）
     * 返回 { top, bottom, left, right }（像素）
     */
    static getSafeArea(): { top: number; bottom: number; left: number; right: number } {
        // TODO: 接入 Cocos sys.getSafeAreaEdge()
        return { top: 0, bottom: 0, left: 0, right: 0 };
    }

    /** 震动（移动端） */
    static vibrate(duration = 50): void {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(duration);
        }
    }

    /** 复制文本到剪贴板 */
    static copyToClipboard(text: string): void {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(text).catch(() => {/* ignore */});
        }
    }
}
