import { Platform } from 'react-native';
import { AGORA_APP_ID } from '../config/agora';
import { api } from './api';

let AgoraRTC: any = null;

if (Platform.OS === 'web') {
  try {
    const pkg = require('agora-rtc-sdk-ng');
    AgoraRTC = pkg.default || pkg;
    AgoraRTC?.setLogLevel?.(2);
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

  async initAudioCall(channelName: string, onRemoteUserJoined?: () => void): Promise<boolean> {
    if (!AgoraRTC) {
      console.log('[AgoraService] AgoraRTC not available (native or web not loaded)');
      return false;
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
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        AEC: true,
        ANS: true,
        AGC: true,
      });

      await this.client.publish([this.localAudioTrack]);
      console.log('[AgoraService] Audio call joined and published on channel:', channel, 'uid:', numericUid);
      return true;
    } catch (err) {
      console.error('[AgoraService] initAudioCall error:', err);
      return false;
    }
  }

  async initVideoCall(
    channelName: string,
    localContainerId: string,
    remoteContainerId: string,
    onRemoteUserJoined?: () => void
  ): Promise<boolean> {
    if (!AgoraRTC) {
      console.log('[AgoraService] AgoraRTC not available');
      return false;
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
            if (typeof document !== 'undefined') {
              const remoteEl = document.getElementById(remoteContainerId);
              if (remoteEl) {
                user.videoTrack?.play(remoteEl);
              }
            }
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

      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
        { AEC: true, ANS: true, AGC: true },
        { encoderConfig: '720p_1' }
      );

      this.localAudioTrack = audioTrack;
      this.localVideoTrack = videoTrack;

      if (typeof document !== 'undefined') {
        const localEl = document.getElementById(localContainerId);
        if (localEl) {
          this.localVideoTrack.play(localEl);
        }
      }

      await this.client.publish([this.localAudioTrack, this.localVideoTrack]);
      console.log('[AgoraService] Video call joined and published on channel:', channel, 'uid:', numericUid);
      return true;
    } catch (err) {
      console.error('[AgoraService] initVideoCall error:', err);
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
