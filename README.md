# cpuprofile-filter

v1.0.0

[via Nic Jansma http://nicj.net](http://nicj.net)

Licensed under the MIT license

## Introduction

Takes a `.cpuprofile` and determines the amount of time that was spent in or under
(inclusive) a configurable list of source files.

As an example use case, `cpuprofile-filter` can be used to determine how much
work a first- or third-party library is doing during page load.

## Download

Releases are available for download from [GitHub](https://github.com/nicjansma/cpuprofile-filter.js).

### NPM

`cpuprofile-filter` is available as the [npm cpuprofile-filter module](https://npmjs.org/package/cpuprofile-filter). You can install it
using Node Package Manager (npm):

    npm install cpuprofile-filter

## Usage

Given a `.cpuprofile` input (JSON), `cpuprofile-filter` will analyze all of the stacks
in the profile and calculate statistics such as how long the profile was captured for,
total CPU time, idle CPU time, and the inclusive CPU time that was spent in the list of target files.

```js
// import
var CpuProfileFilter = require("cpuprofile-filter");

// filter a profile
var results = CpuProfileFilter.filter(profile, config);

// filtered CPU time
var time = results.cpuTimeFiltered;
```

For example, you could specify a configuration of:

```js
CpuProfileFilter.filter(profile, {
    "files": [
        "a.js"
    ]
});
```

And `cpuprofile-filter` will return the amount of time (in microseconds) that
were spent in any function of `a.js`, and, any work done (in any other function
or file) triggered by a function in `a.js`.

`cpuprofile-filter` can optionally be given a list of functions to ignore.

For example, you could specify that you want to track anything in `a.js` _except_
for calls to `wrapper()` in `a.js`:

```js
CpuProfileFilter.filter(profile, {
    "files": [
        "a.js"
    ],
    "ignore": [
        {
            "functionName": "wrapper"
        }
    ]
});
```

For the above example, note that as long as there is a second or more
function in `a.js` besides `wrapper()` on the call stack, the sample will still be counted.

### API

#### `CpuProfileFilter.filter(profile, config)`

Filters a `.cpuprofile` against the given config

**Arguments**:
* `profile`: `.cpuprofile` data (in JSON)
* `config`
* `config.files`: A list of file names to filter
* `config.ignore`: A list of ignores
* `config.ignore.functionName`: A function name to ignore

**Returns**: An object with the following properties

```js
{
    startTime: 1000,        // start time (microseconds)
    endTime: 2000,          // end time (microseconds)
    duration: 1000,         // duration (microseconds)
    sampleCount: 10,        // number of samples
    timePerSample: 100,     // time per sample (microseconds)
    cpuTime: 1000,          // CPU time of the entire profile (microseconds)
    cpuTimeFiltered: 500,   // CPU time of the filtered functions (microseconds)
    idleTime: 0             // Idle time (microseconds)
}
```

## Tests

Tests are provided in the ``test/`` directory, and can be run via ``mocha``:

    mocha test/*

Or via ``gulp``:

    gulp test

## Version History

* v1.0.0 - 2017-09-13: Initial version
