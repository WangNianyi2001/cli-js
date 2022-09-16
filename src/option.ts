import { Init, Parsable, ParseContext, ExecutionContext } from './base.js';

export interface OptionInit extends FlagInit {
	argumentCount: number;
}

export class Option extends Parsable {
	shortNames = new Set<string>();
	argumentCount: number;
	arguments: string[] = [];

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

	override Parse(args: string[], context: ParseContext): void {
		if(args.length < this.argumentCount) {
			throw `Unexpected end of argument list when parsing option ${context.parsedAs}`;
		}
		this.parsed = true;
		this.arguments.push(...args.splice(0, this.argumentCount));
	}

	override Validate(index: string): boolean {
		if(/^\-\-/.test(index))
			return this.names.has(index.slice(2));
		if(/^\-/.test(index))
			return index.slice(1).split('').some(ch => this.shortNames.has(ch));
		return false;
	}
}

export interface FlagInit extends Init {
	shortName?: string | string[];
}

export class Flag extends Option {
	constructor(init: FlagInit) {
		const _init = init as OptionInit;
		_init.argumentCount = 0;
		super(_init);
	}
}