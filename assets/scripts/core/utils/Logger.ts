// 文件路径：assets/scripts/core/utils/Logger.ts
// 依赖：无

/**
 * 日志级别枚举
 */
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    OFF = 4,
}

/** 日志上报回调类型 */
export type LogReporter = (level: LogLevel, module: string, message: string, data?: unknown) => void;

/**
 * 日志系统
 * 支持级别过滤、模块过滤、生产环境静默
 *
 * @example
 * Logger.debug('Network', '连接成功', { url });
 * Logger.error('Shop', '接单失败', err);
 * Logger.setLevel(LogLevel.WARN); // 生产环境
 */
export class Logger {
    private static _level: LogLevel = LogLevel.DEBUG;
    private static _enabledModules: Set<string> | null = null; // null = 全部开启
    private static _reporter: LogReporter | null = null;

    /** 设置全局日志级别 */
    static setLevel(level: LogLevel): void {
        Logger._level = level;
    }

    /** 只显示指定模块的日志，传 null 恢复全部 */
    static filterModules(modules: string[] | null): void {
        Logger._enabledModules = modules ? new Set(modules) : null;
    }

    /** 注册错误上报回调（如上报到服务器） */
    static setReporter(reporter: LogReporter | null): void {
        Logger._reporter = reporter;
    }

    static debug(module: string, message: string, data?: unknown): void {
        Logger._log(LogLevel.DEBUG, module, message, data);
    }

    static info(module: string, message: string, data?: unknown): void {
        Logger._log(LogLevel.INFO, module, message, data);
    }

    static warn(module: string, message: string, data?: unknown): void {
        Logger._log(LogLevel.WARN, module, message, data);
    }

    static error(module: string, message: string, data?: unknown): void {
        Logger._log(LogLevel.ERROR, module, message, data);
    }

    private static _log(level: LogLevel, module: string, message: string, data?: unknown): void {
        if (level < Logger._level) return;
        if (Logger._enabledModules && !Logger._enabledModules.has(module)) return;

        const timestamp = new Date().toISOString().slice(11, 23); // HH:mm:ss.mmm
        const levelStr = LogLevel[level].padEnd(5);
        const prefix = `[${timestamp}] [${levelStr}] [${module}]`;
        const formatted = data !== undefined ? `${prefix} ${message}` : `${prefix} ${message}`;

        switch (level) {
            case LogLevel.DEBUG:
                data !== undefined ? console.debug(formatted, data) : console.debug(formatted);
                break;
            case LogLevel.INFO:
                data !== undefined ? console.info(formatted, data) : console.info(formatted);
                break;
            case LogLevel.WARN:
                data !== undefined ? console.warn(formatted, data) : console.warn(formatted);
                break;
            case LogLevel.ERROR:
                data !== undefined ? console.error(formatted, data) : console.error(formatted);
                Logger._reporter?.(level, module, message, data);
                break;
        }
    }
}

// 生产环境自动降级（Cocos 中通过 CC_DEBUG 判断）
// if (!CC_DEBUG) { Logger.setLevel(LogLevel.WARN); }
