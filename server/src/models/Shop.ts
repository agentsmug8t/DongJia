import mongoose, { Schema, Document } from 'mongoose';

export interface IWorker {
    workerId: string;
    name: string;
    level: number;
    skill: number;
    status: number; // 0=idle, 1=working, 2=resting
}

export interface IShop extends Document {
    shopId: string;
    ownerId: string;
    name: string;
    level: number;
    maxWorkers: number;
    maxOrders: number;
    workers: IWorker[];
    createdAt: Date;
    updatedAt: Date;
}

const WorkerSchema = new Schema<IWorker>({
    workerId: { type: String, required: true },
    name: { type: String, required: true },
    level: { type: Number, default: 1 },
    skill: { type: Number, default: 1 },
    status: { type: Number, default: 0 },
}, { _id: false });

const ShopSchema = new Schema<IShop>({
    shopId: { type: String, required: true, unique: true, index: true },
    ownerId: { type: String, required: true, index: true },
    name: { type: String, default: '路边小摊' },
    level: { type: Number, default: 1 },
    maxWorkers: { type: Number, default: 2 },
    maxOrders: { type: Number, default: 3 },
    workers: { type: [WorkerSchema], default: [] },
}, {
    timestamps: true,
});

export const Shop = mongoose.model<IShop>('Shop', ShopSchema);
