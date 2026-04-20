import {
  auth,
  db,
  onAuthStateChanged,
  signInGuest,
  signInHost,
  signOutCurrent
} from "./firebase.js";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const roomId = params.get("room") || "default";

const roomLabel = document.getElementById("roomLabel");
const hostLoginForm = document.getElementById("hostLoginForm");
const hostEmailInput = document.getElementById("hostEmail");
const hostPasswordInput = document.getElementById("hostPassword");
const guestBtn = document.getElementById("guestBtn");
const logoutBtn = document.getElementById("logoutBtn");
const authStatus = document.getElementById("authStatus");
const hostStatus = document.getElementById("hostStatus");
const nextBtn = document.getElementById("nextBtn");
const autoAdvanceInput = document.getElementById("autoAdvance");
const queueList = document.getElementById("queueList");
const nowPlayingText = document.getElementById("nowPlayingText");

const queueRef = collection(db, "rooms", roomId, "queue");
const roomRef = doc(db, "rooms", roomId);

roomLabel.textContent = `Sala: ${roomId}`;

let queueState = [];
let player = null;
let currentVideoId = null;
let isHost = false;

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
  if (event.data === window.YT.PlayerState.ENDED && autoAdvanceInput.checked && isHost) {
    advanceToNext();
  }
}

hostLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = hostEmailInput.value.trim();
  const password = hostPasswordInput.value;

  if (!email || !password) {
    authStatus.textContent = "Informe email e senha para login de host.";
    return;
  }

  try {
    await signInHost(email, password);
    hostPasswordInput.value = "";
    authStatus.textContent = "Login realizado. Validando permissao de host...";
  } catch (error) {
    authStatus.textContent = "Falha no login. Verifique email/senha no Firebase Auth.";
    console.error(error);
  }
});

guestBtn.addEventListener("click", async () => {
  try {
    await signInGuest();
  } catch (error) {
    authStatus.textContent = "Nao foi possivel entrar como convidado.";
    console.error(error);
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    await signOutCurrent();
    await signInGuest();
  } catch (error) {
    authStatus.textContent = "Falha ao sair.";
    console.error(error);
  }
});

nextBtn.addEventListener("click", async () => {
  await advanceToNext();
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    authStatus.textContent = "Sem usuario. Entrando como convidado...";
    try {
      await signInGuest();
    } catch (error) {
      authStatus.textContent = "Nao foi possivel autenticar.";
      console.error(error);
    }
    return;
  }

  authStatus.textContent = `UID: ${user.uid}${user.isAnonymous ? " (anonimo)" : ""}`;
  await refreshHostState(user.uid);
});

onSnapshot(query(queueRef, orderBy("createdAt", "asc")), (snapshot) => {
  queueState = snapshot.docs.map((songDoc) => ({ id: songDoc.id, ...songDoc.data() }));
  renderQueue();
  syncPlayerWithQueue();
});

async function refreshHostState(uid) {
  const hostDocRef = doc(db, "rooms", roomId, "hosts", uid);
  const hostDoc = await getDoc(hostDocRef);

  isHost = hostDoc.exists();
  nextBtn.disabled = !isHost;
  hostStatus.textContent = isHost
    ? "Permissao host: ativa"
    : "Permissao host: sem acesso (adicione seu UID em rooms/{roomId}/hosts/{uid}).";

  renderQueue();
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

    if (isHost) {
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
  if (!isHost) {
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
  if (!isHost) {
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
    nowPlayingText.textContent = "Nada tocando no momento.";
    return;
  }

  nowPlayingText.textContent = `Agora: ${playing.requestedBy || "Anonimo"}`;

  if (playing.videoId && playing.videoId !== currentVideoId && player && player.loadVideoById) {
    currentVideoId = playing.videoId;
    player.loadVideoById(playing.videoId);
  }
}

signInGuest().catch((error) => {
  authStatus.textContent = "Falha ao iniciar autenticacao anonima.";
  console.error(error);
});
