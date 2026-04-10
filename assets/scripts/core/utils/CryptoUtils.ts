// 文件路径：assets/scripts/core/utils/CryptoUtils.ts
// 依赖：无（使用 Web Crypto API / 简单 XOR，不引入第三方库）

/**
 * 加密工具
 * 注意：XOR 加密仅用于本地存储混淆，不适合安全敏感场景
 */
export class CryptoUtils {
    private static readonly DEFAULT_KEY = 'dongjia_2024';

    /**
     * 简单 XOR 加密/解密（对称）
     * 用于本地存储敏感字段混淆
     */
    static xorEncrypt(text: string, key = CryptoUtils.DEFAULT_KEY): string {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return btoa(result);
    }

    static xorDecrypt(encoded: string, key = CryptoUtils.DEFAULT_KEY): string {
        try {
            const text = atob(encoded);
            let result = '';
            for (let i = 0; i < text.length; i++) {
                result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            return result;
        } catch {
            return '';
        }
    }

    /**
     * Base64 编码/解码
     */
    static base64Encode(str: string): string {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1: string) =>
            String.fromCharCode(parseInt(p1, 16))
        ));
    }

    static base64Decode(str: string): string {
        try {
            return decodeURIComponent(
                atob(str).split('').map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')
            );
        } catch {
            return '';
        }
    }

    /**
     * 简单哈希（djb2，用于生成缓存 key）
     */
    static hash(str: string): number {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
        }
        return hash >>> 0; // 转为无符号整数
    }
}
