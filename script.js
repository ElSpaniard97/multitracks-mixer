// Replace with your Render backend URL
const API_URL = "https://youtube-audio-analyzer.onrender.com";

let wavesurferInstances = {};
let isPlaying = false;

// Handle button clicks
document.getElementById("loadBtn").addEventListener("click", () => {
  const url = document.getElementById("youtubeURL").value.trim();
  if (!url) {
    updateStatus("⚠️ Please enter a valid YouTube URL.");
    return;
  }
  fetchStemsFromYouTube(url);
});

document.getElementById("playBtn").addEventListener("click", () => {
  togglePlayPause();
});

document.getElementById("stopBtn").addEventListener("click", () => {
  stopAll();
});

function updateStatus(message) {
  document.getElementById("status").innerText = message;
}

// Call Render API
async function fetchStemsFromYouTube(url) {
  try {
    updateStatus("🎵 Processing YouTube URL... please wait (30–60s)");

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ youtube_url: url }),
    });

    if (!response.ok) {
      updateStatus("❌ Failed to process audio. Please check the backend logs.");
      return;
    }

    const data = await response.json();
    console.log("Stems received:", data);

    if (!data.stems) {
      updateStatus("⚠️ No stems returned from server.");
      return;
    }

    // Clear existing UI
    document.getElementById("waveforms").innerHTML = "";
    document.getElementById("mixers").innerHTML = "";
    wavesurferInstances = {};

    // Create new waveforms and faders
    for (const [stemName, path] of Object.entries(data.stems)) {
      createTrack(stemName, `${API_URL.replace("/api/extract", "")}${path}`);
    }

    updateStatus("✅ Stems loaded. Press ▶️ to play!");
  } catch (err) {
    console.error(err);
    updateStatus("❌ Error connecting to the API.");
  }
}

// Create waveform + fader for a track
function createTrack(name, audioURL) {
  const waveContainer = document.createElement("div");
  waveContainer.id = `${name}-wave`;
  waveContainer.style.marginBottom = "10px";
  document.getElementById("waveforms").appendChild(waveContainer);

  const ws = WaveSurfer.create({
    container: `#${name}-wave`,
    waveColor: "#58a6ff",
    progressColor: "#1f6feb",
    height: 80,
  });

  ws.load(audioURL);
  wavesurferInstances[name] = ws;

  // Mixer control
  const mixer = document.createElement("div");
  mixer.className = "track";
  mixer.innerHTML = `
    <h3>${name}</h3>
    <input type="range" min="0" max="1" step="0.01" value="1" class="fader" />
  `;
  document.getElementById("mixers").appendChild(mixer);

  const slider = mixer.querySelector(".fader");
  slider.addEventListener("input", (e) => {
    const volume = parseFloat(e.target.value);
    if (ws && ws.backend) ws.setVolume(volume);
  });
}

// Play/pause all tracks together
function togglePlayPause() {
  if (Object.keys(wavesurferInstances).length === 0) {
    updateStatus("⚠️ No tracks loaded yet.");
    return;
  }

  if (!isPlaying) {
    Object.values(wavesurferInstances).forEach((ws) => ws.play());
    updateStatus("▶️ Playing all tracks...");
    isPlaying = true;
  } else {
    Object.values(wavesurferInstances).forEach((ws) => ws.pause());
    updateStatus("⏸️ Paused.");
    isPlaying = false;
  }
}

// Stop all tracks
function stopAll() {
  Object.values(wavesurferInstances).forEach((ws) => ws.stop());
  updateStatus("⏹️ Stopped playback.");
  isPlaying = false;
}
