// 文件路径：assets/scripts/tests/RunTests.ts
// 框架核心模块测试用例
// 运行方式：npm test 或 ts-node assets/scripts/tests/RunTests.ts

// ============================================================
// 注意：此文件用于验证框架逻辑正确性
// 在 Cocos 运行时外执行，部分依赖引擎的功能会被 mock
// ============================================================

/** 简易测试框架 */
let _passed = 0;
let _failed = 0;

function assert(condition: boolean, message: string): void {
    if (condition) {
        _passed++;
        console.log(`  ✓ ${message}`);
    } else {
        _failed++;
        console.error(`  ✗ ${message}`);
    }
}

function describe(name: string, fn: () => void): void {
    console.log(`\n▶ ${name}`);
    fn();
}

// ============================================================
// Mock: 模拟 performance.now（Node 环境）
// ============================================================
if (typeof performance === 'undefined') {
    (globalThis as Record<string, unknown>)['performance'] = {
        now: () => Date.now(),
    };
}

// ============================================================
// 1. EventManager 测试
// ============================================================

// 内联简化版 EventManager（避免 import db:// 路径在 Node 中不可用）
class TestEventManager {
    private _eventMap: Map<string, Array<{ cb: (...args: unknown[]) => void; target: unknown; once: boolean }>> = new Map();

    on(event: string, cb: (...args: unknown[]) => void, target?: unknown): void {
        let list = this._eventMap.get(event);
        if (!list) { list = []; this._eventMap.set(event, list); }
        list.push({ cb, target, once: false });
    }

    once(event: string, cb: (...args: unknown[]) => void, target?: unknown): void {
        let list = this._eventMap.get(event);
        if (!list) { list = []; this._eventMap.set(event, list); }
        list.push({ cb, target, once: true });
    }

    off(event: string, cb?: (...args: unknown[]) => void): void {
        if (!cb) { this._eventMap.delete(event); return; }
        const list = this._eventMap.get(event);
        if (list) {
            const filtered = list.filter((l) => l.cb !== cb);
            filtered.length === 0 ? this._eventMap.delete(event) : this._eventMap.set(event, filtered);
        }
    }

    offAll(target: unknown): void {
        for (const [event, list] of this._eventMap) {
            const filtered = list.filter((l) => l.target !== target);
            filtered.length === 0 ? this._eventMap.delete(event) : this._eventMap.set(event, filtered);
        }
    }

    emit(event: string, ...args: unknown[]): void {
        const list = this._eventMap.get(event);
        if (list) {
            const snapshot = [...list];
            const toRemove: typeof list = [];
            for (const item of snapshot) {
                item.cb(...args);
                if (item.once) toRemove.push(item);
            }
            if (toRemove.length > 0) {
                const remaining = list.filter((l) => !toRemove.includes(l));
                remaining.length === 0 ? this._eventMap.delete(event) : this._eventMap.set(event, remaining);
            }
        }
        // 命名空间通配符
        const ci = event.indexOf(':');
        if (ci > 0) {
            const wk = event.substring(0, ci) + ':*';
            const wList = this._eventMap.get(wk);
            if (wList) {
                for (const item of [...wList]) { item.cb(event, ...args); }
            }
        }
    }

    hasListener(event: string): boolean {
        return (this._eventMap.get(event)?.length ?? 0) > 0;
    }

    getEventCount(): number { return this._eventMap.size; }
}

