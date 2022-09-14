import * as path from 'path';
import { URL } from 'url';
class Parsable {
    parsed = false;
    names = new Set();
    constructor(init) {
        (typeof init.name === 'string'
            ? [init.name]
            : Array.from(init.name))
            .filter(name => /\S/.test(name))
            .forEach(name => this.names.add(name));
        if (this.names.size === 0)
            throw 'A parsable element must have a non-empty name';
    }
}
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
    Parse(args) {
        if (args.length < this.argumentCount)
            throw 'No enough arguments';
        this.parsed = true;
        this.arguments.push(...args.splice(0, this.argumentCount));
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
;
export class Command extends Parsable {
    options = new Set();
    commands = new Set();
    handler = null;
    parsedCommand = null;
    arguments = [];
    constructor(init) {
        super(init);
        this.handler = init.handler || null;
        this.AddOptions(init.options || []);
        this.AddFlags(init.flags || []);
        this.AddCommands(init.commands || []);
    }
    #Add(cons, set, sources) {
        for (const source of sources) {
            if (source instanceof cons)
                set.add(source);
            else
                set.add(new cons(source));
        }
    }
    AddOptions(options) {
        this.#Add(Option, this.options, options);
    }
    AddFlags(flags) {
        this.#Add(Flag, this.options, flags);
    }
    AddCommands(commands) {
        this.#Add(Command, this.commands, commands);
    }
    Validate(header) {
        return this.names.has(header);
    }
    Find(header) {
        return [this.commands, this.options]
            .map(set => Array.from(set))
            .flat()
            .find(child => child.Validate(header))
            || null;
    }
    GetOption(header) {
        for (const name of ['--' + header, '-' + header]) {
            const parsable = this.Find(name);
            if (parsable instanceof Option)
                return parsable.arguments.slice();
        }
        return [];
    }
    GetFlag(header) {
        const parsable = this.Find('-' + header);
        if (parsable instanceof Flag)
            return parsable.parsed;
        return false;
    }
    GetSingle(header) {
        const option = this.GetOption(header)[0];
        return option === undefined ? '' : option;
    }
    Parse(args) {
        while (args.length) {
            const header = args.shift();
            let target = this.Find(header);
            if (!target) {
                this.arguments.push(header);
                continue;
            }
            target.Parse(args);
            if (target instanceof Command)
                this.parsedCommand = target;
        }
        this.parsed = true;
    }
    async Execute(context) {
        if (!this.parsed)
            throw 'Cannot exec an unparsed command';
        if (this.parsedCommand)
            await this.parsedCommand.Execute(context);
        else if (this.handler)
            await this.handler();
        else
            throw 'Invalid arguments';
    }
}
export default class CLI extends Command {
    execContext;
    async Execute(context) {
        try {
            this.Parse(process.argv.slice(2));
            this.parsed = true;
            await super.Execute(context || {
                cwd: process.cwd(),
                execDir: process.argv[0],
                scriptPath: path.resolve(process.argv[1], path.basename(new URL(import.meta.url).pathname))
            });
        }
        catch (e) {
            console.error(e + '');
        }
    }
}
export { CLI };
