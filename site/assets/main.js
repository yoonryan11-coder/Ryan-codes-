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
            var name = (form.querySelector("#name") || {}).value || "there";
            showNote("Thanks, " + name.split(" ")[0] + ". Your brief is in — we reply within one working day.");
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
})();
