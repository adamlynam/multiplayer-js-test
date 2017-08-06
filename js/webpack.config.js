module.exports = {
    entry: './src/client/multiplayer.js',
	output: {
		path: './bin',
		filename: 'bundle.js',
	},
	module: {
		loaders: [{
			test: /\.js$/,
			exclude: /node_modules/,
			loader: 'babel-loader',
			query: {
				presets:['react']
			}
		}]
	}
}
