"use strict";

//
// Imports
//
var _ = require("lodash");

// JSON5 auto-parsing
require("json5/lib/require");

//
// Functions
//

/**
 * Runs a filter against the specified profile
 *
 * @param {object} profile .cpuprofile JSON
 * @param {config} config Filter config
 *
 * @returns {object} Results
 */
function filter(profile, config) {
    if (!profile ||
        !config ||
        !profile.startTime ||
        !profile.endTime ||
        !profile.samples) {
        return undefined;
    }

    // sample profile nodes
    var nodes = {};

    // known frames
    var frames = {};

    //
    // Calculate start and end times, number of samples, etc
    //
    var result = {
        startTime: profile.startTime,
        endTime: profile.endTime,
        duration: profile.endTime - profile.startTime,
        sampleCount: profile.samples.length,
        timePerSample: 0,
        cpuTime: 0,
        cpuTimeFiltered: 0,
        idleTime: 0,
        programTime: 0,
        garbageTime: 0
    };

    // how much time each sample was for
    result.timePerSample = result.duration / result.sampleCount;

    //
    // Generate profiler stacks
    //

    // iterate over each sample
    _.each(profile.nodes, function(node) {
        // calculate CPU time in microseconds
        node.cpuTime = Math.round(node.hitCount * result.timePerSample * 1000) / 1000;

        if (node.callFrame && node.callFrame.functionName === "(idle)") {
            result.idleTime += node.cpuTime;
        } else if (node.callFrame && node.callFrame.functionName === "(program)") {
            result.programTime += node.cpuTime;
            result.cpuTime += node.cpuTime;
        } else if (node.callFrame && node.callFrame.functionName === "(garbage collector)") {
            result.garbageTime += node.cpuTime;
            result.cpuTime += node.cpuTime;
        } else {
            result.cpuTime += node.cpuTime;
        }

        nodes[node.id] = node;
    });

    //
    // Build all known frames
    //
    _.each(nodes, function(node) {
        if (node.children && node.children.length) {
            buildFrame(nodes, frames, node.id, []);
        }
    });

    // run the filter over all of the nodes
    var filteredNodes = filterNodes(nodes, frames, config);

    //
    // Determine how much time is in the filtered stacks
    //

    // re-iterate over all of the filtered nodes
    _.each(filteredNodes, function(node) {
        result.cpuTimeFiltered += node.cpuTime;

        if (process.env.DEBUG && process.env.DEBUG.split(" ").indexOf("cpuprofile-filter") !== -1) {
            /* eslint-disable no-console */

            // log how long this node took
            console.log(node.cpuTime + "ms");

            // show all of the frames
            console.log(_.map(frames[node.id].slice(1), function(frame) {
                if (!frame.functionName) {
                    return frame.url + ":" + frame.lineNumber + ":" + frame.columnNumber;
                } else {
                    return frame.functionName + " (" + frame.url + ")";
                }
            }));

            /* eslint-enable no-console */
        }
    });

    // round filtered CPU time to 3 digits
    result.cpuTimeFiltered = Math.round(result.cpuTimeFiltered * 1000) / 1000;

    return result;
}

/**
 * Builds the specified frame
 *
 * @param {object[]} nodes CPUProfile nodes
 * @param {object} frames Known frames
 * @param {string} id Node ID
 * @param {string[]} stack Current stack
 */
function buildFrame(nodes, frames, id, stack) {
    var node = nodes[id];

    // add this frame onto the stack
    stack.push(node.callFrame);

    // iterate through any children
    if (node.children && node.children.length) {
        for (var i = 0; i < node.children.length; i++) {
            buildFrame(nodes, frames, node.children[i], stack.slice(0));
        }
    }

    // save this frame
    if (!frames[id]) {
        frames[id] = stack;
    }
}

/**
 * Runs the filter against the list of frames
 *
 * @param {object[]} nodes Node list
 * @param {object} frames Frames lookup
 * @param {object} config CPUProfileFilter config
 *
 * @returns {object} Filtered list of nodes
 */
function filterNodes(nodes, frames, config) {
    return _.filter(nodes, function(node) {
        var matched = false;

        // get the frames for this node
        var filteredFrames = frames[node.id];

        // remove any ignored functions
        if (config.ignore) {
            filteredFrames = _.filter(filteredFrames, function(frame) {
                return !_.find(config.ignore, function(ignore) {

                    if (ignore.functionName) {
                        // if there's a function name
                        return frame.functionName === ignore.functionName;
                    } else if (ignore.lineNumber && ignore.columnNumber) {

                        // if there's a line/column number
                        return frame.lineNumber === ignore.lineNumber &&
                               frame.columnNumber === ignore.columnNumber;
                    }

                    return false;
                });
            });
        }

        // if there's a list of files, only include ones that are specified
        if (config.files) {
            matched = _.find(config.files, function(file) {
                return matchesFile(filteredFrames, file);
            });
        }

        return matched;
    });
}

/**
 * Determines if any of the frames has the specified file
 *
 * @param {object[]} frames Stack frames
 * @param {string} match Regular expression match
 *
 * @returns {boolean} True if any of the frames match the file
 */
function matchesFile(frames, match) {
    var re = new RegExp(match);

    return _.find(frames, function(frame) {
        return frame.url && frame.url.match(re);
    });
}

//
// Exports
//
module.exports = {
    filter: filter
};
