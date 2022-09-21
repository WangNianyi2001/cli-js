import { Parsable } from './base.js';
import { Flag, Option } from './option.js';
;
export class Command extends Parsable {
    options = new Set();
    commands = new Set();
    handler = null;
    parsedCommand = null;
    arguments = [];
    constructor(init) {
        super(init);
        this.Add(init);
    }
    Add(init) {
        this.handler = init.handler || null;
        this.AddOptions(init.options || []);
        this.AddFlags(init.flags || []);
        this.AddCommands(init.commands || []);
    }
    #Add(Class, set, sources) {
        for (const source of sources) {
            if (source instanceof Class)
                set.add(source);
            else
                set.add(new Class(source));
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
    Validate(index) {
        return this.names.has(index);
    }
    Find(index) {
        return [this.commands, this.options]
            .map(set => Array.from(set))
            .flat()
            .find(child => child.Validate(index))
            || null;
    }
    GetOption(index) {
        const parsable = this.Find(index);
        if (parsable instanceof Option)
            return parsable.arguments.slice();
        return [];
    }
    GetFlag(index) {
        const parsable = this.Find(index);
        if (parsable instanceof Flag)
            return parsable.parsed;
        return false;
    }
    GetSingle(index) {
        if (typeof index === 'number')
            return (str => typeof str === 'string' ? str : '')(this.arguments[index]);
        const option = this.GetOption(index)[0];
        if (typeof option === 'string')
            return option;
        const flag = this.GetFlag(index);
        if (flag)
            return 'true';
        return '';
    }
    Parse(args, context) {
        while (args.length) {
            const header = args.shift();
            let target = this.Find(header);
            if (!target) {
                this.arguments.push(header);
                continue;
            }
            target.Parse(args, { parsedAs: header });
            if (target instanceof Command)
                this.parsedCommand = target;
        }
        this.parsed = true;
    }
    async Execute(context) {
        if (!this.parsed)
            throw 'Cannot execute an unparsed command';
        if (this.parsedCommand)
            await this.parsedCommand.Execute(context);
        else if (this.handler)
            await this.handler();
        else
            throw 'Invalid arguments';
    }
}
import * as path from 'path';
import { URL } from 'url';
export default class CLI extends Command {
    async Execute(context) {
        this.Parse(process.argv.slice(2), { parsedAs: process.argv[1] });
        this.parsed = true;
        await super.Execute(context || {
            cli: this,
            cwd: process.cwd(),
            execDir: process.argv[0],
            scriptPath: path.resolve(process.argv[1], path.basename(new URL(import.meta.url).pathname))
        });
    }
}
export { CLI };
