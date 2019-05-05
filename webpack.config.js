module.exports = {
  entry: "./Source/Javascript/entry.js",
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