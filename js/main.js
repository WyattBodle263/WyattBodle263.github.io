/* =========================================================
   Wyatt Bodle Portfolio — site behavior
   Vanilla JS. Runs on every page; each feature no-ops if its
   markup isn't present.
   ========================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var THEME_KEY = "wb-theme";

  /* ---------------- Theme (light/dark) ---------------- */
  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
    document.querySelectorAll(".theme-toggle-btn").forEach(function (btn) {
      btn.textContent = theme === "dark" ? "☀" : "☾";
      btn.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      );
    });
  }

  function initTheme() {
    var stored = localStorage.getItem(THEME_KEY);
    var prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(stored || (prefersDark ? "dark" : "light"));
  }

  /* ---------------- Floating controls (theme + cmdk) ---------------- */
  function injectFloatingControls() {
    var wrap = document.createElement("div");
    wrap.className = "floating-controls";

    var themeBtn = document.createElement("button");
    themeBtn.type = "button";
    themeBtn.className = "theme-toggle-btn";
    themeBtn.setAttribute("aria-label", "Toggle dark mode");
    themeBtn.addEventListener("click", function () {
      var current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
      applyTheme(current === "dark" ? "light" : "dark");
    });

    var cmdBtn = document.createElement("button");
    cmdBtn.type = "button";
    cmdBtn.className = "cmdk-btn";
    cmdBtn.innerHTML = '<span class="cmdk-btn-label">Search</span><kbd>⌘K</kbd>';
    cmdBtn.setAttribute("aria-label", "Open command palette");
    cmdBtn.addEventListener("click", openPalette);

    wrap.appendChild(cmdBtn);
    wrap.appendChild(themeBtn);
    document.body.appendChild(wrap);
    applyTheme(root.getAttribute("data-theme") || "light");
  }

  /* ---------------- Command palette ---------------- */
  var paletteEls = null;
  var paletteIndex = 0;
  var paletteItems = [];

  function buildCommandList() {
    var items = [];
    var onIndex = /(^|\/)index\.html$|\/$/.test(location.pathname) || location.pathname === "";

    var sectionMap = [
      ["about", "About"],
      ["experience", "Experience"],
      ["education", "Education"],
      ["projects", "Projects"],
      ["leadership", "Leadership"],
      ["publications", "Publications"],
      ["resume", "Resume"],
      ["contact", "Contact"],
    ];

    sectionMap.forEach(function (pair) {
      var el = document.getElementById(pair[0]);
      if (el) {
        items.push({
          label: pair[1],
          tag: "Section",
          action: function () {
            el.scrollIntoView({ behavior: "smooth" });
          },
        });
      }
    });

    if (!onIndex) {
      items.push({
        label: "Home",
        tag: "Page",
        action: function () {
          window.location.href = "index.html";
        },
      });
    }

    items.push({
      label: "GitHub",
      tag: "Link",
      action: function () {
        window.open("https://github.com/WyattBodle263", "_blank");
      },
    });
    items.push({
      label: "LinkedIn",
      tag: "Link",
      action: function () {
        window.open("https://www.linkedin.com/in/wyatt-bodle/", "_blank");
      },
    });
    items.push({
      label: "Email me",
      tag: "Link",
      action: function () {
        window.location.href = "mailto:wyattbodle2025@outlook.com";
      },
    });
    if (document.querySelector('a[href$="resume.png"]')) {
      items.push({
        label: "Download resume",
        tag: "File",
        action: function () {
          var a = document.createElement("a");
          a.href = "images/resume.png";
          a.download = "";
          a.click();
        },
      });
    }
    items.push({
      label: "Toggle dark / light mode",
      tag: "Action",
      action: function () {
        var current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
        applyTheme(current === "dark" ? "light" : "dark");
      },
    });

    return items;
  }

  function injectCommandPalette() {
    var overlay = document.createElement("div");
    overlay.className = "cmdk-overlay";
    overlay.innerHTML =
      '<div class="cmdk-modal">' +
      '<input class="cmdk-input" type="text" placeholder="Jump to a section, project, or link…" autocomplete="off" spellcheck="false">' +
      '<div class="cmdk-list"></div>' +
      "</div>";
    document.body.appendChild(overlay);

    var input = overlay.querySelector(".cmdk-input");
    var list = overlay.querySelector(".cmdk-list");

    paletteEls = { overlay: overlay, input: input, list: list };

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closePalette();
    });

    input.addEventListener("input", function () {
      renderPaletteItems(input.value);
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setPaletteIndex(paletteIndex + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setPaletteIndex(paletteIndex - 1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        activatePaletteItem(paletteIndex);
      } else if (e.key === "Escape") {
        closePalette();
      }
    });
  }

  function renderPaletteItems(query) {
    var all = buildCommandList();
    var q = (query || "").toLowerCase().trim();
    paletteItems = q
      ? all.filter(function (item) {
          return item.label.toLowerCase().indexOf(q) !== -1;
        })
      : all;

    var list = paletteEls.list;
    list.innerHTML = "";

    if (!paletteItems.length) {
      var empty = document.createElement("div");
      empty.className = "cmdk-empty";
      empty.textContent = "No matches";
      list.appendChild(empty);
      return;
    }

    paletteItems.forEach(function (item, i) {
      var row = document.createElement("div");
      row.className = "cmdk-item" + (i === 0 ? " active" : "");
      row.innerHTML =
        '<span class="cmdk-item-label">' + item.label + "</span>" +
        '<span class="cmdk-item-tag">' + item.tag + "</span>";
      row.addEventListener("mouseenter", function () {
        setPaletteIndex(i);
      });
      row.addEventListener("click", function () {
        activatePaletteItem(i);
      });
      list.appendChild(row);
    });
    paletteIndex = 0;
  }

  function setPaletteIndex(i) {
    if (!paletteItems.length) return;
    paletteIndex = (i + paletteItems.length) % paletteItems.length;
    var rows = paletteEls.list.querySelectorAll(".cmdk-item");
    rows.forEach(function (row, idx) {
      row.classList.toggle("active", idx === paletteIndex);
    });
    var activeRow = rows[paletteIndex];
    if (activeRow) activeRow.scrollIntoView({ block: "nearest" });
  }

  function activatePaletteItem(i) {
    var item = paletteItems[i];
    if (!item) return;
    closePalette();
    setTimeout(item.action, 150);
  }

  function openPalette() {
    if (!paletteEls) return;
    paletteEls.overlay.classList.add("open");
    paletteEls.input.value = "";
    renderPaletteItems("");
    setTimeout(function () {
      paletteEls.input.focus();
    }, 50);
  }

  function closePalette() {
    if (!paletteEls) return;
    paletteEls.overlay.classList.remove("open");
  }

  function initCommandPaletteShortcut() {
    document.addEventListener("keydown", function (e) {
      var isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isCmdK) {
        e.preventDefault();
        if (paletteEls && paletteEls.overlay.classList.contains("open")) {
          closePalette();
        } else {
          openPalette();
        }
      }
    });
  }

  /* ---------------- Preloader ---------------- */
  function injectPreloader() {
    var loader = document.createElement("div");
    loader.className = "page-loader";
    loader.innerHTML = '<div class="loader-ring"></div>';
    document.body.appendChild(loader);
    window.addEventListener("load", function () {
      setTimeout(function () {
        loader.classList.add("hidden");
        setTimeout(function () {
          loader.remove();
        }, 500);
      }, 150);
    });
  }

  /* ---------------- Scroll progress bar ---------------- */
  function injectScrollProgress() {
    var bar = document.createElement("div");
    bar.className = "scroll-progress";
    document.body.appendChild(bar);
    function update() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = pct + "%";
    }
    var ticking = false;
    document.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(function () {
            update();
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );
    update();
  }

  /* ---------------- Back to top ---------------- */
  function injectBackToTop() {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "back-to-top";
    btn.setAttribute("aria-label", "Back to top");
    btn.innerHTML = "↑";
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    document.body.appendChild(btn);

    function toggle() {
      btn.classList.toggle("visible", window.scrollY > 420);
    }
    document.addEventListener("scroll", toggle, { passive: true });
    toggle();
  }

  /* ---------------- Sticky header shadow ---------------- */
  function initHeaderScrollState() {
    var header = document.querySelector(".header_section");
    if (!header) return;
    function toggle() {
      header.classList.toggle("scrolled", window.scrollY > 8);
    }
    document.addEventListener("scroll", toggle, { passive: true });
    toggle();
  }

  /* ---------------- Mobile menu: close on link click ---------------- */
  function initMobileNavClose() {
    var collapse = document.getElementById("navbarSupportedContent");
    if (!collapse) return;
    collapse.querySelectorAll(".nav-link").forEach(function (link) {
      link.addEventListener("click", function () {
        if (collapse.classList.contains("show")) {
          collapse.classList.remove("show");
          var toggler = document.querySelector(".navbar-toggler");
          if (toggler) toggler.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  /* ---------------- Active section highlighting ---------------- */
  function initActiveNavHighlight() {
    var links = Array.prototype.slice.call(
      document.querySelectorAll('.navbar-nav .nav-link[href^="#"], .side-nav a[href^="#"]')
    );
    if (!links.length) return;

    var sections = [];
    links.forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      var section = document.getElementById(id);
      if (!section) return;
      var target = link.closest(".nav-item") || link;
      sections.push({ el: section, target: target, link: link });
    });
    if (!sections.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var match = sections.find(function (s) {
            return s.el === entry.target;
          });
          if (!match || !entry.isIntersecting) return;
          sections.forEach(function (s) {
            s.target.classList.remove("active");
            s.link.classList.remove("active");
          });
          match.target.classList.add("active");
          match.link.classList.add("active");
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach(function (s) {
      observer.observe(s.el);
    });
  }

  /* ---------------- Reveal-on-scroll ---------------- */
  function initRevealOnScroll() {
    var selector = [
      ".service_section .box",
      ".blog_section .box",
      ".about_section .row > div",
      ".timeline-item",
      ".edu-item",
      ".project-row",
      ".pub-item",
      "#publications li",
      "#resume .container > a, .resume-frame",
    ].join(",");

    var targets = Array.prototype.slice.call(document.querySelectorAll(selector));
    if (!targets.length) return;

    targets.forEach(function (el, i) {
      el.classList.add("reveal");
      el.style.transitionDelay = Math.min(i % 6, 5) * 0.06 + "s";
    });

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ---------------- Project filter ---------------- */
  function initProjectFilter() {
    var buttons = document.querySelectorAll(".filter-btn");
    var cards = document.querySelectorAll("[data-category]");
    if (!buttons.length || !cards.length) return;

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) {
          b.classList.remove("active");
        });
        btn.classList.add("active");
        var category = btn.getAttribute("data-filter");
        cards.forEach(function (card) {
          var matches = category === "all" || card.getAttribute("data-category") === category;
          card.classList.toggle("project-hidden", !matches);
        });
      });
    });
  }

  /* ---------------- Init ---------------- */
  initTheme();
  document.addEventListener("DOMContentLoaded", function () {
    injectFloatingControls();
    injectCommandPalette();
    initCommandPaletteShortcut();
    injectPreloader();
    injectScrollProgress();
    injectBackToTop();
    initHeaderScrollState();
    initMobileNavClose();
    initActiveNavHighlight();
    initRevealOnScroll();
    initProjectFilter();
  });
})();
