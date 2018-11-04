# webpack-mutiple-theme-bundle-css-demo
本文主要详细介绍了，如何使用 [webpack][webpack]，打包多套不同主题的解决方案以及实践中所遇到的问题及解决方案。

> 如果你只是想快速编译多套主题，请直接使用 [webpack-multiple-themes-compile][webpack-multiple-themes-compile] 库。
<!-- more -->

## 起因
首先，简单的介绍一下什么是多主题，所谓多套主题/配色，就是我们很常见的换肤功能。换肤简单来说就是更换 `css`。这是一个老生常谈的问题，具体实践请参考[less换肤功能实践][less-multiple-color-theme-realize]。本文不在赘述。
一般实现多主题的样式文件，我们都会借用 [gulp][gulp]、[grunt][grunt]这种构建工具进行构建。但是，这样做有一个巨大的问题，就是非常不方便。我们既然已经使用了 `webpack` 进行打包，又为什么还要使用其他的构建工具呢？
另外，还有一个巨大的弊端就是使用其他构建工具构建的 css ，是没办法支持提供的 [scope][scope]功能的。这非常致命。所以到底该如何使用 webpack 进行构建呢？

## 大致思路
新建一些 `<theme>.less`文件，，使用 `webpack` 读取 `themes`目录中的样式文件，编译后输出 `<theme>.css`。并且首次加载时只引用默认主题文件，其他的可以到切换的时候再引入。
所以只需要解决解决编译多套 css 输出的问题和不让 css 注入 html的问题就好了。

## 解决编译多套 css 输出的问题
- 建立一个[初始化的项目][initial-project]，这个项目以`react`项目为例，预编译语言使用的是`less`。你可以随着自己的喜好进行任意选择。[初始配置][init-webpack-config]。然后再`less`文件夹下，新建一个`themes`目录，和多个 `<theme>.less`。
![目录结构](/static/themes.png)
建好之后，把所有的 文件引入 `index.js`中，`webpack`就会帮你把他们编译输出到一起了。一般情况下，[extract-text-webpack-plugin][extract-text-webpack-plugin] 可以帮我们把样式文件抽出来，但是会帮我们把他们都放在同一个文件中。
修改`index.js`。
```diff
import './less/index.less';
+ import './less/themes/green.less';
+ import './less/themes/red.less';
+ import './less/themes/yellow.less';
```
然后编译一下，你发现所有的样式都混在一起了。
![混在一起的样式](/static/mix-css.png)
参照文档，我们需要多次声明 `ExtractTextPlugin`，以达到把不同的主题输出到不同文件的目的。这里我使用的是, `loader` 的 `include` 和 `exclude`参数。在默认样式中将其他样式排除，然后每一个主题的样式,分别打包自己的样式。
最终代码的改动如下：
```diff
const path = require('path');
+ const fs = require('fs');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlwebpackPlugin = require('html-webpack-plugin');

const { STYLE_DEBUG } = process.env;
+ // 主题路径
+ const THEME_PATH = './src/less/themes';

const extractLess = new ExtractTextPlugin('style.[hash].css');

+ const styleLoaders = [{ loader: 'css-loader' }, { loader: 'less-loader' }];

+ const resolveToThemeStaticPath = fileName => path.resolve(THEME_PATH, fileName);
+ const themeFileNameSet = fs.readdirSync(path.resolve(THEME_PATH));
+ const themePaths = themeFileNameSet.map(resolveToThemeStaticPath);
+ const getThemeName = fileName => `theme-${path.basename(fileName, path.extname(fileName))}`;

+ // 全部 ExtractLessS 的集合
+ const themesExtractLessSet = themeFileNameSet.map(fileName => new ExtractTextPlugin(`${getThemeName(fileName)}.css`))
+ // 主题 Loader 的集合
+ const themeLoaderSet = themeFileNameSet.map((fileName, index) => {
+   return {
+     test: /\.(less|css)$/,
+     include: resolveToThemeStaticPath(fileName),
+     loader: themesExtractLessSet[index].extract({
+       use: styleLoaders
+     })
+   }
+ });


//
//..... 这里省略了
//

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
-          use: [
-            {
-              loader: 'css-loader',
-            }, {
-              loader: 'less-loader'
-            }
-          ],  
+          use: styleLoaders,
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
+      ...themeLoaderSet
    ]
  },
  plugins: [
    extractLess,
+    ...themesExtractLessSet,
    new webpack.NamedModulesPlugin(),
    new HtmlwebpackPlugin({
      title: 'webpack 多主题打包演示',
      template: 'src/index.html',
      inject: true
    })
  ],
  devtool: STYLE_DEBUG === 'SOURCE' && 'source-map'
};
```

