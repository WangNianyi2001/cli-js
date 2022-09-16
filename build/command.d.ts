import { ParseContext, ExecutionContext, Init, Parsable } from './base.js';
import { FlagInit, Flag, OptionInit, Option } from './option.js';
declare type CommandHandler = (this: Command) => void | Promise<void>;
export interface CommandInit extends Init {
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
    parsedCommand: Command | null;
    arguments: string[];
    constructor(init: CommandInit);
    AddOptions(options: Iterable<OptionInit | Option>): void;
    AddFlags(flags: Iterable<FlagInit | Flag>): void;
    AddCommands(commands: Iterable<CommandInit | Command>): void;
    Validate(index: string): boolean;
    Find(index: string): Parsable | null;
    GetOption(index: string): string[];
    GetFlag(index: string): boolean;
    GetSingle(index: string | number): string;
    Parse(args: string[], context: ParseContext): void;
    Execute(context: ExecutionContext): Promise<void>;
}
export default class CLI extends Command {
    Execute(context: ExecutionContext): Promise<void>;
}
export { CLI };
