const gulp = require("gulp");
const eslint = require('gulp-eslint');
const yaml = require("gulp-yaml");
const ts = require("gulp-typescript");
const tsProject = ts.createProject("tsconfig.json");
const sass = require("gulp-sass")(require('sass'));
sass.compiler = require("sass");
const jsonModify = require("gulp-json-modify");

const fs = require("fs");

if (!fs.existsSync("./foundryConfig.json")) {
    console.log("*** No config file found, creating new copy. ***");
    fs.writeFileSync("./foundryConfig.json", JSON.stringify({ deployDest: "./release" }));
} else {
    console.log("*** Found foundryConfig.json ***");
}

const config = require("./foundryConfig.json");

function lintTs() {
    return gulp.src("module/**/*.ts")
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
}
function deploy() {
    return gulp.src(["system.json", "package.json", "dist/template.json", "dist/**/*"])
        .pipe(gulp.dest(config.deployDest, { overwrite: true }));
}

function select2() {
    return gulp.src([
            "node_modules/select2/dist/js/select2.min.js",
            "node_modules/select2/dist/css/select2.min.css"])
        .pipe(gulp.dest("dist/lib/select2"));
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
    return gulp.src(["templates/**/*.html", "templates/**/*.hbs"])
        .pipe(gulp.dest("dist/templates"));
}

function buildYml() {
    return gulp.src("**/*.yml")
        .pipe(yaml({ space: 2 }))
        .pipe(gulp.dest("./dist"));
}

function version() {
    const version = process.argv[4];
    const download = `https://github.com/StasTserk/foundry-burningwheel/releases/download/${version}/release${version}.zip`
    
    return gulp.src("./system.json")
        .pipe(jsonModify({ key: "version", value: version }))
        .pipe(jsonModify({ key: "download", value: download }))
        .pipe(gulp.dest("./"));
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
    select2,
    deploy
)

function watch() {
    gulp.watch("**/*.ts", tsTask);
    gulp.watch("styles/**/**.scss", sassTask);
    gulp.watch("templates/**/*.html", htmlTask);
    gulp.watch("templates/**/*.hbs", htmlTask);
    gulp.watch("**/*.yml", gulp.series(buildYml, deploy));
    gulp.watch("system.json", deploy)
}

exports.default = build;
exports.build = build;
exports.b = build;

exports.lint = lintTs;
exports.ts = compileTs;
exports.css = buildCss;
exports.yml = buildYml;
exports.deploy = deploy;

exports.watch = gulp.series(build, watch);
exports.uv = version;