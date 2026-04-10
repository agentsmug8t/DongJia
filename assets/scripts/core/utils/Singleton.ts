// 文件路径：assets/scripts/core/utils/Singleton.ts
// 依赖：无

/**
 * 泛型单例工厂函数
 * 使用方式：class MyManager extends Singleton<MyManager>() { ... }
 *
 * @example
 * class EventManager extends Singleton<EventManager>() {
 *   protected init(): void { ... }
 * }
 * const em = EventManager.getInstance();
 */
export function Singleton<T>() {
    abstract class SingletonBase {
        private static _instance: SingletonBase | null = null;
        private static _initializing: boolean = false;

        protected constructor() {}

        /**
         * 获取单例实例
         */
        static getInstance<S extends SingletonBase>(this: new () => S): S {
            const ctor = this as unknown as typeof SingletonBase;
            if (!ctor._instance) {
                if (ctor._initializing) {
                    throw new Error(`[Singleton] Circular initialization detected for ${ctor.name}`);
                }
                ctor._initializing = true;
                ctor._instance = new (this as unknown as new () => SingletonBase)();
                ctor._initializing = false;
                (ctor._instance as unknown as SingletonBase & { init?: () => void }).init?.();
            }
            return ctor._instance as S;
        }

        /**
         * 销毁单例实例，释放资源
         */
        static destroyInstance(): void {
            const ctor = this as unknown as typeof SingletonBase;
            if (ctor._instance) {
                (ctor._instance as unknown as SingletonBase & { onDestroy?: () => void }).onDestroy?.();
                ctor._instance = null;
            }
        }

        /**
         * 子类可重写，在实例创建后调用
         */
        protected init(): void {}

        /**
         * 子类可重写，在实例销毁前调用
         */
        protected onDestroy(): void {}
    }

    return SingletonBase as unknown as {
        new(): T;
        getInstance(): T;
        destroyInstance(): void;
    };
}

import { Component } from 'cc';

/**
 * Cocos Component 单例基类
 * 用于需要挂载在场景节点上的单例管理器（如 AudioManager 需要 AudioSource）
 *
 * @example
 * class AudioRoot extends SingletonComponent<AudioRoot>() {
 *   protected onSingletonInit(): void { ... }
 * }
 * // 在场景中挂载后，通过 AudioRoot.getInstance() 获取
 */
export function SingletonComponent<T>() {
    abstract class SingletonComponentBase extends Component {
        private static _instance: SingletonComponentBase | null = null;

        /**
         * 获取单例实例（必须先在场景中挂载）
         * @throws 如果组件未挂载到场景
         */
        static getInstance<S extends SingletonComponentBase>(this: new () => S): S {
            const ctor = this as unknown as typeof SingletonComponentBase;
            if (!ctor._instance) {
                throw new Error(`[SingletonComponent] ${ctor.name} 未挂载到场景，请先添加到节点`);
            }
            return ctor._instance as S;
        }

        /**
         * 检查实例是否存在
         */
        static hasInstance(): boolean {
            return (this as unknown as typeof SingletonComponentBase)._instance !== null;
        }

        /**
         * 销毁单例实例
         */
        static destroyInstance(): void {
            const ctor = this as unknown as typeof SingletonComponentBase;
            if (ctor._instance) {
                ctor._instance.onSingletonDestroy();
                ctor._instance = null;
            }
        }

        onLoad(): void {
            const ctor = this.constructor as unknown as typeof SingletonComponentBase;
            if (ctor._instance && ctor._instance !== this) {
                // 已存在实例，销毁重复的
                return;
            }
            ctor._instance = this;
            this.onSingletonInit();
        }

        onDestroy(): void {
            const ctor = this.constructor as unknown as typeof SingletonComponentBase;
            if (ctor._instance === this) {
                this.onSingletonDestroy();
                ctor._instance = null;
            }
        }

        /** 子类可重写：单例初始化 */
        protected onSingletonInit(): void {}

        /** 子类可重写：单例销毁 */
        protected onSingletonDestroy(): void {}
    }

    return SingletonComponentBase as unknown as {
        new(): T;
        getInstance(): T;
        hasInstance(): boolean;
        destroyInstance(): void;
    };
}
