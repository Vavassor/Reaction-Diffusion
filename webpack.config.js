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
    filename: "bundle.js",
    path: __dirname + "/dist",
    publicPath: "/assets/",
  },
};