做出以上改动之后，就可以正常的输出样式文件了。
![第一次构建](/static/first-build.png)

[详细的代码改动][git-commit-extract-css]在这里，并且有详细的注释。

## 不让 css 注入 html
这样做之后，虽然 `webpack` 可以正常的编译样式文件了，但是有一个致命的问题。让我们看看现在的`<head/>`
```html
<head>
  <meta charset="UTF-8" >
  <title>webpack 多主题打包演示页面</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge" >
  <meta name="viewport" content="width=device-width, initial-scale=1.0" >
  <link rel="stylesheet" type="text/css" href="/resources/loading.css" >
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/docsearch.js@2/dist/cdn/docsearch.min.css" />
  <script type="text/javascript" src="//cdn.staticfile.org/babel-standalone/6.24.0/babel.min.js"></script>
  <script src="https://cdn.polyfill.io/v2/polyfill.min.js?features=default|gated,Array.prototype.includes"></script>
<link href="/style.984c33e9f2d50d6db720.css" rel="stylesheet"><link href="/theme-green.css" rel="stylesheet"><link href="/theme-red.css" rel="stylesheet"><link href="/theme-yellow.css" rel="stylesheet"></head>
```
我们发现不仅注入了`style.css`同时注入了所有的`theme.css`。这显然不是我们想要的。所以有什么办法把多余的主题去掉呢？
### 方法一（不推荐）
用`node`写一个脚本，读取`html`，然后移除。这样又与我们最开始的初衷相违背，还是借助了其他的外力。
### 方法二
[extract-text-webpack-plugin][extract-text-webpack-plugin] 提供了一个 `excludeChunks`方法，可以用来排除 `entry` 。所以我们可以把所有的样式文件放入，`themes.js` 中然后 在 entry 中添加 `themes`。再使用`excludeChunks`排除它就好了。
- 删除 `index.js` 中的样式引用。
```diff
// style
import './less/index.less';
- import './less/themes/green.less';
- import './less/themes/red.less';
- import './less/themes/yellow.less';
```
- 创建`themes.js`
```javascript
import './less/themes/green.less';
import './less/themes/red.less';
import './less/themes/yellow.less';
```
- 修改 `webpack.config.js`
```diff
  entry: {
    app: './src/index.js',
+   themes: './src/themes.js'
  },
//
//... 省略没用的代码
//

new HtmlwebpackPlugin({
  title: 'webpack 多主题打包演示',
  template: 'src/index.html',
  inject: true,
+ excludeChunks: ['themes']
})
```
![使用 excludeChunks方式构建](/static/first-build.png)
但是这时候，发现多了一个 `themes.bundle.js`文件。所以需要删除掉。修改 `build`脚本。
```diff
"build": "rm -rf dist && NODE_ENV=production webpack --mode production --progress && cp -R public/* ./dist/ "
"build": "rm -rf dist && NODE_ENV=production webpack --mode production --progress && cp -R public/* ./dist/ && && rm -rf dist/themes.bundle.js"
```
这样就大功告成了。[更改记录][exclude-css-file]，[完整代码](https://github.com/hiyangguo/webpack-mutiple-theme-bundle-css-demo)

### 方法三
但是，加了句 `rm -rf`，还是感觉有点不爽。所以在仔细的阅读了[extract-text-webpack-plugin][extract-text-webpack-plugin]文档后，我发现他提供了一个钩子函数`html-webpack-plugin-after-html-processing`。可以处理`html`。[HtmlWebpackHandleCssInjectPlugin.js](html-webpack-handle-css-inject-plugin-js)（**支持`webpack4`和其他 `webpack` 版本**）。
然后这样使用：
```diff
+ const HtmlWebpackHandleCssInjectPlugin = require('./HtmlWebpackHandleCssInjectPlugin');
//... 省略没用的代码
  plugins: [
    extractLess,
    // 将所有的 themesExtractLess 加入 plugin
    ...themesExtractLessSet,
    new webpack.NamedModulesPlugin(),
    new HtmlwebpackPlugin({
      title: 'webpack 多主题打包演示',
      template: 'src/index.html',
      inject: true
+    }),
+    new HtmlWebpackHandleCssInjectPlugin({
+      filter: (filePath) => {
+        return filePath.includes('style');
+      }
+    })
+  ],
```
`filter` 函数`Array.filer`用法一直。参数`filePath`参数给出的就是`link`标签中`[href]`的值。
这个方法，既不需要任何工具，也不需要删除什么。非常完美。[更改记录][use-plugin],[完整代码](https://github.com/hiyangguo/webpack-mutiple-theme-bundle-css-demo/tree/plugin)
![使用 hook方式构建](/static/fina-build.png)


这两种方法我个人比较倾向于方法三。由于 plugin 的代码比较简单，就不做 publish 了。需要的欢迎自取。
本文章所涉及的[源码][source]。[方法二](#方法二)和[方法三](#方法三)在不同的分支，[点击查看最终效果][final]。

![最终效果截屏](/static/final-screenshoots.gif)

最后感谢[@xiyuyizhi][xiyuyizhi]提供的[宝贵思路](https://github.com/xiyuyizhi/notes/blob/master/js/theme.md)。
本文纯属原创，如有错误欢迎指正。

## 优化与改进
上面方法存在一个比较严重的问题，就是需要在 `themes` 文件夹下手动建立多个主题文件。这样做一方面比较难维护，另一方面也会多很多的冗余。所以这里写了一个[脚本][generate-themes-script]，读取配置文件，并生成多个`theme.less`。

## 最终实现
最终写了一个[webpack-multiple-themes-compile][webpack-multiple-themes-compile]库，来完成上面所有的操作。只需要简单的几行配置！


[webpack]:https://webpack.js.org/
[less-multiple-color-theme-realize]:https://hiyangguo.github.io/2017/03/21/less-multiple-color-theme-realize/
[gulp]:https://www.gulpjs.com.cn/
[grunt]:https://gruntjs.com/
[scope]:https://www.npmjs.com/package/css-loader#scope
[xiyuyizhi]:https://github.com/xiyuyizhi
[webpack构建下换肤功能的实现思路]:https://juejin.im/post/5a1b8a4df265da430f31d03e
[initial-project]:https://github.com/hiyangguo/webpack-mutiple-theme-bundle-css-demo/tree/v0.0.1
[init-webpack-config]:https://github.com/hiyangguo/webpack-mutiple-theme-bundle-css-demo/blob/v0.0.1/webpack.config.js
[extract-text-webpack-plugin]:https://www.npmjs.com/package/extract-text-webpack-plugin
[git-commit-extract-css]:https://github.com/hiyangguo/webpack-mutiple-theme-bundle-css-demo/commit/1509f94524626331731893253aec2d2ce6936911
[html-webpack-handle-css-inject-plugin-js]:https://gist.github.com/hiyangguo/41b9d5fb9a164b1043ff1e5fbb7cdceb#file-htmlwebpackhandlecssinjectplugin-js
[source]:https://github.com/hiyangguo/webpack-mutiple-theme-bundle-css-demo
[exclude-css-file]:https://github.com/hiyangguo/webpack-mutiple-theme-bundle-css-demo/commit/90c1f24af526cd6d48bf6b095500e4ffa5c7f0e6
[use-plugin]:https://github.com/hiyangguo/webpack-mutiple-theme-bundle-css-demo/commit/2688cead3298b65a4e5871ead1d261b008b545a8
[final]:https://hiyangguo.github.io/webpack-mutiple-theme-bundle-css-demo/
[generate-themes-script]:https://github.com/hiyangguo/webpack-mutiple-theme-bundle-css-demo/blob/master/script/generate-themes.js
[webpack-multiple-themes-compile]:https://github.com/rsuite/webpack-multiple-themes-compile/blob/master/README_zh.md
