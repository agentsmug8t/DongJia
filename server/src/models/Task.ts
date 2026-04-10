import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
    taskId: number;
    playerId: string;
    configId: number;
    name: string;
    desc: string;
    type: string; // 'daily' | 'weekly' | 'main' | 'achievement'
    status: number; // 0=locked, 1=in_progress, 2=claimable, 3=claimed
    progress: number;
    target: number;
    reward: {
        copper?: number;
        silver?: number;
        prestige?: number;
        items?: Array<{ itemId: number; count: number }>;
        exp?: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const TaskSchema = new Schema<ITask>({
    taskId: { type: Number, required: true, index: true },
    playerId: { type: String, required: true, index: true },
    configId: { type: Number, required: true },
    name: { type: String, required: true },
    desc: { type: String, default: '' },
    type: { type: String, required: true, enum: ['daily', 'weekly', 'main', 'achievement'] },
    status: { type: Number, default: 1 },
    progress: { type: Number, default: 0 },
    target: { type: Number, required: true },
    reward: {
        copper: Number,
        silver: Number,
        prestige: Number,
        items: [{ itemId: Number, count: Number }],
        exp: Number,
    },
}, {
    timestamps: true,
});

// 复合索引：玩家 + 任务类型
TaskSchema.index({ playerId: 1, type: 1 });

export const Task = mongoose.model<ITask>('Task', TaskSchema);
