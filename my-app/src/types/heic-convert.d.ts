declare module 'heic-convert' {
  type Format = 'JPEG' | 'PNG';

  interface ConvertOptions {
    buffer: Uint8Array;
    format: Format;
    quality?: number;
  }

  function heicConvert(options: ConvertOptions): Promise<ArrayBuffer>;

  export default heicConvert;
}
