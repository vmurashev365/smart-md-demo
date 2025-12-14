/**
 * API Client - centralized client for HTTP requests
 * 
 * Encapsulates:
 * - Base URL
 * - Headers (including localization)
 * - Error handling
 * - Typed responses
 * - Human-like behavior (optional)
 */

import { APIRequestContext, request } from '@playwright/test';
import {
    beforeAction,
    throttleRequest,
    addJitter,
    getRealisticHeaders,
    getRandomUserAgent,
    configureHumanBehavior,
    getHumanBehaviorConfig,
    type ActionType,
    type HumanBehaviorConfig
} from '../utils/human-like';

export interface ApiClientConfig {
    baseURL: string;
    language?: 'ru' | 'ro';
    extraHeaders?: Record<string, string>;
    /** Enable human-like behavior (delays, realistic headers) */
    humanLike?: boolean;
    /** Human-like behavior speed multiplier */
    humanSpeed?: number;
}

export interface ApiResponse<T = unknown> {
    status: number;
    statusText: string;
    data: T;
    headers: Record<string, string>;
}

/**
 * Typed API client for Smart.md
 */
export class ApiClient {
    private context: APIRequestContext | null = null;
    private config: ApiClientConfig;
    private userAgent: string;

    constructor(config: Partial<ApiClientConfig> = {}) {
        this.config = {
            baseURL: config.baseURL || 'https://www.smart.md',
            language: config.language || 'ru',
            extraHeaders: config.extraHeaders || {},
            humanLike: config.humanLike ?? (process.env.HUMAN_BEHAVIOR !== 'false'),
            humanSpeed: config.humanSpeed ?? parseFloat(process.env.HUMAN_SPEED || '1.0')
        };
        
        // Set consistent User-Agent for session
        this.userAgent = getRandomUserAgent();
        
        // Configure human-like behavior
        if (this.config.humanLike) {
            configureHumanBehavior({
                enabled: true,
                speedMultiplier: this.config.humanSpeed || 1.0
            });
        }
    }

    /**
     * Initialize Playwright API context
     */
    async init(): Promise<void> {
        const headers = this.config.humanLike 
            ? {
                ...getRealisticHeaders(this.config.language),
                'User-Agent': this.userAgent,
                ...this.config.extraHeaders
              }
            : {
                'Accept': 'application/json',
                'Accept-Language': this.config.language === 'ro' ? 'ro-RO,ro' : 'ru-RU,ru',
                ...this.config.extraHeaders
              };

        this.context = await request.newContext({
            baseURL: this.config.baseURL,
            extraHTTPHeaders: headers
        });
    }

    /**
     * Закрытие контекста
     */
    async dispose(): Promise<void> {
        if (this.context) {
            await this.context.dispose();
            this.context = null;
        }
    }

    /**
     * GET запрос
     */
    async get<T = unknown>(
        endpoint: string, 
        options: { params?: Record<string, string>; actionType?: ActionType } = {}
    ): Promise<ApiResponse<T>> {
        this.ensureInitialized();
        
        // Human-like behavior
        if (this.config.humanLike) {
            await throttleRequest();
            await addJitter();
            if (options.actionType) {
                await beforeAction(options.actionType);
            }
        }
        
        let url = endpoint;
        if (options.params) {
            const searchParams = new URLSearchParams(options.params);
            url = `${endpoint}?${searchParams.toString()}`;
        }

        const response = await this.context!.get(url);
        return this.parseResponse<T>(response);
    }

    /**
     * POST запрос
     */
    async post<T = unknown>(
        endpoint: string,
        data?: unknown,
        options: { actionType?: ActionType } = {}
    ): Promise<ApiResponse<T>> {
        this.ensureInitialized();
        
        // Human-like behavior
        if (this.config.humanLike) {
            await throttleRequest();
            await addJitter();
            if (options.actionType) {
                await beforeAction(options.actionType);
            }
        }
        
        const response = await this.context!.post(endpoint, {
            data: data
        });
        return this.parseResponse<T>(response);
    }

    /**
     * PUT запрос
     */
    async put<T = unknown>(
        endpoint: string,
        data?: unknown,
        options: { actionType?: ActionType } = {}
    ): Promise<ApiResponse<T>> {
        this.ensureInitialized();
        
        // Human-like behavior
        if (this.config.humanLike) {
            await throttleRequest();
            await addJitter();
            if (options.actionType) {
                await beforeAction(options.actionType);
            }
        }
        
        const response = await this.context!.put(endpoint, {
            data: data
        });
        return this.parseResponse<T>(response);
    }

    /**
     * DELETE запрос
     */
    async delete<T = unknown>(
        endpoint: string,
        options: { actionType?: ActionType } = {}
    ): Promise<ApiResponse<T>> {
        this.ensureInitialized();
        
        // Human-like behavior
        if (this.config.humanLike) {
            await throttleRequest();
            await addJitter();
            if (options.actionType) {
                await beforeAction(options.actionType);
            }
        }
        
        const response = await this.context!.delete(endpoint);
        return this.parseResponse<T>(response);
    }

    /**
     * Изменить язык для последующих запросов
     */
    async setLanguage(language: 'ru' | 'ro'): Promise<void> {
        this.config.language = language;
        // Re-initialize context with new language
        await this.dispose();
        await this.init();
    }

    /**
     * Получить текущий язык
     */
    getLanguage(): 'ru' | 'ro' {
        return this.config.language || 'ru';
    }

    /**
     * Enable/disable human-like behavior
     */
    setHumanLike(enabled: boolean, speed?: number): void {
        this.config.humanLike = enabled;
        if (speed !== undefined) {
            this.config.humanSpeed = speed;
        }
        configureHumanBehavior({
            enabled,
            speedMultiplier: this.config.humanSpeed || 1.0
        });
    }

    /**
     * Check if human-like behavior is enabled
     */
    isHumanLikeEnabled(): boolean {
        return this.config.humanLike ?? false;
    }

    /**
     * Get human-like behavior configuration
     */
    getHumanLikeConfig(): HumanBehaviorConfig {
        return getHumanBehaviorConfig();
    }

    /**
     * Парсинг ответа
     */
    private async parseResponse<T>(response: Awaited<ReturnType<APIRequestContext['get']>>): Promise<ApiResponse<T>> {
        let data: T;
        
        try {
            data = await response.json() as T;
        } catch {
            // If not JSON, return text as unknown
            data = await response.text() as unknown as T;
        }

        const headers: Record<string, string> = {};
        for (const [key, value] of Object.entries(response.headers())) {
            headers[key] = value;
        }

        return {
            status: response.status(),
            statusText: response.statusText(),
            data,
            headers
        };
    }

    private ensureInitialized(): void {
        if (!this.context) {
            throw new Error('ApiClient not initialized. Call init() first.');
        }
    }
}

/**
 * Фабрика для создания клиента
 */
export async function createApiClient(config?: Partial<ApiClientConfig>): Promise<ApiClient> {
    const client = new ApiClient(config);
    await client.init();
    return client;
}
