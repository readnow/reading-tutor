# Reading Tutor

## LICENSE

[Unlicense](https://spdx.org/licenses/Unlicense.html)

## Generating audio files to be used for the web

In order to run the Reading Tutor, all lines to be read aloud must be
created before the app is opened. This gives better audio results and
makes it so that more web browsers are able to run Reading Tutor.

Prerequisites:

* The `node` CLI must be installed
* The `aws` CLI must be installed

In order to generate the audio files it needs to be given what text needs
to be converted into audio. In order to do so, create a `.txt` where each
line is a sentence to be read by Reading Tutor. E.G. a `grade1.txt` file
might look like:

```txt
I am happy.
Dogs bark.
Birds sing.
```

Running:

```console
node generate_audio_files.js grade1.txt
```

Will instruct `generate_audio_files.js` to read all lines of `grade1.txt`
and generate audio accordingly.

## Build the web page for the application

In order to run the Reading Tutor it needs to list the texts for the web
page to show and in what order. This is related to but independent of the
list of available audio files.

In order to build the web page, the list of grades for the
web page will be used when you run:

```console
node build_web_page.js 1=grade1.txt 2=grade2.txt
```

Would generate the web page with 2 grade levels `1` and `2` with text from
the 2 files `grade1.txt` and `grade2.txt`. Grades that are not whole numbers, are less than 1, or if the list has missing increments will cause errors.

## Hosting the web application

On a static file server, place a copy of the `build/` directory after
generating the audio files and the web page. It will contain a file
`index.html` that can be opened to run the Reading Tutor within a web
browser.
