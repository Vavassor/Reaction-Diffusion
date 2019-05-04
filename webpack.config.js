module.exports = {
  entry: "./Source/Javascript/main.js",
  module: {
    rules: [
      {
        loader: "webpack-glsl-loader",
        test: /\.glsl$/,
      },
    ],
  },
  output: {
    path: __dirname + "/dist",
    filename: "bundle.js",
  },
};