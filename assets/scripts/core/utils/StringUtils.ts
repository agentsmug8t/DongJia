// 文件路径：assets/scripts/core/utils/StringUtils.ts
// 依赖：无

/**
 * 字符串工具函数
 */
export class StringUtils {
    /** 首字母大写 */
    static capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /** camelCase → snake_case */
    static toSnakeCase(str: string): string {
        return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`).replace(/^_/, '');
    }

    /** snake_case → camelCase */
    static toCamelCase(str: string): string {
        return str.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    }

    /** 截断字符串，超出部分用 suffix 代替 */
    static truncate(str: string, maxLen: number, suffix = '...'): string {
        if (str.length <= maxLen) return str;
        return str.slice(0, maxLen - suffix.length) + suffix;
    }

    /** 模板字符串替换：replaceTemplate('你好 {name}', { name: '东家' }) → '你好 东家' */
    static replaceTemplate(template: string, vars: Record<string, string | number>): string {
        return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
    }

    /** 判断是否为空字符串（含纯空格） */
    static isEmpty(str: string | null | undefined): boolean {
        return !str || str.trim().length === 0;
    }

    /** 重复字符串 n 次 */
    static repeat(str: string, n: number): string {
        return Array(n + 1).join(str);
    }

    /** 数字补零：padZero(5, 3) → '005' */
    static padZero(num: number, length: number): string {
        return String(num).padStart(length, '0');
    }

    /** 过滤 HTML 标签（防 XSS 展示） */
    static stripHtml(html: string): string {
        return html.replace(/<[^>]*>/g, '');
    }
}
