// Dados de Eventos
let eventos = [];

async function carregarEventos() {
    try {
        const response = await fetch("content/eventos.json");

        if (!response.ok) {
            throw new Error(`Falha ao carregar eventos: ${response.status}`);
        }

        eventos = await response.json();
    } catch (error) {
        console.error("Erro ao carregar eventos:", error);
        eventos = [];
    }
}

// Dados de Equipamentos
let equipamentos = [];

async function carregarEquipamentos() {
    try {
        const response = await fetch("content/equipamentos.json");

        if (!response.ok) {
            throw new Error(`Falha ao carregar equipamentos: ${response.status}`);
        }

        equipamentos = await response.json();
    } catch (error) {
        console.error("Erro ao carregar equipamentos:", error);
        equipamentos = [];
    }
}

// Dados de Mídia — vêm do mídia kit no NAS, servido pelo QG
// (o manifesto é público; os arquivos originais ficam em /opt/data/mediakit)
const MEDIAKIT_URL = "https://app.portellolabs.co/qg/mediakit/manifest.json";
let midiaKit = [];
let midiaFiltro = "all";
let midiaCarregada = false;

async function carregarMidia() {
    try {
        const response = await fetch(MEDIAKIT_URL, { cache: "no-cache" });

        if (!response.ok) {
            throw new Error(`Falha ao carregar o mídia kit: ${response.status}`);
        }

        const data = await response.json();
        midiaKit = [];
        (data.categories || []).forEach((cat) => {
            (cat.items || []).forEach((item) => {
                midiaKit.push({ ...item, category: cat.key, categoryLabel: cat.label });
            });
        });
    } catch (error) {
        console.error("Erro ao carregar o mídia kit:", error);
        midiaKit = [];
    }
}

// Renderizar Eventos
function renderEventos() {
    const grid = document.getElementById("eventos-grid");
    grid.innerHTML = [...eventos].reverse().map(e => {
        const instagramId = e.instagram ? e.instagram.match(/\/(?:p|reel)\/([^/?]+)/)?.[1] : null;
        let embedHtml = "";
        if (Array.isArray(e.images) && e.images.length) {
            const grid = e.images.length > 1 ? ' style="display:grid;gap:8px;"' : "";
            embedHtml = `<div class="event-image"${grid}>${e.images.map(src => `<img src="${src}" alt="${e.title}" loading="lazy" onerror="this.style.display='none';">`).join("")}</div>`;
        } else if (instagramId) {
            embedHtml = `<div class="event-image"><iframe src="https://www.instagram.com/p/${instagramId}/embed/captioned/?cr=1" width="100%" frameborder="0" style="border:none;"></iframe></div>`;
        } else if (e.youtube) {
            const youtubeId = e.youtube.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&?]+)/)?.[1];
            embedHtml = `<div class="event-image"><iframe width="100%" height="400" src="https://www.youtube.com/embed/${youtubeId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
        } else if (e.soundcloud) {
            embedHtml = `<div class="event-image"><iframe width="100%" height="500" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=${e.soundcloud}&color=%23d3d3d3&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true"></iframe><div style="font-size: 11px; color: #cccccc;line-break: strict; word-break: break-word; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-family: Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,sans-serif;"><a href="${e.soundcloud}" title="DJ Rambda" target="_blank" style="color: #cccccc; text-decoration: none;">DJ Rambda</a></div></div>`;
        } else if (e.video) {
            embedHtml = `<div class="event-image"><video width="100%" height="400" style="background: #000;" controls><source src="${e.video}" type="video/mp4">Seu navegador não suporta o elemento de vídeo.</video></div>`;
        } else if (e.image) {
            embedHtml = `<div class="event-image"><img src="${e.image}" alt="${e.title}" onerror="this.parentElement.style.display='none';"></div>`;
        }
        return `
        <div class="card event-card">
            ${embedHtml}
            <div class="event-header">
                <div class="event-title">${e.title}</div>
                <div class="event-date">${e.date}</div>
            </div>
            <div class="event-body">
                ${e.instagram ? `<div class="event-meta-item"><a href="${e.instagram}" target="_blank" class="social-tag">📱 Instagram</a></div>` : ""}
                ${e.youtube ? `<div class="event-meta-item"><a href="${e.youtube}" target="_blank" class="social-tag">📺 YouTube</a></div>` : ""}
                ${e.soundcloud ? `<div class="event-meta-item"><a href="${e.soundcloud}" target="_blank" class="social-tag">🎵 SoundCloud</a></div>` : ""}
                ${e.local ? `<div class="event-meta-item"><span class="event-meta-label">Local:</span><span class="event-meta-value">${e.local}</span></div>` : ""}
                ${e.content.length > 0 ? `<div class="event-content-row"><span class="event-meta-label">Conteúdo:</span><span class="event-meta-value">${e.content.join(", ")}</span></div>` : ""}
                ${e.genero.length > 0 ? `<div class="event-tags">${e.genero.map(g => `<span class="tag">${g}</span>`).join("")}</div>` : ""}
            </div>
        </div>
        `;
    }).join("");
    if (window.instgrm && window.instgrm.Embeds && window.instgrm.Embeds.process) {
        window.instgrm.Embeds.process();
    }
}

