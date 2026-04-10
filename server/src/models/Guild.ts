import mongoose, { Schema, Document } from 'mongoose';

export interface IGuildMember {
    playerId: string;
    nickname: string;
    level: number;
    contribution: number;
    joinedAt: Date;
}

export interface IGuild extends Document {
    guildId: string;
    name: string;
    level: number;
    notice: string;
    leaderId: string;
    maxMembers: number;
    members: IGuildMember[];
    createdAt: Date;
    updatedAt: Date;
}

const GuildMemberSchema = new Schema<IGuildMember>({
    playerId: { type: String, required: true },
    nickname: { type: String, required: true },
    level: { type: Number, default: 1 },
    contribution: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now },
}, { _id: false });

const GuildSchema = new Schema<IGuild>({
    guildId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, unique: true },
    level: { type: Number, default: 1 },
    notice: { type: String, default: '' },
    leaderId: { type: String, required: true },
    maxMembers: { type: Number, default: 30 },
    members: { type: [GuildMemberSchema], default: [] },
}, {
    timestamps: true,
});

export const Guild = mongoose.model<IGuild>('Guild', GuildSchema);
