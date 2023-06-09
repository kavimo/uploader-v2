const path = require('path');

module.exports = {
  mode: "production",
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: "KavimoUploader",
    libraryTarget: "var",
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    port: 9500,
  },

};