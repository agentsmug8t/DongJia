// 文件路径：assets/scripts/modules/shop/view/WorkerItemView.ts
// 依赖：core/base/BaseComponent.ts

import { BaseComponent } from 'db://assets/scripts/core/base/BaseComponent';
import { Logger } from 'db://assets/scripts/core/utils/Logger';

/**
 * 伙夫列表子项组件
 * 挂载在伙夫列表的每个 item 节点上，展示单个伙夫信息
 *
 * TODO: FairyGUI 集成后绑定实际 UI 组件
 */
export class WorkerItemView extends BaseComponent {
    private _workerData: WorkerInfo | null = null;

    // TODO: FairyGUI 组件引用
    // private _nameLabel: GLabel;
    // private _levelLabel: GLabel;
    // private _skillLabel: GLabel;
    // private _statusIcon: GLoader;
    // private _avatar: GLoader;

    /** 点击回调 */
    onClickCallback: ((workerId: string) => void) | null = null;

    /**
     * 设置伙夫数据并刷新显示
     */
    setData(worker: WorkerInfo): void {
        this._workerData = worker;
        this._refresh();
    }

    get workerId(): string {
        return this._workerData?.workerId ?? '';
    }

    private _refresh(): void {
        if (!this._workerData) return;

        const worker = this._workerData;
        Logger.debug('WorkerItemView', `刷新伙夫: ${worker.name} Lv.${worker.level}`);

        // TODO: 更新 FairyGUI 组件
        // this._nameLabel.text = worker.name;
        // this._levelLabel.text = `Lv.${worker.level}`;
        // this._skillLabel.text = `技能: ${worker.skill}`;
        // this._statusIcon.url = this._getStatusIcon(worker.status);
    }

    /**
     * 更新伙夫状态（服务器推送时调用）
     */
    updateStatus(status: WorkerStatus): void {
        if (!this._workerData) return;
        this._workerData = { ...this._workerData, status };
        this._refresh();
    }

    onItemClick(): void {
        if (this._workerData && this.onClickCallback) {
            this.onClickCallback(this._workerData.workerId);
        }
    }

    resetItem(): void {
        this._workerData = null;
        this.onClickCallback = null;
    }

    private _getStatusIcon(_status: WorkerStatus): string {
        // TODO: 返回对应状态图标路径
        return '';
    }
}
