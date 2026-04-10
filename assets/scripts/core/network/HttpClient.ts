// 文件路径：assets/scripts/core/network/HttpClient.ts
// 依赖：core/utils/Logger.ts, core/constants/GameConstants.ts

import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { GameConstants } from 'db://assets/scripts/core/constants/GameConstants';

/** HTTP 请求方法 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/** HTTP 请求配置 */
export interface HttpRequestConfig {
    url: string;
    method?: HttpMethod;
    headers?: Record<string, string>;
    body?: unknown;
    timeout?: number;
}

/**
 * HTTP 请求封装
 * 基于 fetch API，提供统一的请求/响应处理
 *
 * @example
 * const res = await HttpClient.post<LoginResponse>('/api/login', { token: 'xxx' });
 */
export class HttpClient {
    private static _baseUrl: string = '';
    private static _defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    /** 设置基础 URL */
    static setBaseUrl(url: string): void {
        HttpClient._baseUrl = url.replace(/\/$/, '');
    }

    /** 设置默认请求头（如 Authorization） */
    static setHeader(key: string, value: string): void {
        HttpClient._defaultHeaders[key] = value;
    }

    /** 移除默认请求头 */
    static removeHeader(key: string): void {
        delete HttpClient._defaultHeaders[key];
    }

    static get<T>(url: string, headers?: Record<string, string>): Promise<T> {
        return HttpClient._request<T>({ url, method: 'GET', headers });
    }

    static post<T>(url: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
        return HttpClient._request<T>({ url, method: 'POST', body, headers });
    }

    static put<T>(url: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
        return HttpClient._request<T>({ url, method: 'PUT', body, headers });
    }

    static delete<T>(url: string, headers?: Record<string, string>): Promise<T> {
        return HttpClient._request<T>({ url, method: 'DELETE', headers });
    }

    private static async _request<T>(config: HttpRequestConfig): Promise<T> {
        const { method = 'GET', body, timeout = GameConstants.HTTP_TIMEOUT } = config;
        const url = config.url.startsWith('http') ? config.url : `${HttpClient._baseUrl}${config.url}`;
        const headers = { ...HttpClient._defaultHeaders, ...config.headers };

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);

        try {
            Logger.debug('HttpClient', `${method} ${url}`);

            const response = await fetch(url, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            });

            clearTimeout(timer);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const json = await response.json() as ServerResponse<T>;

            if (json.code !== 0) {
                throw new Error(`[${json.code}] ${json.message}`);
            }

            return json.data;
        } catch (err) {
            clearTimeout(timer);

            if (err instanceof DOMException && err.name === 'AbortError') {
                Logger.error('HttpClient', `请求超时: ${url}`);
                throw new Error(`Request timeout: ${url}`);
            }

            Logger.error('HttpClient', `请求失败: ${url}`, err);
            throw err;
        }
    }
}
