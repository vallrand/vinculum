const path = require('path')
const webpack = require('webpack')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const ManifestPlugin = require('./tasks/ManifestPlugin')
const VirtualModulePlugin = require('./tasks/VirtualModulePlugin')

module.exports = (env, argv) => ({
    entry: require.resolve('./demo/index.ts'),
    output: {
        filename: 'index.js',
		publicPath:'./',
        path: path.resolve('output')
    },
    resolve: {
        extensions: ['.ts', '.js'],
        modules: ['node_modules', path.resolve(__dirname, 'modules')]
    },
    module: {
        rules: [
            { test: /\.tsx?$/i, loader: 'ts-loader', exclude: /node_modules/ },
            { test: /\.css$/i, use: [MiniCssExtractPlugin.loader, 'css-loader'] },
            { test: [/\.glsl$/], loader: 'raw-loader', options: { esModule: false } }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            title: '[Vinculum]',
            inject: 'body',
            favicon: 'demo/icon.ico',
            meta: { viewport: 'width=device-width, height=device-height, initial-scale=1, user-scalable=no' },
            base: './',
            minify: true
        }),
        new MiniCssExtractPlugin({ filename: 'index.css' }),
        new VirtualModulePlugin({
        }),
        new ManifestPlugin({
            entry: './demo/assets',
            manifest: './demo/assets/manifest.json'
        })
    ],
    optimization: {
        minimize: argv.mode === 'production'
    },
    performance: {
        maxEntrypointSize: 1000000,
        maxAssetSize: 2000000
    },
    devServer: {
        port: 9000,
        compress: !true,
        hot: false,
        inline: false,
        liveReload: false,
        publicPath: '/',
        historyApiFallback: { index: '/' }
    }
})