import fs from 'fs';
import path from 'path';

const appDirectory = fs.realpathSync(process.cwd());

const resolveApp = (relativePath: string) => path.resolve(appDirectory, relativePath);

export const appSrcPath = resolveApp('src');

export const appTsConfigPath = resolveApp('tsconfig.json');
