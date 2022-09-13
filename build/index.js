import * as path from 'path';
import { URL } from 'url';
class Parsable {
    parsed = false;
    names = new Set();
    constructor(init) {
        const names = (typeof init.name === 'string'
            ? [init.name]
            : Array.from(init.name)).filter(name => /\S/.test(name));
        if (names.length === 0)
            throw 'A parsable element must have a non-empty name';
        this.names = new Set(names);
    }
}
export class Option extends Parsable {
    shortNames = new Set();
    argumentCount;
    arguments;
    constructor(init) {
        super(init);
        this.argumentCount = init.argumentCount;
    }
    Parse(args) {
        if (args.length < this.argumentCount)
            throw 'No enough arguments';
        this.parsed = true;
        this.arguments = args.splice(0, this.argumentCount);
    }
    Validate(header) {
        if (/^\-\-/.test(header))
            return this.names.has(header.slice(2));
        if (/^\-/.test(header))
            return header.slice(1).split('').some(ch => this.shortNames.has(ch));
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
;
export class Command extends Parsable {
    options = new Set();
    subcommands = new Set();
    handler = null;
    parsedSub = null;
    constructor(init) {
        super(init);
        if (init.handler)
            this.handler = init.handler;
        if (init.options)
            Array.from(init.options).forEach(option => this.options.add(new Option(option)));
        if (init.flags)
            Array.from(init.flags).forEach(flag => this.options.add(new Flag(flag)));
        if (init.subcommands)
            Array.from(init.subcommands).forEach(command => this.subcommands.add(new Command(command)));
    }
    Validate(header) {
        return this.names.has(header);
    }
    Parse(args) {
        while (args.length) {
            const header = args.shift();
            let target = [this.subcommands, this.options]
                .map(set => Array.from(set))
                .flat()
                .find(child => child.Validate(header));
            if (!target)
                throw `Unrecognized token "${header}"`;
            target.Parse(args);
            if (target instanceof Command)
                this.parsedSub = target;
        }
        this.parsed = true;
    }
    Execute() {
        if (!this.parsed)
            throw 'Cannot exec an unparsed command';
        if (this.parsedSub)
            this.parsedSub.Execute();
        else if (this.handler)
            this.handler();
    }
}
;
export class CLI extends Command {
    execContext;
    Execute() {
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
            handler() {
                const flag = this.options.values().next().value;
                if (flag.parsed)
                    console.log('mooooooow');
                else
                    console.log('hello, world');
            }
        }
    ]
});
cli.Execute();
