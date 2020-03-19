'use strict';
/**
 * @author Matthew Carlson <mj.carlson801@gmail.com>
 */
//
// usage: node generate_audio_files.js lines.txt
//
// each line of the .txt file represents an audio clip to be generated
//
// e.g. to create a set of 3 audio files:
//
// ---- test.txt ----
// Test
// this
// out.
// --------
//
// it would create 3 audio files with "Test", "this", and "out."
//
// it will store the mapping of text to audio in a JSON file "text-to-mp3s.json"
//
// it will generate audio files of the name audio_NNN.mp3 where "NNN" is
// replaced with a number
//
// it will not generate audio files if a mapping already exists
//
const fs = require("fs");
const { spawnSync } = require("child_process");

//Capture text file to use
let fileToUse = process.argv[2];
if (typeof fileToUse !== "string") {
  console.error("Please pass in a file to parse");
  process.exit(1);
}

//Read file and convert to strings
let content = fs.readFileSync(fileToUse, "utf8").toString();

//create Map from file, but make an empty one if it fails
let contentMap;
try {
  let readJSON = fs.readFileSync("text-to-mp3s.json", "utf8").toString();
  let parsedJSON = JSON.parse(readJSON);
  contentMap = new Map(parsedJSON);
} catch (e) {
  contentMap = new Map();
}

//read txt-to-mp3s.json and push to Map

//create counter for filename
let counter = contentMap.size + 1;

//create function that checks if filename is already a value in the Map
let mp3File;
function createFilename() {
  mp3File = "audio_" + counter + ".mp3";
  while (Array.from(contentMap.values()).includes(mp3File) ||
    fs.existsSync(mp3File) === true
  ) {
    counter++;
    mp3File = "audio_" + counter + ".mp3";
  }
}

//populate Map
for (let text of content.split(/\r?\n/)) {
  if (text.trim().length === 0) continue;
  //check if text already exists
  if (contentMap.has(text)) {
    // do nothing
  } else {
    //add to Map
    createFilename();
    let result = spawnSync("aws", [
      "--region",
      "us-east-1",
      "polly",
      "synthesize-speech",
      "--engine",
      "neural",
      "--language",
      "en-US",
      "--output-format",
      "mp3",
      "--voice-id",
      "Joanna",
      "--text-type",
      "text",
      "--text",
      text,
      mp3File
    ]);
    console.log(result.stdout.toString());
    console.log(result.stderr.toString());
    if (result.status !== 0) {
      console.error("Failed to generate audio file");
      process.exit(1);
    }
    contentMap.set(text, mp3File);
  }
}

//convert Map contents to JSON
let data = JSON.stringify([...contentMap]);

//update 'text-to-mp3s.json.'
fs.writeFileSync("./text-to-mp3s.json", data, { encoding: "utf8" });