// Renderizar Equipamentos
function renderEquipamentos() {
    const grid = document.getElementById("equipamentos-grid");
    grid.innerHTML = equipamentos.map(eq => `
        <div class="card equipment-card">
            <div class="equipment-image">
                <img src="${eq.image}" alt="${eq.name}" onerror="this.style.display='none';">
            </div>
            <div class="equipment-body">
                <div class="equipment-name">${eq.name}</div>
                <div class="equipment-price">${eq.price}</div>
            </div>
        </div>
    `).join("");
}

// Renderizar Mídia
const MIDIA_ORDEM = ["logo", "fotos", "videos", "bio"];
const MIDIA_ROTULO = { logo: "Logos", fotos: "Fotos", videos: "Vídeos de festas", bio: "Bio & presskit" };

function escMidia(txt) {
    return String(txt == null ? "" : txt)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function midiaCategorias() {
    const mapa = new Map();
    midiaKit.forEach((m) => {
        const atual = mapa.get(m.category) || { key: m.category, label: m.categoryLabel || MIDIA_ROTULO[m.category] || m.category, n: 0 };
        atual.n += 1;
        mapa.set(m.category, atual);
    });
    return Array.from(mapa.values()).sort(
        (a, b) => (MIDIA_ORDEM.indexOf(a.key) + 1 || 99) - (MIDIA_ORDEM.indexOf(b.key) + 1 || 99));
}

function midiaFiltroHtml() {
    const cats = midiaCategorias();
    const btn = (key, label, ativo) =>
        `<button class="media-filter${ativo ? " on" : ""}" data-cat="${key}">${escMidia(label)}</button>`;
    return [btn("all", `Todos (${midiaKit.length})`, midiaFiltro === "all")]
        .concat(cats.map((c) => btn(c.key, `${c.label} (${c.n})`, midiaFiltro === c.key)))
        .join("");
}

function midiaCardHtml(m) {
    const titulo = escMidia(m.title || m.id);
    const legenda = m.caption ? `<span class="media-caption">${escMidia(m.caption)}</span>` : "";
    const credito = m.credit ? `<span class="media-credit">${escMidia(m.credit)}</span>` : "";
    const baixar = `<a class="media-download" href="${m.url}" download target="_blank" rel="noopener">baixar original</a>`;

    if (m.kind === "video") {
        const capa = m.thumb
            ? `<img class="media-asset" src="${m.thumb}" alt="${titulo}" loading="lazy" decoding="async">`
            : `<span class="media-placeholder">▶</span>`;
        const dur = m.duration_s ? `<span class="media-duration">${Math.round(m.duration_s)}s</span>` : "";
        return `<figure class="media-item media-video${m.thumb ? " is-loading" : ""}" data-video="${m.url}" data-title="${titulo}">
            <a class="media-play" href="${m.url}" target="_blank" rel="noopener" title="assistir ${titulo}">
                ${capa}<span class="media-play-icon">▶</span>${dur}
            </a>
            <figcaption><b>${titulo}</b>${legenda}${credito}${baixar}</figcaption>
        </figure>`;
    }
    if (m.kind === "doc") {
        return `<figure class="media-item media-doc">
            <a href="${m.url}" target="_blank" rel="noopener"><span class="media-doc-icon">📄</span></a>
            <figcaption><b>${titulo}</b>${legenda}${baixar}</figcaption>
        </figure>`;
    }
    const mini = m.thumb || m.url;
    return `<figure class="media-item is-loading">
        <a href="${m.url}" target="_blank" rel="noopener" title="${titulo} — abrir original">
            <img class="media-asset" src="${mini}" alt="${titulo}" loading="lazy" decoding="async">
        </a>
        <figcaption><b>${titulo}</b>${legenda}${credito}${baixar}</figcaption>
    </figure>`;
}

function renderMidiaFiltro() {
    const grid = document.getElementById("midia-grid");
    const box = document.getElementById("midia-filtros");
    if (box) box.innerHTML = midiaFiltroHtml();

    const visiveis = midiaKit.filter((m) => midiaFiltro === "all" || m.category === midiaFiltro);
    if (!visiveis.length) {
        grid.innerHTML = `<div class="media-vazio">Nada aqui ainda.</div>`;
        return;
    }
    grid.innerHTML = visiveis.map(midiaCardHtml).join("");

    grid.querySelectorAll(".media-asset").forEach((asset) => {
        const card = asset.closest(".media-item");
        const liberar = () => card && card.classList.remove("is-loading");
        if (asset.tagName === "IMG") {
            if (asset.complete && asset.naturalWidth) liberar();
            else {
                asset.addEventListener("load", liberar, { once: true });
                asset.addEventListener("error", () => {
                    liberar();
                    const fig = asset.closest(".media-item");
                    if (fig) fig.style.display = "none";
                }, { once: true });
            }
        } else {
            asset.addEventListener("loadeddata", liberar, { once: true });
            asset.addEventListener("error", liberar, { once: true });
        }
    });

    // clicar no play abre o player sem carregar vídeo nenhum antes disso
    grid.querySelectorAll(".media-play").forEach((link) => {
        link.addEventListener("click", (ev) => {
            if (ev.metaKey || ev.ctrlKey) return;   // abrir em nova aba = comportamento normal
            ev.preventDefault();
            abrirPlayerMidia(link.closest(".media-video"));
        });
    });

    if (box) {
        box.querySelectorAll(".media-filter").forEach((b) => {
            b.addEventListener("click", () => {
                midiaFiltro = b.dataset.cat;
                renderMidiaFiltro();
            });
        });
    }
}

function abrirPlayerMidia(card) {
    if (!card) return;
    const url = card.dataset.video;
    const titulo = card.dataset.title || "";
    fecharPlayerMidia();
    const box = document.createElement("div");
    box.className = "media-modal";
    box.id = "media-modal";
    box.innerHTML = `
        <div class="media-modal-backdrop" data-close></div>
        <div class="media-modal-body" role="dialog" aria-modal="true" aria-label="${titulo}">
            <button class="media-modal-close" data-close aria-label="fechar">×</button>
            <video controls autoplay playsinline preload="metadata">
                <source src="${url}" type="video/mp4">
            </video>
            <div class="media-modal-foot">
                <b>${titulo}</b>
                <a href="${url}" target="_blank" rel="noopener">baixar original ↗</a>
            </div>
        </div>`;
    document.body.appendChild(box);
    document.body.style.overflow = "hidden";
    box.querySelectorAll("[data-close]").forEach((n) => n.addEventListener("click", fecharPlayerMidia));
    document.addEventListener("keydown", fecharPlayerMidiaTecla);
}

function fecharPlayerMidia() {
    const box = document.getElementById("media-modal");
    if (box) box.remove();
    document.body.style.overflow = "";
    document.removeEventListener("keydown", fecharPlayerMidiaTecla);
}

function fecharPlayerMidiaTecla(ev) {
    if (ev.key === "Escape") fecharPlayerMidia();
}

function renderMidia() {
    const grid = document.getElementById("midia-grid");
    if (!midiaKit.length) {
        grid.innerHTML = `<div class="media-vazio">O mídia kit não carregou agora. Tenta de novo em instantes
            ou abre <a href="https://app.portellolabs.co/qg" target="_blank" rel="noopener">o QG</a>.</div>`;
        return;
    }
    grid.innerHTML = `<div class="media-loading"><span class="media-loading-dot"></span>Carregando mídia...</div>`;
    requestAnimationFrame(() => renderMidiaFiltro());
    midiaCarregada = true;
}

// Navegação
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll("section").forEach(s => s.classList.remove("active"));

        btn.classList.add("active");
        const section = document.getElementById(btn.dataset.section);
        section.classList.add("active");

        if (btn.dataset.section === "midia" && !midiaCarregada) {
            renderMidia();
        }
        history.replaceState(null, "", "#" + btn.dataset.section);
    });
});

// abrir direto numa seção via link (ex.: anabastos.me/dj/#midia)
function abrirSecaoDoHash() {
    const alvo = (location.hash || "").replace("#", "");
    if (!alvo) return;
    const btn = document.querySelector(`.nav-btn[data-section="${alvo}"]`);
    if (btn) btn.click();
}

// Inicializar
async function inicializar() {
    await carregarEventos();
    await carregarEquipamentos();
    await carregarMidia();
    renderEventos();
    renderEquipamentos();
    abrirSecaoDoHash();
}

inicializar();
