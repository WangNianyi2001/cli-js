import type { CLI } from './command.js';
export interface ParseContext {
    parsedAs: string;
}
export interface ExecutionContext {
    cli: CLI;
    cwd?: string;
    execDir?: string;
    scriptPath?: string;
}
export interface Init {
    name?: string | Iterable<string>;
    description?: string;
}
export declare abstract class Parsable {
    parsed: boolean;
    names: Set<string>;
    constructor(init: Init);
    abstract Validate(index: string): boolean;
    abstract Parse(args: string[], context: ParseContext): void;
}
