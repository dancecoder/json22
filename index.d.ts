export declare class JSON22 {
    static readonly mimeType: string;
    static parse<T>(text: string, options?: Json22ParseOptions): T;
    static stringify(value: any, options?: Json22StringifyOptions): string;
}

export interface Json22ParseOptions {
    context?: Record<string, { new (...args: any) }>; // default { 'Date': Date }
    // To be extended
}

export interface Json22StringifyOptions {
    // To be extended
}
