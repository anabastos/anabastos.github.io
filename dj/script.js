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

// Dados de Mídia
let fotosMidia = [];
let midia = [];

async function carregarFotosMidia() {
    try {
        const response = await fetch("content/fotos-midia.json");

        if (!response.ok) {
            throw new Error(`Falha ao carregar fotos de mídia: ${response.status}`);
        }

        fotosMidia = await response.json();
        midia = fotosMidia.map((src) => ({
            type: "image",
            src: `assets/${src}`,
            alt: "Foto profissional"
        }));
    } catch (error) {
        console.error("Erro ao carregar fotos de mídia:", error);
        fotosMidia = [];
        midia = [];
    }
}

let midiaCarregada = false;

// Renderizar Eventos
function renderEventos() {
    const grid = document.getElementById("eventos-grid");
    grid.innerHTML = [...eventos].reverse().map(e => {
        const instagramId = e.instagram ? e.instagram.match(/\/(?:p|reel)\/([^/?]+)/)?.[1] : null;
        let embedHtml = "";
        if (instagramId) {
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
function renderMidia() {
    const grid = document.getElementById("midia-grid");
    grid.innerHTML = `
        <div class="media-loading" id="media-loading">
            <span class="media-loading-dot"></span>
            Carregando mídia...
        </div>
    `;

    requestAnimationFrame(() => {
        grid.innerHTML = midia.map((m) => {
            if (m.type === "image") {
                return `
                    <div class="media-item is-loading">
                        <div class="media-item-loader"></div>
                        <img class="media-asset" src="${m.src}" alt="${m.alt}" loading="lazy" decoding="async">
                    </div>
                `;
            } else if (m.type === "video") {
                return `
                    <div class="media-item is-loading">
                        <div class="media-item-loader"></div>
                        <video class="media-asset" controls preload="metadata" style="width:100%; height:250px; object-fit: cover;">
                            <source src="${m.src}" type="video/mp4">
                            Seu navegador não suporta vídeo HTML5.
                        </video>
                    </div>
                `;
            }
            return "";
        }).join("");

        grid.querySelectorAll(".media-asset").forEach((asset) => {
            const card = asset.closest(".media-item");
            const liberarCard = () => card?.classList.remove("is-loading");

            if (asset.tagName === "IMG") {
                if (asset.complete) {
                    liberarCard();
                } else {
                    asset.addEventListener("load", liberarCard, { once: true });
                    asset.addEventListener("error", () => {
                        liberarCard();
                        asset.style.display = "none";
                    }, { once: true });
                }
            } else {
                asset.addEventListener("loadeddata", liberarCard, { once: true });
                asset.addEventListener("error", liberarCard, { once: true });
            }
        });
    });

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
    });
});

// Inicializar
async function inicializar() {
    await carregarEventos();
    await carregarEquipamentos();
    await carregarFotosMidia();
    renderEventos();
    renderEquipamentos();
}

inicializar();
