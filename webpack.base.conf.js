import path from 'node:path'

export default {
  entry: './src/main.ts', // Example entry point
  output: {
    filename: 'bundle.js',
    path: path.resolve('dist')
  },
  resolve: {
    extensions: ['.js', '.json', '.ts', '.tsx']
  },
  module: {
    rules: [
      // Add loaders here, e.g., for handling Vue files, JavaScript, etc.
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader']
      }
    ]
  },
  ignoreWarnings: [/Failed to parse source map/]
}
