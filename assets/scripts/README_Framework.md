# 东家 - 前端框架使用指南

## 快速上手

### 1. 项目结构
```
assets/scripts/
├── core/           # 框架核心（不要修改，除非扩展框架）
│   ├── base/       # 基类：BaseView, BaseModel, BaseController, BaseComponent, BaseManager
│   ├── manager/    # 管理器：EventManager, UIManager, NetworkManager 等
│   ├── network/    # 网络层：SocketClient, HttpClient, Protocol, MessageQueue
│   ├── ui/         # 通用 UI：Toast, Dialog, Loading, PopupManager
│   ├── utils/      # 工具类：Singleton, Logger, Utils 等
│   ├── constants/  # 常量：EventTypes, UIConstants, GameConstants, ErrorCodes
│   └── types/      # 类型声明：global.d.ts
├── modules/        # 业务模块（按功能划分）
│   ├── shop/       # 商铺模块（示例）
│   ├── guild/      # 联盟模块
│   ├── player/     # 玩家模块
│   ├── task/       # 任务模块
│   └── activity/   # 活动模块
├── startup/        # 启动流程：Main, Bootstrap, Preload
└── libs/           # 第三方库
```

### 2. 启动流程
游戏启动由 `Main.ts` → `Bootstrap.ts` 驱动，按以下顺序执行：
1. 初始化日志系统
2. 初始化各管理器（单例，按依赖顺序）
3. 加载配置表
4. 初始化 UI 系统
5. 连接服务器
6. 用户登录
7. 加载玩家数据
8. 进入主界面

每个步骤支持最多 3 次重试。

---

## 如何添加一个新模块

以"任务模块"为例：

### Step 1: 创建目录结构
```
assets/scripts/modules/task/
├── view/
│   └── TaskMainView.ts
├── model/
│   └── TaskModel.ts
├── controller/
│   └── TaskController.ts
└── service/
    └── TaskService.ts
```

### Step 2: 定义 Model
```typescript
import { BaseModel } from '../../../core/base/BaseModel';

export class TaskModel extends BaseModel {
    private _tasks: TaskInfo[] = [];
    get tasks(): ReadonlyArray<TaskInfo> { return this._tasks; }

    refreshTasks(tasks: TaskInfo[]): void {
        this._tasks = tasks;
        this.notify('task:list:updated');
    }
}
```

### Step 3: 定义 Service（网络请求）
```typescript
import { NetworkManager } from '../../../core/manager/NetworkManager';

export class TaskService {
    private _network = NetworkManager.getInstance();

    async getTaskList(): Promise<TaskInfo[]> {
        return this._network.request('task:list', {});
    }

    async claimReward(taskId: number): Promise<RewardInfo> {
        return this._network.request('task:claim', { taskId });
    }
}
```

### Step 4: 定义 Controller
```typescript
import { BaseController } from '../../../core/base/BaseController';
import { TaskModel } from '../model/TaskModel';
import { TaskService } from '../service/TaskService';

export class TaskController extends BaseController {
    private _model = new TaskModel();
    private _service = new TaskService();

    protected onInit(): void {
        this.loadTasks();
    }

    async loadTasks(): Promise<void> {
        const tasks = await this._service.getTaskList();
        this._model.refreshTasks(tasks);
    }
}
```

### Step 5: 定义 View
```typescript
import { BaseView } from '../../../core/base/BaseView';
import { TaskController } from '../controller/TaskController';

export class TaskMainView extends BaseView {
    private _controller = new TaskController();

    protected onCreate(): void {
        this._controller.init();
        this.listenEvent('task:list:updated', this._refresh.bind(this));
    }

    protected onDestroy(): void {
        this._controller.destroy();
    }

    private _refresh(): void { /* 更新 UI */ }
}
```

### Step 6: 注册事件类型
在 `core/constants/EventTypes.ts` 中添加：
```typescript
export enum TaskEvent {
    LIST_UPDATED = 'task:list:updated',
    COMPLETED = 'task:completed',
    REWARD_CLAIMED = 'task:reward:claimed',
}
```

---

## 如何添加一个新的网络协议

### 1. 在 Protocol.ts 中定义类型
```typescript
// 请求
export interface MyNewRequest { id: number; }
// 响应
export interface MyNewResponse { success: boolean; data: SomeData; }
// 事件名
export const SocketEvent = {
    // ...已有事件
    MY_NEW_EVENT: 'my:new:event',
};
```

### 2. 在 Service 中调用
```typescript
async myNewAction(id: number): Promise<MyNewResponse> {
    return this._network.request<MyNewResponse>(SocketEvent.MY_NEW_EVENT, { id });
}
```

### 3. 监听服务器推送
```typescript
this._network.on(SocketEvent.MY_NEW_EVENT, (data: unknown) => {
    const push = data as MyNewPush;
    // 处理推送
});
```

---

## 如何添加一个新的 UI 界面

### 1. 在 UIConstants.ts 注册路径
```typescript
export const ViewPath = {
    // ...已有路径
    MY_NEW_VIEW: 'ui/mymodule/MyNewView',
};
```

