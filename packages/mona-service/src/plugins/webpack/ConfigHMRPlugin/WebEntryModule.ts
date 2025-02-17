import path from 'path';
import VirtualModulesPlugin from '../VirtualModulesPlugin';
import { formatAppConfig, readConfig } from '@bytedance/mona-shared';
import { PageConfig } from '@bytedance/mona';
import ConfigHelper from '@/ConfigHelper';

class WebEntryModule {
  configHelper: ConfigHelper;
  name: string;
  module: VirtualModulesPlugin;

  constructor(configHelper: ConfigHelper) {
    this.configHelper = configHelper;
    this.name = 'entry.js';
    this.module = this.createModule();
  }

  // change extention filename
  static extendEntryName(filename: string) {
    const ext = path.extname(filename);
    const newExt = ext.endsWith('.ts') ? '.entry.ts' : '.entry.js';
    return filename.replace(ext, newExt);
  }

  createModule() {
    const { entryPath } = this.configHelper;

    const module: Record<string, string> = {};
    const virtualPath = path.join(entryPath, '..', 'app.entry.js');
    module[virtualPath] = this._generateWebAppEntryCode(entryPath);
    this.name = virtualPath;

    return new VirtualModulesPlugin(module);
  }

  updateModule() {
    // update config first
    this.configHelper.readAllConfig();

    // update module
    const code = this._generateWebAppEntryCode(this.configHelper.entryPath);
    const virtualPath = this.name;
    this.module.writeModule(virtualPath, code);
  }

  getPageTitle(page: string) {
    const pageConfigPath = path.join(this.configHelper.cwd, `./src/${page}`, '..', 'page.config');
    const pageConfig = readConfig<PageConfig>(pageConfigPath);
    return pageConfig.navigationBarTitleText || '';
  }

  private _generateRoutesCode() {
    const pages = Array.from(new Set((this.configHelper.appConfig.pages || []) as string[]));
    let routesCode = pages.map((page, index) => `import Page${index} from './${page}';`).join('');
    routesCode += `const routes = [${pages
      .map(
        (page, index) =>
          `{ path: '${page}', component: createPageLifecycle(Page${index}), title: '${this.getPageTitle(page)}' }`,
      )
      .join(',')}];`;
    return routesCode;
  }

  private _generateTabBarCode() {
    const formatedAppConfig = formatAppConfig(this.configHelper.appConfig);
    const tabBarCode = `const tabBar = ${JSON.stringify(formatedAppConfig.tabBar)}`;
    return tabBarCode;
  }

  private _generateNavBarCode() {
    const navBarCode = `const navBar = ${JSON.stringify(this.configHelper.appConfig.window)}`;
    return navBarCode;
  }

  private _generateDefaultPathCode() {
    const defaultPathCode = `const defaultPath = ${this.configHelper.appConfig.entryPagePath}`;
    return defaultPathCode;
  }

  private _generateWebAppEntryCode(filename: string) {
    const code = `
      import { createWebApp, show, createAppLifeCycle, createPageLifecycle } from '@bytedance/mona-runtime';
      import App from './${path.basename(filename)}';
      ${this._generateRoutesCode()}
      ${this._generateTabBarCode()}
      ${this._generateNavBarCode()}
      ${this._generateDefaultPathCode()}
      
      const { provider: p } =  createWebApp(createAppLifeCycle(App), routes, { tabBar, navBar, defaultPath });
      export const provider = p;
    `;

    return code;
  }
}

export default WebEntryModule;
