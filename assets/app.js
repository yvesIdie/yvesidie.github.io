(() => {
  "use strict";

  const cfg = window.LINKHUB || {};
  const ICONS = window.LINKHUB_ICONS || {};
  const AB = window.AnimBase;
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // No AnimBase (blocked/failed) → show everything without the intro.
  if (!AB) root.classList.remove("motion");
  const motion = root.classList.contains("motion");

  if (cfg.title) document.title = cfg.title;

  const footer = $('[data-bind="footer"]');
  if (cfg.footer) footer.textContent = cfg.footer;
  else footer.closest("footer").remove();

  /* ---------- Clock ---------- */

  const clock = $(".clock");
  const clockCfg = cfg.clock;
  if (!clockCfg || !clockCfg.timezone) {
    clock.remove();
  } else {
    const tz = clockCfg.timezone;
    const fmtTime = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: tz });
    const fmtDate = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: tz });
    const fmtParts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    });
    const dateEl = $(".clock__date", clock);
    const timeEl = $(".clock__time", clock);
    const noteEl = $(".clock__note", clock);

    // Minutes the owner's zone is ahead of UTC right now.
    const zoneOffset = (d) => {
      const p = Object.fromEntries(fmtParts.formatToParts(d).map((x) => [x.type, x.value]));
      const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute);
      return Math.round((asUTC - Math.floor(d.getTime() / 60000) * 60000) / 60000);
    };

    const relative = (d) => {
      const diff = zoneOffset(d) + d.getTimezoneOffset();
      if (diff === 0) return "same time as you";
      const a = Math.abs(diff);
      const span = `${Math.floor(a / 60) ? Math.floor(a / 60) + " h" : ""}${a % 60 ? " " + (a % 60) + " min" : ""}`.trim();
      return `${span} ${diff > 0 ? "ahead of" : "behind"} you`;
    };

    const charSpan = (ch) => {
      const s = document.createElement("span");
      s.className = ch === ":" ? "ch colon" : "ch";
      s.textContent = ch;
      return s;
    };

    // Changed digits roll up into place, like the iOS lock screen.
    let shown = "";
    const renderTime = (str) => {
      if (!shown) {
        timeEl.replaceChildren(...[...str].map(charSpan));
      } else {
        [...str].forEach((ch, i) => {
          if (ch === shown[i]) return;
          const next = charSpan(ch);
          timeEl.children[i].replaceWith(next);
          if (motion) {
            next.animate(
              [
                { transform: "translateY(0.3em)", opacity: 0, filter: "blur(6px)" },
                { transform: "none", opacity: 1, filter: "blur(0)" },
              ],
              { duration: 650, delay: i * 40, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" }
            );
          }
        });
      }
      shown = str;
    };

    let timer;
    const tick = () => {
      clearTimeout(timer);
      const now = new Date();
      renderTime(fmtTime.format(now));
      dateEl.textContent = fmtDate.format(now);
      noteEl.textContent = `${clockCfg.label || "My local time"} · ${relative(now)}`;
      timer = setTimeout(tick, 60000 - (now.getTime() % 60000) + 30);
    };
    tick();
    document.addEventListener("visibilitychange", () => !document.hidden && tick());
  }

  /* ---------- Link list ---------- */

  const SVGNS = "http://www.w3.org/2000/svg";
  const svg = (cls, inner, viewBox = "0 0 24 24") => {
    const s = document.createElementNS(SVGNS, "svg");
    s.setAttribute("viewBox", viewBox);
    s.setAttribute("aria-hidden", "true");
    if (cls) s.setAttribute("class", cls);
    s.innerHTML = inner;
    return s;
  };

  const tile = (name) => {
    const icon = ICONS[name] || ICONS.website;
    const t = document.createElement("span");
    t.className = "tile";
    t.style.setProperty("--tile-bg", icon.bg);
    t.style.setProperty("--tile-fg", icon.fg);
    if (icon.raw) t.append(svg("raw", icon.raw));
    else if (icon.s) t.append(svg("stroke", icon.s));
    else t.append(svg(icon.fit ? "fit" : "", `<path d="${icon.d}"/>`));
    return t;
  };

  const slot = $('[data-slot="groups"]');
  (cfg.groups || []).forEach((group) => {
    const links = (group.links || []).filter((l) => l && l.url);
    if (!links.length) return;

    const section = document.createElement("section");
    section.className = "group";
    section.dataset.intro = "block";

    if (group.title) {
      const h = document.createElement("h2");
      h.className = "group__title";
      h.textContent = group.title;
      section.append(h);
    }

    const list = document.createElement("ul");
    list.className = "card";
    links.forEach((link) => {
      const li = document.createElement("li");
      li.className = "row-item";
      li.dataset.intro = "row";

      const a = document.createElement("a");
      a.className = "row";
      a.href = link.url;
      if (/^https?:/i.test(link.url)) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }

      const label = document.createElement("span");
      label.className = "row__label";
      label.textContent = link.label || link.icon || link.url;

      a.append(tile(link.icon), label, svg("row__chev", '<path d="m9.5 6 6 6-6 6"/>'));
      li.append(a);
      list.append(li);
    });

    section.append(list);
    slot.append(section);
  });

  // Logos that were cut out of a badge (Telegram plane, Spotify waves…) get a tight
  // viewBox so they sit centered in the tile at the same visual size as the rest.
  $$(".tile svg.fit").forEach((s) => {
    const b = s.firstElementChild.getBBox();
    const side = Math.max(b.width, b.height);
    const cx = b.x + b.width / 2;
    const cy = b.y + b.height / 2;
    s.setAttribute("viewBox", `${cx - side / 2} ${cy - side / 2} ${side} ${side}`);
  });

  /* ---------- AnimBase: staggered intro ---------- */

  // Frames run at 60 fps. Each element holds its start pose until its own
  // start frame, then eases to rest. Suffixes like ".outQuint" are AnimBase easings.
  const PRESET = {
    clock: {
      dur: 50,
      from: { opacity: "0", transform: "translateY(-12px) scale(0.94)", filter: "blur(12px)" },
      to: { opacity: "1.out", transform: "translateY(0px.outQuint) scale(1.outQuint)", filter: "blur(0px.outCubic)" },
    },
    block: {
      dur: 40,
      from: { opacity: "0", transform: "translateY(20px) scale(0.97)" },
      to: { opacity: "1.out", transform: "translateY(0px.outQuint) scale(1.outQuint)" },
    },
    row: {
      dur: 28,
      from: { opacity: "0", transform: "translateY(10px)", filter: "blur(4px)" },
      to: { opacity: "1.out", transform: "translateY(0px.outCubic)", filter: "blur(0px.outCubic)" },
    },
  };

  const introEls = $$("[data-intro]");
  let introDone = false;

  const finishIntro = () => {
    if (introDone) return;
    introDone = true;
    root.classList.add("intro-done");
    // Drop the leftover inline styles so CSS hover effects work normally.
    introEls.forEach((el) => {
      el.style.removeProperty("opacity");
      el.style.removeProperty("transform");
      el.style.removeProperty("filter");
    });
  };

  if (motion) {
    let cursor = 0;
    let rowStart = 0;
    let rowIndex = 0;
    let last = 0;

    introEls.forEach((el) => {
      const kind = el.dataset.intro;
      const p = PRESET[kind];
      let start;
      if (kind === "row") start = rowStart + rowIndex++ * 4;
      else {
        start = cursor;
        cursor += kind === "clock" ? 14 : 9;
        if (el.classList.contains("group")) {
          rowStart = start + 6;
          rowIndex = 0;
        }
      }
      const frames = {};
      if (start > 0) frames[start] = p.from;
      frames[start + p.dur] = p.to;

      el.dataset.animTriggerGroup = "intro";
      el.dataset.animInit = JSON.stringify(p.from);
      el.dataset.animConfig = JSON.stringify(frames);
      last = Math.max(last, start + p.dur);
    });

    $('[data-anim-trigger-group="intro"][data-anim-trigger-config]').dataset.animTriggerConfig = JSON.stringify({
      speed: 60,
      max: last + 2,
      once: true,
    });
  } else {
    // Reduced motion: plain CSS fade for the toast instead of the AnimBase spring.
    const t = $(".toast");
    ["animTriggerGroup", "animInit", "animConfig"].forEach((k) => delete t.dataset[k]);
  }

  const startIntro = () => {
    if (document.hidden) {
      document.addEventListener("visibilitychange", startIntro, { once: true });
      return;
    }
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    Promise.race([fonts, wait(450)]).then(() =>
      requestAnimationFrame(() => AB.trigger("intro", { onFinish: finishIntro }))
    );
  };

  const onReady = () => {
    if (!motion) return;
    startIntro();
    setTimeout(finishIntro, 8000); // safety net
  };

  // AnimBase scans the page on DOMContentLoaded; it registered its listener
  // first (script order), so ours runs after the scan.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady);
  } else {
    if (AB) AB.refresh();
    onReady();
  }

  /* ---------- Toast ---------- */

  const toast = $(".toast");
  const toastText = $(".toast__text");
  let toastTimer;

  const showToast = (message) => {
    toastText.textContent = message;
    if (motion) {
      const a = AB.getAnimator("toast");
      if (a && a.state && a.state.running) return; // already on screen
      AB.trigger("toast");
    } else {
      toast.classList.add("is-on");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("is-on"), 1600);
    }
  };

  const copy = async (value, message) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.append(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    showToast(message);
  };

  /* ---------- Share ---------- */

  $('[data-action="share"]').addEventListener("click", async () => {
    const url = location.href.split("#")[0];
    if (navigator.share && matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title: document.title, url });
        return;
      } catch (e) {
        if (e && e.name === "AbortError") return;
      }
    }
    copy(url, "Link copied");
  });

  /* ---------- Theme (circular reveal, like Telegram's theme switch) ---------- */

  const darkQuery = matchMedia("(prefers-color-scheme: dark)");
  const currentTheme = () => root.dataset.theme || (darkQuery.matches ? "dark" : "light");

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch {}
    $$('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", theme === "dark" ? "#000000" : "#f2f2f7"));
  };

  const toggle = $(".theme-toggle");
  toggle.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    if (!motion || !document.startViewTransition) {
      applyTheme(next);
      return;
    }
    const r = toggle.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = document.startViewTransition(() => applyTheme(next));
    vt.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 560, easing: "cubic-bezier(.2,.75,.2,1)", pseudoElement: "::view-transition-new(root)" }
      );
    });
  });
})();
