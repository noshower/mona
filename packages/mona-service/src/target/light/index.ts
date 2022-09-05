import path from 'path';

import { IPlugin } from '../../Service';
import { chainModuleRule } from '../plugin/chainModuleRule';
import { chainOptimization } from '../plugin/chainOptimization';
import { chainPlugins } from '../plugin/chainPlugins';
import { chainResolve } from '../plugin/chainResolve';

// copy from plugin
const TARGET = 'light';

const light: IPlugin = ctx => {
  const configHelper = ctx.configHelper;

  ctx.registerTarget(TARGET, tctx => {
    tctx.chainWebpack(webpackConfig => {
      const { isDev } = configHelper;
      const { cwd, projectConfig } = configHelper;
      // webpackConfig.devServer.hot(isDev);
      webpackConfig
        .target('web')
        .devtool(projectConfig.abilities?.sourceMap!)
        .mode(isDev ? 'development' : 'production')
        .entry('app.entry')
        .add(path.join(configHelper.entryPath, '..', 'app.entry.js'));
      webpackConfig.output
        .path(path.join(cwd, projectConfig.output))
        .filename('[name].[contenthash:7].js')
        .publicPath('/')
        .libraryTarget('umd')
        .globalObject('window');
      webpackConfig.output.set('chunkLoadingGlobal', `webpackJsonp_${projectConfig.projectName}_${Date.now()}`);
      chainResolve(webpackConfig, configHelper);
      chainModuleRule(webpackConfig, configHelper);
      chainPlugins(webpackConfig, configHelper);
      chainOptimization(webpackConfig, configHelper);
    });
  });
};

module.exports = light;
