declare module 'electron' {
  interface NativeImage {
    isEmpty(): boolean;
    toPNG(): Buffer;
  }

  interface Clipboard {
    availableFormats(): string[];
    readBuffer(format: string): Buffer;
    readImage(): NativeImage;
  }

  export const clipboard: Clipboard;
  export const remote: { clipboard?: Clipboard } | undefined;
}
