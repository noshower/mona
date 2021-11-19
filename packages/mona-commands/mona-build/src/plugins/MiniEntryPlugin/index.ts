import { ConfigHelper } from '@/configHelper';
import { Compiler } from 'webpack';
import MiniEntryModule from './MiniEntryModule';

class MiniEntryPlugin {
  configHelper: ConfigHelper;
  entryModule: MiniEntryModule;
  pluginName = 'MiniEntryPlugin'

  constructor(configHelper: ConfigHelper) {
    this.configHelper = configHelper;
    this.entryModule = new MiniEntryModule(configHelper);
  }
  
  apply(compiler: Compiler) {
    const { module } = this.entryModule;
    // Applying a webpack compiler to the virtual module
    module.apply(compiler);
    // add entry file
    // compiler.hooks.environment.tap(this.pluginName, () => {
    //   compiler.options.entry = {
    //     ...entries
    //   }
    // })

    // @ts-ignore
    // new EntryPlugin(this.configHelper.cwd, entries['app'].filename).apply(compiler);

    // new EntryPlugin('')
  }
}

export default MiniEntryPlugin;