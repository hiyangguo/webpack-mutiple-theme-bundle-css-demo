const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlwebpackPlugin = require('html-webpack-plugin');

// 主题路径
const THEME_PATH = './src/less/themes';

const extractLess = new ExtractTextPlugin('style.[hash].css');

const styleLoaders = [{ loader: 'css-loader' }, { loader: 'less-loader' }];

const resolveToThemeStaticPath = fileName => path.resolve(THEME_PATH, fileName);
const themeFileNameSet = fs.readdirSync(path.resolve(THEME_PATH));
const themePaths = themeFileNameSet.map(resolveToThemeStaticPath);
const getThemeName = fileName => `theme-${path.basename(fileName, path.extname(fileName))}`;

// 全部 ExtractLessS 的集合
const themesExtractLessSet = themeFileNameSet.map(fileName => new ExtractTextPlugin(`${getThemeName(fileName)}.css`))
// 主题 Loader 的集合
const themeLoaderSet = themeFileNameSet.map((fileName, index) => {
  return {
    test: /\.(less|css)$/,
    include: resolveToThemeStaticPath(fileName),
    loader: themesExtractLessSet[index].extract({
      use: styleLoaders
    })
  }
});


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
    app: './src/index.js',
    themes: './src/themes.js'
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
        exclude: themePaths,
        loader: extractLess.extract({
          use: styleLoaders,
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
      },
      // 将Loader 的集合，加入 rules
      ...themeLoaderSet
    ]
  },
  plugins: [
    extractLess,
    // 将所有的 themesExtractLess 加入 plugin
    ...themesExtractLessSet,
    new webpack.NamedModulesPlugin(),
    new HtmlwebpackPlugin({
      title: 'webpack 多主题打包演示',
      template: 'src/index.html',
      inject: true,
      excludeChunks: ['themes']
    })
  ]
};
