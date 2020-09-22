/**
 * This is used for offline application support
 */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function setupOffline() {
    window.removeEventListener("load", setupOffline);
    navigator.serviceWorker.register("./service-worker.js");
  });
}

/**
 * This displays any error to be shown to the user
 */
var error = /** @type {HTMLDivElement} */(document.getElementById("errorMessage"));

/**
 * This stores the text to be read and should match the audio to be played
 */
var text = /** @type {HTMLDivElement} */(document.getElementById("text"));
var passiveOption = { passive: true };

/**
 * This gets our manifest of all the text and audio files that could be
 * loaded while using the application
 */
var mp3sJSONXHR = new XMLHttpRequest();
mp3sJSONXHR.open("GET", "./mp3s.json");
mp3sJSONXHR.addEventListener('readystatechange', function onload(e) {
  if (mp3sJSONXHR.readyState === XMLHttpRequest.DONE) {
    if (mp3sJSONXHR.status !== 200) {
      var msg = 'Unable to connect, check your internet connection.';
      error.textContent = msg;
      document.body.classList.add('error');
      throw new Error(msg);
    } else {
      var json = JSON.parse(mp3sJSONXHR.responseText);
      mp3sJSONXHR = null;
      ready(json);
    }
  }
}, passiveOption);
mp3sJSONXHR.send();

function Spoken(text, mp3, cancelOnDoublePlay) {
  this.text = text;
  this.mp3 = mp3;
  /** @type {Promise<HTMLAudioElement>} */
  this.audioPromise = null;
  this.cancelOnDoublePlay = cancelOnDoublePlay;
}
Spoken.prototype = {
  audio: function audio() {
    if (this.audioPromise) return this.audioPromise;
    var that = this;
    var elem = new Audio(that.mp3);
    elem.load();
    elem.muted = false;
    elem.volume = 1;
    that.audioPromise = new Promise(function (f, r) {
      function unhook() {
        elem.removeEventListener("abort", fail);
        elem.removeEventListener("error", fail);
        elem.removeEventListener("canplaythrough", pass);
        elem.removeEventListener("load", pass);
      }
      function fail(e) {
        unhook();
        // will retry
        that.audioPromise = null;
        r(e);
      }
      function pass() {
        unhook();
        f(elem);
      }
      elem.addEventListener("abort", fail, passiveOption);
      elem.addEventListener("error", fail, passiveOption);
      elem.addEventListener("canplaythrough", pass, passiveOption);
      elem.addEventListener("load", pass, passiveOption);
    });
    return that.audioPromise;
  },
  stop: function stop() {
    if (!this.audioPromise) return;
    var that = this;
    return this.audioPromise.then(function (audio) {
      audio.pause();
      var i = playing.indexOf(that);
      if (i >= 0) {
        playing.splice(i, 1);
      }
    });
  },
  play: function play() {
    var that = this;
    stopSounds();
    if (that.cancelOnDoublePlay) {
      var i = playing.indexOf(that);
      if (i >= 0) {
        return;
      }
    }
    return this.audio().then(function (audio) {
      return new Promise(function (f) {
        audio.currentTime = 0;
        audio.play();
        var i = playing.indexOf(that);
        if (i < 0) {
          playing.push(that);
        }
        function end() {
          audio.removeEventListener("abort", end);
          audio.removeEventListener("end", end);
          audio.removeEventListener("pause", end);
          f();
        }
        audio.addEventListener("abort", end, passiveOption);
        audio.addEventListener("end", end, passiveOption);
        audio.addEventListener("pause", end, passiveOption);
      });
    });
  }
};
/** @type {HTMLLabelElement} */
var helpElem = (document.getElementById("help"));
/** @type {HTMLLabelElement} */
var decreaseGradeLevelElem = (document.getElementById("decreaseGradeLevel"));
/** @type {HTMLLabelElement} */
var increaseGradeLevelElem = (document.getElementById("increaseGradeLevel"));
/** @type {HTMLLabelElement} */
var previousSentenceElem = (document.getElementById("previousSentence"));
/** @type {HTMLLabelElement} */
var speakElem = (document.getElementById("speak"));
/** @type {HTMLLabelElement} */
var nextSentenceElem = (document.getElementById("nextSentence"));

