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
    return gulp
        .src([
            'source/**/*.ts'
        ])
        .pipe(
            tslint({
                tslint: require('tslint').default,
                configuration: './tslint.json',
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
gulp.task('build', ['lint'], () => {
    var tsResult = tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(tsProject());

    // merge the two output streams, this task is finished when the IO of both operations is done
    return merge([ 
        tsResult.dts.pipe(gulp.dest('build/@types/web-audio-api-player')),
        tsResult.js
            // inline source maps or add directory as sting as first parameter of write
            .pipe(sourcemaps.write()) 
            .pipe(gulp.dest('build'))
    ]);
});

gulp.task('watch', ['build'], function () {
    gulp.watch([
		'source/**/*.ts'
	], ['build']);
});