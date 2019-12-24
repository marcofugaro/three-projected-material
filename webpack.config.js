const path = require('path')
const TerserJsPlugin = require('terser-webpack-plugin')
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages')
const EventHooksPlugin = require('event-hooks-webpack-plugin')
const chalk = require('chalk')
const _ = require('lodash')

module.exports = {
  mode: 'production',
  entry: {
    basic: './examples/basic.js',
    'same-camera': './examples/same-camera.js',
    instancing: './examples/instancing.js',
    '3d-model': './examples/3d-model.js',
  },
  output: {
    path: path.resolve(__dirname, './examples'),
    filename: '[name].bundle.js',
    // change this if you're deploying on a subfolder
    publicPath: '',
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          cacheDirectory: true,
        },
      },
      {
        test: /\.(glsl|frag|vert)$/,
        use: ['raw-loader', 'glslify-loader'],
      },
    ],
  },
  // turn off performance hints
  performance: false,
  // turn off the default webpack bloat
  stats: false,

  plugins: [
    // TODO use webpack's api when it will be implemented
    // https://github.com/webpack/webpack-dev-server/issues/1509
    new EventHooksPlugin({
      // debounced because it gets called two times somehow
      beforeCompile: _.debounce(() => {
        console.log('⏳  Compiling...')
      }, 0),
      done(stats) {
        if (stats.hasErrors()) {
          const statsJson = stats.toJson({ all: false, warnings: true, errors: true })
          const messages = formatWebpackMessages(statsJson)
          console.log(chalk.red('❌  Failed to compile.'))
          console.log()
          console.log(messages.errors[0])
        }
      },
      afterEmit() {
        console.log(chalk.green(`✅  Compiled successfully!`))
        console.log()
      },
    }),
  ],
  optimization: {
    // disable code splitting
    splitChunks: false,
    minimizer: [
      new TerserJsPlugin({
        terserOptions: {
          parse: {
            // we want uglify-js to parse ecma 8 code. However, we don't want it
            // to apply any minfication steps that turns valid ecma 5 code
            // into invalid ecma 5 code. This is why the 'compress' and 'output'
            // sections only apply transformations that are ecma 5 safe
            // https://github.com/facebook/create-react-app/pull/4234
            ecma: 8,
          },
          compress: {
            ecma: 5,
          },
          output: {
            ecma: 5,
            // Turned on because emoji and regex is not minified properly using default
            // https://github.com/facebook/create-react-app/issues/2488
            ascii_only: true,
          },
        },
        parallel: true,
        cache: true,
        sourceMap: true,
      }),
    ],
  },
}
