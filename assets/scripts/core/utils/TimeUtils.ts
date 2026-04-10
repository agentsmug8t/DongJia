// 文件路径：assets/scripts/core/utils/TimeUtils.ts
// 依赖：无

/**
 * 时间工具函数
 */
export class TimeUtils {
    /** 当前时间戳（秒） */
    static now(): number {
        return Math.floor(Date.now() / 1000);
    }

    /** 当前时间戳（毫秒） */
    static nowMs(): number {
        return Date.now();
    }

    /**
     * 格式化时间戳为可读字符串
     * @param timestamp 秒级时间戳
     * @param format 'date' | 'datetime' | 'time'
     */
    static format(timestamp: number, format: 'date' | 'datetime' | 'time' = 'datetime'): string {
        const d = new Date(timestamp * 1000);
        const pad = (n: number) => String(n).padStart(2, '0');
        const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        if (format === 'date') return date;
        if (format === 'time') return time;
        return `${date} ${time}`;
    }

    /**
     * 剩余时间描述：距离 endTimestamp 还有多久
     * 返回如 "2天3小时" / "45分钟" / "30秒"
     */
    static remaining(endTimestamp: number): string {
        const diff = endTimestamp - TimeUtils.now();
        if (diff <= 0) return '已结束';
        if (diff >= 86400) return `${Math.floor(diff / 86400)}天${Math.floor((diff % 86400) / 3600)}小时`;
        if (diff >= 3600) return `${Math.floor(diff / 3600)}小时${Math.floor((diff % 3600) / 60)}分钟`;
        if (diff >= 60) return `${Math.floor(diff / 60)}分钟`;
        return `${diff}秒`;
    }

    /** 今天是否已过了某个时间点（用于每日重置判断） */
    static isPassedTodayTime(hour: number, minute = 0): boolean {
        const now = new Date();
        return now.getHours() > hour || (now.getHours() === hour && now.getMinutes() >= minute);
    }

    /** 获取今天零点的时间戳（秒） */
    static todayStart(): number {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return Math.floor(d.getTime() / 1000);
    }
}
