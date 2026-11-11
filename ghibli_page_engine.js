/* ==========================================================================
   Studio Ghibli Interactive Edition — Runtime Page Engine
   ghibli_page_engine.js
   ========================================================================== */

(function (window, document) {
  'use strict';

  class GhibliPageEngine {
    constructor() {
      this.currentTheme = localStorage.getItem('ghibli_theme') || 'day';
      try {
        if (this.currentTheme !== 'day') {
          document.documentElement.classList.add('theme-' + this.currentTheme);
        }
      } catch(e) {}
      this.activeAudio = null;
      this.recordedBlobs = {};
      this.mediaRecorders = {};
      this.speechSynth = window.speechSynthesis || null;

      // Pomodoro Timer State
      this.pomodoroTime = 25 * 60; // 25 minutes default
      this.pomodoroMode = 'work'; // 'work' | 'break'
      this.pomodoroInterval = null;
      this.isPomodoroRunning = false;

      // 1.3 Substitution Chart Discovery State
      this.discoveredGreetings1_3 = new Set(["Hi! I am Charlotte."]);
      this.all12Greetings1_3 = [
        "Hi! I am Charlotte.",
        "Hi! I am Carla.",
        "Hi! I am Fatima.",
        "Hi! My name is Charlotte.",
        "Hi! My name is Carla.",
        "Hi! My name is Fatima.",
        "Hello! I am Charlotte.",
        "Hello! I am Carla.",
        "Hello! I am Fatima.",
        "Hello! My name is Charlotte.",
        "Hello! My name is Carla.",
        "Hello! My name is Fatima."
      ];

      // 3.3 Substitution Chart Discovery State
      this.discoveredSentences3_3 = new Set(["I am twenty-three years old."]);
      this.all9Sentences3_3 = [
        "I am twenty-three years old.",
        "I am thirty-two years old.",
        "I am sixty-eight years old.",
        "Dan is twenty-three years old.",
        "Dan is thirty-two years old.",
        "Dan is sixty-eight years old.",
        "You are twenty-three years old.",
        "You are thirty-two years old.",
        "You are sixty-eight years old."
      ];

      // 5.5 Substitution Chart Discovery State
      this.discoveredSentences5_5 = new Set(["This is her cat."]);
      this.all12Sentences5_5 = [
        "This is her cat.",
        "This is her parrot.",
        "This is their cat.",
        "This is their parrot.",
        "This is my cat.",
        "This is my parrot.",
        "That is her cat.",
        "That is her parrot.",
        "That is their cat.",
        "That is their parrot.",
        "That is my cat.",
        "That is my parrot."
      ];

      // Teacher Lewis Mascot Stories
      this.mascotQuotes = [
        "Welcome to Teacher Lewis's Practice Book! 🍃 Let's learn English together.",
        "Tip: Practice reading out loud to build your confidence and fluency! 🗣️",
        "Every small step brings you closer to mastering English. Keep going! 🌿",
        "Chapter 4 Wisdom: Pay close attention to action verbs and prepositions!",
        "Don't worry about making mistakes—they are proof that you are trying! ✨",
        "Take a deep breath and listen carefully to the audio pronunciation. 🎧",
        "Studio Ghibli Rule: Learning should feel as magical as a walk in the forest! 🌲"
      ];

      // Bind DOM Ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.init());
      } else {
        this.init();
      }
    }

    init() {
      this.setupTimeOfDay();
      this.setupAudioPlayers();
      this.setupVoiceRecorder();
      this.setupMascotAndPomodoro();
      this.setupExerciseInteractions();
      this.setupConnectingMatching();
      this.setupSentenceMirroring();
      this.setupGradingEngine();
      this.setupResetButton();
      this.setupKeyboardNavigation();
      this.setupAmbientButton();
      this.setupReaderBridge();
    }

    setupReaderBridge() {
      const isEmbedded = (window.self !== window.top);
      
      if (isEmbedded) {
        document.body.classList.add('in-reader-frame');
        
        // If clicking Home Hub link inside iframe, redirect the top window
        document.querySelectorAll('a[href="index.html"]').forEach(a => {
          a.addEventListener('click', (e) => {
            e.preventDefault();
            window.top.location.href = 'index.html';
          });
        });
        
        // Hide duplicate "Reader Mode" button inside the iframe
        document.querySelectorAll('a[href^="ghibli_reader.html"]').forEach(a => {
          a.style.display = 'none';
        });
      } else {
        // Standalone mode: ensure "Reader Mode" links include the current page number
        const match = window.location.pathname.match(/ghibli_p(\d+)\.html/);
        if (match && match[1]) {
          const pNum = parseInt(match[1], 10);
          document.querySelectorAll('a[href="ghibli_reader.html"]').forEach(a => {
            a.href = `ghibli_reader.html?page=${pNum}`;
          });
        }
      }
    }

    setupAmbientButton() {
      document.querySelectorAll('#toggleAmbientBtn, .bgm-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.GhibliAudio && window.GhibliAudio.toggleBGM) {
            window.GhibliAudio.toggleBGM(btn);
          }
        });
      });
      if (window.GhibliAudio && window.GhibliAudio.syncBGMButtonState) {
        window.GhibliAudio.syncBGMButtonState();
      }
    }

    /* ==========================================================================
       1. Time-of-Day Theme Switcher Logic
       ========================================================================== */
    setupTimeOfDay() {
      const todBtns = document.querySelectorAll('.tod-btn');
      
      const applyTheme = (theme) => {
        this.currentTheme = theme;
        localStorage.setItem('ghibli_theme', theme);
        document.documentElement.classList.remove('theme-day', 'theme-sunset', 'theme-night');
        document.documentElement.classList.add('theme-' + theme);
        document.body.classList.remove('theme-day', 'theme-sunset', 'theme-night');
        document.body.classList.add('theme-' + theme);

        todBtns.forEach(btn => {
          if (btn.getAttribute('data-theme') === theme) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });

        const firefliesContainer = document.getElementById('firefliesContainer');
        if (theme === 'night') {
          this.spawnFireflies(18);
          this.speakMascot("Nighttime in the Ghibli forest... Listen to the fireflies! 🌙", 4000);
        } else {
          if (firefliesContainer) firefliesContainer.innerHTML = '';
          if (theme === 'sunset') {
            this.speakMascot("Golden hour! The sunset brings peace to our study space. 🌅", 4000);
          }
        }
      };

      todBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const theme = btn.getAttribute('data-theme');
          applyTheme(theme);
        });
      });

      // Apply initial loaded theme
      applyTheme(this.currentTheme);
    }

    spawnFireflies(count = 18) {
      const container = document.getElementById('firefliesContainer');
      if (!container) return;
      container.innerHTML = '';

      for (let i = 0; i < count; i++) {
        const firefly = document.createElement('div');
        firefly.className = 'firefly';
        firefly.style.left = Math.random() * 100 + 'vw';
        firefly.style.top = Math.random() * 100 + 'vh';
        firefly.style.animationDelay = (Math.random() * 5) + 's';
        firefly.style.animationDuration = (4 + Math.random() * 5) + 's';
        container.appendChild(firefly);
      }
    }

    /* ==========================================================================
       2. Audio Player Subsystem (MP3 + SpeechSynthesis Fallback)
       ========================================================================== */
    setupAudioPlayers() {
      document.addEventListener('click', (e) => {
        const audioBtn = e.target.closest('.ghibli-audio-btn, .ghibli-audio-play-btn, [data-audio]');
        if (!audioBtn) return;

        // Skip if button is a voice recorder or recording playback button
        if (audioBtn.classList.contains('ghibli-rec-btn') || 
            audioBtn.classList.contains('rec-btn') || 
            audioBtn.classList.contains('play-rec-btn') || 
            audioBtn.classList.contains('my-voice-btn')) {
          return;
        }

        const audioPath = audioBtn.getAttribute('data-audio') || audioBtn.dataset.audio || '';
        
        // Extract fallback text from data attributes or surrounding card context
        let fallbackText = audioBtn.getAttribute('data-fallback-text') || audioBtn.getAttribute('data-text');
        if (!fallbackText) {
          const card = audioBtn.closest('.animal-card, .ghibli-char-card, .ghibli-listen-card, .ghibli-card-body, .fill-blank-item, .mc-prompt-row, .audio-item-row, .exercise-items-list, .exercise-item, section, div');
          if (card) {
            const input = card.querySelector('input[data-correct], input[type="text"]');
            if (input) {
              fallbackText = input.getAttribute('data-correct') || input.value || input.placeholder;
            }
            if (!fallbackText) {
              const img = card.querySelector('img[alt]');
              if (img) fallbackText = img.getAttribute('alt');
            }
            if (!fallbackText) {
              const promptEl = card.querySelector('.ghibli-prompt-text, .ghibli-ex-instruction, .char-name, p, span');
              if (promptEl) fallbackText = promptEl.textContent;
            }
          }
        }

        this.playAudioTrack(audioPath, fallbackText || "Listen and repeat.", audioBtn);
      });
    }

    getAudioCandidates(src) {
      if (!src) return [];
      const list = [];
      const cleanSrc = src.trim().split('?')[0].split('#')[0];
      if (!cleanSrc) return [];

      list.push(cleanSrc);

      // If path is like 'audio/1/1_4_eg.mp3' or 'audio/14/14_3_1.mp3'
      const m1 = cleanSrc.match(/^audio\/(\d+)\/(.+)$/i);
      if (m1) {
        const unitNum = parseInt(m1[1], 10);
        const filename = m1[2];
        const unitPadded = String(unitNum).padStart(2, '0');
        
        list.push(`assets/audio/track_${unitPadded}_${filename}`);
        list.push(`assets/audio/track_${unitNum}_${filename}`);
        list.push(`assets/audio/${filename}`);

        // Try stripped unit prefix in filename e.g. 1_4_eg.mp3 -> 4_eg.mp3
        const mUnitPrefix = filename.match(/^(\d+)_(.+)$/);
        if (mUnitPrefix) {
          const rest = mUnitPrefix[2];
          list.push(`assets/audio/track_${unitPadded}_${rest}`);
          list.push(`assets/audio/track_${unitNum}_${rest}`);
        }
        
        // Suffix matches for _a_usuk, _usuk, _uk, _us, _a
        const baseName = filename.replace(/\.mp3$/i, '');
        list.push(`audio/${unitNum}/${baseName}_a_usuk.mp3`);
        list.push(`audio/${unitNum}/${baseName}_usuk.mp3`);
        list.push(`audio/${unitNum}/${baseName}_uk.mp3`);
        list.push(`audio/${unitNum}/${baseName}_us.mp3`);
        list.push(`audio/${unitNum}/${baseName}_a.mp3`);
      }

      // If path starts with assets/audio/track_01_1_1.mp3
      const m2 = cleanSrc.match(/^assets\/audio\/track_(\d+)_(.+)\.mp3$/i);
      if (m2) {
        const unitNum = parseInt(m2[1], 10);
        const rest = m2[2];
        list.push(`audio/${unitNum}/${unitNum}_${rest}.mp3`);
        list.push(`audio/${unitNum}/${rest}.mp3`);
      }

      return Array.from(new Set(list));
    }

    playAudioTrack(audioPath, fallbackText, btnElement = null) {
      if (this.activeAudio) {
        this.activeAudio.pause();
        this.activeAudio.currentTime = 0;
        this.activeAudio = null;
      }
      if (this.speechSynth && this.speechSynth.speaking) {
        this.speechSynth.cancel();
      }

      const icon = btnElement ? btnElement.querySelector('i') : null;
      const originalIconClass = icon ? icon.className : null;

      const resetBtnState = () => {
        if (btnElement) {
          btnElement.classList.remove('playing');
          if (icon && originalIconClass) {
            icon.className = originalIconClass;
          }
        }
        this.activeAudio = null;
        if (window.GhibliAudio && typeof window.GhibliAudio.unduckBGM === 'function') {
          window.GhibliAudio.unduckBGM();
        }
      };

      if (btnElement) {
        btnElement.classList.add('playing');
        if (icon && !icon.classList.contains('fa-volume-high')) {
          icon.className = 'fa-solid fa-volume-high fa-beat';
        }
      }

      if (window.GhibliAudio && typeof window.GhibliAudio.duckBGM === 'function') {
        window.GhibliAudio.duckBGM();
      }

      const candidates = this.getAudioCandidates(audioPath);
      let candidateIndex = 0;

      const tryNextCandidate = () => {
        if (candidateIndex >= candidates.length) {
          // Audio files not available on disk -> Fallback to SpeechSynthesis
          if (fallbackText) {
            this.fallbackSpeechSynthesis(fallbackText, resetBtnState, btnElement);
          } else {
            resetBtnState();
          }
          return;
        }

        const currentSrc = candidates[candidateIndex++];
        const audio = new Audio();
        audio.preload = 'auto';
        this.activeAudio = audio;

        let hasHandledError = false;
        const onError = () => {
          if (hasHandledError) return;
          hasHandledError = true;
          tryNextCandidate();
        };

        audio.onended = resetBtnState;
        audio.onerror = onError;

        audio.src = currentSrc;

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            onError();
          });
        }
      };

      if (candidates.length > 0) {
        tryNextCandidate();
      } else if (fallbackText) {
        this.fallbackSpeechSynthesis(fallbackText, resetBtnState, btnElement);
      } else {
        resetBtnState();
      }
    }

    fallbackSpeechSynthesis(text, onEndedCallback, btnElement = null) {
      const reset = () => {
        if (onEndedCallback) onEndedCallback();
      };

      if (!this.speechSynth || typeof SpeechSynthesisUtterance === 'undefined') {
        reset();
        return;
      }

      // Clean text: strip HTML, punctuation clutter, example tags, brackets, pipes
      let cleanText = String(text || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/Example|Score:\s*\d+\s*\/\s*\d+/gi, ' ')
        .replace(/\|.*$/g, '') // pick first answer if piped
        .replace(/[{}\[\]\(\)]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) {
        reset();
        return;
      }

      try {
        this.speechSynth.cancel();
        if (this.speechSynth.paused) {
          this.speechSynth.resume();
        }

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'en-US';
        utterance.rate = 0.92;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onend = reset;
        utterance.onerror = (e) => {
          console.warn('SpeechSynthesis fallback error:', e);
          reset();
        };

        this.speechSynth.speak(utterance);
      } catch (err) {
        console.warn('SpeechSynthesis initialization error:', err);
        reset();
      }
    }

    /* ==========================================================================
       3. Voice Recorder Subsystem (MediaRecorder API + Practice Fallback)
       ========================================================================== */
    setupVoiceRecorder() {
      // Helper to detect best supported MIME type
      const getSupportedMimeType = () => {
        if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return '';
        const types = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/mp4',
          'audio/aac',
          'audio/ogg'
        ];
        for (const type of types) {
          if (MediaRecorder.isTypeSupported(type)) return type;
        }
        return '';
      };

      // Helper to extract spoken text / audio path from context card
      const getCardInfo = (recBtn) => {
        const card = recBtn.closest('.animal-card, .ghibli-char-card, .ghibli-listen-card, .ghibli-card-body, .exercise-item, section, div');
        let text = '';
        let audioPath = '';

        if (card) {
          const audioBtn = card.querySelector('[data-audio]');
          if (audioBtn) audioPath = audioBtn.getAttribute('data-audio') || '';

          const input = card.querySelector('input[data-correct], input[type="text"]');
          if (input) {
            text = input.value || input.getAttribute('data-correct') || input.placeholder || '';
          }

          if (!text) {
            const img = card.querySelector('img[alt]');
            if (img) text = img.getAttribute('alt') || '';
          }

          if (!text) {
            const promptText = card.querySelector('.ghibli-prompt-text, .ghibli-ex-instruction, p, span');
            if (promptText) text = promptText.textContent || '';
          }
        }

        return { text: text.trim() || 'English Practice', audioPath };
      };

      // 1. Playback Delegation for "My Voice" button
      document.addEventListener('click', (e) => {
        const playBtn = e.target.closest('.play-rec-btn, .my-voice-btn');
        if (!playBtn) return;

        const recId = playBtn.getAttribute('data-id') || playBtn.getAttribute('data-for');
        const recData = this.recordedBlobs[recId];

        if (recData) {
          if (typeof recData === 'string' && (recData.startsWith('blob:') || recData.startsWith('data:') || recData.startsWith('audio/'))) {
            // Play real recorded blob URL
            const voiceAudio = new Audio(recData);
            voiceAudio.play().catch(err => {
              console.warn('Recorded voice playback error:', err);
              if (this.speakMascot) this.speakMascot("Playing your recorded voice! 🔊", 4000);
            });
            if (this.speakMascot) this.speakMascot("Playing your recorded voice! 🔊", 4000);
          } else {
            // Practice Fallback Playback
            const info = typeof recData === 'object' ? recData : { text: recData };
            if (info.audioPath) {
              this.playAudioTrack(info.audioPath, info.text, playBtn);
            } else if (info.text && window.speechSynthesis) {
              window.speechSynthesis.cancel();
              const u = new SpeechSynthesisUtterance(info.text);
              u.lang = 'en-US';
              window.speechSynthesis.speak(u);
            }
            if (this.speakMascot) this.speakMascot(`Playing practice voice for: "${info.text}" 🔊`, 4000);
          }
        } else {
          alert('No recording found yet. Click Rec first to record your voice!');
        }
      });

      // 2. Record / Stop Delegation for "Rec" button
      document.addEventListener('click', async (e) => {
        const recBtn = e.target.closest('.rec-btn, .ghibli-rec-btn');
        if (!recBtn) return;

        const recId = recBtn.getAttribute('data-id') || recBtn.getAttribute('data-for') || 'item_default';
        const isRecording = recBtn.classList.contains('recording');

        const revealPlayBtn = () => {
          const container = recBtn.parentNode || recBtn.closest('.voice-recorder-controls') || recBtn.closest('.ghibli-card-body') || recBtn.closest('.animal-card');
          let playBtn = container ? container.querySelector(`.play-rec-btn[data-id="${recId}"], .play-rec-btn, .my-voice-btn`) : null;
          if (playBtn) {
            playBtn.classList.remove('hidden');
            playBtn.style.display = 'inline-flex';
            playBtn.classList.add('has-voice');
          } else if (recBtn.parentNode) {
            playBtn = document.createElement('button');
            playBtn.className = 'voice-btn play-rec-btn has-voice';
            playBtn.setAttribute('data-id', recId);
            playBtn.innerHTML = '<i class="fa-solid fa-play"></i> My Voice';
            recBtn.parentNode.appendChild(playBtn);
          }
        };

        if (!isRecording) {
          recBtn.classList.add('recording');
          recBtn.innerHTML = '<i class="fa-solid fa-square-stop" style="color:#ef4444;"></i> Stop';

          let stream = null;
          let mediaRecorder = null;
          const mimeType = getSupportedMimeType();

          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && typeof MediaRecorder !== 'undefined') {
            try {
              stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (err) {
              console.warn("Microphone access unavailable or denied:", err);
            }
          }

          if (stream) {
            try {
              const options = mimeType ? { mimeType } : {};
              mediaRecorder = new MediaRecorder(stream, options);
              const chunks = [];

              mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) chunks.push(event.data);
              };

              mediaRecorder.onstop = () => {
                const finalMime = mimeType || mediaRecorder.mimeType || 'audio/webm';
                const blob = new Blob(chunks, { type: finalMime });
                const audioUrl = URL.createObjectURL(blob);
                this.recordedBlobs[recId] = audioUrl;

                if (stream) {
                  stream.getTracks().forEach(track => track.stop());
                }
                revealPlayBtn();
              };

              mediaRecorder.start();
              this.mediaRecorders[recId] = mediaRecorder;
              if (this.speakMascot) this.speakMascot("Recording your voice... Speak clearly into your microphone! 🎙️", 4000);
              return;

            } catch (err) {
              console.warn("MediaRecorder init failed, switching to practice mode:", err);
              if (stream) stream.getTracks().forEach(track => track.stop());
            }
          }

          // Practice Recording Mode (when mic permission/hardware is unavailable)
          const info = getCardInfo(recBtn);
          this.mediaRecorders[recId] = { isFallback: true, info };
          if (this.speakMascot) this.speakMascot(`Voice Practice active for "${info.text}"! Click 'Stop' when finished speaking. 🗣️`, 4000);

        } else {
          // Stop recording
          recBtn.classList.remove('recording');
          recBtn.innerHTML = '<i class="fa-solid fa-microphone"></i> Rec';

          const activeRec = this.mediaRecorders[recId];
          if (activeRec) {
            if (activeRec.isFallback) {
              this.recordedBlobs[recId] = activeRec.info;
              revealPlayBtn();
              delete this.mediaRecorders[recId];
            } else if (activeRec.state && activeRec.state !== 'inactive') {
              activeRec.stop();
              delete this.mediaRecorders[recId];
            }
          } else {
            revealPlayBtn();
          }

          if (this.speakMascot) this.speakMascot("Recording saved! Click 'My Voice' to listen. 🎵", 4000);
        }
      });
    }

    /* ==========================================================================
       4. Kodama Mascot Engine & Pomodoro Timer
       ========================================================================== */
    setupMascotAndPomodoro() {
      const avatar = document.getElementById('mascotAvatar') || document.getElementById('mascotAvatarWrap') || document.getElementById('mascotAvatarImg');
      const pomodoroPill = document.getElementById('pomodoroPill') || document.getElementById('pomoToggleBtn');

      if (avatar) {
        avatar.addEventListener('click', () => {
          const randomQuote = this.mascotQuotes[Math.floor(Math.random() * this.mascotQuotes.length)];
          this.speakMascot(randomQuote, 6000);
          if (window.GhibliAudio) window.GhibliAudio.playWaterDrop();
        });
      }

      if (pomodoroPill) {
        pomodoroPill.addEventListener('click', () => this.togglePomodoro());
      }
    }

    speakMascot(text, duration = 5000, emote = 'happy') {
      const bubble = document.getElementById('mascotBubble');
      if (!bubble) return;

      const textContent = document.getElementById('mascotTextContent');
      if (textContent) {
        textContent.textContent = text;
      } else {
        bubble.innerHTML = `<div class="mascot-text" id="mascotTextContent">${text}</div>`;
      }
      bubble.style.display = 'block';
      bubble.classList.remove('focused-auto-collapsed');

      if (this.mascotTimeout) clearTimeout(this.mascotTimeout);
      this.mascotTimeout = setTimeout(() => {
        bubble.classList.add('focused-auto-collapsed');
      }, duration);
    }

    togglePomodoro() {
      const display = document.getElementById('pomodoroDisplay');
      const pill = document.getElementById('pomodoroPill');
      if (!display) return;

      if (this.isPomodoroRunning) {
        clearInterval(this.pomodoroInterval);
        this.isPomodoroRunning = false;
        this.speakMascot("Pomodoro paused.", 3000);
      } else {
        this.isPomodoroRunning = true;
        this.speakMascot(this.pomodoroMode === 'work' ? "Focus time started! 25 minutes of study." : "Break time started! Relax for 5 minutes.", 4000);

        this.pomodoroInterval = setInterval(() => {
          this.pomodoroTime--;
          if (this.pomodoroTime < 0) {
            clearInterval(this.pomodoroInterval);
            this.isPomodoroRunning = false;

            if (this.pomodoroMode === 'work') {
              this.pomodoroMode = 'break';
              this.pomodoroTime = 5 * 60;
              if (pill) pill.classList.add('break-mode');
              if (window.GhibliAudio) window.GhibliAudio.playFanfare();
              this.speakMascot("Great session! Take a 5-minute Ghibli break. 🍵", 7000);
            } else {
              this.pomodoroMode = 'work';
              this.pomodoroTime = 25 * 60;
              if (pill) pill.classList.remove('break-mode');
              if (window.GhibliAudio) window.GhibliAudio.playChime();
              this.speakMascot("Ready to practice more English? Let's go! 🌿", 7000);
            }
          }

          const mins = Math.floor(this.pomodoroTime / 60).toString().padStart(2, '0');
          const secs = (this.pomodoroTime % 60).toString().padStart(2, '0');
          display.textContent = `${mins}:${secs}`;
        }, 1000);
      }
    }

    /* ==========================================================================
       5. Interactive Exercise UI Event Listeners
       ========================================================================== */
    setupExerciseInteractions() {
      // Multiple Choice selection
      // Option & True/False Selection Handler
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('.ghibli-option, .tf-btn');
        if (!btn) return;

        const group = btn.closest('.tf-btn-group, .ghibli-mc-container, .mc-options-grid, .options-grid');
        if (group) {
          group.querySelectorAll('.ghibli-option, .tf-btn').forEach(b => {
            b.classList.remove('selected');
          });
        }
        btn.classList.add('selected');
        
        // Sync with linked text input if present in card
        const card = btn.closest('.ghibli-char-card, .tf-question-card, .exercise-item, .reading-questions-column');
        if (card) {
          const input = card.querySelector('input.ghibli-input');
          if (input) {
            input.value = btn.dataset.value || btn.textContent.trim();
            input.classList.remove('correct', 'incorrect');
          }
        }
        
        if (window.GhibliAudio) window.GhibliAudio.playClick();
      });

      // Cross-out Word In-Sentence Selection Handler
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('.ghibli-crossout-btn');
        if (!btn) return;

        const group = btn.closest('.ghibli-crossout-group');
        if (!group) return;
        if (group.classList.contains('example-group') || group.closest('.example-card')) return;

        // If already crossed out, toggle off
        if (btn.classList.contains('crossed-out')) {
          btn.classList.remove('crossed-out', 'selected');
        } else {
          // Un-cross other buttons in this group (single cross-out per item)
          group.querySelectorAll('.ghibli-crossout-btn').forEach(b => {
            b.classList.remove('crossed-out', 'selected');
          });
          btn.classList.add('crossed-out', 'selected');
        }

        // Clear previous graded states on interaction
        group.querySelectorAll('.ghibli-crossout-btn').forEach(b => {
          b.classList.remove('correct', 'incorrect', 'should-cross');
        });

        if (window.GhibliAudio) window.GhibliAudio.playClick();
      });

      // Synchronize typing in True/False inputs with buttons
      document.addEventListener('input', (e) => {
        const input = e.target.closest('.tf-question-card input.ghibli-input, .reading-questions-column input.ghibli-input');
        if (!input) return;
        const card = input.closest('.tf-question-card, .ghibli-char-card');
        if (!card) return;
        const val = input.value.trim().toLowerCase();
        card.querySelectorAll('.tf-btn').forEach(btn => {
          const btnVal = (btn.dataset.value || btn.textContent).trim().toLowerCase();
          if (val === btnVal) {
            btn.classList.add('selected');
          } else {
            btn.classList.remove('selected');
          }
        });
      });

      // Word Chip Drag & Drop, Intra-Slot Reordering & Click for Sentence Ordering
      let draggedChip = null;
      let sourceContainer = null;

      const updateOrderInput = (orderingContainer) => {
        if (!orderingContainer) return;
        const dropSlot = orderingContainer.querySelector('.ghibli-drop-slot');
        const orderInput = orderingContainer.querySelector('.order-input, .ghibli-input');
        if (dropSlot && orderInput) {
          const words = Array.from(dropSlot.querySelectorAll('.word-chip')).map(c => c.innerText.trim());
          orderInput.value = words.join(' ');
        }
        if (dropSlot) {
          dropSlot.classList.remove('correct', 'incorrect');
          const placeholder = dropSlot.querySelector('.drop-placeholder');
          const chips = dropSlot.querySelectorAll('.word-chip');
          if (placeholder) {
            placeholder.style.display = chips.length > 0 ? 'none' : 'flex';
          }
          if (chips.length > 0) {
            dropSlot.classList.add('has-chips');
          } else {
            dropSlot.classList.remove('has-chips');
          }
        }
      };

      // 1. Dragstart
      document.addEventListener('dragstart', (e) => {
        const chip = e.target.closest('.word-chip');
        if (!chip) return;

        draggedChip = chip;
        sourceContainer = chip.parentElement;
        chip.classList.add('is-dragging');

        e.dataTransfer.setData('text/plain', chip.innerText.trim());
        e.dataTransfer.effectAllowed = 'move';
      });

      // 2. Dragend
      document.addEventListener('dragend', (e) => {
        const chip = e.target.closest('.word-chip');
        if (chip) {
          chip.classList.remove('is-dragging');
        }
        document.querySelectorAll('.ghibli-drop-slot, .word-pool').forEach(el => {
          el.classList.remove('drag-over');
        });
        draggedChip = null;
        sourceContainer = null;
      });

      // 3. Dragover
      document.addEventListener('dragover', (e) => {
        if (!draggedChip) return;

        const dropSlot = e.target.closest('.ghibli-drop-slot');
        const wordPool = e.target.closest('.word-pool');
        const targetChip = e.target.closest('.word-chip');

        if (dropSlot || wordPool || targetChip) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }

        // Highlight active drop zone
        document.querySelectorAll('.ghibli-drop-slot, .word-pool').forEach(el => {
          if (el === dropSlot || el === wordPool || el === (targetChip ? targetChip.closest('.ghibli-drop-slot, .word-pool') : null)) {
            el.classList.add('drag-over');
          } else {
            el.classList.remove('drag-over');
          }
        });
      });

      // 4. Dragleave
      document.addEventListener('dragleave', (e) => {
        const zone = e.target.closest('.ghibli-drop-slot, .word-pool');
        if (zone && !zone.contains(e.relatedTarget)) {
          zone.classList.remove('drag-over');
        }
      });

      // 5. Drop
      document.addEventListener('drop', (e) => {
        if (!draggedChip) return;
        e.preventDefault();

        const dropSlot = e.target.closest('.ghibli-drop-slot');
        const wordPool = e.target.closest('.word-pool');
        const targetChip = e.target.closest('.word-chip');
        const orderingContainer = (dropSlot || wordPool || (targetChip ? targetChip.closest('.ghibli-ordering-container') : null))?.closest('.ghibli-ordering-container');

        // Ensure drop is scoped to the same sentence ordering item
        if (orderingContainer && draggedChip.closest('.ghibli-ordering-container') === orderingContainer) {
          if (targetChip && targetChip !== draggedChip) {
            const parent = targetChip.parentElement;
            if (parent) {
              const rect = targetChip.getBoundingClientRect();
              const midX = rect.left + rect.width / 2;
              if (e.clientX > midX) {
                targetChip.after(draggedChip);
              } else {
                parent.insertBefore(draggedChip, targetChip);
              }
            }
          } else if (dropSlot) {
            dropSlot.appendChild(draggedChip);
          } else if (wordPool) {
            wordPool.appendChild(draggedChip);
          }

          updateOrderInput(orderingContainer);
          if (window.GhibliAudio && window.GhibliAudio.playWaterDrop) {
            window.GhibliAudio.playWaterDrop();
          }
        }

        document.querySelectorAll('.ghibli-drop-slot, .word-pool').forEach(el => el.classList.remove('drag-over'));
        if (draggedChip) draggedChip.classList.remove('is-dragging');
        draggedChip = null;
        sourceContainer = null;
      });

      // 6. Click-to-Move on Word Chip
      document.addEventListener('click', (e) => {
        const chip = e.target.closest('.word-chip');
        if (!chip) return;

        const orderingContainer = chip.closest('.ghibli-ordering-container');
        if (!orderingContainer) return;

        const wordPool = orderingContainer.querySelector('.word-pool');
        const dropSlot = orderingContainer.querySelector('.ghibli-drop-slot');

        if (chip.parentElement === wordPool && dropSlot) {
          dropSlot.appendChild(chip);
        } else if (chip.parentElement === dropSlot && wordPool) {
          wordPool.appendChild(chip);
        }

        updateOrderInput(orderingContainer);
        if (window.GhibliAudio && window.GhibliAudio.playWaterDrop) {
          window.GhibliAudio.playWaterDrop();
        }
      });

      // 7. Individual Sentence Reset Button
      document.addEventListener('click', (e) => {
        const resetBtn = e.target.closest('.ghibli-order-reset-btn');
        if (!resetBtn) return;

        const orderingContainer = resetBtn.closest('.ghibli-ordering-container');
        if (!orderingContainer) return;

        const wordPool = orderingContainer.querySelector('.word-pool');
        const dropSlot = orderingContainer.querySelector('.ghibli-drop-slot');
        if (wordPool && dropSlot) {
          const placedChips = Array.from(dropSlot.querySelectorAll('.word-chip'));
          placedChips.forEach(c => wordPool.appendChild(c));
          updateOrderInput(orderingContainer);
          dropSlot.classList.remove('correct', 'incorrect');
          if (window.GhibliAudio && window.GhibliAudio.playClick) {
            window.GhibliAudio.playClick();
          }
          if (this.speakMascot) {
            this.speakMascot("Sentence reset! Click or drag words to try again! 🌿", 3000);
          }
        }
      });

      // Sentence Construction Chart Block Selection & Live Experimentation Engine
      document.addEventListener('click', (e) => {
        const blockBtn = e.target.closest('.ghibli-block-btn');
        if (!blockBtn) return;

        const col = blockBtn.closest('.ghibli-chart-col, .ex1-3-col, .ex5-5-col, [class*="-col"]');
        const card = blockBtn.closest('.ghibli-exercise-card, .ex1-3-card, .ex5-5-card, .ghibli-chart-container, .ghibli-section, body');
        if (!col) return;

        col.querySelectorAll('.ghibli-block-btn').forEach(btn => {
          btn.classList.remove('selected');
          if (col.classList.contains('ghibli-chart-col')) {
            btn.style.background = '#ffffff';
            btn.style.color = 'var(--ghibli-text-main, #2b261f)';
            btn.style.borderColor = '#cbd5e1';
            btn.style.fontWeight = '600';
          }
        });
        blockBtn.classList.add('selected');
        if (col.classList.contains('ghibli-chart-col')) {
          blockBtn.style.background = '#2d5a27';
          blockBtn.style.color = '#ffffff';
          blockBtn.style.borderColor = '#2d5a27';
          blockBtn.style.fontWeight = '700';
        }

        if (card) {
          // Update chip corresponding to this column
          const colType = blockBtn.dataset.col;
          const val = (blockBtn.dataset.value || blockBtn.textContent).trim();
          if (colType) {
            const chip = card.querySelector(`.chip-${colType}, [id^="chip_${colType}"]`);
            if (chip) chip.textContent = val;
          }

          // Exercise 1.3 grammar validation & discovery engine
          if (card.classList.contains('ex1-3-card')) {
            const greeting = card.querySelector('.col-greeting .ghibli-block-btn.selected, .ghibli-block-btn.selected[data-col="greeting"]')?.dataset.value || 'Hi!';
            const subj = card.querySelector('.col-subject .ghibli-block-btn.selected, .ghibli-block-btn.selected[data-col="subject"]')?.dataset.value || 'I';
            const verb = card.querySelector('.col-verb .ghibli-block-btn.selected, .ghibli-block-btn.selected[data-col="verb"]')?.dataset.value || 'am';
            const name = card.querySelector('.col-name .ghibli-block-btn.selected, .ghibli-block-btn.selected[data-col="name"]')?.dataset.value || 'Charlotte.';
            const currentGreeting = `${greeting} ${subj} ${verb} ${name}`;

            const valBadge = card.querySelector('.ex1-3-validation-badge, [id^="ex1_3_val_badge"]');
            const valText = card.querySelector('[id^="ex1_3_val_text"]');
            
            const isValid = (subj === 'I' && verb === 'am') || (subj === 'My name' && verb === 'is');
            if (valBadge) {
              valBadge.className = isValid ? 'ex1-3-validation-badge valid' : 'ex1-3-validation-badge invalid';
              const msg = isValid ? 'Valid Greeting!' : (subj === 'I' ? 'Grammar Check: Pair "I" with "am"' : 'Grammar Check: Pair "My name" with "is"');
              if (valText) valText.textContent = msg;
              else valBadge.innerHTML = `<i class="fa-solid fa-${isValid ? 'circle-check' : 'triangle-exclamation'}"></i> <span>${msg}</span>`;
            }

            if (isValid) {
              if (this.discoveredGreetings1_3 && !this.discoveredGreetings1_3.has(currentGreeting)) {
                this.discoveredGreetings1_3.add(currentGreeting);
                if (window.GhibliAudio && window.GhibliAudio.playChime) {
                  window.GhibliAudio.playChime();
                }
                this.speakMascot(`🎉 Discovered greeting ${this.discoveredGreetings1_3.size}/12: "${currentGreeting}"!`, 3500);
                this.updateDiscoveryTray1_3();
              }
              const syncedInput = card.querySelector('.chart-synced-input');
              if (syncedInput) {
                syncedInput.value = currentGreeting;
                syncedInput.dispatchEvent(new Event('input', { bubbles: true }));
              }
            }
          }

          // Exercise 3.3 grammar validation & discovery engine
          if (card.querySelector('#assembledGreetingText_ex3_3') || card.classList.contains('ex3-3-card')) {
            const subj = card.querySelector('.ghibli-block-btn.selected[data-col="subject"]')?.dataset.value || 'I';
            const verb = card.querySelector('.ghibli-block-btn.selected[data-col="verb"]')?.dataset.value || 'am';
            const age = card.querySelector('.ghibli-block-btn.selected[data-col="age"]')?.dataset.value || 'twenty-three';
            const phrase = card.querySelector('.ghibli-block-btn.selected[data-col="phrase"]')?.dataset.value || 'years old.';
            const currentSentence = `${subj} ${verb} ${age} ${phrase}`;

            const isValid = (subj === 'I' && verb === 'am') || (subj === 'Dan' && verb === 'is') || (subj === 'You' && verb === 'are');
            const valBadge = card.querySelector('.ex3-3-validation-badge, #ex3_3_val_badge');
            if (valBadge) {
              if (isValid) {
                valBadge.className = 'ex1-3-validation-badge ex3-3-validation-badge valid';
                valBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> <span>Valid Sentence!</span>';
              } else {
                valBadge.className = 'ex1-3-validation-badge ex3-3-validation-badge invalid';
                const expectedVerb = subj === 'I' ? 'am' : (subj === 'Dan' ? 'is' : 'are');
                valBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <span>Grammar Check: Pair "${subj}" with "${expectedVerb}"</span>`;
              }
            }

            if (isValid) {
              if (this.discoveredSentences3_3 && !this.discoveredSentences3_3.has(currentSentence)) {
                this.discoveredSentences3_3.add(currentSentence);
                if (window.GhibliAudio && window.GhibliAudio.playChime) {
                  window.GhibliAudio.playChime();
                }
                this.speakMascot(`🎉 Discovered sentence ${this.discoveredSentences3_3.size}/9: "${currentSentence}"!`, 3500);
                this.updateDiscoveryTray3_3();
              }
              const syncedInput = card.querySelector('.chart-synced-input');
              if (syncedInput) {
                syncedInput.value = currentSentence;
                syncedInput.dispatchEvent(new Event('input', { bubbles: true }));
              }
            }
          }

          // Exercise 5.5 grammar validation & discovery engine
          if (card.classList.contains('ex5-5-card')) {
            const pointer = card.querySelector('.col-pointer .ghibli-block-btn.selected')?.dataset.value || 'This';
            const verb = card.querySelector('.col-verb .ghibli-block-btn.selected')?.dataset.value || 'is';
            const possessive = card.querySelector('.col-possessive .ghibli-block-btn.selected')?.dataset.value || 'her';
            const noun = card.querySelector('.col-noun .ghibli-block-btn.selected')?.dataset.value || 'cat.';

            const valBadge = card.querySelector('.ex5-5-validation-badge, [id^="ex5_5_val_badge"]');
            const valText = card.querySelector('[id^="ex5_5_val_text"]');
            const currentSentence = `${pointer} ${verb} ${possessive} ${noun}`;

            const isValid = (verb === 'is');
            if (valBadge) {
              if (isValid) {
                valBadge.className = 'ex5-5-validation-badge valid';
                if (valText) valText.textContent = 'Valid Sentence!';
                else valBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> <span>Valid Sentence!</span>';

                if (this.discoveredSentences5_5 && !this.discoveredSentences5_5.has(currentSentence)) {
                  this.discoveredSentences5_5.add(currentSentence);
                  if (window.GhibliAudio && window.GhibliAudio.playChime) {
                    window.GhibliAudio.playChime();
                  }
                  this.speakMascot(`🎉 Discovered sentence ${this.discoveredSentences5_5.size}/12: "${currentSentence}"!`, 3500);
                  this.updateDiscoveryTray5_5();
                }
              } else {
                valBadge.className = 'ex5-5-validation-badge invalid';
                const msg = `Grammar Check: Pair singular "${pointer}" with "is", not "are"`;
                if (valText) valText.textContent = msg;
                else valBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <span>${msg}</span>`;
              }
            }
          }

          // Assembled text element fallback
          const selectedBtns = card.querySelectorAll('.ghibli-block-btn.selected');
          const words = Array.from(selectedBtns).map(b => (b.getAttribute('data-value') || b.textContent).trim());
          const sentence = words.join(' ').replace(/\s+'m\b/g, "'m");
          const assembledEl = card.querySelector('.ghibli-assembled-text, [id^="assembledGreetingText"], [id^="assembledSentenceText"]');
          if (assembledEl) {
            assembledEl.textContent = `"${sentence}"`;
          }
        }

        if (window.GhibliAudio && window.GhibliAudio.playClick) {
          window.GhibliAudio.playClick();
        }
      });

      // Toggle Greetings Tray for Exercise 1.3
      document.addEventListener('click', (e) => {
        const trayToggle = e.target.closest('#toggleGreetingsTray');
        if (!trayToggle) return;

        const grid = document.getElementById('ex1_3_tray_grid');
        const icon = trayToggle.querySelector('.tray-icon');
        if (grid) {
          const isHidden = (grid.style.display === 'none');
          grid.style.display = isHidden ? 'grid' : 'none';
          if (icon) icon.className = isHidden ? 'fa-solid fa-chevron-down tray-icon' : 'fa-solid fa-chevron-right tray-icon';
        }
      });

      // Toggle Sentences Tray for Exercise 3.3
      document.addEventListener('click', (e) => {
        const trayToggle = e.target.closest('#toggleSentencesTray3_3');
        if (!trayToggle) return;

        const grid = document.getElementById('ex3_3_tray_grid');
        const icon = trayToggle.querySelector('.tray-icon');
        if (grid) {
          const isHidden = (grid.style.display === 'none');
          grid.style.display = isHidden ? 'grid' : 'none';
          if (icon) icon.className = isHidden ? 'fa-solid fa-chevron-down tray-icon' : 'fa-solid fa-chevron-right tray-icon';
        }
      });

      // Toggle Sentences Tray for Exercise 5.5
      document.addEventListener('click', (e) => {
        const trayToggle = e.target.closest('#toggleSentencesTray');
        if (!trayToggle) return;

        const grid = document.getElementById('ex5_5_tray_grid');
        const icon = trayToggle.querySelector('.tray-icon');
        if (grid) {
          const isHidden = (grid.style.display === 'none');
          grid.style.display = isHidden ? 'grid' : 'none';
          if (icon) icon.className = isHidden ? 'fa-solid fa-chevron-down tray-icon' : 'fa-solid fa-chevron-right tray-icon';
        }
      });

      this.updateDiscoveryTray1_3();
      this.updateDiscoveryTray3_3();
      this.updateDiscoveryTray5_5();

      // Chart Listen & Speak button
      document.addEventListener('click', (e) => {
        const playBtn = e.target.closest('[id^="playChartSentenceBtn"], [id^="playSentenceBtn"], [id^="playGreetingBtn"], .play-chart-sentence-btn');
        if (!playBtn) return;

        const card = playBtn.closest('.ghibli-exercise-card, .ex1-3-card, .ex5-5-card, .ghibli-chart-container, .ghibli-section, body');
        if (!card) return;

        const selectedBtns = card.querySelectorAll('.ghibli-block-btn.selected');
        const words = Array.from(selectedBtns).map(b => (b.getAttribute('data-value') || b.textContent).trim());
        const sentence = words.join(' ').replace(/\s+'m\b/g, "'m");

        if (sentence) {
          const audioSrc = playBtn.dataset.audio || (typeof window.getChartAudioPath === 'function' ? window.getChartAudioPath(sentence) : '');
          this.playAudioTrack(audioSrc, sentence, playBtn);
        }
      });
    }

    updateDiscoveryTray1_3() {
      const countEl = document.getElementById('ex1_3_found_count');
      const trayCountEl = document.getElementById('tray_count');
      const trayGrid = document.getElementById('ex1_3_tray_grid');

      if (!this.discoveredGreetings1_3) {
        this.discoveredGreetings1_3 = new Set(["Hi! I am Charlotte."]);
      }

      if (countEl) countEl.textContent = this.discoveredGreetings1_3.size;
      if (trayCountEl) trayCountEl.textContent = this.discoveredGreetings1_3.size;

      if (trayGrid && this.all12Greetings1_3) {
        trayGrid.innerHTML = this.all12Greetings1_3.map((g, idx) => {
          const isFound = this.discoveredGreetings1_3.has(g);
          if (isFound) {
            return `<div class="ex1-3-tray-item unlocked"><i class="fa-solid fa-star" style="color:var(--ghibli-accent-gold, #e5a93c);"></i> ${g}</div>`;
          } else {
            return `<div class="ex1-3-tray-item locked"><i class="fa-regular fa-circle"></i> Greeting ${idx + 1}</div>`;
          }
        }).join('');
      }
    }

    updateDiscoveryTray3_3() {
      const countEl = document.getElementById('ex3_3_found_count');
      const trayCountEl = document.getElementById('tray_count_3_3');
      const trayGrid = document.getElementById('ex3_3_tray_grid');

      if (!this.discoveredSentences3_3) {
        this.discoveredSentences3_3 = new Set(["I am twenty-three years old."]);
      }

      if (countEl) countEl.textContent = this.discoveredSentences3_3.size;
      if (trayCountEl) trayCountEl.textContent = this.discoveredSentences3_3.size;

      if (trayGrid && this.all9Sentences3_3) {
        trayGrid.innerHTML = this.all9Sentences3_3.map((s, idx) => {
          const isFound = this.discoveredSentences3_3.has(s);
          if (isFound) {
            return `<div class="ex1-3-tray-item unlocked" style="display:flex; align-items:center; gap:6px; padding:6px 10px; background:rgba(45,90,39,0.12); border-radius:8px; border:1px solid #2d5a27; font-weight:700; font-size:0.85rem; color:#2d5a27;"><i class="fa-solid fa-star" style="color:var(--ghibli-accent-gold, #e5a93c);"></i> ${s}</div>`;
          } else {
            return `<div class="ex1-3-tray-item locked" style="display:flex; align-items:center; gap:6px; padding:6px 10px; background:rgba(0,0,0,0.04); border-radius:8px; border:1px dashed #ccc; font-size:0.85rem; color:#888;"><i class="fa-regular fa-circle"></i> Sentence ${idx + 1}</div>`;
          }
        }).join('');
      }
    }

    updateDiscoveryTray5_5() {
      const countEl = document.getElementById('ex5_5_found_count');
      const trayCountEl = document.getElementById('tray_count_5_5');
      const trayGrid = document.getElementById('ex5_5_tray_grid');

      if (!this.discoveredSentences5_5) {
        this.discoveredSentences5_5 = new Set(["This is her cat."]);
      }

      if (countEl) countEl.textContent = this.discoveredSentences5_5.size;
      if (trayCountEl) trayCountEl.textContent = this.discoveredSentences5_5.size;

      if (trayGrid && this.all12Sentences5_5) {
        trayGrid.innerHTML = this.all12Sentences5_5.map((s, idx) => {
          const isFound = this.discoveredSentences5_5.has(s);
          if (isFound) {
            return `<div class="ex5-5-tray-item unlocked" style="display:flex; align-items:center; gap:6px; padding:6px 10px; background:rgba(45,90,39,0.12); border-radius:8px; border:1px solid #2d5a27; font-weight:700; font-size:0.85rem; color:#2d5a27;"><i class="fa-solid fa-star" style="color:var(--ghibli-accent-gold, #e5a93c);"></i> ${s}</div>`;
          } else {
            return `<div class="ex5-5-tray-item locked" style="display:flex; align-items:center; gap:6px; padding:6px 10px; background:rgba(0,0,0,0.04); border-radius:8px; border:1px dashed #ccc; font-size:0.85rem; color:#888;"><i class="fa-regular fa-circle"></i> Sentence ${idx + 1}</div>`;
          }
        }).join('');
      }
    }

    /* ==========================================================================
       5a. Interactive Connecting & Line-Matching System (e.g. Page 28 Ex 8.6)
       ========================================================================== */
    setupConnectingMatching() {
      const containers = document.querySelectorAll('.ghibli-connecting-container');
      if (containers.length === 0) return;

      containers.forEach(container => {
        const svg = container.querySelector('.ghibli-connecting-svg');
        if (!svg) return;

        let activeSourceCard = null;
        const connections = new Map(); // sourceId -> { targetId, pathEl, inputEl }

        // Helper to get anchor dot center coordinates relative to svg
        const getDotCenter = (dotEl) => {
          if (!dotEl || !svg) return null;
          const svgRect = svg.getBoundingClientRect();
          const dotRect = dotEl.getBoundingClientRect();
          if (svgRect.width === 0 || svgRect.height === 0 || (dotRect.width === 0 && dotRect.height === 0)) {
            return null;
          }
          return {
            x: dotRect.left + dotRect.width / 2 - svgRect.left,
            y: dotRect.top + dotRect.height / 2 - svgRect.top
          };
        };

        // Helper to update path bezier
        const updatePath = (pathEl, startDot, endDot) => {
          if (!pathEl || !startDot || !endDot) return;
          const p1 = getDotCenter(startDot);
          const p2 = getDotCenter(endDot);
          if (!p1 || !p2) return;
          const dx = Math.max(30, Math.abs(p2.x - p1.x) * 0.55);
          const cp1x = p1.x + dx;
          const cp1y = p1.y;
          const cp2x = p2.x - dx;
          const cp2y = p2.y;
          const d = `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
          pathEl.setAttribute('d', d);
        };

        // Render / refresh all paths
        const refreshAllPaths = () => {
          // Update example line (Left example card -> Right example card)
          let exampleSource = container.querySelector('.left-column .example-card') || container.querySelector('.example-card:not(.target-card)');
          let exampleTarget = container.querySelector('.right-column .example-card') || container.querySelector('.target-card.example-card');

          let examplePath = container.querySelector('.example-line');
          if (!examplePath && exampleSource && exampleTarget && svg) {
            examplePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            examplePath.classList.add('connecting-line', 'example-line');
            const markerDef = svg.querySelector('marker[id^="arrow-example"]') || svg.querySelector('marker[id="arrow-example"]');
            if (markerDef) {
              examplePath.setAttribute('marker-end', `url(#${markerDef.id})`);
            }
            svg.insertBefore(examplePath, svg.firstChild);
          }

          if (exampleSource && exampleTarget) {
            exampleSource.classList.add('is-connected');
            exampleTarget.classList.add('is-connected');
            if (examplePath) {
              const startDot = exampleSource.querySelector('.anchor-dot');
              const endDot = exampleTarget.querySelector('.anchor-dot');
              if (startDot && endDot) {
                updatePath(examplePath, startDot, endDot);
              }
            }
          }

          // Update all active user connections
          connections.forEach((conn, sourceId) => {
            const sourceCard = container.querySelector(`.source-card[data-source-id="${sourceId}"]`);
            const targetCard = container.querySelector(`.target-card[data-target-id="${conn.targetId}"]`);
            if (sourceCard && targetCard && conn.pathEl) {
              const startDot = sourceCard.querySelector('.anchor-dot');
              const endDot = targetCard.querySelector('.anchor-dot');
              if (startDot && endDot) {
                updatePath(conn.pathEl, startDot, endDot);
              }
            }
          });
        };

        // Create connection
        const connect = (sourceCard, targetCard) => {
          const sourceId = sourceCard.dataset.sourceId;
          const targetId = targetCard.dataset.targetId;
          const targetVal = targetCard.dataset.value || targetId;

          // If another source was connected to this target, remove it first
          connections.forEach((conn, sId) => {
            if (conn.targetId === targetId && sId !== sourceId) {
              disconnect(sId);
            }
          });

          // Disconnect existing if source was connected to something else
          if (connections.has(sourceId)) {
            disconnect(sourceId);
          }

          // Create SVG Path
          const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          pathEl.classList.add('connecting-line', 'user-line');
          pathEl.setAttribute('marker-end', 'url(#arrow-user)');
          svg.appendChild(pathEl);

          // Update hidden input
          const inputEl = sourceCard.querySelector('input.ghibli-connecting-input');
          if (inputEl) {
            inputEl.value = targetVal;
            inputEl.classList.remove('correct', 'incorrect');
          }

          connections.set(sourceId, { targetId, pathEl, inputEl });

          sourceCard.classList.add('is-connected');
          sourceCard.classList.remove('active-source', 'connected-correct', 'connected-incorrect', 'unattempted-pulse');
          targetCard.classList.add('is-connected');
          targetCard.classList.remove('connected-correct', 'connected-incorrect');

          refreshAllPaths();
          if (window.GhibliAudio && window.GhibliAudio.playClick) {
            window.GhibliAudio.playClick();
          }
        };

        // Disconnect a source
        const disconnect = (sourceId) => {
          if (!connections.has(sourceId)) return;
          const conn = connections.get(sourceId);
          if (conn.pathEl && conn.pathEl.parentNode) {
            conn.pathEl.parentNode.removeChild(conn.pathEl);
          }
          if (conn.inputEl) {
            conn.inputEl.value = '';
            conn.inputEl.classList.remove('correct', 'incorrect');
          }
          const sourceCard = container.querySelector(`.source-card[data-source-id="${sourceId}"]`);
          if (sourceCard) {
            sourceCard.classList.remove('is-connected', 'active-source', 'connected-correct', 'connected-incorrect', 'unattempted-pulse');
          }
          // Check if any other source is connected to this target
          let targetStillUsed = false;
          connections.forEach((c, sId) => {
            if (sId !== sourceId && c.targetId === conn.targetId) targetStillUsed = true;
          });
          const targetCard = container.querySelector(`.target-card[data-target-id="${conn.targetId}"]`);
          if (targetCard && !targetStillUsed && !targetCard.classList.contains('example-card')) {
            targetCard.classList.remove('is-connected', 'connected-correct', 'connected-incorrect');
          }
          connections.delete(sourceId);
        };

        // Handle click on Source Card
        container.querySelectorAll('.source-card').forEach(card => {
          card.addEventListener('click', (e) => {
            if (e.target.closest('.ghibli-audio-btn, .ghibli-audio-play-btn, .voice-btn, .rec-btn, .play-rec-btn, button, [data-audio]')) return;

            // If already active, toggle off
            if (card === activeSourceCard) {
              card.classList.remove('active-source');
              activeSourceCard = null;
              return;
            }

            if (activeSourceCard) {
              activeSourceCard.classList.remove('active-source');
            }

            activeSourceCard = card;
            card.classList.add('active-source');
            if (window.GhibliAudio && window.GhibliAudio.playClick) {
              window.GhibliAudio.playClick();
            }
          });
        });

        // Handle click on Target Card
        container.querySelectorAll('.target-card:not(.example-card)').forEach(card => {
          card.addEventListener('click', (e) => {
            if (activeSourceCard) {
              connect(activeSourceCard, card);
              activeSourceCard.classList.remove('active-source');
              activeSourceCard = null;
            } else {
              // If user clicks a target that is already connected, disconnect it
              const targetId = card.dataset.targetId;
              let foundSourceId = null;
              connections.forEach((conn, sId) => {
                if (conn.targetId === targetId) foundSourceId = sId;
              });
              if (foundSourceId) {
                disconnect(foundSourceId);
                if (window.GhibliAudio && window.GhibliAudio.playWaterDrop) {
                  window.GhibliAudio.playWaterDrop();
                }
              }
            }
          });
        });

        // Debounced path refresher to prevent layout thrashing
        let rafId = null;
        const debouncedRefresh = () => {
          if (rafId) cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(refreshAllPaths);
        };

        // Window resize & lifecycle listeners to recalculate paths
        window.addEventListener('resize', debouncedRefresh);
        window.addEventListener('load', debouncedRefresh);

        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(debouncedRefresh);
        }

        // Listen for all contained images to load before finalizing paths
        container.querySelectorAll('img').forEach(img => {
          if (!img.complete) {
            img.addEventListener('load', debouncedRefresh, { once: true });
          }
        });

        // ResizeObserver for robust layout detection
        if (typeof ResizeObserver !== 'undefined') {
          const ro = new ResizeObserver(debouncedRefresh);
          ro.observe(container);
          if (container.parentElement) ro.observe(container.parentElement);
        }

        // IntersectionObserver to recalculate when scrolled into view
        if (typeof IntersectionObserver !== 'undefined') {
          const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                debouncedRefresh();
              }
            });
          }, { threshold: [0, 0.5, 1.0] });
          io.observe(container);
        }

        // Initial single RAF render
        requestAnimationFrame(refreshAllPaths);

        // Grade lines appearance
        container._ghibliGradeLines = () => {
          connections.forEach((conn, sourceId) => {
            const sourceCard = container.querySelector(`.source-card[data-source-id="${sourceId}"]`);
            const input = conn.inputEl || (sourceCard ? sourceCard.querySelector('input.ghibli-connecting-input') : null);
            const userVal = input ? input.value.trim().toLowerCase() : '';
            const correctVal = sourceCard ? (sourceCard.getAttribute('data-correct') || '').trim().toLowerCase() : '';
            const isCorrect = (userVal && userVal === correctVal);

            if (conn.pathEl) {
              conn.pathEl.classList.remove('line-correct', 'line-incorrect');
              if (isCorrect) {
                conn.pathEl.classList.add('line-correct');
                conn.pathEl.setAttribute('marker-end', 'url(#arrow-correct)');
              } else {
                conn.pathEl.classList.add('line-incorrect');
                conn.pathEl.setAttribute('marker-end', 'url(#arrow-incorrect)');
              }
            }
          });
          refreshAllPaths();
        };

        // Store reference for reset
        container._ghibliDisconnectAll = () => {
          const keys = Array.from(connections.keys());
          keys.forEach(k => disconnect(k));
          if (activeSourceCard) {
            activeSourceCard.classList.remove('active-source');
            activeSourceCard = null;
          }
          container.querySelectorAll('.source-card, .target-card').forEach(c => {
            if (!c.classList.contains('example-card')) {
              c.classList.remove('is-connected', 'active-source', 'connected-correct', 'connected-incorrect', 'unattempted-pulse');
            }
          });
          // Ensure example cards always stay is-connected
          container.querySelectorAll('.example-card').forEach(c => c.classList.add('is-connected'));
          refreshAllPaths();
        };

        // Store reference for refresh
        container._ghibliRefreshPaths = refreshAllPaths;
      });
    }

    /* ==========================================================================
       5b. Live Sentence Mirroring System (Exercise 5.1)
       ========================================================================== */
    isEx51Card(card, input) {
      if (!card) return false;
      const sec = card.closest('.ghibli-section, .ghibli-exercise-card, .exercise-block, section');
      if (sec) {
        const exNum = sec.querySelector('.ghibli-ex-num, .exercise-num');
        if (exNum && exNum.textContent.trim().includes('5.1')) return true;
      }
      if (input) {
        if (input.id && input.id.startsWith('ex51')) return true;
        if (input.className && input.className.includes('ex51')) return true;
      }
      const cardId = card.querySelector('[data-id]')?.getAttribute('data-id') || '';
      if (cardId.startsWith('p20_ex1')) return true;
      return false;
    }

    setupSentenceMirroring() {
      const cards = document.querySelectorAll('.ghibli-char-card, .fill-blank-item, .exercise-item');
      cards.forEach(card => {
        if (card.dataset.mirroringSetup) return;

        const input = card.querySelector('input.ghibli-input');
        if (!input || input.classList.contains('ghibli-inline-input')) return;

        // Only apply live mirroring to Exercise 5.1 cards
        if (!this.isEx51Card(card, input)) return;

        const promptWrap = card.querySelector('.ghibli-prompt-text, .ghibli-sentence-text, .item-text');
        if (!promptWrap) return;

        const targetSpan = promptWrap.querySelector('span:not(.ghibli-eg-badge):not(.ghibli-example-badge):not(.item-index)') || promptWrap;
        const rawText = targetSpan.textContent.trim();

        const hasBlank = /\[blank\]/i.test(rawText);
        const hasUnderscores = /_{2,}/.test(rawText);

        if (hasBlank || hasUnderscores) {
          card.dataset.mirroringSetup = 'true';
          card.dataset.origSentence = rawText;

          const isExample = input.hasAttribute('readonly') || input.classList.contains('correct') || input.classList.contains('example-input') || card.classList.contains('example-card');
          const initialVal = input.value.trim();

          let formattedHtml = rawText;
          formattedHtml = formattedHtml.replace(/\(([a-zA-Z\s]+)\)/g, '<span class="ghibli-clue-hint">($1)</span>');

          if (hasBlank) {
            formattedHtml = formattedHtml.replace(/\[blank\]/gi, '<span class="ghibli-mirrored-blank placeholder" data-placeholder="______">______</span>');
          } else if (hasUnderscores) {
            formattedHtml = formattedHtml.replace(/_{2,}/g, '<span class="ghibli-mirrored-blank placeholder" data-placeholder="______">______</span>');
          }

          targetSpan.innerHTML = formattedHtml;

          const blankSpan = targetSpan.querySelector('.ghibli-mirrored-blank');
          if (blankSpan && isExample) {
            blankSpan.classList.add('example-blank');
            if (initialVal) {
              blankSpan.textContent = initialVal;
              blankSpan.classList.remove('placeholder');
              blankSpan.classList.add('has-value', 'correct');
            }
          }
        }
      });

      document.addEventListener('input', e => {
        const input = e.target.closest('input.ghibli-input');
        if (!input || input.classList.contains('ghibli-inline-input')) return;

        const card = input.closest('.ghibli-char-card, .fill-blank-item, .exercise-item');
        if (!card || !this.isEx51Card(card, input)) return;

        const promptWrap = card.querySelector('.ghibli-prompt-text, .ghibli-sentence-text, .item-text');
        if (!promptWrap) return;

        const targetSpan = promptWrap.querySelector('span:not(.ghibli-eg-badge):not(.ghibli-example-badge):not(.item-index)') || promptWrap;
        const blankSpan = targetSpan.querySelector('.ghibli-mirrored-blank');
        if (blankSpan && blankSpan.classList.contains('example-blank')) return;

        const val = input.value;
        const origSentence = card.dataset.origSentence || '';

        if (!val || !val.trim()) {
          if (origSentence) {
            let resetHtml = origSentence.replace(/\(([a-zA-Z\s]+)\)/g, '<span class="ghibli-clue-hint">($1)</span>');
            if (/\[blank\]/i.test(resetHtml)) {
              resetHtml = resetHtml.replace(/\[blank\]/gi, '<span class="ghibli-mirrored-blank placeholder" data-placeholder="______">______</span>');
            } else {
              resetHtml = resetHtml.replace(/_{2,}/g, '<span class="ghibli-mirrored-blank placeholder" data-placeholder="______">______</span>');
            }
            targetSpan.innerHTML = resetHtml;
          }
        } else {
          const trimmedVal = val.trim();
          const promptPrefix = origSentence.split(/_{2,}|\[blank\]/i)[0].trim();

          if (promptPrefix && trimmedVal.toLowerCase().startsWith(promptPrefix.toLowerCase() + ' ') && trimmedVal.length > promptPrefix.length + 3) {
            targetSpan.innerHTML = `<span class="ghibli-mirrored-blank has-value">${val}</span>`;
          } else {
            if (!targetSpan.querySelector('.ghibli-mirrored-blank')) {
              let baseHtml = origSentence.replace(/\(([a-zA-Z\s]+)\)/g, '<span class="ghibli-clue-hint">($1)</span>');
              if (/\[blank\]/i.test(baseHtml)) {
                baseHtml = baseHtml.replace(/\[blank\]/gi, '<span class="ghibli-mirrored-blank placeholder" data-placeholder="______">______</span>');
              } else {
                baseHtml = baseHtml.replace(/_{2,}/g, '<span class="ghibli-mirrored-blank placeholder" data-placeholder="______">______</span>');
              }
              targetSpan.innerHTML = baseHtml;
            }
            const currentBlank = targetSpan.querySelector('.ghibli-mirrored-blank');
            if (currentBlank) {
              currentBlank.textContent = val;
              currentBlank.className = 'ghibli-mirrored-blank has-value';
            }
            const currentClue = targetSpan.querySelector('.ghibli-clue-hint');
            if (currentClue) currentClue.style.opacity = '0.35';
          }
        }
      });
    }

    /* ==========================================================================
       6. Instant Grading Engine (Check Answers)
       ========================================================================== */
    setupGradingEngine() {
      document.addEventListener('click', (e) => {
        const checkBtn = e.target.closest('#ghibliCheckAnswersBtn, #ghibliFloatingCheckBtn, .ghibli-check-btn, .ghibli-check-btn-bottom, .ghibli-floating-check-btn');
        if (checkBtn) {
          this.checkAnswers();
        }
      });
    }

    checkAnswers() {
      let totalItems = 0;
      let totalCorrect = 0;

      const expandContractions = (str) => {
        if (!str) return '';
        return str.toString().toLowerCase()
          .replace(/\bisn['’]?t\b/g, 'is not')
          .replace(/\baren['’]?t\b/g, 'are not')
          .replace(/\bwasn['’]?t\b/g, 'was not')
          .replace(/\bweren['’]?t\b/g, 'were not')
          .replace(/\bdon['’]?t\b/g, 'do not')
          .replace(/\bdoesn['’]?t\b/g, 'does not')
          .replace(/\bdidn['’]?t\b/g, 'did not')
          .replace(/\bcan['’]?t\b/g, 'cannot')
          .replace(/\bcannot\b/g, 'can not')
          .replace(/\bwon['’]?t\b/g, 'will not')
          .replace(/\bi['’]?m\b/g, 'i am')
          .replace(/\byou['’]?re\b/g, 'you are')
          .replace(/\bhe['’]?s\b/g, 'he is')
          .replace(/\bshe['’]?s\b/g, 'she is')
          .replace(/\bit['’]?s\b/g, 'it is')
          .replace(/\bwe['’]?re\b/g, 'we are')
          .replace(/\bthey['’]?re\b/g, 'they are')
          .replace(/\bthere['’]?s\b/g, 'there is');
      };

      const normalize = (str) => {
        if (!str) return '';
        return expandContractions(str)
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      };

      const correctUserAnswers = new Set();

      // 1. Fill in Blank inputs
      const fillInputs = document.querySelectorAll('input.ghibli-input[data-correct], input.ex1-1-input[data-correct]');
      fillInputs.forEach(input => {
        // Skip if input is part of sentence ordering fallback, connecting matching, or is a read-only example input
        if (input.closest('.ghibli-ordering-container, .ghibli-connecting-container') || input.classList.contains('ghibli-connecting-input')) return;
        if (input.hasAttribute('readonly') || input.classList.contains('example-input')) return;

        totalItems++;
        const userVal = normalize(input.value);
        const correctAttr = input.getAttribute('data-correct') || '';
        const acceptedAnswers = correctAttr.split('|').map(normalize).filter(Boolean);

        input.classList.remove('correct', 'incorrect');
        const card = input.closest('.ghibli-char-card, .fill-blank-item, .exercise-item');
        const blank = card ? card.querySelector('.ghibli-mirrored-blank') : null;

        if (userVal && (acceptedAnswers.includes(userVal) || correctAttr === 'null')) {
          input.classList.add('correct');
          if (blank && !blank.classList.contains('example-blank')) {
            blank.classList.add('correct');
            blank.classList.remove('incorrect');
          }
          totalCorrect++;
          acceptedAnswers.forEach(ans => { if (ans) correctUserAnswers.add(ans); });
          if (userVal) correctUserAnswers.add(userVal);
        } else {
          input.classList.add('incorrect');
          if (blank && !blank.classList.contains('example-blank')) {
            blank.classList.add('incorrect');
            blank.classList.remove('correct');
          }
        }
      });

      // 2. Sentence Ordering
      const orderingContainers = document.querySelectorAll('.ghibli-ordering-container');
      orderingContainers.forEach(container => {
        totalItems++;
        const dropSlot = container.querySelector('.ghibli-drop-slot');
        const orderInput = container.querySelector('.order-input, .ghibli-input');
        const correctAttr = container.getAttribute('data-correct') || (orderInput ? orderInput.getAttribute('data-correct') : '');
        const acceptedAnswers = correctAttr.split('|').map(normalize);

        let userSentence = '';
        if (dropSlot && dropSlot.children.length > 0) {
          userSentence = Array.from(dropSlot.querySelectorAll('.word-chip')).map(c => c.innerText.trim()).join(' ');
        } else if (orderInput) {
          userSentence = orderInput.value;
        }

        const userNorm = normalize(userSentence);
        if (dropSlot) dropSlot.classList.remove('correct', 'incorrect');
        if (orderInput) orderInput.classList.remove('correct', 'incorrect');

        if (userNorm && acceptedAnswers.includes(userNorm)) {
          if (dropSlot) dropSlot.classList.add('correct');
          if (orderInput) orderInput.classList.add('correct');
          totalCorrect++;
        } else {
          if (dropSlot) dropSlot.classList.add('incorrect');
          if (orderInput) orderInput.classList.add('incorrect');
        }
      });

      // 3. Multiple Choice & True/False Pill Buttons
      const mcContainers = document.querySelectorAll('.ghibli-mc-container, .mc-options-grid, .tf-btn-group, .options-grid');
      mcContainers.forEach(container => {
        const options = container.querySelectorAll('.ghibli-option');
        if (options.length === 0) return;
        totalItems++;

        options.forEach(opt => opt.classList.remove('correct', 'incorrect'));
        const selected = container.querySelector('.ghibli-option.selected');
        
        let isCorrect = false;
        if (selected) {
          const isSelectedCorrect = selected.getAttribute('data-correct') === 'true';
          if (isSelectedCorrect) {
            selected.classList.add('correct');
            isCorrect = true;
            totalCorrect++;
          } else {
            selected.classList.add('incorrect');
          }
        }

        // Highlight correct option if user chose wrong or nothing
        if (!isCorrect) {
          const correctOpt = container.querySelector('.ghibli-option[data-correct="true"]');
          if (correctOpt) correctOpt.classList.add('correct');
        }
      });

      // 3b. Cross-Out In-Sentence Exercises
      const crossoutGroups = document.querySelectorAll('.ghibli-crossout-group:not(.example-group)');
      crossoutGroups.forEach(group => {
        if (group.closest('.example-card')) return;
        const btns = group.querySelectorAll('.ghibli-crossout-btn');
        if (btns.length === 0) return;
        totalItems++;

        btns.forEach(b => b.classList.remove('correct', 'incorrect', 'should-cross'));
        group.classList.remove('unattempted');
        const crossedBtn = group.querySelector('.ghibli-crossout-btn.crossed-out, .ghibli-crossout-btn.selected');

        if (crossedBtn) {
          const isTarget = (crossedBtn.getAttribute('data-correct') === 'true');
          if (isTarget) {
            crossedBtn.classList.add('correct');
            totalCorrect++;
          } else {
            crossedBtn.classList.add('incorrect');
            // If student made an incorrect selection, show what should have been crossed
            const correctTarget = group.querySelector('.ghibli-crossout-btn[data-correct="true"]');
            if (correctTarget) {
              correctTarget.classList.add('should-cross');
            }
          }
        } else {
          // If nothing is selected, do NOT tell the student which is the correct answer
          group.classList.add('unattempted');
        }
      });

      // 4. Matching Selects
      const matchingSelects = document.querySelectorAll('select.ghibli-input[data-correct], select.ghibli-matching-select[data-correct], select.ghibli-select-matching[data-correct], .ghibli-matching-select[data-correct], .ghibli-select-matching[data-correct]');
      const seenSelects = new Set();
      matchingSelects.forEach(select => {
        if (seenSelects.has(select)) return;
        seenSelects.add(select);
        if (select.closest('.ghibli-ordering-container, .ghibli-connecting-container')) return;
        if (select.hasAttribute('readonly') || select.classList.contains('example-input')) return;

        totalItems++;
        const userVal = normalize(select.value);
        const correctAttr = select.getAttribute('data-correct') || '';
        const acceptedAnswers = correctAttr.split('|').map(normalize).filter(Boolean);

        select.classList.remove('correct', 'incorrect');
        if (userVal && acceptedAnswers.includes(userVal)) {
          select.classList.add('correct');
          totalCorrect++;
          acceptedAnswers.forEach(ans => { if (ans) correctUserAnswers.add(ans); });
          if (userVal) correctUserAnswers.add(userVal);
        } else {
          select.classList.add('incorrect');
        }
      });

      // 4b. Connecting Match Exercises (e.g. Exercise 8.6)
      const connectingContainers = document.querySelectorAll('.ghibli-connecting-container');
      connectingContainers.forEach(container => {
        const sourceCards = container.querySelectorAll('.source-card');
        sourceCards.forEach(card => {
          totalItems++;
          const input = card.querySelector('input.ghibli-connecting-input');
          const userVal = normalize(input ? input.value : '');
          const correctVal = normalize(card.getAttribute('data-correct') || (input ? input.getAttribute('data-correct') : ''));
          const targetCard = userVal ? container.querySelector(`.target-card[data-target-id="${userVal}"]`) : null;

          card.classList.remove('connected-correct', 'connected-incorrect', 'unattempted-pulse');
          if (targetCard && !targetCard.classList.contains('example-card')) {
            targetCard.classList.remove('connected-correct', 'connected-incorrect');
          }

          if (userVal) {
            const isCorrect = (userVal === correctVal);
            if (isCorrect) {
              card.classList.add('connected-correct');
              if (targetCard) targetCard.classList.add('connected-correct');
              totalCorrect++;
              if (input) {
                input.classList.add('correct');
                input.classList.remove('incorrect');
              }
              correctUserAnswers.add(userVal);
            } else {
              card.classList.add('connected-incorrect');
              if (targetCard) targetCard.classList.add('connected-incorrect');
              if (input) {
                input.classList.add('incorrect');
                input.classList.remove('correct');
              }
            }
          } else {
            card.classList.add('unattempted-pulse');
            if (input) input.classList.add('incorrect');
          }
        });

        if (container._ghibliGradeLines) {
          container._ghibliGradeLines();
        }
      });

      // 5. True / False Groups
      const tfGroups = document.querySelectorAll('.tf-btn-group');
      tfGroups.forEach(group => {
        const btns = group.querySelectorAll('.tf-btn');
        if (btns.length === 0) return;
        totalItems++;

        btns.forEach(b => b.classList.remove('correct', 'incorrect'));
        const selected = group.querySelector('.tf-btn.selected');

        if (selected) {
          const isSelectedCorrect = selected.getAttribute('data-correct') === 'true';
          if (isSelectedCorrect) {
            selected.classList.add('correct');
            totalCorrect++;
          } else {
            selected.classList.add('incorrect');
          }
        }
      });

      // 6. Sidebar / Word Panel Items (e.g. Page 19 Exercise 4.2)
      const wordItems = document.querySelectorAll('.animal-word-item, .word-panel-item, .ghibli-word-bank-item');
      wordItems.forEach(item => {
        if (item.classList.contains('example-item')) return;

        const rawText = item.getAttribute('data-word') || item.textContent || '';
        const cleanText = normalize(rawText.replace(/[✓✔]/g, '').trim());

        if (cleanText && correctUserAnswers.has(cleanText)) {
          item.classList.add('correct');
          item.style.background = 'rgba(45, 90, 39, 0.18)';
          item.style.color = '#1b4315';
          item.style.borderColor = '#2d5a27';
          item.style.fontWeight = '700';
          item.style.textDecoration = 'line-through';
          item.style.opacity = '0.85';
          item.style.boxShadow = '0 2px 6px rgba(45, 90, 39, 0.15)';
          if (!item.querySelector('.word-check-icon')) {
            const checkIcon = document.createElement('i');
            checkIcon.className = 'fa-solid fa-circle-check word-check-icon';
            checkIcon.style.color = '#2d5a27';
            checkIcon.style.marginLeft = 'auto';
            checkIcon.style.fontSize = '0.9rem';
            item.appendChild(checkIcon);
          }
        } else {
          item.classList.remove('correct');
          item.style.background = '#ffffff';
          item.style.color = '#2b261f';
          item.style.borderColor = 'rgba(45, 90, 39, 0.18)';
          item.style.fontWeight = '600';
          item.style.textDecoration = 'none';
          item.style.opacity = '1.0';
          item.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)';
          const checkIcon = item.querySelector('.word-check-icon');
          if (checkIcon) checkIcon.remove();
        }
      });

      // Update Score Display Badge
      const scoreBadge = document.querySelector('.ghibli-score-badge, #ghibliScoreBadge');
      const scoreText = document.getElementById('ghibliScoreText');
      if (scoreText) {
        scoreText.textContent = `Score: ${totalCorrect} / ${totalItems}`;
      }
      if (scoreBadge) {
        scoreBadge.classList.remove('bump');
        void scoreBadge.offsetWidth; // Trigger reflow
        scoreBadge.classList.add('bump');
      }

      // Audio & Mascot Feedback
      if (totalItems > 0) {
        if (totalCorrect === totalItems) {
          if (window.GhibliAudio) window.GhibliAudio.playFanfare();
          this.speakMascot(`Magnificent work! 🌿 All ${totalCorrect} answers are correct!`, 6000, 'celebrate');
        } else if (totalCorrect >= totalItems / 2) {
          if (window.GhibliAudio) window.GhibliAudio.playChime();
          this.speakMascot(`Great effort! You scored ${totalCorrect}/${totalItems}. Keep practicing! 🍵`, 5000, 'happy');
        } else {
          if (window.GhibliAudio) window.GhibliAudio.playWaterDrop();
          this.speakMascot(`Don't give up! You scored ${totalCorrect}/${totalItems}. Review the highlighted items and try again. 🍃`, 5000, 'encouragement');
        }
      }
    }

    /* ==========================================================================
       7. Reset Button Logic
       ========================================================================== */
    setupResetButton() {
      document.addEventListener('click', (e) => {
        const resetBtn = e.target.closest('#ghibliResetBtn, .ghibli-reset-btn, .ghibli-reset-btn-bottom');
        if (resetBtn) {
          this.resetPage();
        }
      });
    }

    resetPage() {
      // Clear feedback badges
      document.querySelectorAll('.ghibli-feedback-badge').forEach(badge => badge.remove());

      // Clear inputs
      document.querySelectorAll('.ghibli-input, .ex1-1-input, .order-input').forEach(input => {
        input.value = '';
        input.classList.remove('correct', 'incorrect');
      });

      // Reset mirrored blanks in sentences
      document.querySelectorAll('.ghibli-char-card, .fill-blank-item, .exercise-item').forEach(card => {
        const promptWrap = card.querySelector('.ghibli-prompt-text, .ghibli-sentence-text, .item-text');
        const targetSpan = promptWrap ? (promptWrap.querySelector('span:not(.ghibli-eg-badge):not(.ghibli-example-badge):not(.item-index)') || promptWrap) : null;
        const origSentence = card.dataset.origSentence;
        if (targetSpan && origSentence && !card.classList.contains('example-card')) {
          let resetHtml = origSentence.replace(/\(([a-zA-Z\s]+)\)/g, '<span class="ghibli-clue-hint">($1)</span>');
          if (/\[blank\]/i.test(resetHtml)) {
            resetHtml = resetHtml.replace(/\[blank\]/gi, '<span class="ghibli-mirrored-blank placeholder" data-placeholder="______">______</span>');
          } else {
            resetHtml = resetHtml.replace(/_{2,}/g, '<span class="ghibli-mirrored-blank placeholder" data-placeholder="______">______</span>');
          }
          targetSpan.innerHTML = resetHtml;
        }
      });

      // Reset option buttons
      document.querySelectorAll('.ghibli-option, .tf-btn').forEach(btn => {
        btn.classList.remove('selected', 'correct', 'incorrect');
      });

      // Reset crossout buttons (preserve pre-crossed-out example groups)
      document.querySelectorAll('.ghibli-crossout-group:not(.example-group)').forEach(group => {
        if (group.closest('.example-card')) return;
        group.classList.remove('unattempted');
        group.querySelectorAll('.ghibli-crossout-btn').forEach(btn => {
          btn.classList.remove('crossed-out', 'selected', 'correct', 'incorrect', 'should-cross');
        });
      });

      // Reset matching selects
      document.querySelectorAll('select.ghibli-input, select.ghibli-matching-select, select.ghibli-select-matching, .ghibli-matching-select, .ghibli-select-matching').forEach(select => {
        select.selectedIndex = 0;
        select.classList.remove('correct', 'incorrect');
      });

      // Reset connecting matching containers
      document.querySelectorAll('.ghibli-connecting-container').forEach(container => {
        if (container._ghibliDisconnectAll) {
          container._ghibliDisconnectAll();
        }
      });

      // Reset sidebar / word panel items
      document.querySelectorAll('.animal-word-item, .word-panel-item, .ghibli-word-bank-item').forEach(item => {
        if (!item.classList.contains('example-item')) {
          item.classList.remove('correct');
          item.style.background = '#ffffff';
          item.style.color = '#2b261f';
          item.style.borderColor = 'rgba(45, 90, 39, 0.18)';
          item.style.fontWeight = '600';
          item.style.textDecoration = 'none';
          item.style.opacity = '1.0';
          item.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)';
          const checkIcon = item.querySelector('.word-check-icon');
          if (checkIcon) checkIcon.remove();
        }
      });

      // Reset sentence ordering chips back to pool
      document.querySelectorAll('.ghibli-ordering-container').forEach(container => {
        const pool = container.querySelector('.word-pool');
        const dropSlot = container.querySelector('.ghibli-drop-slot');
        if (pool && dropSlot) {
          const chips = Array.from(dropSlot.querySelectorAll('.word-chip'));
          chips.forEach(chip => pool.appendChild(chip));
          dropSlot.classList.remove('correct', 'incorrect');
        }
      });

      // Reset score badge
      const inputCount = document.querySelectorAll('input.ghibli-input[data-correct]:not([readonly]):not(.example-input):not(.ghibli-connecting-input), input.ex1-1-input[data-correct]').length;
      const selectCount = document.querySelectorAll('select.ghibli-input[data-correct], select.ghibli-matching-select[data-correct], select.ghibli-select-matching[data-correct]').length;
      const orderCount = document.querySelectorAll('.ghibli-ordering-container').length;
      const mcCount = document.querySelectorAll('.ghibli-mc-container, .mc-options-grid').length;
      const crossoutCount = Array.from(document.querySelectorAll('.ghibli-crossout-group:not(.example-group)')).filter(g => !g.closest('.example-card')).length;
      const tfCount = document.querySelectorAll('.tf-btn-group').length;
      const connectingCount = document.querySelectorAll('.ghibli-connecting-container .source-card').length;
      const totalItems = inputCount + selectCount + orderCount + mcCount + crossoutCount + tfCount + connectingCount;

      const scoreText = document.getElementById('ghibliScoreText');
      if (scoreText) {
        scoreText.textContent = `Score: 0 / ${totalItems}`;
      }

      if (window.GhibliAudio) window.GhibliAudio.playWaterDrop();
      this.speakMascot("Page reset! Ready for a clean start. 🧹", 4000);
    }

    /* ==========================================================================
       8. Navigation, Quick Page Jump Bar & Keyboard Shortcuts
       ========================================================================== */
    setupKeyboardNavigation() {
      // Inject Quick Page Jump widget into navigation bar if present
      // Quick page jump widget disabled in standalone homework mode

      document.addEventListener('keydown', (e) => {
        // Ctrl + J or Alt + J for Quick Jump
        if ((e.ctrlKey || e.altKey) && e.key.toLowerCase() === 'j') {
          e.preventDefault();
          this.promptPageJump();
          return;
        }

        // Ignore arrow navigation if typing in an input box
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
          return;
        }

        if (e.key === 'ArrowLeft') {
          const prevBtn = document.querySelector('.chapter-nav-bar a:first-child, .page-turn-bar a:first-child');
          if (prevBtn) prevBtn.click();
        } else if (e.key === 'ArrowRight') {
          const nextBtn = document.querySelector('.chapter-nav-bar a:last-child, .page-turn-bar a:last-child');
          if (nextBtn) nextBtn.click();
        }
      });
    }

    injectQuickPageJumpWidget() {
      const turnBars = document.querySelectorAll('.page-turn-bar, .chapter-nav-bar');
      turnBars.forEach(bar => {
        if (bar.querySelector('.quick-jump-wrap')) return;

        const jumpWrap = document.createElement('div');
        jumpWrap.className = 'quick-jump-wrap';
        jumpWrap.style.cssText = 'display:flex; align-items:center; gap:6px; background:rgba(255,255,255,0.9); padding:4px 10px; border-radius:20px; border:1px solid rgba(0,0,0,0.15);';
        
        jumpWrap.innerHTML = `
          <i class="fa-solid fa-compass" style="color:#2d5a27; font-size:0.9rem;"></i>
          <input type="number" class="quick-jump-input" placeholder="Page #" min="12" max="176" style="width:60px; padding:3px 6px; border-radius:10px; border:1px solid #ccc; font-weight:700; text-align:center; font-size:0.9rem; outline:none;">
          <button class="quick-jump-btn" style="background:#2d5a27; color:#fff; border:none; padding:4px 10px; border-radius:10px; font-weight:700; font-size:0.8rem; cursor:pointer;">Go</button>
        `;

        const input = jumpWrap.querySelector('.quick-jump-input');
        const btn = jumpWrap.querySelector('.quick-jump-btn');

        const doJump = () => {
          const val = parseInt(input.value, 10);
          if (val && val >= 12 && val <= 176) {
            const pageStr = String(val).padStart(3, '0');
            window.location.href = `ghibli_p${pageStr}.html`;
          } else {
            alert('Please enter a page number between 12 and 176!');
          }
        };

        btn.addEventListener('click', doJump);
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') doJump();
        });

        // Insert before badge or middle
        const badge = bar.querySelector('.page-turn-badge');
        if (badge) {
          bar.insertBefore(jumpWrap, badge);
        } else {
          bar.appendChild(jumpWrap);
        }
      });
    }

    promptPageJump() {
      const pageNum = prompt("🌿 Quick Jump: Enter a page number (12 to 176):");
      if (pageNum) {
        const val = parseInt(pageNum.trim(), 10);
        if (val && val >= 12 && val <= 176) {
          const pageStr = String(val).padStart(3, '0');
          window.location.href = `ghibli_p${pageStr}.html`;
        } else {
          alert("Invalid page number! Please enter a number between 12 and 176.");
        }
      }
    }
  }

  const engineInstance = new GhibliPageEngine();
  window.GhibliEngine = engineInstance;
  window.ghibliPageEngineInstance = engineInstance;
})(window, document);
