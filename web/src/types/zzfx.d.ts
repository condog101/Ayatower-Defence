declare module 'zzfx' {
  export const ZZFX: {
    volume: number;
    sampleRate: number;
    audioContext: AudioContext;
    buildSamples(...params: (number | undefined)[]): number[];
  };
  export function zzfx(...params: (number | undefined)[]): AudioBufferSourceNode;
  export class ZZFXSound {
    constructor(params: (number | undefined)[]);
    play(volume?: number, pitch?: number, randomnessScale?: number, pan?: number, loop?: boolean): AudioBufferSourceNode;
    stop(): void;
  }
}