### 2. 创建 View 类
```typescript
export class MyNewView extends BaseView {
    constructor() { super(ViewPath.MY_NEW_VIEW); }
    protected onCreate(params?: unknown): void { /* 初始化 */ }
    protected onShow(): void { /* 每次显示 */ }
    protected onHide(): void { /* 每次隐藏 */ }
    protected onDestroy(): void { /* 销毁清理 */ }
}
```

### 3. 打开界面
```typescript
await UIManager.getInstance().open(ViewPath.MY_NEW_VIEW, { someParam: 123 });
```

### 4. 关闭界面
```typescript
// 从外部关闭
UIManager.getInstance().close(ViewPath.MY_NEW_VIEW);
// 从内部关闭
this.close();
```

---

## 常见问题

### Q: 如何在模块间通信？
使用 EventManager 事件总线：
```typescript
// 发送
EventManager.getInstance().emit(PlayerEvent.COPPER_CHANGED, newAmount);
// 接收（在 BaseView/BaseComponent 中）
this.listenEvent(PlayerEvent.COPPER_CHANGED, (amount: unknown) => { ... });
```

### Q: 如何避免内存泄漏？
- BaseView / BaseComponent 在销毁时自动清理事件监听
- 手动创建的监听需要在 onDestroy 中调用 `EventManager.getInstance().offAll(this)`
- 使用对象池管理频繁创建的节点

### Q: 何时使用对象池？
- 列表项（订单、伙夫、聊天消息等）
- 特效节点
- 频繁出现/消失的 UI 元素

### Q: 何时使用分帧加载？
- 大量列表项渲染时，每帧只创建 5-10 个
- 配置表数据量大时，分批解析

---

## 性能优化建议

### 何时使用对象池
- 列表项（订单、伙夫、聊天消息等）频繁创建/销毁时
- 特效节点（飘字、粒子等）
- 频繁出现/消失的 UI 元素（如弹幕）
- 使用方式：
```typescript
PoolManager.getInstance().registerPool('orderItem', orderPrefab, 10);
const node = PoolManager.getInstance().get('orderItem');
// 使用完毕后回收
PoolManager.getInstance().put('orderItem', node);
```

### 何时使用分帧加载
- 大量列表项渲染时（>20 个），每帧只创建 5-10 个
- 配置表数据量大时，分批解析
- 场景切换时的资源预加载
```typescript
// 分帧创建示例
async function createItemsInFrames(items: unknown[], parent: Node): Promise<void> {
    const BATCH_SIZE = 5;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        for (const item of batch) { /* 创建节点 */ }
        await new Promise((r) => requestAnimationFrame(r)); // 等待下一帧
    }
}
```

### 如何避免内存泄漏
1. **事件监听**：BaseView / BaseComponent 在销毁时自动清理。手动创建的监听需在 onDestroy 中调用 `EventManager.getInstance().offAll(this)`
2. **定时器**：使用 TimerManager 替代原生 setTimeout/setInterval，对象销毁时调用 `TimerManager.getInstance().clearAll(this)`
3. **资源引用**：离开模块时调用 `ResourceManager.releaseBundle()` 释放 Bundle
4. **对象池**：回收节点而非销毁，避免 GC 压力
5. **闭包陷阱**：避免在回调中捕获大对象引用

## 错误处理策略

### 全局错误捕获
```typescript
// Main.ts 中
async start(): Promise<void> {
    try {
        await this._bootstrap.start();
    } catch (err) {
        Logger.error('Main', '启动失败', err);
        // 显示错误界面，提供重试按钮
    }
}
```

### 网络错误重试策略
- **自动重连**：SocketClient 使用指数退避策略（1s → 2s → 4s → 8s → 16s），最多 5 次
- **离线缓存**：NetworkManager 在断线时将消息存入 MessageQueue，重连后自动重发
- **消息过期**：MessageQueue 支持 TTL，超时消息自动丢弃
- **请求超时**：SocketClient.request() 默认 10s 超时，返回 Promise.reject

### UI 错误降级处理
- **Toast/Dialog/Loading**：未注入渲染回调时打印日志而非崩溃
- **界面加载失败**：UIManager.open() 返回 Promise.reject，调用方可 catch 处理
- **配置缺失**：ConfigManager.get() 返回 null，调用方需判空
- **资源加载失败**：ResourceManager 打印错误日志并 reject，不影响其他资源

## 依赖说明

### npm 包
```bash
npm install socket.io-client    # Socket.IO 客户端（已安装）
```

### tsconfig.json 关键配置
- `strict: true` — 严格类型检查
- `experimentalDecorators: true` — 支持 Cocos 装饰器
- `paths: { "db://assets/*": ["./assets/*"] }` — Cocos 资源路径别名

### 运行测试
```bash
npm test    # 运行 36 个框架核心测试用例
```

## 测试验证

框架包含 5 组核心测试（`assets/scripts/tests/RunTests.ts`）：

| 模块 | 测试项 | 覆盖内容 |
|------|--------|----------|
| EventManager | 8 项 | on/emit/off/once/offAll/hasListener/命名空间通配符 |
| Utils | 7 项 | formatNumber/formatTime/deepClone/getUUID |
| TimerManager | 3 项 | setTimeout/setInterval/clearTimer |
| MessageQueue | 6 项 | enqueue/flush/优先级排序/remove |
| UIManager Stack | 10 项 | open/close/栈管理/层级恢复 |
