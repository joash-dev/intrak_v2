declare module 'pizzip' {
  export default class PizZip {
    constructor(data?: string | ArrayBuffer | Uint8Array, options?: any);
    load(data: string | ArrayBuffer | Uint8Array, options?: any): void;
    file(
      path: string,
      data?: string | ArrayBuffer | Uint8Array,
      options?: any
    ): void;
    generate(options: { type: string }): any;
  }
}

