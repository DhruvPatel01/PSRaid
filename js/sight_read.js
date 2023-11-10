VF = Vex.Flow
QUEUE_LEN = 5;
QUEUE_GAP = 100;
NOTE_SPEED = 100; //pixels per second
NOTES = [];
NOTE_LENGTHS = ['1', '2', '4', '8'];
notes_queue = Array();

var practiceKeys = document.querySelectorAll('#practice_keys input');
practiceKeys.forEach(function (input, index) {
  if (input.checked) NOTES.push(input.value);

  input.addEventListener('change', function () {
    var idx = NOTES.indexOf(input.value);
    if (input.checked && idx == -1) {
      NOTES.push(input.value);
      if (notes_queue.length < QUEUE_LEN) 
        append_random_note();
    }

    if (!input.checked && idx > -1) {
      NOTES.splice(idx, 1);
    }
    console.log(NOTES);
  });
});


function random_elem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function getTranslation(transform) {
  //https://stackoverflow.com/questions/38224875/replacing-d3-transform-in-d3-v4/38230545#38230545
  var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttributeNS(null, "transform", transform);
  var matrix = g.transform.baseVal.consolidate().matrix;
  return [matrix.e, matrix.f];
}

var renderer = new VF.Renderer(document.getElementById('stave'),
  VF.Renderer.Backends.SVG);
renderer.resize(QUEUE_LEN * QUEUE_GAP + 10, 300);

var ctx = renderer.getContext();
var treble_staff = new VF.Stave(10, 40, QUEUE_LEN * QUEUE_GAP);
var bass_staff = new VF.Stave(10, 120, QUEUE_LEN * QUEUE_GAP);
treble_staff.addClef('treble').setContext(ctx).draw();
bass_staff.addClef('bass').setContext(ctx).draw();
var stavs = { 'treble': treble_staff, 'bass': bass_staff };

var tick_ctxt = new VF.TickContext();

function append_random_note() {
  if (NOTES.length == 0) return;

  var note_raw = random_elem(NOTES);
  if (note_raw[2] < '4') 
    clef_used = "bass";
  else
    clef_used = "treble";

  var duration = random_elem(NOTE_LENGTHS);
  var note = new VF.StaveNote({ clef: clef_used, keys: [note_raw], duration: duration });
  note = note.setContext(ctx).setStave(stavs[clef_used]);
  tick_ctxt.addTickable(note);
  tick_ctxt.preFormat().setX(QUEUE_LEN * QUEUE_GAP);
  var group = ctx.openGroup();
  note.draw();
  group.dataset.note = note_raw.replace("/", "").toUpperCase();
  group.dataset.duration = duration;
  group.dataset.clef = clef_used;
  ctx.closeGroup();
  notes_queue.push(group);
}

for (var i = 0; i < QUEUE_LEN; i++) {
  append_random_note();
}

d3.selectAll(notes_queue)
  .transition()
  .ease(d3.easeLinear)
  .delay(function (d, i) { return Math.round(1000 * QUEUE_GAP / NOTE_SPEED * i); })
  .duration(function (d, i) { return Math.round(1000 * (QUEUE_LEN - i) * QUEUE_GAP / NOTE_SPEED); })
  .attr("transform", function (d, i) {
    return `translate(${-(QUEUE_LEN - i) * QUEUE_GAP}, 0)`;
  });


function correct_treble_note() {
  
  append_random_note();

  d3.selectAll(notes_queue).interrupt();

  var first_note = notes_queue.shift();
  var [x, y] = getTranslation(d3.select(first_note).attr('transform'));

  d3.select(first_note).transition().duration(1000).style("opacity", 0).attr("transform", `translate(${x}, -500)`);
  x = (QUEUE_LEN * QUEUE_GAP + x)
  var q = Math.floor(x / QUEUE_GAP);
  var r = Math.round(x) % QUEUE_GAP;

  window.setTimeout(function (node) {
    node.remove();
  }, 2000, first_note);

  var data = Array(QUEUE_LEN);
  var I = QUEUE_LEN - q - 1;
  for (var i = 0; i < QUEUE_LEN; i++) {
    if (i >= I) {
      var delay = Math.round(1000 * (r + (i - I) * QUEUE_GAP) / NOTE_SPEED);
      var duration = Math.round(1000 * (QUEUE_LEN - i) * QUEUE_GAP / NOTE_SPEED);
    } else {
      var delay = 0;
      var duration = Math.round(1000 * (x + QUEUE_GAP) / NOTE_SPEED);
    }
    data[i] = { "delay": delay, "duration": duration };
  }

  d3.selectAll(notes_queue)
    .data(data)
    .transition()
    .ease(d3.easeLinear)
    .delay(function (d, i) { return d.delay; })
    .duration(function (d, i) { return d.duration; })
    .attr("transform", function (d, i) {
      return `translate(${-(QUEUE_LEN - i) * QUEUE_GAP}, 0)`;
    });
}


