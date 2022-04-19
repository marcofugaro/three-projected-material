import { TextureEncoding } from 'three/src/constants.js';
import type { Texture } from 'three';
export declare function monkeyPatch(shader: string, { defines, header, main, ...replaces }: {
    [x: string]: any;
    defines?: Record<string, string> | undefined;
    header?: string | undefined;
    main?: string | undefined;
}): string;
export declare function addLoadListener(texture: Texture, callback: (t: Texture) => void): void;
export declare function getEncodingComponents(encoding: TextureEncoding): string[];
export declare function getTexelDecodingFunction(functionName: string, encoding: TextureEncoding): string;
