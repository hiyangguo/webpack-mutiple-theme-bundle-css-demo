const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlwebpackPlugin = require('html-webpack-plugin');

const { STYLE_DEBUG } = process.env;

const extractLess = new ExtractTextPlugin('style.[hash].css');

module.exports = {
  devServer: {
    contentBase: path.join(__dirname, 'public'),
    disableHostCheck: true,
    historyApiFallback: true,
    compress: true,
    host: '0.0.0.0',
    port: 3201
  },
  entry: {
    app: './src/index.js'
  },
  output: {
    filename: '[name].bundle.js?[hash]',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          'transform-loader?brfs', // Use browserify transforms as webpack-loader.
          'babel-loader?babelrc'
        ],
        exclude: /node_modules/
      },
      {
        test: /\.(less|css)$/,
        loader: extractLess.extract({
          use: [
            {
              loader: 'css-loader',
            }, {
              loader: 'less-loader'
            }
          ],
          // use style-loader in development
          fallback: 'style-loader?{attrs:{prop: "value"}}'
        })
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader'
          }
        ]
      }
    ]
  },
  plugins: [
    extractLess,
    new webpack.NamedModulesPlugin(),
    new HtmlwebpackPlugin({
      title: 'webpack 多主题打包演示',
      template: 'src/index.html',
      inject: true
    })
  ],
  devtool: STYLE_DEBUG === 'SOURCE' && 'source-map'
};
