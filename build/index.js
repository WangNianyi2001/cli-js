import * as path from 'path';
import { URL } from 'url';
;
var execContext = {
    cwd: process.cwd(),
    execDir: process.argv[0],
    scriptPath: path.resolve(process.argv[1], path.basename(new URL(import.meta.url).pathname))
};
