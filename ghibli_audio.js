/* Lightweight Ghibli Audio Manager for English with Abdi */
(function () {
  var bgm = null;
  var bgmPlaying = false;

  function playFile(src, vol) {
    try {
      var a = new Audio(src);
      a.volume = typeof vol === 'number' ? vol : 0.45;
      a.play().catch(function () {});
    } catch (e) {}
  }

  function ensureBGM() {
    if (!bgm) {
      bgm = new Audio('audio/ghibli_bg_music.mp3');
      bgm.loop = true;
      bgm.volume = 0.2;
    }
    return bgm;
  }

  function syncBGMButtonState() {
    var btns = document.querySelectorAll('#toggleAmbientBtn, .bgm-btn-text');
    btns.forEach(function (el) {
      if (el.classList && el.classList.contains('bgm-btn-text')) {
        el.textContent = bgmPlaying ? 'Music: On' : 'Music: Off';
      }
    });
  }

  window.GhibliAudio = {
    toggleBGM: function () {
      var a = ensureBGM();
      if (bgmPlaying) {
        a.pause();
        bgmPlaying = false;
      } else {
        a.play().then(function () {
          bgmPlaying = true;
          syncBGMButtonState();
        }).catch(function () {});
        bgmPlaying = true;
      }
      syncBGMButtonState();
    },
    syncBGMButtonState: syncBGMButtonState,
    duckBGM: function () {
      if (bgm && bgmPlaying) bgm.volume = 0.06;
    },
    unduckBGM: function () {
      if (bgm && bgmPlaying) bgm.volume = 0.2;
    },
    playClick: function () { playFile('audio/ghibli_click.wav', 0.35); },
    playChime: function () { playFile('audio/ghibli_chime.wav', 0.45); },
    playFanfare: function () { playFile('audio/ghibli_chime.wav', 0.55); },
    playWaterDrop: function () { playFile('audio/ghibli_waterdrop.wav', 0.4); }
  };

  window.playGhibliWaterdrop = window.GhibliAudio.playWaterDrop;
})();
