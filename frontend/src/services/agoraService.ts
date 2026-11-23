import { Platform } from 'react-native';
import { AGORA_APP_ID } from '../config/agora';
import { api } from './api';

let AgoraRTC: any = null;

if (Platform.OS === 'web') {
  try {
    const pkg = require('agora-rtc-sdk-ng');
    AgoraRTC = pkg.default || pkg;
    AgoraRTC?.setLogLevel?.(2);

    if (AgoraRTC) {
      AgoraRTC.onAudioAutoplayFailed = () => {
        console.warn('[AgoraService] Audio autoplay blocked by browser policy! Unlocking on user interaction...');
        if (typeof window !== 'undefined') {
          const unlockAudio = () => {
            AgoraRTC?.resumeAudio?.();
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
          };
          window.addEventListener('click', unlockAudio, { once: true });
          window.addEventListener('touchstart', unlockAudio, { once: true });
        }
      };
    }
  } catch (err) {
    console.warn('[AgoraService] Could not import agora-rtc-sdk-ng:', err);
  }
}

export class AgoraService {
  private client: any = null;
  private localAudioTrack: any = null;
  private localVideoTrack: any = null;
  private remoteAudioTrack: any = null;
  private remoteVideoTrack: any = null;
  private isJoined: boolean = false;

  private sanitizeChannel(channel: string): string {
    const clean = (channel || 'cockatiel_call').replace(/[^a-zA-Z0-9_\-]/g, '_');
    return clean.slice(0, 64);
  }

