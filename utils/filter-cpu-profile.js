/* eslint-disable no-console, no-process-exit */
"use strict";

//
// Input
//
var fs = require("fs");

var CpuProfileFilter = require("../src/cpuprofile-filter");

// JSON5 auto-parsing
require("json5/lib/require");

//
// Arguments
//
if (process.argv.length < 4) {
    console.log("Usage: filter-cpu-profile.js [profile.cpuprofile] [config.json5]");
    process.exit(1);
}

var profile = fs.readFileSync(process.argv[2], "utf-8");
try {
    profile = JSON.parse(profile);
} catch (e) {
    console.error("Could not read .cpuprofile from", process.argv[2]);
    process.exit(1);
}

var config = require(process.argv[3]);

console.log(CpuProfileFilter.filter(profile, config));
