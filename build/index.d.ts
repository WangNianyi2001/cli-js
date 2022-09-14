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
    shortName?: string | string[];
}
export declare class Flag extends Option {
    constructor(init: FlagInit);
}
declare type CommandHandler = (this: Command) => void;
interface CommandInit extends Init {
    handler?: CommandHandler;
    options?: Iterable<OptionInit | Option>;
    flags?: Iterable<FlagInit | Flag>;
    commands?: Iterable<CommandInit | Command>;
}
export declare class Command extends Parsable {
    #private;
    options: Set<Option>;
    commands: Set<Command>;
    handler: CommandHandler | null;
    parsedSub: Command | null;
    arguments: string[];
    constructor(init: CommandInit);
    AddOptions(options: Iterable<OptionInit | Option>): void;
    AddFlags(flags: Iterable<FlagInit | Flag>): void;
    AddCommands(commands: Iterable<CommandInit | Command>): void;
    Validate(header: string): boolean;
    Find(header: string): Parsable | null;
    GetOption(header: string): string[];
    GetFlag(header: string): boolean;
    GetSingle(header: string): string;
    Parse(args: string[]): void;
    Execute(): void;
}
interface ExecContext {
    cwd?: string;
    execDir?: string;
    scriptPath?: string;
}
export default class CLI extends Command {
    execContext: ExecContext;
    Execute(): void;
}
export { CLI };
