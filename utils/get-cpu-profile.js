/* eslint-disable no-console,no-process-exit */
"use strict";

//
// Imports
//
const fs = require("fs");

const cdp = require("chrome-remote-interface");
const chromeLauncher = require("chrome-launcher");

// sleep promise
const sleep = n => new Promise(resolve => setTimeout(resolve, n));

// how long to wait after a page load for profiling data
const LOAD_WAIT = 1000;

//
// Arguments
//
if (process.argv.length < 5) {
    console.log("Usage: get-cpu-profile.js [url] [tag] [iterations]");
    process.exit(1);
}

const url = process.argv[2];
const tag = process.argv[3] ? process.argv[3] : "profile";
const iterations = process.argv[4] ? process.argv[4] : 1;

(async function() {
    // launch chrome
    const chrome = await chromeLauncher.launch({
        port: 9222,
        chromeFlags: ["--headless", "--disable-gpu"]
    });

    // load the page the specified number of times
    for (var i = 0; i < iterations; i++) {
        console.log();
        console.log("Iteration", i);
        await loadPage(i);
    }

    // stop this chrome load
    await chrome.kill();

    async function loadPage(iteration) {
        // get the remote interface
        const client = await cdp();

        const { Profiler, Page } = client;

        // open the Page
        console.log("Opening Page");
        await Page.enable();

        // enable the Profiler
        console.log("Opening Profiler");
        await Profiler.enable();

        // sample at 100ns
        await Profiler.setSamplingInterval({ interval: 100 });

        // ensure the browser cache is cleared
        console.log("Clearing browser cache");
        await client.send("Network.clearBrowserCache");

        console.log("Starting Profiler");
        await Profiler.enable();
        await Profiler.start();

        // navigate
        console.log(`Navigating to ${url}`);
        await Page.navigate({
            url
        });

        // wait a bit after the page has loaded, then save the profiler data
        return new Promise(async function(resolve) {
            await client.on("Page.loadEventFired", async() => {
                console.log(`Page has loaded!  Waiting ${LOAD_WAIT}ms for profile.`);
                await sleep(LOAD_WAIT);

                // get the profiler data
                const data = await Profiler.stop();

                // save it to a file
                await saveProfile(data, iteration);

                await client.close();

                resolve(true);
            });
        });
    }

    async function saveProfile(data, iteration) {
        const filename = `${tag}-${iteration}-${Date.now()}.cpuprofile`;
        const string = JSON.stringify(data.profile, null, 2);

        // write the profiler data to a file
        fs.writeFileSync(filename, string);

        console.log("Done! Profile data saved to:", filename);
    }
}());
