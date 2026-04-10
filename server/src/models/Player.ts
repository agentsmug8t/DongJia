import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayer extends Document {
    playerId: string;
    nickname: string;
    level: number;
    avatar: string;
    copper: number;
    silver: number;
    prestige: number;
    title: string;
    exp: number;
    items: Array<{ itemId: number; count: number; expireAt?: number }>;
    shopId: string;
    guildId: string;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date;
}

const PlayerSchema = new Schema<IPlayer>({
    playerId: { type: String, required: true, unique: true, index: true },
    nickname: { type: String, required: true, default: '新掌柜' },
    level: { type: Number, default: 1 },
    avatar: { type: String, default: '' },
    copper: { type: Number, default: 0 },
    silver: { type: Number, default: 0 },
    prestige: { type: Number, default: 0 },
    title: { type: String, default: 'novice' },
    exp: { type: Number, default: 0 },
    items: { type: [{ itemId: Number, count: Number, expireAt: Number }], default: [] },
    shopId: { type: String, default: '' },
    guildId: { type: String, default: '' },
    lastLoginAt: { type: Date, default: Date.now },
}, {
    timestamps: true,
});

export const Player = mongoose.model<IPlayer>('Player', PlayerSchema);
