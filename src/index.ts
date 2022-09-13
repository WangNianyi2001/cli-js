import * as path from 'path';
import { URL } from 'url';

interface ExecContext {
	cwd?: string;
	execDir?: string;
	scriptPath?: string;
};

const execContext: ExecContext = {
	cwd: process.cwd(),
	execDir: process.argv[0],
	scriptPath: path.resolve(process.argv[1], path.basename(new URL(import.meta.url).pathname))
};

interface Executable {
	Execute(args: string[], context: ExecContext): void;
}
