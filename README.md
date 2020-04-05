# About

This is a webapp to learn sight reading. When I started learning sight reading, I wanted to find an app that can help it. I had simple requirenments. First it had to be open source, so that I can tinker with it, and second it should take real audio as an input from microphone and give me feedback. After not finding any app that satisfied me, I started my own.

As of now it is work in progress. It is not even alpha version. Audio input doesn't work properly (octave identification is sometimes incorrect). But virtual keyboard works properly. If you don't want to use real keyboard, do not give mic permission in the start. I will setup buttons to start and stop mic on your whim later. You can use your keyboard keys from A to F rather than using mouse on on screen keyboard. For now when you press say `a`, it plays `a` in the octave the target not is in. So if target note is say `C4` and you hit `a`, `A4` will be played.

# Credits
- On screen piano was written by [Taufik Nurrohman](https://hompimpaalaihumgambreng.blogspot.com/) and distributed under God Almighty Licence (whatever that means. See css/piano.css)
- [Tone.js](https://tonejs.github.io/) to generate audio notes, distributed under MIT licence.
- [Vexflow](https://www.vexflow.com/) to generate text notes etc, distributed under MIT licence.