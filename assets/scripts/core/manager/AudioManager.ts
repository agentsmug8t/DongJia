// 文件路径：assets/scripts/core/manager/AudioManager.ts
// 依赖：core/utils/Singleton.ts, core/utils/Logger.ts, core/manager/LocalStorageManager.ts

import { AudioSource, AudioClip } from 'cc';
import { Singleton } from 'db://assets/scripts/core/utils/Singleton';
import { Logger } from 'db://assets/scripts/core/utils/Logger';
import { LocalStorageManager } from 'db://assets/scripts/core/manager/LocalStorageManager';

/**
 * 音频管理器
 * 管理 BGM 和 SFX 的播放、音量、静音
 *
 * @example
 * const am = AudioManager.getInstance();
 * am.playBGM(bgmClip);
 * am.playSFX(clickClip, 0.8);
 * am.setBGMVolume(0.5);
 * am.setMute(true);
 */
export class AudioManager extends Singleton<AudioManager>() {
    private _bgmSource: AudioSource | null = null;
    private _sfxSource: AudioSource | null = null;

    private _bgmVolume: number = 1;
    private _sfxVolume: number = 1;
    private _isMuted: boolean = false;

    private static readonly STORAGE_KEY_BGM = 'audio_bgm_volume';
    private static readonly STORAGE_KEY_SFX = 'audio_sfx_volume';
    private static readonly STORAGE_KEY_MUTE = 'audio_mute';

    protected init(): void {
        // 从本地存储恢复音量设置
        const ls = LocalStorageManager.getInstance();
        this._bgmVolume = ls.get<number>(AudioManager.STORAGE_KEY_BGM, 1) ?? 1;
        this._sfxVolume = ls.get<number>(AudioManager.STORAGE_KEY_SFX, 1) ?? 1;
        this._isMuted = ls.get<boolean>(AudioManager.STORAGE_KEY_MUTE, false) ?? false;

        Logger.info('AudioManager', `初始化完成 BGM:${this._bgmVolume} SFX:${this._sfxVolume} Mute:${this._isMuted}`);
    }

    /**
     * 注入 Cocos AudioSource 组件（由启动流程调用）
     */
    setup(bgmSource: AudioSource, sfxSource: AudioSource): void {
        this._bgmSource = bgmSource;
        this._sfxSource = sfxSource;
        this._applyVolume();
    }

    /**
     * 播放背景音乐
     */
    playBGM(clip: AudioClip, loop = true): void {
        if (!this._bgmSource) return;
        this._bgmSource.clip = clip;
        this._bgmSource.loop = loop;
        this._bgmSource.play();
    }

    /**
     * 停止背景音乐
     */
    stopBGM(): void {
        this._bgmSource?.stop();
    }

    /**
     * 暂停/恢复背景音乐
     */
    pauseBGM(): void {
        this._bgmSource?.pause();
    }

    resumeBGM(): void {
        if (this._bgmSource && this._bgmSource.clip) {
            this._bgmSource.play();
        }
    }

    /**
     * 播放音效
     */
    playSFX(clip: AudioClip, volume?: number): void {
        if (!this._sfxSource || this._isMuted) return;
        const vol = (volume ?? 1) * this._sfxVolume;
        this._sfxSource.playOneShot(clip, vol);
    }

    /**
     * 设置 BGM 音量（0~1）
     */
    setBGMVolume(volume: number): void {
        this._bgmVolume = Math.max(0, Math.min(1, volume));
        this._applyVolume();
        LocalStorageManager.getInstance().set(AudioManager.STORAGE_KEY_BGM, this._bgmVolume);
    }

    /**
     * 设置 SFX 音量（0~1）
     */
    setSFXVolume(volume: number): void {
        this._sfxVolume = Math.max(0, Math.min(1, volume));
        this._applyVolume();
        LocalStorageManager.getInstance().set(AudioManager.STORAGE_KEY_SFX, this._sfxVolume);
    }

    /**
     * 静音开关
     */
    setMute(muted: boolean): void {
        this._isMuted = muted;
        this._applyVolume();
        LocalStorageManager.getInstance().set(AudioManager.STORAGE_KEY_MUTE, this._isMuted);
    }

    get bgmVolume(): number { return this._bgmVolume; }
    get sfxVolume(): number { return this._sfxVolume; }
    get isMuted(): boolean { return this._isMuted; }

    // ─── 淡入淡出 ─────────────────────────────────────────────────

    private _fadeTimer: ReturnType<typeof setInterval> | null = null;

    /**
     * BGM 淡入
     * @param clip - 音频资源
     * @param duration - 淡入时长（毫秒）
     * @param loop - 是否循环
     */
    fadeInBGM(clip: AudioClip, duration = 1000, loop = true): void {
        this._clearFade();
        if (!this._bgmSource) return;

        this._bgmSource.clip = clip;
        this._bgmSource.loop = loop;
        this._bgmSource.volume = 0;
        this._bgmSource.play();

        const targetVolume = this._isMuted ? 0 : this._bgmVolume;
        const step = targetVolume / (duration / 50);
        let current = 0;

        this._fadeTimer = setInterval(() => {
            current += step;
            if (current >= targetVolume) {
                current = targetVolume;
                this._clearFade();
            }
            if (this._bgmSource) this._bgmSource.volume = current;
        }, 50);
    }

    /**
     * BGM 淡出
     * @param duration - 淡出时长（毫秒）
     * @param stopAfter - 淡出后是否停止播放
     */
    fadeOutBGM(duration = 1000, stopAfter = true): void {
        this._clearFade();
        if (!this._bgmSource) return;

        const startVolume = this._bgmSource.volume;
        const step = startVolume / (duration / 50);

        this._fadeTimer = setInterval(() => {
            if (!this._bgmSource) {
                this._clearFade();
                return;
            }
            const newVol = this._bgmSource.volume - step;
            if (newVol <= 0) {
                this._bgmSource.volume = 0;
                if (stopAfter) this._bgmSource.stop();
                this._clearFade();
            } else {
                this._bgmSource.volume = newVol;
            }
        }, 50);
    }

    /**
     * 交叉淡入淡出（切换 BGM）
     * @param newClip - 新的音频资源
     * @param duration - 过渡时长（毫秒）
     */
    crossFadeBGM(newClip: AudioClip, duration = 1000): void {
        this.fadeOutBGM(duration / 2, true);
        setTimeout(() => {
            this.fadeInBGM(newClip, duration / 2);
        }, duration / 2);
    }

    private _clearFade(): void {
        if (this._fadeTimer !== null) {
            clearInterval(this._fadeTimer);
            this._fadeTimer = null;
        }
    }

    private _applyVolume(): void {
        if (this._bgmSource) {
            this._bgmSource.volume = this._isMuted ? 0 : this._bgmVolume;
        }
        if (this._sfxSource) {
            this._sfxSource.volume = this._isMuted ? 0 : this._sfxVolume;
        }
    }

    protected onDestroy(): void {
        this._clearFade();
        this.stopBGM();
    }
}
