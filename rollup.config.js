import path from 'path';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import uglify from 'rollup-plugin-uglify';
import { minify } from 'uglify-es';

let plugins = [
  resolve({
    preferBuiltins: true,
  }),
  commonjs(),
  babel({
    exclude: 'node_modules/**',
  }),
];

if (process.env.ENV === 'prod') {
  plugins = plugins.concat([
    uglify({}, minify),
  ]);
}

if (process.env.ENV === 'dev') {
  plugins = plugins.concat([
    serve({
      open: true,
      contentBase: '',
    }),
    livereload({
      watch: [
        path.resolve(__dirname, 'dist'),
      ],
    }),
  ]);
}

export default {
  input: 'src/showy.js',
  output: {
    file: process.env.ENV === 'prod' ? 'dist/showy.min.js' : 'dist/showy.js',
    format: 'umd',
  },
  name: 'Showy',
  sourcemap: true,
  plugins,
  globals: {
    lodash: '_',
  },
};
