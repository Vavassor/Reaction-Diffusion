const { merge } = require("webpack-merge");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const common = require("./webpack.common.js");

module.exports = merge(common, {
  mode: "production",
  module: {
    rules: [
      {
        use: [MiniCssExtractPlugin.loader, "css-loader"],
        test: /\.css$/,
      },
    ],
  },
  optimization: {
    runtimeChunk: "single",
  },
  output: {
    filename: "[name].[contenthash].js",
  },
  plugins: [new MiniCssExtractPlugin()],
});
