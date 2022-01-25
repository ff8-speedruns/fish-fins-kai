function play() {
    var audioFiles = [
        'ayayaya',
        'ahnonono',
        'cantsee',
        'cantseegame',
        'dontknowcalm',
        'dontknow',
        'laugh',
        'batman',
        'foudre',
        'ultima',
        'what',
        'whatareyoudoing',
        'allo'
    ];
    var randomSound = audioFiles[Math.floor(Math.random()*audioFiles.length)];
    var audio = document.getElementById("kaiaudio");
    audio.src = `mp3/${randomSound}.mp3`;
    audio.play();
  }