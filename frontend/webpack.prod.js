const path = require('path')
const TerserPlugin = require('terser-webpack-plugin')
const { DefinePlugin } = require('webpack')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

module.exports = (env, argv) => {
  const isProduction = env.NODE_ENV === 'production'
  
  return {
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    
    optimization: {
      minimize: isProduction,
      minimizer: isProduction ? [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
            },
            mangle: {
              // Ofuscar nombres de variables y funciones
              toplevel: true,
              properties: {
                regex: /^_/
              }
            },
            format: {
              comments: false,
            }
          })
        })
      ] : [],
      
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          }
        }
      }
    },
    
    plugins: [
      new DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
        'process.env.API_URL': JSON.stringify(process.env.API_URL || 'http://localhost:3000'),
        // Variables de entorno para producción
        'process.env.BUILD_TIME': JSON.stringify(new Date().toISOString()),
        'process.env.BUILD_VERSION': JSON.stringify(require('./package.json').version || '1.0.0')
      }),
      
      ...(isProduction && process.env.ANALYZE_BUNDLE ? [
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: 'bundle-report.html'
        })
      ] : [])
    ],
    
    output: {
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      chunkFilename: isProduction ? '[name].[contenthash].chunk.js' : '[name].chunk.js',
      path: path.resolve(__dirname, 'dist'),
      publicPath: '/',
      
      // Limpiar salida anterior
      clean: true
    },
    
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    
    module: {
      rules: [
        {
          test: /\.(js|jsx|ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: {
                    browsers: ['> 1%', 'last 2 versions', 'not dead']
                  },
                  modules: false,
                  useBuiltIns: ['usage']
                }],
                '@babel/preset-react'
              ],
              plugins: [
                ...(isProduction ? [
                  // Remover console.log en producción
                  ['transform-remove-console', {
                    exclude: ['error', 'warn']
                  }],
                  // Remover comentarios y código muerto
                  'babel-plugin-transform-remove-console'
                ] : [])
              ]
            }
          }
        },
        
        {
          test: /\.css$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                minimize: isProduction
              }
            }
          ]
        }
      ]
    }
  }
}
