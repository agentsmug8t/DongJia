// 文件路径：assets/scripts/core/utils/MathUtils.ts
// 依赖：无

/**
 * 数学工具函数
 */
export class MathUtils {
    /** 将 value 限制在 [min, max] 范围内 */
    static clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }

    /** 线性插值 */
    static lerp(a: number, b: number, t: number): number {
        return a + (b - a) * MathUtils.clamp(t, 0, 1);
    }

    /** 将 value 从 [inMin, inMax] 映射到 [outMin, outMax] */
    static remap(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
        const t = (value - inMin) / (inMax - inMin);
        return MathUtils.lerp(outMin, outMax, t);
    }

    /** 角度转弧度 */
    static toRad(deg: number): number {
        return (deg * Math.PI) / 180;
    }

    /** 弧度转角度 */
    static toDeg(rad: number): number {
        return (rad * 180) / Math.PI;
    }

    /** 两点距离 */
    static distance(x1: number, y1: number, x2: number, y2: number): number {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    /** 判断是否为 2 的幂 */
    static isPowerOfTwo(n: number): boolean {
        return n > 0 && (n & (n - 1)) === 0;
    }

    /** 向上取到最近的 2 的幂 */
    static nextPowerOfTwo(n: number): number {
        let p = 1;
        while (p < n) p <<= 1;
        return p;
    }

    /** 百分比（保留 decimals 位小数） */
    static percent(value: number, total: number, decimals = 1): number {
        if (total === 0) return 0;
        return parseFloat(((value / total) * 100).toFixed(decimals));
    }
}
