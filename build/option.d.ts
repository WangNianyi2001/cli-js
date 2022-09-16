import { Init, Parsable, ParseContext } from './base.js';
export interface OptionInit extends FlagInit {
    argumentCount: number;
}
export declare class Option extends Parsable {
    shortNames: Set<string>;
    argumentCount: number;
    arguments: string[];
    constructor(init: OptionInit);
    Parse(args: string[], context: ParseContext): void;
    Validate(index: string): boolean;
}
export interface FlagInit extends Init {
    shortName?: string | string[];
}
export declare class Flag extends Option {
    constructor(init: FlagInit);
}