describe('EventManager', () => {
    const em = new TestEventManager();
    let received: boolean = false;
    let receivedValue: unknown = null;

    // on / emit
    const cb = (val: unknown) => { received = true; receivedValue = val; };
    em.on('test:event', cb);
    em.emit('test:event', 42);
    assert((received as boolean) === true, 'on/emit: 事件被正确触发');
    assert(receivedValue === 42, 'on/emit: 参数正确传递');

    // off
    received = false;
    em.off('test:event', cb);
    em.emit('test:event', 99);
    assert(received === false, 'off: 移除后不再触发');

    // once
    let onceCount = 0;
    em.once('once:event', () => { onceCount++; });
    em.emit('once:event');
    em.emit('once:event');
    assert(onceCount === 1, 'once: 只触发一次');

    // offAll
    const target = {};
    let targetCalled: boolean = false;
    em.on('target:event', () => { targetCalled = true; }, target);
    em.offAll(target);
    em.emit('target:event');
    assert(targetCalled === false, 'offAll: 清理 target 后不再触发');

    // hasListener
    em.on('has:event', () => {});
    assert(em.hasListener('has:event') === true, 'hasListener: 有监听返回 true');
    assert(em.hasListener('no:event') === false, 'hasListener: 无监听返回 false');

    // 命名空间通配符
    let wildcardEvent = '';
    em.on('shop:*', (evt: unknown) => { wildcardEvent = evt as string; });
    em.emit('shop:order:taken');
    assert(wildcardEvent === 'shop:order:taken', '命名空间通配符: shop:* 匹配 shop:order:taken');
});

// ============================================================
// 2. Utils 工具函数测试
// ============================================================

describe('Utils', () => {
    // formatNumber
    const formatNumber = (num: number): string => {
        if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
        if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
        return String(num);
    };
    assert(formatNumber(999) === '999', 'formatNumber: 999 → "999"');
    assert(formatNumber(1000) === '1K', 'formatNumber: 1000 → "1K"');
    assert(formatNumber(1500) === '1.5K', 'formatNumber: 1500 → "1.5K"');
    assert(formatNumber(1000000) === '1M', 'formatNumber: 1000000 → "1M"');

    // formatTime
    const formatTime = (seconds: number): string => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const pad = (n: number) => String(n).padStart(2, '0');
        return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
    };
    assert(formatTime(65) === '01:05', 'formatTime: 65s → "01:05"');
    assert(formatTime(3665) === '01:01:05', 'formatTime: 3665s → "01:01:05"');

    // deepClone
    const obj = { a: 1, b: { c: 2 } };
    const cloned = JSON.parse(JSON.stringify(obj));
    cloned.b.c = 99;
    assert(obj.b.c === 2, 'deepClone: 修改克隆体不影响原对象');

    // getUUID
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
    assert(uuid.length === 36, 'getUUID: 长度为 36');
    assert(uuid[14] === '4', 'getUUID: 版本位为 4');
});

// ============================================================
// 3. TimerManager 测试（简化版）
// ============================================================

describe('TimerManager', () => {
    // 简化版 TimerManager
    class TestTimerManager {
        private _timers: Map<number, { cb: () => void; interval: number; elapsed: number; repeat: boolean }> = new Map();
        private _id = 0;

        setTimeout(cb: () => void, delay: number): number {
            const id = ++this._id;
            this._timers.set(id, { cb, interval: delay, elapsed: 0, repeat: false });
            return id;
        }

        setInterval(cb: () => void, interval: number): number {
            const id = ++this._id;
            this._timers.set(id, { cb, interval, elapsed: 0, repeat: true });
            return id;
        }

        clearTimer(id: number): void { this._timers.delete(id); }

        update(dt: number): void {
            const toRemove: number[] = [];
            for (const [id, t] of this._timers) {
                t.elapsed += dt;
                if (t.elapsed >= t.interval) {
                    t.cb();
                    if (t.repeat) { t.elapsed -= t.interval; } else { toRemove.push(id); }
                }
            }
            for (const id of toRemove) this._timers.delete(id);
        }

        get timerCount(): number { return this._timers.size; }
    }

    const tm = new TestTimerManager();
    let timeoutFired: boolean = false;
    let intervalCount = 0;

    tm.setTimeout(() => { timeoutFired = true; }, 1);
    tm.setInterval(() => { intervalCount++; }, 0.5);

    // 模拟 2 秒（40 帧 × 0.05s）
    for (let i = 0; i < 40; i++) tm.update(0.05);

    assert((timeoutFired as boolean) === true, 'setTimeout: 1 秒后触发');
    assert(intervalCount >= 3, `setInterval: 2 秒内触发 ≥3 次 (实际 ${intervalCount})`);

    // clearTimer
    const id = tm.setTimeout(() => {}, 10);
    tm.clearTimer(id);
    assert(tm.timerCount === 1, 'clearTimer: 清除后计数减少'); // 只剩 interval
});

