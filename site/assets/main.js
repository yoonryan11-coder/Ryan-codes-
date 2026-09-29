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
     Scattered planets — desktop-only ambient toy. Drift, bounce off
     the viewport edges and off each other. Skipped on touch devices
     and when reduced-motion is requested.
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

    /* ---- Planets ---- */
    var PALETTE = [
      ["#7C5CFF", "#3D2E99"], // violet
      ["#2FC6FF", "#0E5A7A"], // aurora cyan
      ["#FFD37A", "#B8813A"], // starlight gold
      ["#FF5DA2", "#8C2F63"]  // pink
    ];
    var COUNT = 7;
    var planets = [];
    for (var i = 0; i < COUNT; i++) {
      var r = 7 + Math.random() * 11;
      planets.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: r,
        c: PALETTE[i % PALETTE.length],
        ring: Math.random() < 0.35
      });
    }

    function drawPlanet(p) {
      ctx.save();
      ctx.shadowColor = p.c[0];
      ctx.shadowBlur = p.r * 1.6;
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
      ctx.restore();
    }

    var MAX_V = 3.2;
    function clampV(p) {
      var s = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (s > MAX_V) { p.vx = (p.vx / s) * MAX_V; p.vy = (p.vy / s) * MAX_V; }
    }

    function step() {
      ctx.clearRect(0, 0, W, H);

      for (var i = 0; i < planets.length; i++) {
        var p = planets[i];
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.999; p.vy *= 0.999;

        if (p.x - p.r < 0) { p.x = p.r; p.vx *= -1; }
        if (p.x + p.r > W) { p.x = W - p.r; p.vx *= -1; }
        if (p.y - p.r < 0) { p.y = p.r; p.vy *= -1; }
        if (p.y + p.r > H) { p.y = H - p.r; p.vy *= -1; }
        clampV(p);
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
            p1.x -= nx2 * overlap2; p1.y -= ny2 * overlap2;
            p2.x += nx2 * overlap2; p2.y += ny2 * overlap2;

            var rvx = p2.vx - p1.vx, rvy = p2.vy - p1.vy;
            var rel = rvx * nx2 + rvy * ny2;
            if (rel < 0) {
              var restitution = 0.9;
              var imp = -(1 + restitution) * rel / 2;
              p1.vx -= imp * nx2; p1.vy -= imp * ny2;
              p2.vx += imp * nx2; p2.vy += imp * ny2;
            }
            clampV(p1); clampV(p2);
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
