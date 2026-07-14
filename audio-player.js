(function () {
  const SPEEDS = [1, 1.25, 1.5, 0.75];
  const BAR_W = 3, BAR_GAP = 3;

  function fmt(sec) {
    if (!isFinite(sec)) return "–:––";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return m + ":" + s;
  }

  function initPlayer(root) {
    const audio    = root.querySelector("audio");
    const playBtn  = root.querySelector(".dp-play");
    const iconPlay = root.querySelector(".dp-icon-play");
    const iconPause= root.querySelector(".dp-icon-pause");
    const wave     = root.querySelector(".dp-wave");
    const canvas   = wave.querySelector("canvas");
    const scrub    = wave.querySelector("input[type=range]");
    const tCur     = root.querySelector(".dp-time-current");
    const tTot     = root.querySelector(".dp-time-total");
    const tChip    = root.querySelector(".dp-time-total-chip");
    const speedBtn = root.querySelector(".dp-speed");
    const ctx2d    = canvas.getContext("2d");
    let peaks = null;
    let speedIdx = 0;
    let scrubbing = false;

    function computePeaks(buffer, count) {
      const data = buffer.getChannelData(0);
      const block = Math.floor(data.length / count);
      const out = new Float32Array(count);
      let max = 0;
      for (let i = 0; i < count; i++) {
        let peak = 0;
        const start = i * block;
        for (let j = 0; j < block; j += 16) {
          const v = Math.abs(data[start + j]);
          if (v > peak) peak = v;
        }
        out[i] = peak;
        if (peak > max) max = peak;
      }
      if (max > 0) for (let i = 0; i < count; i++) out[i] /= max;
      return out;
    }

    function drawWave(progressPct) {
      const dpr = window.devicePixelRatio || 1;
      const w = wave.clientWidth, h = wave.clientHeight;
      if (canvas.width !== w * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2d.clearRect(0, 0, w, h);
      const count = Math.floor(w / (BAR_W + BAR_GAP));
      const mid = h / 2;
      const playedX = (progressPct / 100) * w;
      for (let i = 0; i < count; i++) {
        const x = i * (BAR_W + BAR_GAP);
        const p = peaks ? peaks[Math.floor((i / count) * peaks.length)] : 0.28;
        const bh = Math.max(3, p * (h - 10));
        ctx2d.fillStyle = x < playedX ? "#e0b968" : "rgba(255,255,255,0.22)";
        ctx2d.beginPath();
        ctx2d.roundRect(x, mid - bh / 2, BAR_W, bh, 1.5);
        ctx2d.fill();
      }
    }

    async function loadPeaks() {
      try {
        const res = await fetch(audio.currentSrc || audio.src);
        const buf = await res.arrayBuffer();
        const actx = new (window.AudioContext || window.webkitAudioContext)();
        const decoded = await actx.decodeAudioData(buf);
        peaks = computePeaks(decoded, 400);
        actx.close();
        drawWave(currentPct());
      } catch (e) {
        drawWave(currentPct());
      }
    }

    function currentPct() {
      return audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    }

    function setIcon(playing) {
      iconPlay.style.display  = playing ? "none" : "block";
      iconPause.style.display = playing ? "block" : "none";
      playBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
      root.classList.toggle("is-playing", playing);
    }
    playBtn.addEventListener("click", () => { audio.paused ? audio.play() : audio.pause(); });
    audio.addEventListener("play",  () => setIcon(true));
    audio.addEventListener("pause", () => setIcon(false));
    audio.addEventListener("ended", () => setIcon(false));

    root.querySelectorAll(".dp-skip").forEach(btn => {
      btn.addEventListener("click", () => {
        const d = parseFloat(btn.dataset.skip);
        audio.currentTime = Math.min(Math.max(audio.currentTime + d, 0), audio.duration || 0);
      });
    });

    audio.addEventListener("loadedmetadata", () => {
      tTot.textContent = fmt(audio.duration);
      if (tChip) tChip.textContent = fmt(audio.duration) + " listen";
    });

    audio.addEventListener("timeupdate", () => {
      const pct = currentPct();
      if (!scrubbing) scrub.value = pct;
      tCur.textContent = fmt(audio.currentTime);
      drawWave(scrubbing ? scrub.value : pct);
    });

    scrub.addEventListener("input", () => {
      scrubbing = true;
      if (audio.duration) tCur.textContent = fmt((scrub.value / 100) * audio.duration);
      drawWave(scrub.value);
    });
    scrub.addEventListener("change", () => {
      if (audio.duration) audio.currentTime = (scrub.value / 100) * audio.duration;
      scrubbing = false;
    });

    speedBtn.addEventListener("click", () => {
      speedIdx = (speedIdx + 1) % SPEEDS.length;
      audio.playbackRate = SPEEDS[speedIdx];
      speedBtn.textContent = SPEEDS[speedIdx] + "×";
    });

    window.addEventListener("resize", () => drawWave(currentPct()));

    function startDemo() {
      const DUR = 45, RATE = 22050;
      const octx = new OfflineAudioContext(1, DUR * RATE, RATE);
      const osc = octx.createOscillator();
      const gain = octx.createGain();
      osc.frequency.value = 200;
      let t = 0;
      while (t < DUR) {
        const burst = 0.25 + Math.random() * 0.9;
        const pause = 0.08 + Math.random() * 0.35;
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.06 + Math.random() * 0.1, t + burst * 0.3);
        gain.gain.linearRampToValueAtTime(0.001, t + burst);
        t += burst + pause;
      }
      osc.connect(gain).connect(octx.destination);
      osc.start();
      octx.startRendering().then(buf => {
        const n = buf.length, data = buf.getChannelData(0);
        const wav = new DataView(new ArrayBuffer(44 + n * 2));
        const ws = (o, s) => { for (let i = 0; i < s.length; i++) wav.setUint8(o + i, s.charCodeAt(i)); };
        ws(0, "RIFF"); wav.setUint32(4, 36 + n * 2, true); ws(8, "WAVE");
        ws(12, "fmt "); wav.setUint32(16, 16, true); wav.setUint16(20, 1, true);
        wav.setUint16(22, 1, true); wav.setUint32(24, RATE, true);
        wav.setUint32(28, RATE * 2, true); wav.setUint16(32, 2, true);
        wav.setUint16(34, 16, true); ws(36, "data"); wav.setUint32(40, n * 2, true);
        for (let i = 0; i < n; i++) wav.setInt16(44 + i * 2, Math.max(-1, Math.min(1, data[i])) * 32767, true);
        audio.src = URL.createObjectURL(new Blob([wav.buffer], { type: "audio/wav" }));
        audio.addEventListener("loadedmetadata", loadPeaks, { once: true });
      });
    }

    if (audio.hasAttribute("data-demo")) {
      startDemo();
    } else if (audio.currentSrc || audio.src) {
      loadPeaks();
    }
    drawWave(0);
  }

  document.querySelectorAll(".dp-player").forEach(initPlayer);
})();