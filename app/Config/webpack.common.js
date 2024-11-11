const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./Source/Javascript/entry.js",
  module: {
    rules: [
      {
        use: "webpack-glsl-loader",
        test: /\.glsl$/,
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource"
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, "../dist"),
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: "index.html",
      title: "Reaction Diffusion Tool",
    }),
  ],
  resolve: {
    extensions: [".js"],
  },
};
