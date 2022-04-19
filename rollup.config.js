import typescript from '@rollup/plugin-typescript'

// This is for the old-school-script-tag build

export default [
	{
		input: 'src/ProjectedMaterial.ts',
		external: ['three'],
		plugins: [typescript({})],
		output: {
			format: 'umd',
			/** @param {string} id */
			globals: id => (id === 'three' || id.startsWith('three/') ? 'THREE' : undefined),
			name: 'projectedMaterial',
			exports: 'named',
			file: 'dist/ProjectedMaterial.global.js',
		},
	},
]
