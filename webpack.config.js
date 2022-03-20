const fs = require("fs");
const path = require("path");
const webpack = require('webpack');
const appDirectory = fs.realpathSync(process.cwd());

module.exports = () => {
  return {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: {
      index: path.resolve(appDirectory, "views/js", "index.js"),
      bidding: path.resolve(appDirectory, "views/js", "bidding.js"),
      competitors: path.resolve(appDirectory, "views/js", "competitors.js"),
      style: [
        path.resolve(appDirectory, "views/scss", "style.scss"),
        path.resolve(appDirectory, "views/scss/league", "base-prices.scss"),
        path.resolve(appDirectory, "views/scss/league", "configure.scss"),
        path.resolve(appDirectory, "views/scss/league", "bidding.scss"),
        path.resolve(appDirectory, "views/scss/league", "my-team.scss"),
        path.resolve(appDirectory, "views/scss/league", "competitors.scss"),
        path.resolve(appDirectory, "views/scss/league", "auction-pool.scss"),
        path.resolve(appDirectory, "views/scss/partials", "bottom-menu.scss")
      ],
    },
    output: {
      filename: "javascripts/[name].js",
      path: path.resolve(appDirectory, "public"),
      clean: true,
      library: {
        name: 'FantasyAuction',
        type: 'umd',
      },
      globalObject: 'this',
      publicPath: ''
    },
    optimization: {
      minimize: true
    },
    plugins: [
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1,
      })
    ],
    module: {
      rules: [
        {
          test: /\.scss$/,
          // use: [
          //   "style-loader",
          //   {
          //     loader: "css-loader",
          //     options: {
          //       modules: {
          //         localIdentName: "[hash:base64:5]--[name]--[local]"
          //       }
          //     },
          //   },
          //   "sass-loader",
          // ],
          use: [
            {
              loader: 'file-loader',
              options: {
                name: 'stylesheets/[name].css',
              }
            },
            {
              loader: 'postcss-loader'
            },
            {
              loader: 'sass-loader'
            }
          ],
          exclude: /\.global.scss$/,
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: "asset/resource",
        },
        {
          test: /\.(js|jsx)$/,
          use: {
            loader: require.resolve("babel-loader"),
            options: {
              presets: [
                [require.resolve("@babel/preset-env"), { modules: false }]
              ]
            },
          },
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: "asset/resource",
        },
      ],
    }
  }
};
