import replace from '@rollup/plugin-replace'

export default [
  {
    input: 'src/ProjectedMaterial.js',
    external: ['three'],
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
    output: {
      format: 'esm',
      file: 'examples/lib/ProjectedMaterial.module.js',
      plugins: [
        replace({
          three: 'https://unpkg.com/three@0.122.0/build/three.module.js',
        }),
      ],
    },
  },
]
