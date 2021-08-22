import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import {babel} from '@rollup/plugin-babel';
import serve from 'rollup-plugin-serve'
import page from 'rollup-plugin-generate-html-template';
import styles from 'rollup-plugin-styles';

const srcDir = 'src';
const testDir = 'test';
const buildDir = 'build';
const casesPage = 'cases.html'

const config = {
    input: [`${testDir}/remote-specs.js`],
    output: {
        file: `${buildDir}/remote-specs.js`,
        format: "iife",
        sourcemap: true,
        assetFileNames: "assets/[name].[ext]",
    },
    plugins: [
        nodeResolve(),
        commonjs(),
        styles(),
        babel({
            babelHelpers: 'bundled',
            presets: [['@babel/preset-env', {modules: false}]],
        }),
        page({template: `${testDir}/${casesPage}`}),
        serve({
            open: true,
            openPage: `/${buildDir}/${casesPage}`,
            contentBase: '.',
            port: 9876
        })
    ]
};

export default config;
