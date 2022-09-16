import { Parsable } from './base.js';
export class Option extends Parsable {
    shortNames = new Set();
    argumentCount;
    arguments = [];
    constructor(init) {
        super(init);
        this.argumentCount = init.argumentCount;
        if (init.shortName) {
            (typeof init.shortName === 'string'
                ? [init.shortName]
                : Array.from(init.shortName))
                .filter(name => /\S/.test(name))
                .forEach(name => this.shortNames.add(name));
        }
    }
    Parse(args, context) {
        if (args.length < this.argumentCount) {
            throw `Unexpected end of argument list when parsing option ${context.parsedAs}`;
        }
        this.parsed = true;
        this.arguments.push(...args.splice(0, this.argumentCount));
    }
    Validate(index) {
        if (/^\-\-/.test(index))
            return this.names.has(index.slice(2));
        if (/^\-/.test(index))
            return index.slice(1).split('').some(ch => this.shortNames.has(ch));
        return false;
    }
}
export class Flag extends Option {
    constructor(init) {
        const _init = init;
        _init.argumentCount = 0;
        super(_init);
    }
}