  checkMediaSupport(): { supported: boolean; reason?: string } {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!window.isSecureContext && !isLocal) {
        return {
          supported: false,
          reason: 'Browser blocks camera & microphone on HTTP IP addresses. Please test on http://localhost:8081 or enable HTTPS.',
        };
      }
      if (!navigator?.mediaDevices?.getUserMedia) {
        return {
          supported: false,
          reason: 'Camera & microphone permissions not available in this browser context.',
        };
      }
    }
    return { supported: true };
  }

  private playVideoInContainer(track: any, containerId: string) {
    if (typeof document === 'undefined' || !track) return;
    const el = document.getElementById(containerId);
    if (el) {
      track.play(el);
    } else {
      setTimeout(() => {
        const retryEl = document.getElementById(containerId);
        if (retryEl) track.play(retryEl);
      }, 250);
      setTimeout(() => {
        const retryEl = document.getElementById(containerId);
        if (retryEl) track.play(retryEl);
      }, 750);
    }
  }

  async initAudioCall(
    channelName: string,
    onRemoteUserJoined?: () => void,
    onError?: (msg: string) => void
  ): Promise<boolean> {
    if (!AgoraRTC) {
      console.log('[AgoraService] AgoraRTC not available');
      return false;
    }

    const support = this.checkMediaSupport();
    if (!support.supported) {
      console.warn('[AgoraService]', support.reason);
      onError?.(support.reason!);
    }

    try {
      if (this.isJoined) {
        await this.leave();
      }

      this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      const channel = this.sanitizeChannel(channelName);
      const numericUid = Math.floor(Math.random() * 900000) + 100000;

      this.client.on('user-published', async (user: any, mediaType: string) => {
        try {
          await this.client.subscribe(user, mediaType);
          if (mediaType === 'audio') {
            this.remoteAudioTrack = user.audioTrack;
            user.audioTrack?.play();
            onRemoteUserJoined?.();
          }
        } catch (subErr) {
          console.warn('[AgoraService] Audio subscribe error:', subErr);
        }
      });

      this.client.on('user-unpublished', (user: any, mediaType: string) => {
        if (mediaType === 'audio') {
          user.audioTrack?.stop();
        }
      });

      // Obtain RTC token from backend
      let token: string | null = null;
      try {
        const tokenRes = await api.calls.getAgoraToken(channel, numericUid);
        if (tokenRes?.success && tokenRes?.token) {
          token = tokenRes.token;
        }
      } catch (tokErr) {
        console.warn('[AgoraService] Token fetch failed:', tokErr);
      }

      await this.client.join(AGORA_APP_ID, channel, token, numericUid);
      this.isJoined = true;

      // Create and publish local mic track
      try {
        this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
          AEC: true,
          ANS: true,
          AGC: true,
        });
        await this.client.publish([this.localAudioTrack]);
        console.log('[AgoraService] Audio call joined and published on channel:', channel);
      } catch (trackErr: any) {
        console.error('[AgoraService] Failed to create mic track:', trackErr);
        onError?.(trackErr.message || 'Microphone access denied');
      }

      return true;
    } catch (err: any) {
      console.error('[AgoraService] initAudioCall error:', err);
      onError?.(err.message || 'Call connection failed');
      return false;
    }
  }

  async initVideoCall(
    channelName: string,
    localContainerId: string,
    remoteContainerId: string,
    onRemoteUserJoined?: () => void,
    onError?: (msg: string) => void
  ): Promise<boolean> {
    if (!AgoraRTC) {
      console.log('[AgoraService] AgoraRTC not available');
      return false;
    }

    const support = this.checkMediaSupport();
    if (!support.supported) {
      console.warn('[AgoraService]', support.reason);
      onError?.(support.reason!);
    }

    try {
      if (this.isJoined) {
        await this.leave();
      }

      this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      const channel = this.sanitizeChannel(channelName);
      const numericUid = Math.floor(Math.random() * 900000) + 100000;

      this.client.on('user-published', async (user: any, mediaType: string) => {
        try {
          await this.client.subscribe(user, mediaType);
          if (mediaType === 'audio') {
            this.remoteAudioTrack = user.audioTrack;
            user.audioTrack?.play();
          }
          if (mediaType === 'video') {
            this.remoteVideoTrack = user.videoTrack;
            this.playVideoInContainer(user.videoTrack, remoteContainerId);
            onRemoteUserJoined?.();
          }
        } catch (subErr) {
          console.warn('[AgoraService] Video subscribe error:', subErr);
        }
      });

      this.client.on('user-unpublished', (user: any, mediaType: string) => {
        if (mediaType === 'audio') user.audioTrack?.stop();
        if (mediaType === 'video') user.videoTrack?.stop();
      });

      // Obtain RTC token from backend
      let token: string | null = null;
      try {
        const tokenRes = await api.calls.getAgoraToken(channel, numericUid);
        if (tokenRes?.success && tokenRes?.token) {
          token = tokenRes.token;
        }
      } catch (tokErr) {
        console.warn('[AgoraService] Token fetch failed:', tokErr);
      }

      await this.client.join(AGORA_APP_ID, channel, token, numericUid);
      this.isJoined = true;

      try {
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
          { AEC: true, ANS: true, AGC: true },
          { encoderConfig: '720p_1' }
        );

        this.localAudioTrack = audioTrack;
        this.localVideoTrack = videoTrack;

        this.playVideoInContainer(this.localVideoTrack, localContainerId);

        await this.client.publish([this.localAudioTrack, this.localVideoTrack]);
        console.log('[AgoraService] Video call joined and published on channel:', channel);
      } catch (trackErr: any) {
        console.error('[AgoraService] Failed to create camera/mic tracks:', trackErr);
        onError?.(trackErr.message || 'Camera or Microphone access denied');
      }

      return true;
    } catch (err: any) {
      console.error('[AgoraService] initVideoCall error:', err);
      onError?.(err.message || 'Video call connection failed');
      return false;
    }
  }

  setMuted(muted: boolean) {
    if (this.localAudioTrack) {
      this.localAudioTrack.setEnabled(!muted);
    }
  }

  setVideoDisabled(disabled: boolean) {
    if (this.localVideoTrack) {
      this.localVideoTrack.setEnabled(!disabled);
    }
  }

  async leave() {
    try {
      if (this.localAudioTrack) {
        this.localAudioTrack.stop();
        this.localAudioTrack.close();
        this.localAudioTrack = null;
      }
      if (this.localVideoTrack) {
        this.localVideoTrack.stop();
        this.localVideoTrack.close();
        this.localVideoTrack = null;
      }
      if (this.client) {
        await this.client.leave();
        this.client = null;
      }
      this.isJoined = false;
      console.log('[AgoraService] Left call successfully');
    } catch (err) {
      console.error('[AgoraService] leave error:', err);
    }
  }
}

export const agoraService = new AgoraService();
