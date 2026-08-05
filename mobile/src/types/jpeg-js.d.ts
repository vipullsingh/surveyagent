declare module 'jpeg-js/lib/decoder' {
  interface RawImageData {
    width: number;
    height: number;
    data: Uint8Array;
  }
  function decode(
    jpegData: Uint8Array | ArrayLike<number>,
    options?: { useTArray?: boolean; colorTransform?: boolean; formatAsRGBA?: boolean; tolerantDecoding?: boolean }
  ): RawImageData;
  export = decode;
}
