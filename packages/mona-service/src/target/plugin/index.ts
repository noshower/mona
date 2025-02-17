import path from 'path';

import { chainModuleRule } from './chainModuleRule';
import { Platform, genPluginHtml } from '../constants';
import { chainOptimization } from '../utils/chainOptimization';
import { chainPlugins } from '../utils/chainPlugins';
import { chainResolve } from '../utils/chainResolve';
import { IPlugin } from '../../Service';

const { PLUGIN } = Platform;

const plugin: IPlugin = ctx => {
  const configHelper = ctx.configHelper;

  ctx.registerTarget(PLUGIN, tctx => {
    tctx.chainWebpack(webpackConfig => {
      const { isDev } = configHelper;
      const { cwd, projectConfig } = configHelper;

      webpackConfig
        .devtool(isDev ? projectConfig.abilities?.sourceMap! : false)
        .optimization.runtimeChunk(Boolean(isDev))
        .end()
        .mode(isDev ? 'development' : 'production')
        .entry('app.entry')
        .add(path.join(configHelper.entryPath, '..', 'app.entry.js'));
      webpackConfig.output
        .pathinfo(false)
        .path(path.join(cwd, projectConfig.output))
        .filename(isDev ? '[name].js' : '[name].[contenthash:7].js')
        .publicPath('/')
        .libraryTarget('umd')
        .globalObject('window');
      webpackConfig.output.set('chunkLoadingGlobal', `webpackJsonp_${projectConfig.projectName}_${Date.now()}`);
      chainResolve(webpackConfig, configHelper, PLUGIN);
      chainModuleRule(webpackConfig, configHelper);
      chainPlugins(webpackConfig, configHelper, PLUGIN, genPluginHtml);
      chainOptimization(webpackConfig, configHelper);
    });
  });
};

module.exports = plugin;
