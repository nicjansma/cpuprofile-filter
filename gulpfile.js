"use strict";

(function() {
    //
    // Imports
    //
    var fs = require("fs");
    var gulp = require("gulp");
    var eslint = require("gulp-eslint");
    var mocha = require("gulp-spawn-mocha");
    var jsoncombine = require("gulp-jsoncombine");

    //
    // Task Definitions
    //
    gulp.task("lint", function() {
        gulp.src(["*.js", "src/*.js", "test/*.js", "utils/*.js"])
            .pipe(eslint())
            .pipe(eslint.format());
    });

    gulp.task("lint:build", function() {
        return gulp.src(["*.js", "src/*.js", "test/*.js", "utils/*.js"])
            .pipe(eslint())
            .pipe(eslint.format())
            .pipe(eslint.format("checkstyle", fs.createWriteStream("eslint.xml")));
    });

    gulp.task("build-test", function() {
        gulp.src("test/data/*.json")
            .pipe(jsoncombine("data.js", function(data) {
                var out = "window.TEST_DATA = ";

                out += JSON.stringify(data);

                out += ";";

                return new Buffer(out);
            }))
            .pipe(gulp.dest("./test/build"));
    });

    gulp.task("mocha", ["build-test"], function() {
        return gulp.src("test/test-*.js",
            {
                read: false
            })
            .pipe(mocha());
    });

    gulp.task("mocha-tap", ["mocha"], function() {
        return gulp.src("test/test-*.js",
            {
                read: false
            })
            .pipe(mocha({
                reporter: "tap",
                output: "./test/mocha.tap"
            }));
    });

    gulp.task("all", ["default"]);
    gulp.task("test", ["mocha", "mocha-tap"]);
    gulp.task("default", ["lint", "lint:build", "test"]);
    gulp.task("travis", ["default"]);
}());
