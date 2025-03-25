import pkg from './package.json' with { type: 'json' }
import typescript from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'

export default {
    input: 'src/index.ts',
    output: [
        {
            file: pkg.main,
            format: 'esm',
            name: pkg.name,
            sourcemap: true,
        },
        {
            file: 'dist/index.min.js',
            format: 'esm',
            name: pkg.name,
            sourcemap: true,
            plugins: [
                terser({
                    compress: {
                        drop_console: true,
                    },
                    output: {
                        comments: false,
                    },
                    keep_classnames: false,
                    keep_fnames: false,
                }),
            ],
        },
    ],
    plugins: [
        nodeResolve({
            extensions: ['.ts', '.js']
        }),
        typescript({
            compilerOptions: {
                declaration: true,
                declarationDir: './dist',
                sourceMap: true
            },
            include: ['src/**/*.ts'],
            exclude: ['node_modules', 'dist', 'examples']
        })
    ],
}