// ============================================================
// 4. MessageQueue 测试
// ============================================================

describe('MessageQueue', () => {
    class TestMessageQueue {
        private _queue: Array<{ id: number; event: string; data: unknown; priority: number; expireAt: number }> = [];
        private _id = 0;

        enqueue(event: string, data: unknown, priority = 1, ttl = 0): number {
            const id = ++this._id;
            this._queue.push({ id, event, data, priority, createdAt: Date.now(), expireAt: ttl > 0 ? Date.now() + ttl : 0 } as never);
            this._queue.sort((a, b) => b.priority - a.priority);
            return id;
        }

        flush(): Array<{ event: string; data: unknown }> {
            const now = Date.now();
            const valid = this._queue.filter((m) => m.expireAt === 0 || m.expireAt > now);
            this._queue.length = 0;
            return valid.map((m) => ({ event: m.event, data: m.data }));
        }

        remove(id: number): boolean {
            const i = this._queue.findIndex((m) => m.id === id);
            if (i !== -1) { this._queue.splice(i, 1); return true; }
            return false;
        }

        get size(): number { return this._queue.length; }
        get isEmpty(): boolean { return this._queue.length === 0; }
    }

    const mq = new TestMessageQueue();

    // enqueue / flush
    mq.enqueue('order:take', { orderId: 1 }, 2);
    mq.enqueue('chat:send', { msg: 'hi' }, 1);
    assert(mq.size === 2, 'enqueue: 入队 2 条消息');

    const messages = mq.flush();
    assert(messages.length === 2, 'flush: 取出 2 条消息');
    assert(messages[0].event === 'order:take', 'flush: 高优先级在前');
    assert(mq.isEmpty === true, 'flush: 队列已清空');

    // remove
    const id = mq.enqueue('test', {});
    assert(mq.remove(id) === true, 'remove: 成功移除');
    assert(mq.isEmpty === true, 'remove: 队列为空');
});

// ============================================================
// 5. UIManager 栈管理测试（简化版）
// ============================================================

describe('UIManager Stack', () => {
    interface MockView { viewPath: string; visible: boolean; destroyed: boolean }

    const stack: MockView[] = [];

    function open(viewPath: string): MockView {
        const top = stack[stack.length - 1];
        if (top) top.visible = false;
        const view: MockView = { viewPath, visible: true, destroyed: false };
        stack.push(view);
        return view;
    }

    function close(): MockView | null {
        const view = stack.pop();
        if (!view) return null;
        view.visible = false;
        view.destroyed = true;
        const newTop = stack[stack.length - 1];
        if (newTop) newTop.visible = true;
        return view;
    }

    function getTopView(): MockView | null {
        return stack[stack.length - 1] ?? null;
    }

    // 打开 A → B → C
    const a = open('ViewA');
    const b = open('ViewB');
    const c = open('ViewC');

    assert(stack.length === 3, 'open: 栈深度为 3');
    assert(getTopView()?.viewPath === 'ViewC', 'open: 栈顶为 ViewC');
    assert(a.visible === false, 'open: ViewA 被隐藏');
    assert(b.visible === false, 'open: ViewB 被隐藏');
    assert(c.visible === true, 'open: ViewC 可见');

    // 关闭 C → 栈顶恢复为 B
    close();
    assert(stack.length === 2, 'close: 栈深度为 2');
    assert(getTopView()?.viewPath === 'ViewB', 'close: 栈顶恢复为 ViewB');
    assert(b.visible === true, 'close: ViewB 恢复可见');

    // 关闭 B → 栈顶恢复为 A
    close();
    assert(getTopView()?.viewPath === 'ViewA', 'close: 栈顶恢复为 ViewA');
    assert(a.visible === true, 'close: ViewA 恢复可见');
});

// ============================================================
// 测试结果汇总
// ============================================================

console.log('\n══════════════════════════════════════');
console.log(`  测试完成: ${_passed} 通过, ${_failed} 失败`);
console.log('══════════════════════════════════════\n');

if (_failed > 0) process.exit(1);
