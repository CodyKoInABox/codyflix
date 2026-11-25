export {};

declare global {
  interface Window {
    YT?: {
      Player: new (element: HTMLElement, options: YTPlayerOptions) => YTPlayer;
      PlayerState?: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }

  interface YTPlayer {
    destroy: () => void;
    getCurrentTime: () => number;
    getDuration: () => number;
    getIframe: () => HTMLIFrameElement;
    seekTo: (seconds: number, allowSeekAhead: boolean) => void;
    mute: () => void;
    unMute: () => void;
    isMuted: () => boolean;
  }

  interface YTPlayerOptions {
    videoId: string;
    host?: string;
    width?: string | number;
    height?: string | number;
    playerVars?: Record<string, string | number>;
    events?: {
      onReady?: (event: { target: YTPlayer }) => void;
      onStateChange?: (event: { data: number; target: YTPlayer }) => void;
      onError?: (event: { data: number }) => void;
    };
  }
}
