VF = Vex.Flow
QUEUE_LEN = 5;
QUEUE_GAP = 100;
NOTE_SPEED = 100; //pixels per second
TREBLE_NOTES = ['c/4', 'd/4', 'e/4', 'f/4', 'g/4', 'a/4', 'b/4', 
                'c/5', 'd/5', 'e/5', 'f/5', 'g/5'];//, 'a/5', 'b/5', 
                // 'c/6'];
NOTE_LENGTHS = ['1', '2', '4', '8'];
notes_queue = Array();

function random_elem(items) {
  return items[Math.floor(Math.random()*items.length)];
}

function simulate_event(element, eventName)
{
    var options = extend(defaultOptions, arguments[2] || {});
    var oEvent, eventType = null;

    for (var name in eventMatchers)
    {
        if (eventMatchers[name].test(eventName)) { eventType = name; break; }
    }

    if (!eventType)
        throw new SyntaxError('Only HTMLEvents and MouseEvents interfaces are supported');

    if (document.createEvent)
    {
        oEvent = document.createEvent(eventType);
        if (eventType == 'HTMLEvents')
        {
            oEvent.initEvent(eventName, options.bubbles, options.cancelable);
        }
        else
        {
            oEvent.initMouseEvent(eventName, options.bubbles, options.cancelable, document.defaultView,
            options.button, options.pointerX, options.pointerY, options.pointerX, options.pointerY,
            options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, element);
        }
        element.dispatchEvent(oEvent);
    }
    else
    {
        options.clientX = options.pointerX;
        options.clientY = options.pointerY;
        var evt = document.createEventObject();
        oEvent = extend(evt, options);
        element.fireEvent('on' + eventName, oEvent);
    }
    return element;
}

function extend(destination, source) {
    for (var property in source)
      destination[property] = source[property];
    return destination;
}

var eventMatchers = {
    'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
    'MouseEvents': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
}

var defaultOptions = {
    pointerX: 0,
    pointerY: 0,
    button: 0,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    bubbles: true,
    cancelable: true
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
renderer.resize(QUEUE_LEN*QUEUE_GAP+10, 400);

var ctx = renderer.getContext();
var treble_staf = new VF.Stave(10, 40, QUEUE_LEN*QUEUE_GAP);
treble_staf.addClef('treble');
treble_staf.setContext(ctx).draw();

var bass_staf =new VF.Stave(10, 120, QUEUE_LEN*QUEUE_GAP);
bass_staf.addClef('bass');
bass_staf.setContext(ctx).draw(); 

var tick_ctxt = new VF.TickContext();
var notes_queue = Array();
for (var i = 0; i < QUEUE_LEN; i++) {
    var note_raw = random_elem(TREBLE_NOTES);
    var duration = random_elem(NOTE_LENGTHS);
    var note = new VF.StaveNote({clef:'treble', keys: [note_raw], duration: duration});
    note = note.setContext(ctx).setStave(treble_staf);
    tick_ctxt.addTickable(note);
    tick_ctxt.preFormat().setX(QUEUE_LEN*QUEUE_GAP);
    var group = ctx.openGroup();
    note.draw();
    group.dataset.note = note_raw;
    group.dataset.duration = duration;
    ctx.closeGroup();
    notes_queue.push(group);
}

d3.selectAll(notes_queue)
  .transition()
    .ease(d3.easeLinear)
    .delay(function(d, i) {return Math.round(1000*QUEUE_GAP/NOTE_SPEED*i);})
    .duration(function(d, i) {return Math.round(1000*(QUEUE_LEN - i)*QUEUE_GAP/NOTE_SPEED);})
  .attr("transform", function(d, i){
    //   var tmp = -(QUEUE_LEN - i)*QUEUE
      return `translate(${-(QUEUE_LEN-i)*QUEUE_GAP}, 0)`;
  });


function correct_treble_note() {
    var note_raw = random_elem(TREBLE_NOTES);
    var duration = random_elem(NOTE_LENGTHS);
    var note = new VF.StaveNote({clef:'treble', keys: [note_raw], duration: duration});
    note = note.setContext(ctx).setStave(treble_staf);
    tick_ctxt.addTickable(note);
    tick_ctxt.preFormat().setX(QUEUE_LEN*QUEUE_GAP);
    var group = ctx.openGroup();
    note.draw();
    group.dataset.note = note_raw;
    group.dataset.duration = duration;
    ctx.closeGroup();
    notes_queue.push(group);
    
    d3.selectAll(notes_queue).interrupt();
    var first_note = notes_queue.shift();
    var [x, y] = getTranslation(d3.select(first_note).attr('transform'));
    d3.select(first_note).transition().duration(1000).style("opacity", 0).attr("transform", `translate(${x}, -500)`);
    x = (QUEUE_LEN*QUEUE_GAP + x)
    var q = Math.floor(x/QUEUE_GAP);
    var r = Math.round(x) % QUEUE_GAP;
    
    window.setTimeout(function(node) {
      node.remove();
    }, 2000, first_note);
     
    var data = Array(QUEUE_LEN);
    var I = QUEUE_LEN - q - 1;
    for (var i = 0; i < QUEUE_LEN; i++){
        if (i >= I) {
          var delay = Math.round(1000*(r + (i - I)*QUEUE_GAP)/NOTE_SPEED);
          var duration = Math.round(1000*(QUEUE_LEN - i)*QUEUE_GAP/NOTE_SPEED); 
        } else {
          var delay = 0;
          var duration = Math.round(1000*(x+QUEUE_GAP)/NOTE_SPEED);
        }
        data[i] = {"delay": delay, "duration": duration}; 
    }

    d3.selectAll(notes_queue)
    .data(data)
    .transition()
        .ease(d3.easeLinear)
        .delay(function(d, i) {return d.delay;})
        .duration(function(d, i) {return d.duration;})
    .attr("transform", function(d, i){
        //   var tmp = -(QUEUE_LEN - i)*QUEUE
        return `translate(${-(QUEUE_LEN-i)*QUEUE_GAP}, 0)`;
    });
}


/**
 * Virtual Piano 
 */
const synth = new Tone.Synth().toMaster();

function note_pressed(e) {
  var note = e.target.id;
  synth.triggerAttackRelease(e.target.id, '4n');
  note = note.toLowerCase();
  var correct_ans = notes_queue[0].dataset.note;
  if ((note[0] == correct_ans[0]) &&
      (note[1] == correct_ans[correct_ans.length-1])) {
        var class_added = "activeCorrect";
        correct_treble_note();
  } else {
    var class_added = "activeWrong";
  }
  e.target.classList.add(class_added);
  window.setTimeout(function(elem, class_to_remove) {
    elem.classList.remove(class_to_remove);
  }, 1000, e.target, class_added); 
}

var piano = document.getElementById('piano');
var keys = piano.getElementsByClassName('anchor');
for (var i = 0; i < keys.length; i++) {
  keys[i].addEventListener('click', note_pressed);
}

keys = piano.getElementsByTagName('span');
for (var i = 0; i < keys.length; i++) {
  keys[i].addEventListener('click', note_pressed);
}

window.addEventListener('keydown', function(e) {
  var key = e.key;
  if (key < 'a' || key > 'g')
    return;
  var current_note = notes_queue[0].dataset.note;
  var octave = current_note[current_note.length - 1];
  document.getElementById(key.toUpperCase()+octave).click();
})