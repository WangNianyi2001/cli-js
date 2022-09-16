export class Parsable {
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
