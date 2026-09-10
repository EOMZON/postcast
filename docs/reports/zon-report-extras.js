(function () {
  if (window.__zonReportExtrasLoaded) return;
  window.__zonReportExtrasLoaded = true;

  const css = `
.kpi-grid{display:grid;gap:12px;grid-template-columns:repeat(4,minmax(0,1fr));margin-top:12px}
@media (max-width:760px){.kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
.kpi{border:1px solid var(--gray-200,#e8e8e8);background:rgba(250,250,250,.92);padding:12px}
.kpi .k{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--gray-600,#666)}
.kpi .v{margin-top:6px;font-size:18px;font-weight:650;color:var(--black,#0a0a0a)}
.barlist{display:grid;gap:10px;margin-top:12px}
.barrow{display:grid;grid-template-columns:180px 1fr 72px;gap:10px;align-items:center}
@media (max-width:560px){.barrow{grid-template-columns:1fr}}
.barlabel{font-size:12px;color:var(--gray-800,#333)}
.bartrack{height:10px;border:1px solid var(--gray-200,#e8e8e8);background:rgba(245,245,245,.6);overflow:hidden}
.barfill{display:block;height:100%;width:var(--pct,50%);background:var(--black,#0a0a0a)}
.barvalue{font-size:12px;color:var(--gray-600,#666);justify-self:end;white-space:nowrap;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace}
/* Back-compat aliases (early reports used label/bar/val) */
.barrow .label{font-size:12px;color:var(--gray-800,#333)}
.barrow .bar{height:10px;border:1px solid var(--gray-200,#e8e8e8);background:rgba(245,245,245,.6);overflow:hidden}
.barrow .val{font-size:12px;color:var(--gray-600,#666);justify-self:end;white-space:nowrap;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace}

.zr-lb-root[hidden]{display:none}
.zr-lb-root{position:fixed;inset:0;z-index:9999;background:rgba(250,250,250,.95)}
.zr-lb-backdrop{position:absolute;inset:0}
.zr-lb-dialog{position:relative;display:grid;grid-template-rows:auto minmax(220px,1fr) auto;height:100%;border-top:1px solid #e8e8e8}
.zr-lb-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 12px;border-bottom:1px solid #e8e8e8}
.zr-lb-title{font-size:12px;color:#666;letter-spacing:.04em}
.zr-lb-actions{display:flex;gap:8px}
.zr-lb-btn{border:1px solid #0a0a0a;background:transparent;color:#0a0a0a;padding:4px 10px;font-size:12px;cursor:pointer}
.zr-lb-btn:hover{background:#0a0a0a;color:#fafafa}
.zr-lb-stage{position:relative;overflow:hidden}
.zr-lb-viewport{position:absolute;inset:0;touch-action:none;cursor:grab}
.zr-lb-viewport:active{cursor:grabbing}
.zr-lb-canvas{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform}
.zr-lb-canvas img,.zr-lb-canvas svg,.zr-lb-canvas canvas{display:block;max-width:none}
.zr-lb-caption{padding:8px 12px;border-top:1px solid #e8e8e8;font-size:12px;color:#666;display:flex;justify-content:space-between;gap:12px}
.zoomable{cursor:zoom-in}
html.zr-lb-open,body.zr-lb-open{overflow:hidden}
`;

  function ensureStyle() {
    if (document.getElementById("zon-report-extras-css")) return;
    const style = document.createElement("style");
    style.id = "zon-report-extras-css";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function ensureLightbox() {
    let root = document.getElementById("zrLightbox");
    if (root) return root;
    root = document.createElement("div");
    root.id = "zrLightbox";
    root.className = "zr-lb-root";
    root.hidden = true;
    root.innerHTML =
      '<div class="zr-lb-backdrop" data-zr-close></div>' +
      '<div class="zr-lb-dialog" role="dialog" aria-modal="true" aria-label="Image viewer">' +
      '<div class="zr-lb-toolbar">' +
      '<div class="zr-lb-title" id="zrLbTitle">Preview</div>' +
      '<div class="zr-lb-actions">' +
      '<button class="zr-lb-btn" type="button" data-zr-zoom-out>-</button>' +
      '<button class="zr-lb-btn" type="button" data-zr-zoom-in>+</button>' +
      '<button class="zr-lb-btn" type="button" data-zr-fit>Fit</button>' +
      '<button class="zr-lb-btn" type="button" data-zr-close>Close</button>' +
      '</div></div>' +
      '<div class="zr-lb-stage"><div class="zr-lb-viewport" tabindex="0"><div class="zr-lb-canvas" id="zrLbCanvas"></div></div></div>' +
      '<div class="zr-lb-caption"><span id="zrLbCaption"></span><span id="zrLbZoom">100%</span></div>' +
      '</div>';
    document.body.appendChild(root);
    return root;
  }

  function parseViewBox(viewBox) {
    if (!viewBox) return null;
    const parts = String(viewBox)
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return null;
    return { w: parts[2], h: parts[3] };
  }

  function bindLightbox() {
    const root = ensureLightbox();
    if (root.dataset.bound === "1") return;
    root.dataset.bound = "1";

    const canvas = root.querySelector("#zrLbCanvas");
    const viewport = root.querySelector(".zr-lb-viewport");
    const titleEl = root.querySelector("#zrLbTitle");
    const captionEl = root.querySelector("#zrLbCaption");
    const zoomEl = root.querySelector("#zrLbZoom");
    const btnFit = root.querySelector("[data-zr-fit]");
    const btnIn = root.querySelector("[data-zr-zoom-in]");
    const btnOut = root.querySelector("[data-zr-zoom-out]");

    const MIN = 0.2;
    const MAX = 12;
    let state = { scale: 1, tx: 0, ty: 0, w: 1, h: 1 };
    let pointers = new Map();
    let panStart = null;
    let pinchStart = null;

    function clamp(v, min, max) {
      return Math.max(min, Math.min(max, v));
    }

    function setTransform() {
      canvas.style.transform = `translate3d(${state.tx}px, ${state.ty}px, 0) scale(${state.scale})`;
      zoomEl.textContent = `${Math.round(state.scale * 100)}%`;
    }

    function fit() {
      const rect = viewport.getBoundingClientRect();
      const s = clamp(Math.min(rect.width / state.w, rect.height / state.h) * 0.98, MIN, MAX);
      state.scale = s;
      state.tx = (rect.width - state.w * s) / 2;
      state.ty = (rect.height - state.h * s) / 2;
      setTransform();
    }

    function zoomAt(clientX, clientY, nextScale) {
      const rect = viewport.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const scale = clamp(nextScale, MIN, MAX);
      const cx = (px - state.tx) / state.scale;
      const cy = (py - state.ty) / state.scale;
      state.scale = scale;
      state.tx = px - cx * scale;
      state.ty = py - cy * scale;
      setTransform();
    }

    function stepZoom(factor) {
      const r = viewport.getBoundingClientRect();
      zoomAt(r.left + r.width / 2, r.top + r.height / 2, state.scale * factor);
    }

    function close() {
      root.hidden = true;
      document.documentElement.classList.remove("zr-lb-open");
      document.body.classList.remove("zr-lb-open");
      canvas.innerHTML = "";
      pointers.clear();
      panStart = null;
      pinchStart = null;
    }

    async function open(payload) {
      canvas.innerHTML = "";
      canvas.appendChild(payload.node);
      state = { scale: 1, tx: 0, ty: 0, w: payload.w, h: payload.h };
      titleEl.textContent = payload.title || "Preview";
      captionEl.textContent = payload.caption || "";
      root.hidden = false;
      document.documentElement.classList.add("zr-lb-open");
      document.body.classList.add("zr-lb-open");
      await new Promise((resolve) => requestAnimationFrame(resolve));
      fit();
    }

    async function fromElement(el) {
      const tag = (el.tagName || "").toLowerCase();
      const figCaption = el.closest("figure")?.querySelector("figcaption")?.textContent?.trim() || "";
      if (tag === "img") {
        const img = document.createElement("img");
        img.src = el.currentSrc || el.src;
        img.alt = el.alt || "";
        if ("decode" in img) {
          try {
            await img.decode();
          } catch {}
        }
        return {
          node: img,
          title: el.alt || "Image",
          caption: figCaption,
          w: img.naturalWidth || el.naturalWidth || 1,
          h: img.naturalHeight || el.naturalHeight || 1
        };
      }
      if (tag === "canvas") {
        const img = document.createElement("img");
        img.src = el.toDataURL("image/png");
        return {
          node: img,
          title: el.getAttribute("aria-label") || "Canvas",
          caption: figCaption,
          w: el.width || el.getBoundingClientRect().width || 1,
          h: el.height || el.getBoundingClientRect().height || 1
        };
      }
      if (tag === "svg") {
        const svg = el.cloneNode(true);
        const vb = parseViewBox(el.getAttribute("viewBox"));
        const box = el.getBoundingClientRect();
        const w = (vb && vb.w) || box.width || 300;
        const h = (vb && vb.h) || box.height || 150;
        svg.setAttribute("width", String(w));
        svg.setAttribute("height", String(h));
        svg.setAttribute("preserveAspectRatio", "xMinYMin meet");
        return {
          node: svg,
          title: el.getAttribute("aria-label") || "Diagram",
          caption: figCaption,
          w,
          h
        };
      }
      return null;
    }

    root.querySelectorAll("[data-zr-close]").forEach((el) => el.addEventListener("click", close));
    btnFit.addEventListener("click", fit);
    btnIn.addEventListener("click", () => stepZoom(1.12));
    btnOut.addEventListener("click", () => stepZoom(1 / 1.12));

    document.addEventListener("keydown", (e) => {
      if (root.hidden) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
      if (!e.metaKey && !e.ctrlKey && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        stepZoom(1.12);
      }
      if (!e.metaKey && !e.ctrlKey && e.key === "-") {
        e.preventDefault();
        stepZoom(1 / 1.12);
      }
      if (!e.metaKey && !e.ctrlKey && e.key === "0") {
        e.preventDefault();
        fit();
      }
    });

    viewport.addEventListener("wheel", (e) => {
      if (root.hidden) return;
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0015);
      zoomAt(e.clientX, e.clientY, state.scale * factor);
    }, { passive: false });

    viewport.addEventListener("dblclick", (e) => {
      if (root.hidden) return;
      e.preventDefault();
      fit();
    });

    viewport.addEventListener("pointerdown", (e) => {
      if (root.hidden) return;
      viewport.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        panStart = { x: e.clientX, y: e.clientY, tx: state.tx, ty: state.ty };
        pinchStart = null;
      } else if (pointers.size === 2) {
        const [p1, p2] = Array.from(pointers.values());
        const rect = viewport.getBoundingClientRect();
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const px = midX - rect.left;
        const py = midY - rect.top;
        const cx = (px - state.tx) / state.scale;
        const cy = (py - state.ty) / state.scale;
        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        pinchStart = { rect, cx, cy, dist, scale: state.scale };
        panStart = null;
      }
    });

    viewport.addEventListener("pointermove", (e) => {
      if (root.hidden || !pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1 && panStart) {
        state.tx = panStart.tx + (e.clientX - panStart.x);
        state.ty = panStart.ty + (e.clientY - panStart.y);
        setTransform();
      } else if (pointers.size === 2 && pinchStart) {
        const [p1, p2] = Array.from(pointers.values());
        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        const nextScale = clamp(pinchStart.scale * (dist / pinchStart.dist), MIN, MAX);
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const px = midX - pinchStart.rect.left;
        const py = midY - pinchStart.rect.top;
        state.scale = nextScale;
        state.tx = px - pinchStart.cx * nextScale;
        state.ty = py - pinchStart.cy * nextScale;
        setTransform();
      }
    });

    function clearPointer(e) {
      pointers.delete(e.pointerId);
      if (pointers.size === 1) {
        const p = Array.from(pointers.values())[0];
        panStart = { x: p.x, y: p.y, tx: state.tx, ty: state.ty };
        pinchStart = null;
      } else if (pointers.size === 0) {
        panStart = null;
        pinchStart = null;
      }
    }

    viewport.addEventListener("pointerup", clearPointer);
    viewport.addEventListener("pointercancel", clearPointer);

    async function onMediaClick(el, event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      event.stopPropagation();
      const payload = await fromElement(el);
      if (payload) await open(payload);
    }

    function bindMedia(rootEl) {
      rootEl.querySelectorAll("figure").forEach((fig) => {
        if (fig.dataset.zrZoomBound === "1") return;
        const media = fig.querySelector("svg,img,canvas");
        if (!media) return;
        fig.dataset.zrZoomBound = "1";
        fig.classList.add("zoomable");
        fig.addEventListener("click", (event) => {
          const target = event.target.closest("svg,img,canvas") || media;
          if (!target) return;
          onMediaClick(target, event);
        });
      });

      rootEl.querySelectorAll("main img, main svg, main canvas").forEach((el) => {
        if (el.dataset.zrZoomBound === "1") return;
        el.dataset.zrZoomBound = "1";
        el.classList.add("zoomable");
        el.addEventListener("click", (event) => onMediaClick(el, event));
      });
    }

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          bindMedia(node);
        });
      }
    });

    bindMedia(document);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    ensureStyle();
    bindLightbox();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
