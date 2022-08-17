// https://storybook.js.org/docs/react/addons/writing-presets
import { dirname, join } from 'path';
import { Options, PresetProperty } from '@storybook/core-common';
import { TransformOptions } from '@babel/core';
import { configureConfig } from './config/webpack';
import { configureCss } from './css/webpack';
import { configureImports } from './imports/webpack';
import { configureRouting } from './routing/webpack';
import { configureStyledJsx } from './styledJsx/webpack';
import { configureStyledJsxTransforms } from './styledJsx/babel';
import { configureImages } from './images/webpack';
import { configureRuntimeNextjsVersionResolution } from './utils';
import { FrameworkOptions, StorybookConfig } from './types';

export const addons: PresetProperty<'addons', StorybookConfig> = [
  dirname(require.resolve(join('@storybook/preset-react-webpack', 'package.json'))),
  dirname(require.resolve(join('@storybook/react', 'package.json'))),
  dirname(require.resolve(join('@storybook/builder-webpack5', 'package.json'))),
];

const defaultFrameworkOptions: FrameworkOptions = {};

export const frameworkOptions = async (
  _: never,
  options: Options
): Promise<StorybookConfig['framework']> => {
  const config = await options.presets.apply<StorybookConfig['framework']>('framework');

  if (typeof config === 'string') {
    return {
      name: config,
      options: defaultFrameworkOptions,
    };
  }
  if (typeof config === 'undefined') {
    return {
      name: require.resolve('@storybook/cra') as '@storybook/cra',
      options: defaultFrameworkOptions,
    };
  }

  return {
    name: config.name,
    options: {
      ...defaultFrameworkOptions,
      ...config.options,
    },
  };
};

export const core: PresetProperty<'core', StorybookConfig> = async (config, options) => {
  const framework = await options.presets.apply<StorybookConfig['framework']>('framework');

  return {
    ...config,
    builder: {
      name: dirname(
        require.resolve(join('@storybook/builder-webpack5', 'package.json'))
      ) as '@storybook/builder-webpack5',
      options: typeof framework === 'string' ? {} : framework.options.builder || {},
    },
  };
};

export const config: StorybookConfig['previewAnnotations'] = (entry = []) => [
  ...entry,
  require.resolve('./preview'),
];

export const babel = async (config: TransformOptions): Promise<TransformOptions> =>
  configureStyledJsxTransforms(config);

export const webpack: StorybookConfig['webpack'] = async (baseConfig, options) => {
  const { nextConfigPath } = options as FrameworkOptions;
  const nextConfig = await configureConfig(baseConfig, nextConfigPath);

  configureRuntimeNextjsVersionResolution(baseConfig);
  configureImports(baseConfig);
  configureCss(baseConfig, nextConfig);
  configureImages(baseConfig);
  configureRouting(baseConfig);
  configureStyledJsx(baseConfig);

  return baseConfig;
};
