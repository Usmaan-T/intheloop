// Babel configuration for Jest
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic', development: true }]
  ],
  plugins: []
}; 