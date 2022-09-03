import ConfigHelper from '@/ConfigHelper';
import { merge } from 'lodash';

import Config from 'webpack-chain';
import { TARGET } from './constants';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import { appSrcPath, appTsConfigPath } from './utils';

const extensions = ['.js', '.mjs', '.jsx', '.ts', '.tsx', '.json'];

export function chainResolve(webpackConfig: Config, configHelper: ConfigHelper) {
  const resolve = webpackConfig.resolve;
  resolve.extensions.merge(extensions);
  // 解决 @import "~styles" 找不到模块问题
  resolve.modules.merge([appSrcPath, 'node_modules']);
  resolve.alias.merge(merge(genAlias(), configHelper.projectConfig.abilities?.alias));

  resolve.plugin('tsconfigPathsPlugin').use(TsconfigPathsPlugin, [{ configFile: appTsConfigPath }]);
}

export function genAlias() {
  return {
    '@bytedance/mona-runtime': `@bytedance/mona-runtime/dist/index.${TARGET}.js`,
  };
}
