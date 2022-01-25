import path from 'path';
import fs from 'fs';
import { AppConfig, ProjectConfig } from '@bytedance/mona';
import { readConfig, searchScriptFile } from '@bytedance/mona-shared';

const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  projectName: 'mona-app',
  input: './src/app',
  output: 'dist',
  compilerOptimization: true,
  dev: {
    port: 9999,
  },
};

const DEFAULT_APP_CONFIG: AppConfig = {
  pages: [],
};

class ConfigHelper {
  cwd: string;
  projectConfig!: ProjectConfig;
  appConfig!: AppConfig;
  entryPath!: string;

  constructor() {
    this.cwd = process.cwd();
    this.readAllConfig();
  }

  readAllConfig() {
    this.projectConfig = { ...DEFAULT_PROJECT_CONFIG, ...this._readConfig<ProjectConfig>('mona.config') };
    this.appConfig = { ...DEFAULT_APP_CONFIG, ...this._readConfig<AppConfig>('app.config') };
    this.entryPath = searchScriptFile(path.resolve(this.cwd, this.projectConfig.input));
  }

  private _readConfig<T>(configName: string): T {
    const projectConfigPath = path.join(this.cwd, configName);
    const fullConfigPath = searchScriptFile(projectConfigPath);
    if (fs.existsSync(fullConfigPath)) {
      const projectConfig = readConfig<T>(fullConfigPath);
      return projectConfig;
    } else {
      throw new Error('无效的项目目录，请在mona项目根目录执行命令');
    }
  }
}

export default ConfigHelper;
