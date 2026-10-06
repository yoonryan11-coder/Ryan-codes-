/* Yoonspace — interactions. Small, dependency-free, progressive. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Current year in footer ---- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---- Mobile nav toggle ---- */
  var navBtn = document.querySelector("[data-nav-toggle]");
  var navMenu = document.querySelector("[data-nav-menu]");
  if (navBtn && navMenu) {
    navBtn.addEventListener("click", function () {
      var open = navMenu.classList.toggle("hidden") === false;
      navBtn.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    });
    navMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        navMenu.classList.add("hidden");
        navBtn.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---- Shrink / shadow the floating nav on scroll ---- */
  var nav = document.querySelector("[data-nav]");
  if (nav) {
    var onScroll = function () {
      if (window.scrollY > 24) nav.setAttribute("data-stuck", "true");
      else nav.removeAttribute("data-stuck");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- Scroll reveal ---- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if (reduce || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---- Count-up stats ---- */
  var stats = document.querySelectorAll("[data-count]");
  if (stats.length) {
    var animateCount = function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var decimals = (el.getAttribute("data-count").split(".")[1] || "").length;
      if (reduce) { el.textContent = target.toFixed(decimals); return; }
      var start = null, dur = 1400;
      var step = function (ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(decimals);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target.toFixed(decimals);
      };
      requestAnimationFrame(step);
    };
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); sio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    stats.forEach(function (el) { sio.observe(el); });
  }

  /* ---- Work filter ---- */
  var filterBar = document.querySelector("[data-filter-bar]");
  if (filterBar) {
    var items = document.querySelectorAll("[data-work-item]");
    filterBar.querySelectorAll("[data-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var f = btn.getAttribute("data-filter");
        filterBar.querySelectorAll("[data-filter]").forEach(function (b) {
          b.setAttribute("data-active", String(b === btn));
        });
        items.forEach(function (item) {
          var tags = (item.getAttribute("data-tags") || "");
          var show = f === "all" || tags.indexOf(f) > -1;
          item.style.display = show ? "" : "none";
        });
      });
    });
  }

  /* ---- Contact form → Web3Forms (emails ryan@yoonspace.co.nz) ---- */
  var form = document.querySelector("[data-contact-form]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = form.querySelector("[data-form-note]");
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      var label = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }

      var showNote = function (msg) {
        if (note) { note.hidden = false; note.textContent = msg; note.focus(); }
      };

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: new FormData(form)
      })
        .then(function (r) { return r.json(); })
        .then(function (json) {
          if (json && json.success) {
            var nameField = form.querySelector("#name") || form.querySelector("#contact_name");
            var name = (nameField || {}).value || "there";
            var successMsg = form.getAttribute("data-success-message") || "Your brief is in — we reply within one working day.";
            showNote("Thanks, " + name.split(" ")[0] + ". " + successMsg);
          if (window.fbq) fbq("track", "Lead");
            form.reset();
          } else {
            showNote("Sorry, something went wrong. Please email ryan@yoonspace.co.nz directly.");
          }
        })
        .catch(function () {
          showNote("Sorry, something went wrong. Please email ryan@yoonspace.co.nz directly.");
        })
        .then(function () {
          if (btn) { btn.disabled = false; btn.textContent = label; }
        });
    });
  }

  /* ---- Click-to-play video facades (load YouTube only on click) ---- */
  document.querySelectorAll("[data-yt]").forEach(function (el) {
    el.addEventListener("click", function () {
      var id = el.getAttribute("data-yt");
      if (!id || el.getAttribute("data-loaded")) return;
      el.setAttribute("data-loaded", "1");
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0&playsinline=1";
      iframe.title = el.getAttribute("aria-label") || "Video";
      iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture; web-share");
      iframe.setAttribute("allowfullscreen", "");
      iframe.className = "absolute inset-0 h-full w-full";
      iframe.style.border = "0";
      el.innerHTML = "";
      el.appendChild(iframe);
    });
  });

  /* ============================================================
     Playable planets — desktop-only toy. They drift and bounce off
     the viewport edges and each other; nudge them with the pointer,
     or grab one and fling it. Skipped on touch devices and when
     reduced-motion is requested.
     ============================================================ */
  var fine = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canvas = document.querySelector(".planets-canvas");

  if (fine && !reduce && canvas && window.requestAnimationFrame) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    var PALETTE = [
      ["#7C5CFF", "#3D2E99"],
      ["#2FC6FF", "#0E5A7A"],
      ["#FFD37A", "#B8813A"],
      ["#FF5DA2", "#8C2F63"]
    ];
    var COUNT = 8;
    var planets = [];
    for (var i = 0; i < COUNT; i++) {
      var r = 9 + Math.random() * 9;
      planets.push({
        x: r + Math.random() * (W - 2 * r),
        y: r + Math.random() * (H - 2 * r),
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        r: r,
        c: PALETTE[i % PALETTE.length],
        ring: Math.random() < 0.35,
        flash: 0
      });
    }
    canvas.__planets = planets;

    var mouseX = -9999, mouseY = -9999, pvx = 0, pvy = 0, lastT = 0;
    var hover = null, grabbed = null;
    var NUDGE_R = 14, GRAB_R = 10, MAX_V = 14, DRIFT_V = 3.2;
    var html = document.documentElement;

    function planetAt(x, y, pad) {
      var best = null, bd = Infinity;
      for (var i = 0; i < planets.length; i++) {
        var p = planets[i], dx = p.x - x, dy = p.y - y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < p.r + pad && d < bd) { best = p; bd = d; }
      }
      return best;
    }

    document.addEventListener("mousemove", function (e) {
      var now = performance.now(), dt = Math.max(1, now - lastT);
      if (mouseX > -9999) {
        var k = Math.min(1, 16 / dt);
        pvx = pvx * (1 - k) + (e.clientX - mouseX) * k;
        pvy = pvy * (1 - k) + (e.clientY - mouseY) * k;
      }
      mouseX = e.clientX; mouseY = e.clientY; lastT = now;
      if (!grabbed) {
        hover = planetAt(mouseX, mouseY, GRAB_R);
        html.classList.toggle("planet-hover", !!hover);
      }
    }, { passive: true });

    document.addEventListener("mousedown", function (e) {
      if (e.button !== 0) return;
      var p = planetAt(e.clientX, e.clientY, GRAB_R);
      if (!p) return;
      grabbed = p; hover = p;
      p.vx = 0; p.vy = 0;
      html.classList.add("planet-grabbing");
      e.preventDefault();
    });

    function release() {
      if (!grabbed) return;
      grabbed.vx = pvx * 0.9; grabbed.vy = pvy * 0.9;
      clampV(grabbed, MAX_V);
      grabbed = null;
      html.classList.remove("planet-grabbing");
    }
    document.addEventListener("mouseup", release);
    window.addEventListener("blur", release);
    document.addEventListener("mouseleave", function () { release(); mouseX = -9999; mouseY = -9999; hover = null; html.classList.remove("planet-hover"); });

    function clampV(p, max) {
      var s = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (s > max) { p.vx = (p.vx / s) * max; p.vy = (p.vy / s) * max; }
    }

    function drawPlanet(p) {
      ctx.save();
      ctx.shadowColor = p.c[0];
      ctx.shadowBlur = p.r * 1.6 + p.flash * 26;
      var g = ctx.createRadialGradient(p.x - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.15, p.x, p.y, p.r);
      g.addColorStop(0, p.c[0]);
      g.addColorStop(1, p.c[1]);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      if (p.ring) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = p.c[0];
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.r * 1.9, p.r * 0.6, -0.5, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (p === hover || p === grabbed) {
        ctx.shadowBlur = 0;
        ctx.globalAlpha = p === grabbed ? 0.9 : 0.6;
        ctx.strokeStyle = "#ECEEFB";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    function step() {
      ctx.clearRect(0, 0, W, H);

      for (var i = 0; i < planets.length; i++) {
        var p = planets[i];
        if (p === grabbed) {
          p.x += (mouseX - p.x) * 0.55;
          p.y += (mouseY - p.y) * 0.55;
          p.x = Math.max(p.r, Math.min(W - p.r, p.x));
          p.y = Math.max(p.r, Math.min(H - p.r, p.y));
          p.flash *= 0.9;
          continue;
        }

        p.x += p.vx; p.y += p.vy;
        var speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        var damp = speed > DRIFT_V ? 0.992 : 0.999;
        p.vx *= damp; p.vy *= damp;

        var hit = false;
        if (p.x - p.r < 0) { p.x = p.r; p.vx = Math.abs(p.vx) * 0.92; hit = true; }
        if (p.x + p.r > W) { p.x = W - p.r; p.vx = -Math.abs(p.vx) * 0.92; hit = true; }
        if (p.y - p.r < 0) { p.y = p.r; p.vy = Math.abs(p.vy) * 0.92; hit = true; }
        if (p.y + p.r > H) { p.y = H - p.r; p.vy = -Math.abs(p.vy) * 0.92; hit = true; }
        if (hit && speed > 1.5) p.flash = Math.min(1, speed / MAX_V);
        p.flash *= 0.9;

        // Pointer nudge — swipe past a planet to knock it away (a slow
        // approach leaves it still so it can be hovered and grabbed)
        if (mouseX > -9999 && pvx * pvx + pvy * pvy > 12) {
          var dx = p.x - mouseX, dy = p.y - mouseY;
          var dist = Math.sqrt(dx * dx + dy * dy);
          var minDist = p.r + NUDGE_R;
          if (dist < minDist && dist > 0.001) {
            var nx = dx / dist, ny = dy / dist;
            var overlap = minDist - dist;
            p.x += nx * overlap; p.y += ny * overlap;
            p.vx = nx * 2.2 + pvx * 0.45;
            p.vy = ny * 2.2 + pvy * 0.45;
          }
        }
        clampV(p, MAX_V);
      }

      // Planet-vs-planet elastic collisions
      for (var a = 0; a < planets.length; a++) {
        for (var b = a + 1; b < planets.length; b++) {
          var p1 = planets[a], p2 = planets[b];
          var ddx = p2.x - p1.x, ddy = p2.y - p1.y;
          var d = Math.sqrt(ddx * ddx + ddy * ddy);
          var minD = p1.r + p2.r;
          if (d < minD && d > 0.001) {
            var nx2 = ddx / d, ny2 = ddy / d;
            var overlap2 = (minD - d) / 2;
            if (p1 !== grabbed) { p1.x -= nx2 * overlap2; p1.y -= ny2 * overlap2; }
            if (p2 !== grabbed) { p2.x += nx2 * overlap2; p2.y += ny2 * overlap2; }

            var rvx = p2.vx - p1.vx, rvy = p2.vy - p1.vy;
            var rel = rvx * nx2 + rvy * ny2;
            if (rel < 0) {
              var imp = -(1 + 0.9) * rel / 2;
              if (p1 !== grabbed) { p1.vx -= imp * nx2; p1.vy -= imp * ny2; }
              if (p2 !== grabbed) { p2.vx += imp * nx2; p2.vy += imp * ny2; }
              if (Math.abs(rel) > 3) { p1.flash = Math.max(p1.flash, 0.6); p2.flash = Math.max(p2.flash, 0.6); }
            }
            clampV(p1, MAX_V); clampV(p2, MAX_V);
          }
        }
      }

      for (var k = 0; k < planets.length; k++) drawPlanet(planets[k]);
      raf = window.requestAnimationFrame(step);
    }

    var raf = window.requestAnimationFrame(step);

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { if (raf) window.cancelAnimationFrame(raf); }
      else { raf = window.requestAnimationFrame(step); }
    });
  }
})();
