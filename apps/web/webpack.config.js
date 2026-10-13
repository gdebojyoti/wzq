import Dotenv from 'dotenv-webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import webpack from 'webpack'
import pkg from './package.json' with { type: 'json' }

export default {
  entry: './src/index.ts',
  // Hashed names can be cached forever (vercel.json). remoteEntry.js keeps its name: hosts load it by URL.
  output: { filename: '[name].[contenthash].js', publicPath: 'auto', clean: true },
  devServer: {
    port: 8081,
    // Mirrors the routes in vercel.json.
    setupMiddlewares: (middlewares) => [
      (req, res, next) => {
        const { pathname, search } = new URL(req.url, 'http://localhost')
        if (pathname === '/') return res.writeHead(307, { Location: '/wzq' + search }).end()
        if (pathname === '/wzq/') return res.writeHead(308, { Location: '/wzq' + search }).end()
        if (pathname === '/wzq') req.url = '/index.html'
        next()
      },
      ...middlewares
    ]
  },
  resolve: { extensions: ['.ts', '.tsx', '.js'] },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'esbuild-loader',
        options: { target: 'es2022', jsx: 'automatic' }
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: { postcssOptions: { plugins: ['@tailwindcss/postcss'] } }
          }
        ]
      }
    ]
  },
  plugins: [
    new webpack.container.ModuleFederationPlugin({
      name: 'wzq',
      filename: 'remoteEntry.js',
      exposes: { './Wzq': './src/Wzq.tsx' },
      shared: {
        react: { singleton: true, requiredVersion: pkg.dependencies.react },
        'react-dom': { singleton: true, requiredVersion: pkg.dependencies['react-dom'] }
      }
    }),
    // Reads apps/web/.env if there is one, and the platform's variables on Vercel.
    new Dotenv({ systemvars: true, silent: true }),
    new HtmlWebpackPlugin({ template: './src/index.html', chunks: ['main'] })
  ]
}
