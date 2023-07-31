import typescript from 'rollup-plugin-typescript2'
import pkg from '../package.json' assert { type: "json" }
import terser from '@rollup/plugin-terser'

export default {
    input: 'src/index.ts',
    output: [
        {
            file: pkg.main,
            format: 'esm',
            name: pkg.name,
            sourcemap: true
        },
        {
            file: 'dist/index.min.js',
            format: 'esm',
            name: pkg.name,
            sourcemap: true,
            plugins: [terser({
                compress: {
                    drop_console: true,
                },
            })],
        },
    ],
    plugins: [
        typescript({
            tsconfig: "tsconfig.json",
            useTsconfigDeclarationDir: true
        }),
    ],
}