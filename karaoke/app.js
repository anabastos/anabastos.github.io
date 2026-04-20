import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "COLOQUE_SUA_API_KEY",
  authDomain: "COLOQUE_SEU_AUTH_DOMAIN",
  projectId: "COLOQUE_SEU_PROJECT_ID",
  storageBucket: "COLOQUE_SEU_STORAGE_BUCKET",
  messagingSenderId: "COLOQUE_SEU_MESSAGING_SENDER_ID",
  appId: "COLOQUE_SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const requestedByInput = document.getElementById("requestedBy");
const youtubeUrlInput = document.getElementById("youtubeUrl");
const requestForm = document.getElementById("requestForm");
const queueList = document.getElementById("queueList");
const nowPlayingText = document.getElementById("nowPlayingText");
const nextBtn = document.getElementById("nextBtn");
const hostModeInput = document.getElementById("hostMode");
const autoAdvanceInput = document.getElementById("autoAdvance");
const formFeedback = document.getElementById("formFeedback");
const roomLabel = document.getElementById("roomLabel");

const params = new URLSearchParams(window.location.search);
const roomId = params.get("room") || "default";

roomLabel.textContent = `Sala: ${roomId}`;

const queueRef = collection(db, "rooms", roomId, "queue");
const roomRef = doc(db, "rooms", roomId);

let queueState = [];
let player = null;
let currentVideoId = null;

hostModeInput.addEventListener("change", () => {
  syncHostControls();
});

nextBtn.addEventListener("click", async () => {
  await advanceToNext();
});

requestForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const requestedBy = requestedByInput.value.trim();
  const url = youtubeUrlInput.value.trim();
  const videoId = extractVideoId(url);

  if (!videoId) {
    formFeedback.textContent = "Link invalido. Envie uma URL do YouTube.";
    return;
  }

  try {
    await addDoc(queueRef, {
      requestedBy,
      url,
      videoId,
      status: "queued",
      createdAt: serverTimestamp(),
      playedAt: null
    });

    requestForm.reset();
    formFeedback.textContent = "Pedido recebido e adicionado na fila.";
  } catch (error) {
    formFeedback.textContent = "Nao foi possivel adicionar na fila. Verifique o Firebase config/rules.";
    console.error(error);
  }
});

window.onYouTubeIframeAPIReady = () => {
  player = new window.YT.Player("player", {
    height: "100%",
    width: "100%",
    videoId: "",
    playerVars: {
      playsinline: 1,
      rel: 0,
      origin: window.location.origin
    },
    events: {
      onStateChange: handlePlayerStateChange
    }
  });
};

function handlePlayerStateChange(event) {
  if (event.data === window.YT.PlayerState.ENDED && autoAdvanceInput.checked && hostModeInput.checked) {
    advanceToNext();
  }
}

function extractVideoId(url) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "").trim();
    }

    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.searchParams.get("v")) {
        return parsed.searchParams.get("v");
      }

      const parts = parsed.pathname.split("/").filter(Boolean);
      const embedIndex = parts.indexOf("embed");
      if (embedIndex >= 0 && parts[embedIndex + 1]) {
        return parts[embedIndex + 1];
      }

      const shortsIndex = parts.indexOf("shorts");
      if (shortsIndex >= 0 && parts[shortsIndex + 1]) {
        return parts[shortsIndex + 1];
      }
    }

    return null;
  } catch {
    return null;
  }
}

function syncHostControls() {
  const isHost = hostModeInput.checked;
  nextBtn.disabled = !isHost;
}

function renderQueue() {
  queueList.innerHTML = "";

  for (const item of queueState) {
    const li = document.createElement("li");
    li.className = `queue-item ${item.status || "queued"}`;

    const title = document.createElement("strong");
    title.textContent = `${item.requestedBy || "Anonimo"} pediu: ${item.url}`;

    const meta = document.createElement("span");
    meta.className = "queue-meta";
    meta.textContent = `Status: ${item.status || "queued"}`;

    li.appendChild(title);
    li.appendChild(meta);

    if (hostModeInput.checked) {
      const actionWrap = document.createElement("div");
      actionWrap.className = "item-actions";

      if (item.status !== "playing") {
        const playNowButton = document.createElement("button");
        playNowButton.type = "button";
        playNowButton.textContent = "Tocar agora";
        playNowButton.addEventListener("click", async () => {
          await forcePlayItem(item.id);
        });
        actionWrap.appendChild(playNowButton);
      }

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.textContent = "Remover";
      removeButton.addEventListener("click", async () => {
        await deleteDoc(doc(db, "rooms", roomId, "queue", item.id));
      });
      actionWrap.appendChild(removeButton);

      li.appendChild(actionWrap);
    }

    queueList.appendChild(li);
  }
}

async function forcePlayItem(itemId) {
  if (!hostModeInput.checked) {
    return;
  }

  const playing = queueState.find((item) => item.status === "playing");
  if (playing && playing.id !== itemId) {
    await updateDoc(doc(db, "rooms", roomId, "queue", playing.id), {
      status: "played",
      playedAt: serverTimestamp()
    });
  }

  await updateDoc(doc(db, "rooms", roomId, "queue", itemId), {
    status: "playing"
  });

  await updateDoc(roomRef, {
    nowPlayingId: itemId,
    updatedAt: serverTimestamp()
  });
}

async function advanceToNext() {
  if (!hostModeInput.checked) {
    return;
  }

  const playing = queueState.find((item) => item.status === "playing");

  if (playing) {
    await updateDoc(doc(db, "rooms", roomId, "queue", playing.id), {
      status: "played",
      playedAt: serverTimestamp()
    });
  }

  const next = queueState.find((item) => item.status === "queued");

  if (!next) {
    await updateDoc(roomRef, {
      nowPlayingId: null,
      updatedAt: serverTimestamp()
    });
    nowPlayingText.textContent = "Fila vazia.";
    return;
  }

  await updateDoc(doc(db, "rooms", roomId, "queue", next.id), {
    status: "playing"
  });

  await updateDoc(roomRef, {
    nowPlayingId: next.id,
    updatedAt: serverTimestamp()
  });
}

function syncPlayerWithQueue() {
  const playing = queueState.find((item) => item.status === "playing");

  if (!playing) {
    currentVideoId = null;
    return;
  }

  nowPlayingText.textContent = `Agora: ${playing.requestedBy || "Anonimo"}`;

  if (playing.videoId && playing.videoId !== currentVideoId && player && player.loadVideoById) {
    currentVideoId = playing.videoId;
    player.loadVideoById(playing.videoId);
  }
}

onSnapshot(query(queueRef, orderBy("createdAt", "asc")), (snapshot) => {
  queueState = snapshot.docs.map((songDoc) => ({ id: songDoc.id, ...songDoc.data() }));

  renderQueue();
  syncPlayerWithQueue();
});

syncHostControls();

async function bootstrapRoom() {
  const playingDocs = await getDocs(query(queueRef, where("status", "==", "playing")));
  if (playingDocs.empty) {
    nowPlayingText.textContent = "Aguardando host iniciar a fila.";
  }
}

bootstrapRoom();
