import { config } from '../config';

enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

const LEVEL = config.isDev ? LogLevel.DEBUG : LogLevel.WARN;

function formatTime(): string {
    return new Date().toISOString().slice(11, 23);
}

export const logger = {
    debug(message: string, data?: unknown): void {
        if (LEVEL > LogLevel.DEBUG) return;
        data !== undefined ? console.debug(`[${formatTime()}] [DEBUG] ${message}`, data) : console.debug(`[${formatTime()}] [DEBUG] ${message}`);
    },

    info(message: string, data?: unknown): void {
        if (LEVEL > LogLevel.INFO) return;
        data !== undefined ? console.info(`[${formatTime()}] [INFO ] ${message}`, data) : console.info(`[${formatTime()}] [INFO ] ${message}`);
    },

    warn(message: string, data?: unknown): void {
        if (LEVEL > LogLevel.WARN) return;
        data !== undefined ? console.warn(`[${formatTime()}] [WARN ] ${message}`, data) : console.warn(`[${formatTime()}] [WARN ] ${message}`);
    },

    error(message: string, data?: unknown): void {
        data !== undefined ? console.error(`[${formatTime()}] [ERROR] ${message}`, data) : console.error(`[${formatTime()}] [ERROR] ${message}`);
    },
};
