import * as path from 'path';
import { URL } from 'url';

interface Init {
	name: string | Iterable<string>;
}

abstract class Parsable {
	parsed = false;
	names = new Set<string>();

	constructor(init: Init) {
		(typeof init.name === 'string'
			? [init.name]
			: Array.from(init.name)
		)
			.filter(name => /\S/.test(name))
			.forEach(name => this.names.add(name));
		if(this.names.size === 0)
			throw 'A parsable element must have a non-empty name';
	}

	abstract Validate(header: string): boolean;
	abstract Parse(args: string[]): void;
}

interface OptionInit extends FlagInit {
	argumentCount: number;
}

export class Option extends Parsable {
	shortNames = new Set<string>();
	argumentCount: number;
	arguments: string[];

	constructor(init: OptionInit) {
		super(init);
		this.argumentCount = init.argumentCount;
		if(init.shortName) {
			(typeof init.shortName === 'string'
				? [init.shortName]
				: Array.from(init.shortName))
				.filter(name => /\S/.test(name))
				.forEach(name => this.shortNames.add(name));
		}
	}

	override Parse(args: string[]): void {
		if(args.length < this.argumentCount)
			throw 'No enough arguments';
		this.parsed = true;
		this.arguments = args.splice(0, this.argumentCount);
	}

	override Validate(header: string): boolean {
		if(/^\-\-/.test(header))
			return this.names.has(header.slice(2));
		if(/^\-/.test(header))
			return header.slice(1).split('').some(ch => this.shortNames.has(ch));
		return false;
	}
}

interface FlagInit extends Init {
	shortName: string | string[];
}

export class Flag extends Option {
	constructor(init: FlagInit) {
		const _init = init as OptionInit;
		_init.argumentCount = 0;
		super(_init);
	}
}

type CommandHandler = (this: Command) => void;
interface CommandInit extends Init {
	handler?: CommandHandler;
	options?: Iterable<OptionInit | Option>;
	flags?: Iterable<FlagInit | Flag>;
	commands?: Iterable<CommandInit | Command>;
};

export class Command extends Parsable {
	options = new Set<Option>();
	commands = new Set<Command>();
	handler: CommandHandler | null = null;
	parsedSub: Command | null = null;
	arguments: string[] = [];

	constructor(init: CommandInit) {
		super(init);
		if(init.handler)
			this.handler = init.handler;
		if(init.options)
			this.AddOptions(init.options);
		if(init.flags)
			this.AddFlags(init.flags);
		if(init.commands)
			this.AddCommands(init.commands);
	}

	#Add<I extends Init, P extends Parsable>(
		cons: { new(init: I): P }, set: Set<P>, sources: Iterable<I | P>
	) {
		for(const source of sources) {
			if(source instanceof cons)
				set.add(source);
			else
				set.add(new cons(source as I));
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

	override Validate(header: string): boolean {
		return this.names.has(header);
	}

	Find(header: string): Parsable | null {
		return [this.commands, this.options]
			.map(set => Array.from(set as Set<Parsable>) as Parsable[])
			.flat()
			.find(child => child.Validate(header))
			|| null;
	}

	override Parse(args: string[]): void {
		while(args.length) {
			const header = args.shift();
			let target = this.Find(header);
			if(!target) {
				this.arguments.push(header);
				continue;
			}
			target.Parse(args);
			if(target instanceof Command)
				this.parsedSub = target;
		}
		this.parsed = true;
	}

	Execute(): void {
		if(!this.parsed)
			throw 'Cannot exec an unparsed command';
		if(this.parsedSub)
			this.parsedSub.Execute();
		else if(this.handler)
			this.handler();
	}
}

interface ExecContext {
	cwd?: string;
	execDir?: string;
	scriptPath?: string;
};

export default class CLI extends Command {
	execContext: ExecContext;

	override Execute() {
		this.execContext = {
			cwd: process.cwd(),
			execDir: process.argv[0],
			scriptPath: path.resolve(process.argv[1], path.basename(new URL(import.meta.url).pathname))
		};
		try {
			this.Parse(process.argv.slice(2));
			this.parsed = true;
			super.Execute();
		} catch(e: any) {
			console.error(e + '');
		}
	}
}

export { CLI };