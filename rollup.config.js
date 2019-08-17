import banner from 'rollup-plugin-banner'

export default {
  input: 'build/index.js',
  output: {
    format: 'iife',
    name: 'webtreemap',
    file: 'dist/webtreemap.js',
    // sourcemap: true,
  },
  plugins: [
    banner('webtreemap-cdt v<%= pkg.version %>')
  ]
}