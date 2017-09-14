/* eslint-disable no-unused-expressions,no-loop-func */
"use strict";
//
// Helper functions
//
var fs = require("fs");
var path = require("path");
var chai = require("chai");
var JSON5 = require("json5");

var expect = chai.expect;

/**
 * Gets the specified file's contents
 *
 * @param {string} name File name
 *
 * @returns {object} File's contents
 */
function getFile(name) {
    // Read from the file system (NodeJS)
    var data = fs.readFileSync(path.join(__dirname, "data", name), "utf8");
    return JSON5.parse(data);
}

var CpuProfileFilter = require("../src/cpuprofile-filter");

// load all of the test data files
var tests = fs.readdirSync(path.join(__dirname, "data")).map(function(name) {
    return name.replace(".json5", "");
});

//
// CpuProfileFilter
//
describe("CpuProfileFilter examples", function() {
    for (var i = 1; i <= tests.length; i++) {
        var test = tests[i - 1];

        describe(test, function() {
            it("Should parse " + test + ".cpuprofile OK", (function(n) {
                return function() {
                    var profile = getFile(n + ".json5").profile;

                    expect(profile).to.exist;
                    expect(profile).to.have.property("nodes");
                    expect(profile).to.have.property("startTime");
                    expect(profile).to.have.property("endTime");
                    expect(profile).to.have.property("samples");
                };
            }(test)));

            it("Should parse " + test + ".config.json5 OK", (function(n) {
                return function() {
                    var config = getFile(n + ".json5").config;

                    expect(config).to.exist;
                    expect(config).to.have.property("files");
                    expect(config).to.have.property("ignore");
                };
            }(test)));

            it("Should parse " + test + ".result.json5 OK", (function(n) {
                return function() {
                    var results = getFile(n + ".json5").results;

                    expect(results).to.exist;
                    expect(results).to.have.property("startTime");
                    expect(results).to.have.property("endTime");
                    expect(results).to.have.property("duration");
                    expect(results).to.have.property("sampleCount");
                    expect(results).to.have.property("timePerSample");
                    expect(results).to.have.property("cpuTime");
                    expect(results).to.have.property("cpuTimeFiltered");
                    expect(results).to.have.property("idleTime");
                };
            }(test)));

            it("Should get the expected result of filtering the profile via the config", (function(n) {
                return function() {
                    var file = getFile(n + ".json5");

                    var exec = CpuProfileFilter.filter(file.profile, file.config);

                    expect(exec).to.deep.equal(file.results);
                };
            }(test)));
        });
    }
});
