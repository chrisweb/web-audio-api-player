'use strict';

const gulp = require('gulp');
const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json');
const merge = require('merge2');
const sourcemaps = require('gulp-sourcemaps');

// documentation: https://github.com/gulpjs/gulp/blob/master/docs/API.md

// check the coding standards and programming errors
gulp.task('lint', () => {
    const tslint = require('gulp-tslint');
    // Built-in rules are at
    // https://github.com/palantir/tslint#supported-rules
    const tslintConfig = require('./tslint.json');
    return gulp
        .src([
            'javascripts/**/*.ts'
        ])
        .pipe(
            tslint({
                tslint: require('tslint').default,
                configuration: tslintConfig,
                formatter: 'prose'
            })
        )
        .pipe(
            tslint.report({
                emitError: true
            })
        );
});

// gulp typescript build
gulp.task('build', ['copy:html', 'copy:player', 'copy:types'],  () => {
    var tsResult = tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(tsProject());

    // merge the two output streams, this task is finished when the IO of both operations is done
    return merge([ 
        tsResult.dts.pipe(gulp.dest('build/@types/web-audio-api-player_visualizer-example')),
        tsResult.js
            // inline source maps or add directory as sting as first parameter of write
            .pipe(sourcemaps.write())
            .pipe(gulp.dest('build'))
    ]);
});

// copy the player library into the example node_modules directory
gulp.task('copy:player', () => {
    return gulp
        .src(['../../build/**', '!../../build/{@types,@types/**}'])
        .pipe(gulp.dest('node_modules/web-audio-api-player'));
});

// copy the player declaration files into the example node_modules directory
gulp.task('copy:types', () => {
    return gulp
        .src('../../build/@types/**')
        .pipe(gulp.dest('node_modules/@types'));
});

gulp.task('copy:html', () => {
    return gulp
        .src('./html/**')
        .pipe(gulp.dest('build/html'));
});

gulp.task('watch', ['build'], function () {
    gulp.watch([
		'javascripts/**/*.ts'
	], ['build']);
});