module.exports = {
  entry: "./Source/Javascript/entry.js",
  module: {
    rules: [
      {
        loader: "webpack-glsl-loader",
        test: /\.glsl$/,
      },
      {
        loaders: [
          "style-loader",
          "css-loader",
        ],
        test: /\.css$/,
      },
    ],
  },
  output: {
    path: __dirname + "/dist",
    filename: "bundle.js",
  },
};