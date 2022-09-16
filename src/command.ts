import { ParseContext, ExecutionContext, Init, Parsable } from './base.js';
import { FlagInit, Flag, OptionInit, Option } from './option.js';

type CommandHandler = (this: Command) => void | Promise<void>;
export interface CommandInit extends Init {
	handler?: CommandHandler;
	options?: Iterable<OptionInit | Option>;
	flags?: Iterable<FlagInit | Flag>;
	commands?: Iterable<CommandInit | Command>;
};

export class Command extends Parsable {
	options = new Set<Option>();
	commands = new Set<Command>();
	handler: CommandHandler | null = null;
	parsedCommand: Command | null = null;
	arguments: string[] = [];

	constructor(init: CommandInit) {
		super(init);
		this.handler = init.handler || null;
		this.AddOptions(init.options || []);
		this.AddFlags(init.flags || []);
		this.AddCommands(init.commands || []);
	}

	#Add<I extends Init, P extends Parsable>(
		Class: { new(init: I): P; }, set: Set<P>, sources: Iterable<I | P>
	) {
		for(const source of sources) {
			if(source instanceof Class)
				set.add(source);
			else
				set.add(new Class(source as I));
		}
	}
	AddOptions(options: Iterable<OptionInit | Option>) {
		this.#Add(Option, this.options, options);
	}
	AddFlags(flags: Iterable<FlagInit | Flag>) {
		this.#Add(Flag, this.options, flags);
	}
	AddCommands(commands: Iterable<CommandInit | Command>) {
		this.#Add(Command, this.commands, commands);
	}

	override Validate(index: string): boolean {
		return this.names.has(index);
	}

	Find(index: string): Parsable | null {
		return [this.commands, this.options]
			.map(set => Array.from(set as Set<Parsable>) as Parsable[])
			.flat()
			.find(child => child.Validate(index))
			|| null;
	}
	GetOption(index: string): string[] {
		const parsable = this.Find(index);
		if(parsable instanceof Option)
			return parsable.arguments.slice();
		return [];
	}
	GetFlag(index: string): boolean {
		const parsable = this.Find(index);
		if(parsable instanceof Flag)
			return parsable.parsed;
		return false;
	}
	GetSingle(index: string | number): string {
		if(typeof index === 'number')
			return (str => typeof str === 'string' ? str : '')(this.arguments[index]);
		const option = this.GetOption(index)[0];
		if(typeof option === 'string')
			return option;
		const flag = this.GetFlag(index);
		if(flag)
			return 'true';
		return '';
	}

	override Parse(args: string[], context: ParseContext): void {
		while(args.length) {
			const header = args.shift();
			let target = this.Find(header);
			if(!target) {
				this.arguments.push(header);
				continue;
			}
			target.Parse(args, { parsedAs: header });
			if(target instanceof Command)
				this.parsedCommand = target;
		}
		this.parsed = true;
	}

	async Execute(context: ExecutionContext) {
		if(!this.parsed)
			throw 'Cannot execute an unparsed command';
		if(this.parsedCommand)
			await this.parsedCommand.Execute(context);
		else if(this.handler)
			await this.handler();
		else
			throw 'Invalid arguments';
	}
}

import * as path from 'path';
import { URL } from 'url';

export default class CLI extends Command {
	override async Execute(context: ExecutionContext) {
		try {
			this.Parse(process.argv.slice(2), { parsedAs: process.argv[1] });
			this.parsed = true;
			await super.Execute(context || {
				cli: this,
				cwd: process.cwd(),
				execDir: process.argv[0],
				scriptPath: path.resolve(process.argv[1], path.basename(new URL(import.meta.url).pathname))
			});
		} catch(e: any) {
			console.error(e);
		}
	}
}

export { CLI };