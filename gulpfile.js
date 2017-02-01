"use strict";

// Dependencies
var gulp = require("gulp"),
    template = require("gulp-template"),
    changed = require("gulp-changed"),
    less = require("gulp-less"),
    beautify = require("gulp-cssbeautify"),
    jshint = require("gulp-jshint"),
    wrapper = require("gulp-wrapper"),
    markdowneyjr = require("markdowneyjr"),
    lodash = require("template"),
    fs = require("fs"),
    prepCandidates = require("./lib/prep-candidates.js"),
    Entities = require("html-entities").AllHtmlEntities,
    entities = new Entities(),
    server;

// Where built files will go
var outputDir = "output";

// Populate .html from template, and smash header + footer together
gulp.task("html", function() {

  // Get content for templating from Markdown file
  var content = getContent();

  content.races = prepCandidates(fs.readFileSync("data/candidates.csv","utf8"), fs.readFileSync("data/slates.csv","utf8"));

  // Create footer and header output
  var header = read("src/templates/header.html") + "\n",
      footer = "\n" + read("src/templates/scripts.html");

  // If it's being deployed, deploy=true
  if (process.env.DEPLOY) {
    content.template.DEPLOY = true;
  }

  // Concatenate files
  gulp.src("src/*.html")
      .pipe(wrapper({
         header: header,
         footer: footer
      }))
      .pipe(template(content))
      .pipe(gulp.dest(outputDir));

});

// JS processing
gulp.task("js", function() {
  // JShint
  gulp.src(["src/js/**/*.js", "!src/js/libs/**/*.js", "gulpfile.js", "server.js"])
    .pipe(jshint())
    .pipe(jshint.reporter("default"));

  // Copy our JS
  gulp.src(["src/js/**/*.js"])
    .pipe(gulp.dest(outputDir + "/js"));

});

//LESS compiling and CSS indenting
gulp.task("css", function() {

  // LESS compile
  gulp.src(["src/css/*.less"])
    .pipe(changed(outputDir+"/css"))
    .pipe(less())
    .pipe(beautify({
      indent: "  ",
      autosemicolon: true
    }))
    .pipe(gulp.dest(outputDir+"/css"));

  // Copy libs
  gulp.src(["src/css/libs/**/*"])
    .pipe(changed(outputDir + "/css/libs"))
    .pipe(gulp.dest(outputDir + "/css/libs"));

});

//Copy over other files
gulp.task("misc", function() {

  // Copy data files
  gulp.src(["src/data/*"])
    .pipe(changed(outputDir+"/data"))
    .pipe(gulp.dest(outputDir+"/data"));

  // Copy media files
  gulp.src(["src/media/*"])
    .pipe(changed(outputDir+"/media"))
    .pipe(gulp.dest(outputDir+"/media"));

  // Minify and copy images
  gulp.src("src/img/**/*")
      .pipe(changed(outputDir+"/img"))
      .pipe(gulp.dest(outputDir+"/img"));

});

// Watch tasks
gulp.task("watch",["js","css","misc","html"],function() {

  gulp.watch(["src/js/**/*"],["js"]);
  gulp.watch(["src/css/**/*"],["css"]);
  gulp.watch(["src/img/**/*","src/media/*","src/data/*"],["misc"]);
  gulp.watch(["src/**/*.html","content.md","lib/prep-candidates.js"],["html"]);

});

// Web server with livereload
gulp.task("server", function() {

  // Don't require this by default since it's not a core dependency
  server = server || require("gulp-express");

  // Start server
  server.run(["server.js", "--debug"], {
    env: process.NODE_ENV,
    cwd: __dirname
  });

  gulp.watch(["output/**/*"], server.notify);

});

// Default task is a basic build
gulp.task("default",["js","css","misc","html"]);

// Develop task will run a server + watch too
gulp.task("develop", ["default", "watch", "server"]);

// Helper functions
function read(filename) {
  return fs.readFileSync(filename,{ encoding: "utf8" });
}

// Read from content.md, return JSON
function getContent() {

  // Blank default templating
  var content = {
        template: {}
      },
      markdown;

  // Try to read it from Markdown
  try {
    markdown = read("content.md");
  } catch (e) {
    // content.md doesn't exist?
    return content;
  }

  // Turn Markdown into JSON with some boolean fields
  content.template = markdowneyjr(markdown,{
    boolean: ["Use Full Footer","Data News Tuesday"]
  });

  // Fields with defaults
  if (!content.template.URL) {
    content.template.URL = "http://project.wnyc.org/" + content.template.Slug + "/";
  }

  if (!content.template["Tweet URL"]) {
    content.template["Tweet URL"] =content.template.URL;
  }

  return content;

}
