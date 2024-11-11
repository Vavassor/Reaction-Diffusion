const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");

module.exports = merge(common, {
  devServer: {
    contentBase: "./dist",
    open: true,
  },
  mode: "development",
  module: {
    rules: [
      {
        use: ["style-loader", "css-loader"],
        test: /\.css$/,
      },
    ]
  },
  output: {
    filename: "bundle.js",
  },
});
