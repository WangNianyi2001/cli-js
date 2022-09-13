import * as path from 'path';
import { URL } from 'url';

interface Init {
	name: string | Iterable<string>;
}

abstract class Parsable {
	parsed = false;
	names = new Set<string>();

	constructor(init: Init) {
		const names = (typeof init.name === 'string'
			? [init.name]
			: Array.from(init.name)
		).filter(name => /\S/.test(name));
		if(names.length === 0)
			throw 'A parsable element must have a non-empty name';
		this.names = new Set<string>(names);
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
	options?: Iterable<OptionInit>;
	flags?: Iterable<FlagInit>;
	subcommands?: Iterable<CommandInit>;
};

export class Command extends Parsable {
	options = new Set<Option>();
	subcommands = new Set<Command>();
	handler: CommandHandler | null = null;
	parsedSub: Command | null = null;

	constructor(init: CommandInit) {
		super(init);
		if(init.handler)
			this.handler = init.handler;
		if(init.options)
			Array.from(init.options).forEach(option => this.options.add(new Option(option)));
		if(init.flags)
			Array.from(init.flags).forEach(flag => this.options.add(new Flag(flag)));
		if(init.subcommands)
			Array.from(init.subcommands).forEach(command => this.subcommands.add(new Command(command)));
	}

	override Validate(header: string): boolean {
		return this.names.has(header);
	}

	override Parse(args: string[]): void {
		while(args.length) {
			const header = args.shift();
			let target = [this.subcommands, this.options]
				.map(set => Array.from(set as Set<Parsable>) as Parsable[])
				.flat()
				.find(child => child.Validate(header));
			if(!target)
				throw `Unrecognized token "${header}"`;
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

export class CLI extends Command {
	execContext: ExecContext;

	override Execute() {
		this.execContext = {
			cwd: process.cwd(),
			execDir: process.argv[0],
			scriptPath: path.resolve(process.argv[1], path.basename(new URL(import.meta.url).pathname))
		};
		this.Parse(process.argv.slice(2));
		this.parsed = true;
		super.Execute();
	}
}

const cli = new CLI({
	name: 'cli',
	subcommands: [
		{
			name: 'hello',
			flags: [{ name: 'cow' }],
			handler(this: Command) {
				const flag = this.options.values().next().value as Flag;
				if(flag.parsed) console.log('mooooooow');
				else console.log('hello, world');
			}
		}
	]
});
cli.Execute();
