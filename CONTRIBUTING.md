# Design

## Text Corpus

All text used in the interface is configured by files in [`/levels`](/levels).

Files should be created for `1.txt` to `12.txt` for grade level texts.
These files should have lines of text to be spoken by the application at the appropriate level. E.G. with a file `1.txt`:

```txt
I am happy.
Birds Sing.
```

Would create 2 audio snippets and texts to be read at grade level 1 in the corresponding order: `I am happy.` then `Birds sing.`.

Any file that is not `NUMBER.txt` will be treated as a special ad-hoc file and audio for the first line of the file will be generated.

The only file used for this nature is [`help.txt`](/levels/help.txt)

## Changing the user interface

| File | Purpose |
| ---- | ---- |
| [`/scaffold/player.html`](/scaffold/index.html) | This file represents all the visual containers that the application uses. It does not contain styles. It does not contain interactivity for events such as clicking buttons. If you need to add a space to put text, add a button, or change the organization of containers you likely want to edit this file. |
| [`/scaffold/interactivity.js`](/scaffold/interactivity.js) | This file represents all behaviors that respond to user interface events. If you are looking to react to some event like the grade changing, you likely want to edit this file. NOTE: this file uses IE11 compatible syntax and thus most modern features of JS are not used, intentionally. |
| [`/scaffold/style.css`](/scaffold/style.css) | This file represents all styling of elements in `player.html`. If you are looking to change colors, padding, or layout you likely want to edit this file. NOTE: button images are not styled by this file, in order to change those colors use an SVG editor. |

## Automation

The app will be placed in [`/build`](/build) every time the repository is pushed to.
This is controlled by [the github action](.github/workflows/sync.yaml).
The action uses scripts in [`/actions`](/actions) to take the files from `/levels` and `/scaffold`.
The scripts run commands to generate the appropriate files for the application under `/build`.

Roughly:

1. The texts in `/levels` are compiled into a mapping of "text snippet."->"audio_NUMBER.mp3" in [`/build/text-to-mp3s.json`](/build/text-to-mp3s.json). If audio for a text does not exist it is created as a new audio file, but if it already exists no action is taken. NOTE: Audio files are not deleted if they do not have an entry in `text-to-mp3s.json`.
1. The files in `/levels` are sorted by if they are a grade level or ad-hoc text, then placed into [`/build/mp3s.json`](/build/mp3s.json). This is the file used to generate what a user sees and hears when running the application.
1. The files in `/scaffold` are copied to `/build`.
