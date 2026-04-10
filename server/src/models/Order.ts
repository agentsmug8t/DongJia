import mongoose, { Schema, Document } from 'mongoose';

export interface IReward {
    copper?: number;
    silver?: number;
    prestige?: number;
    items?: Array<{ itemId: number; count: number }>;
    exp?: number;
}

export interface IOrder extends Document {
    orderId: number;
    shopId: string;
    playerId: string;
    configId: number;
    name: string;
    difficulty: number;
    reward: IReward;
    status: number; // 0=pending, 1=in_progress, 2=completed, 3=failed, 4=expired
    startAt: number;
    endAt: number;
    completedAt: number;
    createdAt: Date;
}

const OrderSchema = new Schema<IOrder>({
    orderId: { type: Number, required: true, unique: true, index: true },
    shopId: { type: String, required: true, index: true },
    playerId: { type: String, required: true, index: true },
    configId: { type: Number, required: true },
    name: { type: String, required: true },
    difficulty: { type: Number, default: 1 },
    reward: {
        copper: Number,
        silver: Number,
        prestige: Number,
        items: [{ itemId: Number, count: Number }],
        exp: Number,
    },
    status: { type: Number, default: 0 },
    startAt: { type: Number, default: 0 },
    endAt: { type: Number, default: 0 },
    completedAt: { type: Number, default: 0 },
}, {
    timestamps: true,
});

// 自增 orderId
OrderSchema.pre('save', async function (next) {
    if (this.isNew && !this.orderId) {
        const last = await Order.findOne().sort({ orderId: -1 }).lean();
        this.orderId = (last?.orderId ?? 0) + 1;
    }
    next();
});

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
