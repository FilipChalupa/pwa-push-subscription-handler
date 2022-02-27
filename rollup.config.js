import cleaner from 'rollup-plugin-cleaner'
import typescript from 'rollup-plugin-typescript2'
import packageJson from './package.json'

const production = !process.env.ROLLUP_WATCH
const sourcemap = !production

export default {
	input: './src/index.ts',
	output: [
		{
			file: packageJson.main,
			format: 'cjs',
			sourcemap,
		},
		{
			file: packageJson.module,
			format: 'esm',
			sourcemap,
		},
	],
	plugins: [
		cleaner({
			targets: ['./dist/'],
		}),
		typescript(),
	],
}
