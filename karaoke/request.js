import { auth, db, onAuthStateChanged, signInGuest } from "./firebase.js";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const roomId = params.get("room") || "default";

const roomLabel = document.getElementById("roomLabel");
const authStatus = document.getElementById("authStatus");
const requestForm = document.getElementById("requestForm");
const requestedByInput = document.getElementById("requestedBy");
const youtubeUrlInput = document.getElementById("youtubeUrl");
const formFeedback = document.getElementById("formFeedback");
const queueList = document.getElementById("queueList");

roomLabel.textContent = `Sala: ${roomId}`;

const queueRef = collection(db, "rooms", roomId, "queue");

onAuthStateChanged(auth, (user) => {
  if (!user) {
    authStatus.textContent = "Conectando como convidado...";
    return;
  }

  authStatus.textContent = `Conectado: ${user.uid}`;
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
    formFeedback.textContent = "Pedido enviado com sucesso.";
  } catch (error) {
    formFeedback.textContent = "Nao foi possivel enviar. Verifique auth e regras do Firestore.";
    console.error(error);
  }
});

onSnapshot(query(queueRef, orderBy("createdAt", "asc")), (snapshot) => {
  const queueState = snapshot.docs.map((songDoc) => ({ id: songDoc.id, ...songDoc.data() }));
  renderQueue(queueState);
});

function renderQueue(items) {
  queueList.innerHTML = "";

  for (const item of items) {
    const li = document.createElement("li");
    li.className = `queue-item ${item.status || "queued"}`;

    const title = document.createElement("strong");
    title.textContent = `${item.requestedBy || "Anonimo"}`;

    const details = document.createElement("span");
    details.className = "queue-meta";
    details.textContent = `Status: ${item.status || "queued"}`;

    li.appendChild(title);
    li.appendChild(details);
    queueList.appendChild(li);
  }
}

function extractVideoId(url) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "").trim();
    }

    if (parsed.hostname.includes("youtube.com")) {
      const paramId = parsed.searchParams.get("v");
      if (paramId) {
        return paramId;
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

signInGuest().catch((error) => {
  authStatus.textContent = "Falha ao autenticar anonimamente.";
  console.error(error);
});
