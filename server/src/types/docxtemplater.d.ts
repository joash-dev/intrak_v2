declare module 'docxtemplater' {
  import PizZip from 'pizzip';

  interface DocxtemplaterOptions {
    paragraphLoop?: boolean;
    linebreaks?: boolean;
    delimiters?: {
      start?: string;
      end?: string;
    };
  }

  export default class Docxtemplater {
    constructor(zip: PizZip, options?: DocxtemplaterOptions);
    setData(data: Record<string, unknown>): void;
    render(): void;
    getZip(): {
      generate: (options: { type: string }) => Buffer;
    };
  }
}

