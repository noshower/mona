import path from 'path';
import Config from 'webpack-chain';

import ConfigHelper from '@/ConfigHelper';

import { genAlias } from './chainResolve';
import { MonaPlugins } from '@/plugins';
import { appSrcPath } from './utils';

import { TARGET } from './constants';

export function chainModuleRule(webpackConfig: Config, configHelper: ConfigHelper) {
  createCssRule(webpackConfig, configHelper);
  createLessRule(webpackConfig, configHelper);
  createAssetRule(webpackConfig, configHelper);
  createNodeModulesLessRule(webpackConfig, configHelper);
  createJsRule(webpackConfig, configHelper);
}

const commonCssRule = (
  styleRule: Config.Rule<Config.Module>,
  configHelper: ConfigHelper,
  cssOptions: Record<string, any>,
) => {
  styleRule.use('style-loader').when(
    configHelper.isDev,
    r => r.loader(require.resolve('style-loader')),
    r => r.loader(MonaPlugins.MiniCssExtractPlugin.loader),
  );

  styleRule.use('css-loader').loader(require.resolve('css-loader')).options(cssOptions);

  styleRule
    .use('postcss-loader')
    .loader(require.resolve('postcss-loader'))
    .options({
      postcssOptions: {
        plugins: [
          require('postcss-flexbugs-fixes'),
          [
            require('postcss-preset-env'),
            {
              autoprefixer: true,
              stage: 3,
            },
          ],
        ],
        sourceMap: configHelper.isDev,
      },
    });

  return styleRule;
};

function createJsRule(webpackConfig: Config, configHelper: ConfigHelper) {
  const { projectConfig, cwd } = configHelper;
  const jsRule = webpackConfig.module.rule('app-src-ts').test(/\.((j|t)sx?)$/i);

  jsRule
    .use('babel')
    .loader(require.resolve('babel-loader'))
    .options({
      babelrc: false,
      // https://github.com/babel/babel/issues/12731
      sourceType: 'unambiguous',
      presets: [
        [require.resolve('@babel/preset-env')],
        [require.resolve('@babel/preset-typescript')],
        [require.resolve('@babel/preset-react'), { runtime: 'automatic' }],
      ],
      overrides: [
        {
          test: /\.tsx?$/,
          plugins: [[require('@babel/plugin-proposal-decorators'), { legacy: true }]],
        },
      ],
      plugins: [
        // Todo
        MonaPlugins.babel.collectNativeComponent.bind(null, configHelper),
        [require.resolve('@babel/plugin-transform-runtime'), { regenerator: true }],
        configHelper.isDev && require.resolve('react-refresh/babel'),
        projectConfig.enableMultiBuild && [
          path.join(__dirname, '../../plugins/babel/BabelPluginMultiTarget.js'),
          { target: TARGET, context: cwd, alias: genAlias() },
        ],
        [require.resolve('babel-plugin-import'), { libraryName: 'antd', libraryDirectory: 'es', style: true }, 'antd'],
      ].filter(Boolean),
    });
  jsRule
    .use('ttComponentLoader')
    .loader(path.resolve(__dirname, '../../plugins/loaders/ImportCustomComponentLoader'))
    .options({ target: TARGET, configHelper });
}

function createLessRule(webpackConfig: Config, configHelper: ConfigHelper) {
  const lessRule = webpackConfig.module
    .rule('app-src-less')
    .test(/\.less$/i)
    .include.add(appSrcPath)
    .end();

  commonCssRule(lessRule, configHelper, {
    esModule: true,
    sourceMap: configHelper.isDev,
    modules: {
      localIdentName: '[local]_[hash:base64:5]',
    },
  })
    .use('less')
    .loader('less-loader')
    .options({
      sourceMap: configHelper.isDev,
      lessOptions: {
        math: 'always',
        javascriptEnabled: true,
      },
    });
}

function createNodeModulesLessRule(webpackConfig: Config, configHelper: ConfigHelper) {
  const lessRule = webpackConfig.module
    .rule('node-modules-less')
    .test(/\.less$/i)
    .include.add(/node_modules/)
    .end();

  lessRule.use('style-loader').when(
    configHelper.isDev,
    r => r.loader(require.resolve('style-loader')),
    r => r.loader(MonaPlugins.MiniCssExtractPlugin.loader),
  );

  lessRule.use('css-loader').loader(require.resolve('css-loader'));

  lessRule
    .use('less-loader')
    .loader(require.resolve('less-loader'))
    .options({
      lessOptions: {
        // modifyVars: theme,
        javascriptEnabled: true,
      },
    });
}

function createCssRule(webpackConfig: Config, configHelper: ConfigHelper) {
  const cssRule = webpackConfig.module
    .rule('app-src-css')
    .test(/\.css$/i)
    .include.add(appSrcPath)
    .end();

  commonCssRule(cssRule, configHelper, {
    esModule: true,
    sourceMap: configHelper.isDev,
    modules: {
      localIdentName: '[local]_[hash:base64:5]',
    },
  });
}

function createAssetRule(webpackConfig: Config, configHelper: ConfigHelper) {
  const resourceType = 'asset/resource';
  const { projectConfig } = configHelper;

  webpackConfig.module
    .rule('app-src-img')
    .test(/\.(png|jpe?g|gif|webp)$/i)
    .include.add(appSrcPath)
    .end()
    .set('type', resourceType);

  webpackConfig.module
    .rule('app-src-svg')
    .test(/\.svg$/i)
    .include.add(appSrcPath)
    .end()
    .when(
      !!projectConfig.transformSvgToComponentInWeb,
      s => s.use('@svgr/webpack').loader(require.resolve('@svgr/webpack')),
      s => s.set('type', resourceType),
    );

  webpackConfig.module
    .rule('app-src-font')
    .test(/\.(ttf|eot|woff|woff2)$/i)
    .include.add(appSrcPath)
    .end()
    .set('type', resourceType);
}
