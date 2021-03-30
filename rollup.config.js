import replace from '@rollup/plugin-replace'
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
      '@babel/plugin-proposal-class-properties',
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
        format: 'umd',
        globals: {
          three: 'THREE',
        },
        name: 'projectedMaterial',
        exports: 'named',
        file: 'build/ProjectedMaterial.js',
      },
      {
        format: 'esm',
        file: 'build/ProjectedMaterial.module.js',
      },
    ],
  },
  // This build is for the examples
  {
    input: 'src/ProjectedMaterial.js',
    external: ['three'],
    plugins: [babel(babelOptions)],
    output: {
      format: 'esm',
      file: 'examples/lib/ProjectedMaterial.module.js',
      plugins: [
        replace({
          three: 'https://unpkg.com/three@0.126.1/build/three.module.js',
        }),
      ],
    },
  },
]
