/* eslint-disable no-unused-expressions */
"use strict";

//
// Imports
//
var CpuProfileFilter = require("../src/cpuprofile-filter");

var chai = require("chai");
var expect = chai.expect;

//
// CpuProfileFilter
//
describe("CpuProfileFilter", function() {
    //
    // .trimTiming
    //
    describe(".filter()", function() {
        it("should return undefined if missing arguments", function() {
            expect(CpuProfileFilter.filter()).to.equal(undefined);
            expect(CpuProfileFilter.filter({})).to.equal(undefined);
        });

        it("should return undefined if given empty input", function() {
            expect(CpuProfileFilter.filter({}, {})).to.equal(undefined);
        });
    });
});
