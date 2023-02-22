import babel from '@rollup/plugin-babel'

const babelOptions = {
  babelrc: false,
  exclude: '**/node_modules/**',
  babelHelpers: 'bundled',
  presets: [
    [
      '@babel/preset-env',
      {
        loose: true,
        modules: false,
        targets: '>1.5%, not dead, not ie 11, not op_mini all',
      },
    ],
  ],
  plugins: [
    [
      '@babel/plugin-proposal-private-methods',
      {
        loose: true,
      },
    ],
  ],
}

export default [
  {
    input: 'src/ProjectedMaterial.js',
    external: ['three'],
    plugins: [babel(babelOptions)],
    output: [
      {
        format: 'cjs',
        file: 'build/ProjectedMaterial.cjs.js',
      },
      {
        format: 'esm',
        file: 'build/ProjectedMaterial.module.js',
      },
    ],
  },
]
