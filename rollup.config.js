import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';
import filesize from 'rollup-plugin-filesize';
import nodeResolve from 'rollup-plugin-node-resolve';
import progress from 'rollup-plugin-progress';
import visualizer from 'rollup-plugin-visualizer';
import json from 'rollup-plugin-json';
import replace from 'rollup-plugin-replace';

import pkg from './package.json';

const isDev = process.env.NODE_ENV !== 'production';

export default [
  {
    input: 'src/index.js',
    output: {
      name: 'react-ahax',
      file: pkg.browser,
      format: 'umd',
      sourcemap: 'inline'
    },
    external: ['react'],
    plugins: [
      progress(),
      nodeResolve({
        browser: true
      }),
      commonjs({
        include: 'node_modules/**'
      }),
      json(),
      babel({
        include: 'src/**',
        runtimeHelpers: true // 使plugin-transform-runtime生效
      }),
      visualizer(),
      filesize(),
      replace({
        'process.env.NODE_ENV': JSON.stringify('production')
      }),
      !isDev && terser()
    ]
  }
];
