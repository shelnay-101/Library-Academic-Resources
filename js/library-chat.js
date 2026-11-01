// Library AI assistant widget: a small floating icon that opens a popup chat.
// Added automatically on public pages by js/nav.js (no HTML needed). Keeps only the latest question and answer.
(function () {
  if (window.__libraryChat || location.pathname.startsWith("/admin")) return;
  window.__libraryChat = true;

  if (!document.querySelector('link[href*="chat.css"]')) {
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "/css/chat.css"; document.head.append(l);
  }

  const SUGGESTIONS = ["Recommend a book about statistics", "Which categories do you have?", "How do I scan a QR code?", "Where is Floor 2?"];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // tiny safe formatter: **bold** and bullet lists, everything else plain text
  function format(text) {
    const lines = esc(text).split(/\r?\n/), out = []; let list = false;
    const inline = t => t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    for (const raw of lines) {
      const m = raw.match(/^\s*(?:[*\-•]|\d+\.)\s+(.*)$/);
      if (m) { if (!list) { out.push("<ul>"); list = true; } out.push("<li>" + inline(m[1]) + "</li>"); }
      else { if (list) { out.push("</ul>"); list = false; } if (raw.trim()) out.push("<p>" + inline(raw) + "</p>"); }
    }
    if (list) out.push("</ul>");
    return out.join("");
  }

  const root = document.createElement("div");
  root.id = "lc-root";
  root.innerHTML = `
    <button class="lc-fab" type="button" aria-label="Open library assistant" aria-expanded="false" title="Ask the library assistant">
      <svg class="lc-ico-chat" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M12 2C6.5 2 2 5.9 2 10.7c0 2.4 1.1 4.6 3 6.2V21l3.9-2.2c1 .3 2 .4 3.1.4 5.5 0 10-3.9 10-8.5S17.5 2 12 2Zm-3 9.6a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Zm3 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Zm3 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z"/></svg>
      <svg class="lc-ico-x" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" d="M6 6l12 12M18 6 6 18"/></svg>
    </button>
    <section class="lc-panel" role="dialog" aria-label="Library assistant" hidden>
      <header class="lc-head">
        <div class="lc-title"><span class="lc-avatar" aria-hidden="true">✦</span><div><strong>Library Assistant</strong><small>Ask about books &amp; locations</small></div></div>
        <div class="lc-tools">
          <button class="lc-clear" type="button" title="Clear chat" aria-label="Clear chat">↺</button>
          <button class="lc-min" type="button" title="Minimize" aria-label="Minimize assistant">&minus;</button>
        </div>
      </header>
      <div class="lc-body" aria-live="polite"></div>
      <form class="lc-form" autocomplete="off">
        <input class="lc-input" type="text" maxlength="500" placeholder="Ask about a book, category or shelf…" aria-label="Your question" required>
        <button class="lc-send" type="submit" aria-label="Send question"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M3 20.5 21 12 3 3.5v6.6l11 1.9-11 1.9z"/></svg></button>
      </form>
      <p class="lc-note">AI can make mistakes. Open the book page for the exact location.</p>
    </section>`;
  document.body.append(root);

  const fab = root.querySelector(".lc-fab"), panel = root.querySelector(".lc-panel"), body = root.querySelector(".lc-body"),
    form = root.querySelector(".lc-form"), input = root.querySelector(".lc-input"), send = root.querySelector(".lc-send");
  let state = null;       // only the latest exchange: { q, a, books, error, loading }
  let busy = false;

  function render() {
    if (!state) {
      body.innerHTML = `<div class="lc-hello"><p><strong>Hi! 👋</strong> I can help you find books and their shelf locations.</p></div><div class="lc-chips">${SUGGESTIONS.map(s => `<button type="button" class="lc-chip">${esc(s)}</button>`).join("")}</div>`;
      return;
    }
    const books = (state.books || []).map(b => `<a class="lc-book" href="/book.html?id=${encodeURIComponent(b.id)}"><strong>${esc(b.title)}</strong><span>${esc(b.author)}</span><small>⌖ Floor ${esc(b.floor)} · Book store ${esc(b.shelf)} · ${b.available ? "● Available" : "● Unavailable"}</small></a>`).join("");
    body.innerHTML = `<div class="lc-q">${esc(state.q)}</div>` +
      (state.loading ? `<div class="lc-a lc-typing" aria-label="Thinking"><i></i><i></i><i></i></div>`
        : state.error ? `<div class="lc-a lc-err">${esc(state.error)}</div>`
        : `<div class="lc-a">${format(state.a)}</div>${books ? `<div class="lc-books">${books}</div>` : ""}`);
    body.scrollTop = 0;
  }

  function setOpen(open) {
    root.classList.toggle("open", open);
    panel.hidden = !open;
    fab.setAttribute("aria-expanded", String(open));
    fab.setAttribute("aria-label", open ? "Close library assistant" : "Open library assistant");
    if (open) { render(); setTimeout(() => input.focus({ preventScroll: true }), 50); }
  }

  async function ask(q) {
    q = q.trim(); if (!q || busy) return;
    busy = true; input.value = ""; input.disabled = send.disabled = true;
    state = { q, loading: true }; render();
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 30000);
    try {
      const r = await fetch("/api/library-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: q }), signal: ctl.signal });
      let data = {}; try { data = await r.json(); } catch { /* not JSON */ }
      if (!r.ok) throw new Error(data.error || (r.status === 404 ? "The assistant is not installed on this site yet." : "The assistant is unavailable. Please try again."));
      state = { q, a: data.answer || "Sorry, I could not find an answer.", books: data.books || [] };
    } catch (e) {
      state = { q, error: e.name === "AbortError" ? "That took too long. Please try again." : (e.message || "The assistant is unavailable. Please try again.") };
    } finally {
      clearTimeout(timer); busy = false; input.disabled = send.disabled = false; render(); input.focus({ preventScroll: true });
    }
  }

  fab.addEventListener("click", () => setOpen(!root.classList.contains("open")));
  root.querySelector(".lc-min").addEventListener("click", () => { setOpen(false); fab.focus(); });
  root.querySelector(".lc-clear").addEventListener("click", () => { if (busy) return; state = null; render(); input.focus(); });
  form.addEventListener("submit", e => { e.preventDefault(); ask(input.value); });
  body.addEventListener("click", e => { const c = e.target.closest(".lc-chip"); if (c) ask(c.textContent); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && root.classList.contains("open") && !document.querySelector(".pv-overlay")) { setOpen(false); fab.focus(); } });
})();