/**
 * @param {HTMLLabelElement} elem 
 * @param {EventListenerOrEventListenerObject} action 
 */
function addClickAction(elem, action) {
  document.getElementById(elem.getAttribute('for')).addEventListener("click", action, passiveOption);
}

addClickAction(helpElem, helpAction);
addClickAction(decreaseGradeLevelElem, decreaseGradeLevelAction);
addClickAction(increaseGradeLevelElem, increaseGradeLevelAction);
addClickAction(previousSentenceElem, previousSentenceAction);
addClickAction(speakElem, speakAction);
addClickAction(nextSentenceElem, nextSentenceAction);

var currentLevel = Infinity;
var sentenceOffset = 0;
/** @type {Record<number, Spoken[]>} */
var levels;
var help;
function ready(mp3sJSON) {
  help = new Spoken(mp3sJSON.help[0], mp3sJSON.help[1], true);
  /**
   * @type {Map<number, Array<Spoken> >}
   */
  levels = {};
  for (var key in mp3sJSON.levels) {
    var sentencesGradeLevel = +key;
    if (sentencesGradeLevel < currentLevel) {
      currentLevel = sentencesGradeLevel;
    }
    var sentencesToMP3s = mp3sJSON.levels[key];
    for (var i = 0; i < sentencesToMP3s.length; i++) {
      var text = sentencesToMP3s[i][0];
      var mp3 = sentencesToMP3s[i][1];
      sentencesToMP3s[i] = new Spoken(text, mp3, false);
    }
    levels[sentencesGradeLevel] = sentencesToMP3s;
  }
  showSentence();
  
  var labels = document.getElementsByTagName("label");
  for (var labelI = 0; labelI < labels.length; labelI++) {
    /** @type {HTMLButtonElement} */(document.getElementById(labels[labelI].getAttribute('for'))).disabled = false;
  }
  disableInactiveButtons();
}

function disableInactiveButtons() {
  /** @type {HTMLButtonElement} */(document.getElementById(decreaseGradeLevelElem.getAttribute('for'))).disabled = (currentLevel - 1) in levels === false;
  /** @type {HTMLButtonElement} */(document.getElementById(increaseGradeLevelElem.getAttribute('for'))).disabled = (currentLevel + 1) in levels === false;
}

window.addEventListener("keyup", function (e) {
  if (e.key === "Escape" || e.key === "Esc") {
    stopSounds();
  } else if (e.key === "ArrowLeft" || e.key === "Left") {
    previousSentenceAction();
  } else if (e.key === "ArrowRight" || e.key === "Right") {
    nextSentenceAction();
  }
}, passiveOption);
/** @type {Spoken[]} */
var playing = [];
function stopSounds() {
  document.body.classList.remove("introducing");
  var todo = [];
  for (var i = 0; i < playing.length; i++) {
    todo.push(playing[i].stop());
  }
  return Promise.all(todo);
}

function getSentencesForGrade(gradeLevel) {
  return levels[gradeLevel];
}

function getSentence(gradeLevel, sentenceOffset) {
  return getSentencesForGrade(gradeLevel)[sentenceOffset];
}

function showSentence() {
  disableInactiveButtons();
  text.textContent = getSentence(currentLevel, sentenceOffset).text;
}

function helpAction() {
  help.play();
}

function nextSentenceAction() {
  sentenceOffset++;
  if (sentenceOffset >= getSentencesForGrade(currentLevel).length) {
    sentenceOffset = 0;
  }
  stopSounds();
  showSentence();
}
function previousSentenceAction() {
  sentenceOffset--;
  if (sentenceOffset < 0) {
    sentenceOffset = getSentencesForGrade(currentLevel).length - 1;
  }
  stopSounds();
  showSentence();
}

function increaseGradeLevelAction() {
  if ((currentLevel + 1) in levels === false) return;
  sentenceOffset = 0;
  currentLevel++;
  stopSounds();
  showSentence();
}

function decreaseGradeLevelAction() {
  if ((currentLevel - 1) in levels === false) return;
  sentenceOffset = 0;
  currentLevel--;
  stopSounds();
  showSentence();
}

function speakAction() {
  getSentence(currentLevel, sentenceOffset).play();
}
