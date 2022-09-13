interface Init {
    name: string | Iterable<string>;
}
declare abstract class Parsable {
    parsed: boolean;
    names: Set<string>;
    constructor(init: Init);
    abstract Validate(header: string): boolean;
    abstract Parse(args: string[]): void;
}
interface OptionInit extends FlagInit {
    argumentCount: number;
}
export declare class Option extends Parsable {
    shortNames: Set<string>;
    argumentCount: number;
    arguments: string[];
    constructor(init: OptionInit);
    Parse(args: string[]): void;
    Validate(header: string): boolean;
}
interface FlagInit extends Init {
}
export declare class Flag extends Option {
    constructor(init: FlagInit);
}
declare type CommandHandler = (this: Command) => void;
interface CommandInit extends Init {
    handler?: CommandHandler;
    options?: Iterable<OptionInit>;
    flags?: Iterable<FlagInit>;
    subcommands?: Iterable<CommandInit>;
}
export declare class Command extends Parsable {
    options: Set<Option>;
    subcommands: Set<Command>;
    handler: CommandHandler | null;
    parsedSub: Command | null;
    constructor(init: CommandInit);
    Validate(header: string): boolean;
    Parse(args: string[]): void;
    Execute(): void;
}
interface ExecContext {
    cwd?: string;
    execDir?: string;
    scriptPath?: string;
}
export declare class CLI extends Command {
    execContext: ExecContext;
    Execute(): void;
}
export {};
