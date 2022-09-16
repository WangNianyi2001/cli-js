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
	name: string | Iterable<string>;
	description?: string;
}

export abstract class Parsable {
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

	abstract Validate(index: string): boolean;
	abstract Parse(args: string[], context: ParseContext): void;
}