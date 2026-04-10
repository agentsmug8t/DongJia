// 文件路径：assets/scripts/core/utils/Utils.ts
// 依赖：无

/**
 * 通用工具函数集合
 */
export class Utils {
    /**
     * 深拷贝（JSON 安全对象）
     */
    static deepClone<T>(obj: T): T {
        if (obj === null || typeof obj !== 'object') return obj;
        return JSON.parse(JSON.stringify(obj)) as T;
    }

    /**
     * 大数字格式化：1000→1K，1000000→1M
     */
    static formatNumber(num: number): string {
        if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
        if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
        return String(num);
    }

    /**
     * 秒数格式化：3665→01:01:05
     */
    static formatTime(seconds: number): string {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const pad = (n: number) => String(n).padStart(2, '0');
        return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
    }

    /**
     * 随机整数 [min, max]
     */
    static random(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * 随机取数组元素
     */
    static randomItem<T>(arr: T[]): T {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    /**
     * Fisher-Yates 打乱数组（返回新数组）
     */
    static shuffle<T>(arr: T[]): T[] {
        const result = [...arr];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    /**
     * 防抖：delay 毫秒内只执行最后一次
     */
    static debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
        let timer: ReturnType<typeof setTimeout> | null = null;
        return (...args: Parameters<T>) => {
            if (timer !== null) clearTimeout(timer);
            timer = setTimeout(() => {
                fn(...args);
                timer = null;
            }, delay);
        };
    }

    /**
     * 节流：interval 毫秒内最多执行一次
     */
    static throttle<T extends (...args: unknown[]) => void>(fn: T, interval: number): (...args: Parameters<T>) => void {
        let lastTime = 0;
        return (...args: Parameters<T>) => {
            const now = Date.now();
            if (now - lastTime >= interval) {
                lastTime = now;
                fn(...args);
            }
        };
    }

    /**
     * 生成 UUID v4
     */
    static getUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    /**
     * 浅合并对象（source 覆盖 target 中同名属性）
     */
    static mergeObjects<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
        return Object.assign({}, target, source);
    }

    /**
     * 等待指定毫秒（Promise 版 setTimeout）
     */
    static wait(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * 安全解析 JSON，失败返回 null
     */
    static safeParseJSON<T>(str: string): T | null {
        try {
            return JSON.parse(str) as T;
        } catch {
            return null;
        }
    }
}
