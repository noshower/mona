import path from 'path';
import fse from 'fs-extra';
import ConfigHelper from '../../ConfigHelper';
import { NPM_DIR } from '../constants';
import monaStore from '../store';
import { NODE_MODULES } from '@/target/constants';
import { miniExt } from '@/target/mini/constants';

const defaultEntryConfig: Record<string, any> = {};

let id = 1;
// 将路径和jsx收集的prop一一对应
export const genNativeComponentId = (resourcePath: string) => {
  const entry = monaStore.nativeEntryMap.get(resourcePath);
  if (entry?.id) {
    return entry?.id;
  }
  return `native${id++}`;
};

export const genNativeComponentEntry = (
  configHelper: ConfigHelper,
  entryPath: string,
  nativeEntry?: TtComponentEntry,
) => {
  entryPath = entryPath.replace(path.extname(entryPath), '');
  if (monaStore.nativeEntryMap.has(entryPath)) {
    return monaStore.nativeEntryMap.get(entryPath)! as TtComponentEntry;
  } else {
    const nEntry = nativeEntry || new TtComponentEntry(configHelper, entryPath);
    monaStore.nativeEntryMap.set(entryPath, nEntry);
    return nEntry;
  }
};

export class TtEntry {
  basename: string = '';
  dirPath: string = '';
  _dependencies: string[] = [];
  readonly id: string;
  configHelper: ConfigHelper;
  _entry: string = '';
  /**
   *
   * @param configHelper 配置文件
   * @param entryPath xxxx/index 入口文件。/a/b/index.js的entryPath为/a/b/index
   */
  constructor(configHelper: ConfigHelper, entryPath: string) {
    this.entry = entryPath;
    this.configHelper = configHelper;
    this.id = genNativeComponentId(entryPath);
  }

  set entry(e: string) {
    this._entry = e;
    this.basename = path.basename(e);
    this.dirPath = path.dirname(e);
    this._dependencies = Object.values(miniExt).map(ext => `${e}${ext}`);
  }

  get entry() {
    return this._entry;
  }

  get path() {
    return {
      main: `${this.entry}${miniExt.main}`,
      stylePath: `${this.entry}${miniExt.style}`,
      templatePath: `${this.entry}${miniExt.templ}`,
      configPath: `${this.entry}${miniExt.config}`,
    };
  }

  get context() {
    let context = this.dirPath;
    if (this.dirPath.includes(NODE_MODULES)) {
      context = context.slice(0, context.indexOf(NODE_MODULES) + NODE_MODULES.length + 1);
    }

    return context;
  }

  get outputDir() {
    const dirPath = path.join(this.configHelper.cwd, './src');
    let outputPath = path.relative(dirPath, this.dirPath);

    if (this.dirPath.includes(NODE_MODULES)) {
      outputPath = this.dirPath.slice(this.dirPath.indexOf(NODE_MODULES) + NODE_MODULES.length);
      outputPath = path.join(NPM_DIR, outputPath);
    } else if (!this.dirPath.startsWith(dirPath)) {
      const dirname = path.basename(this.dirPath);
      const componentPath = path.join(this.configHelper.cwd, `./src/components/tt/${dirname}_${this.id}`);
      outputPath = path.relative(dirPath, componentPath);
    }
    return outputPath;
  }

  get outputPath() {
    const outputDir = this.outputDir;
    return {
      main: path.join(outputDir, `./${this.basename}`),
      mainPath: path.join(outputDir, `./${this.basename}${miniExt.main}`),
      stylePath: path.join(outputDir, `./${this.basename}${miniExt.style}`),
      templatePath: path.join(outputDir, `./${this.basename}${miniExt.templ}`),
      configPath: path.join(outputDir, `./${this.basename}${miniExt.config}`),
    };
  }

  readConfig() {
    const ext = path.extname(this.entry);

    const filename = ext ? this.entry.replace(ext, miniExt.config) : this.path.configPath;

    try {
      return JSON.parse(fse.readFileSync(filename).toString());
    } catch (error) {}
    return defaultEntryConfig;
  }
}

interface ComponentImportInfo {
  // 包名称，例如: @bytedance/mona-runtime
  // 引入名称例如 import CustomComponent from 'xxx'。 在JSX中这样使用<CustomComponent /> ，则jsx中使用的名称 CustomComponent为componentName
  componentName: string;

  // jsx中使用的prop, native组件的jsx上不能 写spread attribute {...props} 的形式
  props: Set<string>;

  defaultProps: Record<string, any>;
  isRenderAllProps: boolean;
  // 是否使用该组件
  isUse: boolean;
}
// 小程序语法自定义组件入口
export class TtComponentEntry extends TtEntry {
  // 用于生成模板
  templateInfo: ComponentImportInfo;

  constructor(configHelper: ConfigHelper, entryPath: string) {
    super(configHelper, entryPath);
    this.templateInfo = {
      props: new Set([]),
      defaultProps: {},
      isUse: false,
      isRenderAllProps: false,
      componentName: '',
    };
  }

  // 依赖包括
  readUsingComponents(handledPath: Set<string> = new Set([this.entry])) {
    if (!fse.existsSync(`${this.entry}.js`)) {
      return new Set([]);
    }
    const config = this.readConfig();
    const usingComponent = config.usingComponents || {};
    const res = new Set(this._dependencies);
    Object.keys(usingComponent).forEach(name => {
      const cPath = usingComponent[name] as string;
      let vPath;
      // usingComponent中填写绝对路径会根据资源目录读
      if (path.isAbsolute(cPath)) {
        const appEntryDir = path.join(this.configHelper.cwd, './src');
        vPath = path.join(appEntryDir, cPath);
      } else if (cPath.startsWith('../') || cPath.startsWith('./')) {
        vPath = path.join(this.dirPath, usingComponent[name]);
      } else {
        // npm包忽略
        return;
      }

      if (handledPath.has(vPath)) {
        return;
      }
      handledPath.add(vPath);

      const nEntry = genNativeComponentEntry(this.configHelper, vPath);
      nEntry?.readUsingComponents(handledPath)?.forEach(d => {
        res.add(d);
      });
    });
    return res;
  }

  static isNative(jsPath: string) {
    if (!jsPath) {
      return false;
    }
    const ext = path.extname(jsPath);
    let jsonPath = '';
    if (ext === '.js') {
      jsonPath = jsPath.replace(/\.js$/, '.json');
    } else if (!ext) {
      jsonPath = `${jsPath}.json`;
    } else {
      return false;
    }
    return fse.existsSync(jsonPath) ? Boolean(require(jsonPath)?.component) : false;
  }

  get virtualSource() {
    return `
    import { createMiniComponent } from '@bytedance/mona-runtime';
    export default createMiniComponent('${this.id}')
  `;
  }

  genOutputConfig() {
    const outputJson = this.readConfig();
    const usingComponents = outputJson.usingComponents || {};
    const outputPath = this.outputDir;
    Object.keys(usingComponents).forEach(name => {
      const cPath = usingComponents[name];
      if (!cPath.startsWith('ext://') && !path.isAbsolute(cPath)) {
        const vPath = path.join(this.dirPath, cPath);
        const nEntry = genNativeComponentEntry(this.configHelper, vPath);
        if (nEntry) {
          usingComponents[name] = path.relative(outputPath, nEntry.outputPath.main);
        }
      }
    });
    outputJson.usingComponents = usingComponents;
    return outputJson;
  }
}
