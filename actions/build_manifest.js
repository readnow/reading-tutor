const fs = require('fs');
const path = require('path');
const levelTextPaths = process.argv.slice(2);

if (levelTextPaths.length === 0) {
  console.error('Must include at least 1 text file to process');
  process.exit(1);
}

const existingAudio = new Map(
  JSON.parse(
    fs.readFileSync('./text-to-mp3s.json', 'utf8')
  )
);
const outPath = 'mp3s.json';
const adHoc = {};
const levels = {};
const seenAudio = new Set();
for (const levelTextPath of levelTextPaths) {
  const level = path.basename(levelTextPath, '.txt');
  const levelText = fs.readFileSync(levelTextPath, 'utf8');
  if (level === `${+level}`) {
    const lines = levels[level] = [];
    // grade level
    for (const line of levelText.split(/\r?\n/g)) {
      if (line.trim().length === 0) continue;
      const audioPath = existingAudio.get(line);
      if (audioPath) {
        seenAudio.add(audioPath);
        lines.push([line, audioPath]);
      } else {
        console.error(`couldn't find audio for ${
          JSON.stringify(line)}, found in ${levelTextPath}
        `.replace(/\s+/, ' '));
        process.exit(1);
      }
    }
  } else {
    if (level === 'levels') {
      console.error(
        'File named levels.txt is not allowed, please rename file.'
      );
      process.exit(1);
    }
    const audioPath = existingAudio.get(levelText);
    if (audioPath) {
      seenAudio.add(audioPath);
      adHoc[level] = [levelText, audioPath];
    } else {
      console.error(`couldn't find audio for ${
        JSON.stringify(levelText.replace(/(?:\r?\n)+$/, ''))
      }, be sure it was generated, if it was a multi-line file,
        it needs to be changed to a single line.
      `.replace(/\s+/, ' '));
      process.exit(1);
    }
  }
}
fs.writeFileSync(
  outPath,
  JSON.stringify({
    ...adHoc,
    levels
  }),
  'utf8'
);
process.stdout.write([...seenAudio].join('\n') + '\n');