/**
 * Virtual Piano 
 */
const synth = new Tone.Synth().toMaster();
var mute_synth = false;

function note_pressed(e) {
  var note = e.target.dataset.key;
  if (note.length == 1) {
    note = note + notes_queue[0].dataset.note[1];
  }

  if (!mute_synth) {
    synth.triggerAttackRelease(note, '4n');
  }
  var correct_ans = notes_queue[0].dataset.note;
  if (note === correct_ans) {
    var class_added = "activeCorrect";
    correct_treble_note();
  } else {
    var class_added = "activeWrong";
  }
  e.target.classList.add(class_added);
  window.setTimeout(function (elem, class_to_remove) {
    elem.classList.remove(class_to_remove);
  }, 1000, e.target, class_added);
}

var piano = document.getElementById('piano');
var keys = piano.getElementsByClassName('anchor');
var keys_table = {};
for (var i = 0; i < keys.length; i++) {
  keys[i].addEventListener('click', note_pressed);
  keys_table[keys[i].dataset.key] = keys[i];
}

keys = piano.getElementsByTagName('span');
for (var i = 0; i < keys.length; i++) {
  keys[i].addEventListener('click', note_pressed);
  keys_table[keys[i].dataset.key] = keys[i];
}

window.addEventListener('keydown', function (e) {
  var key = e.key;
  if (key < 'a' || key > 'g')
    return;
  var octave = notes_queue[0].dataset.note[1];
  keys_table[key.toUpperCase() + octave].click();
})

/**
 * Follwing code is for simple 7 key keyboard for mobile
 * devices. Some code is repetative, I have not 
 * refactored it.
 */
var tmp = document.getElementById("simple_layout");
var tmp = tmp.children;
for (var i = 0; i < tmp.length; i++) {
  tmp[i].addEventListener("click", note_pressed);
}

/**
 * Following code is inspired(copied) from 
 * wonderful article by Jonathan Bergknoff.
 * More info @ https://github.com/jbergknoff/guitar-tuner/
 */

document.getElementById("start_recording").addEventListener('click', initialize);

var worker = new Worker("js/note_detection_worker.js");
worker.addEventListener("message", note_detected); //TODO: 

function note_detected(e) {
  if (e.data.avg_amplitude > 100) {

    console.log(e.data.avg_amplitude / e.data.amplitude)
    var note = e.data.note;
    var elem = document.getElementById(note);
    if (elem) {
      mute_synth = true;
      elem.click();
      mute_synth = false;
    }
  }
}

function initialize() {
  navigator.mediaDevices.getUserMedia({ 'audio': true }).then(use_stream);
}

var recording = true;

function use_stream(stream) {
  var audio_context = new AudioContext();
  var microphone = audio_context.createMediaStreamSource(stream);
  var script_processor = audio_context.createScriptProcessor(1024, 1, 1);

  script_processor.connect(audio_context.destination);
  microphone.connect(script_processor);

  var buffer = [];
  var sample_length_milliseconds = 100;

  // Need to leak this function into the global namespace so it doesn't get
  // prematurely garbage-collected.
  // http://lists.w3.org/Archives/Public/public-audio/2013JanMar/0304.html
  window.capture_audio = function (event) {
    if (!recording)
      return;

    buffer = buffer.concat(Array.prototype.slice.call(event.inputBuffer.getChannelData(0)));

    // Stop recording after sample_length_milliseconds.
    if (buffer.length > sample_length_milliseconds * audio_context.sampleRate / 1000) {
      recording = false;

      worker.postMessage
        (
          {
            "timeseries": buffer,
            "sample_rate": audio_context.sampleRate
          }
        );

      buffer = [];
      setTimeout(function () { recording = true; }, 100);
    }
  };

  script_processor.onaudioprocess = window.capture_audio;
}
