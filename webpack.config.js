const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyFilePlugin = require("copy-webpack-plugin");

module.exports = {
  mode: 'development',
  entry: {
    enigma: path.join(__dirname, '/src/enigmaISimulator/index.ts')
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.html$/,
        loader: 'html-loader'
      }
    ]
  },
  resolve: {
    extensions: [
      '.ts', '.js'
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser'
    }),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html'
    }),
    new HtmlWebpackPlugin({
      template: './src/enigmaISimulator/index.html',
      filename: 'enigmaISimulator/index.html'
    }),
    new CopyFilePlugin({
      patterns: [
        {
          context: path.resolve(__dirname, "src"),
          from: "**/*.pdf",
          to: path.resolve(__dirname, "dist")
        }
      ]
    })
  ]
};
