const gulp = require("gulp");
const tslint = require("gulp-tslint");
const yaml = require("gulp-yaml");
const ts = require("gulp-typescript");
const tsProject = ts.createProject("tsconfig.json");
const config = require("./foundryconfig.json");
const sass = require("gulp-sass");
sass.compiler = require("node-sass");

function lintTs() {
    return gulp.src("module/*.ts")
        .pipe(tslint())
        .pipe(tslint.report());
}
function deploy() {

    return gulp.src(["system.json", "package.json", "dist/template.json", "dist/**/*"])
        .pipe(gulp.dest(config.deployDest, { overwrite: true }));
}

function compileTs() {
    return tsProject.src()
        .pipe(tsProject())
        .pipe(gulp.dest("dist"));
}

function buildCss() {
    return gulp.src("styles/**/*.scss")
        .pipe(sass())
        .pipe(gulp.dest("dist/styles"));
}

function buildHtml() {
    return gulp.src("templates/**/*.html")
        .pipe(gulp.dest("dist/templates"));
}

function buildYml() {
    return gulp.src("template.yml")
        .pipe(yaml({ space: 2 }))
        .pipe(gulp.dest("./dist"));
}

const tsTask = gulp.series(
    lintTs,
    compileTs,
    deploy);

const sassTask = gulp.series(
    buildCss,
    deploy
);

const htmlTask = gulp.series(
    buildHtml,
    deploy
);

const build = gulp.series(
    lintTs,
    compileTs,
    buildCss,
    buildHtml,
    buildYml,
    deploy
)

function watch() {
    gulp.watch("**/*.ts", tsTask);
    gulp.watch("styles/**/**.scss", sassTask);
    gulp.watch("templates/**/*.html", htmlTask);
}

exports.default = build;
exports.build = build;
exports.b = build;

exports.lint = lintTs;
exports.ts = compileTs;
exports.css = buildCss;
exports.yml = buildYml;
exports.deploy = deploy;

exports.watch = watch