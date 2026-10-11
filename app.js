(function () {
  "use strict";

  const main = document.getElementById("app-main");
  const config = window.SITE_CONFIG || {};
  const library = Array.isArray(window.MEDIA_LIBRARY) ? window.MEDIA_LIBRARY : [];
  const storageKey = "kairo:saved-items";
  const state = {
    saved: loadSaved(),
    exploreFilter: "all",
    exploreQuery: ""
  };

  const icons = {
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13m-5-5 5 5-5 5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" /></svg>',
    arrowUp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m-5 5 5-5 5 5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" /></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 9 6-9 6V6Z" fill="currentColor" /></svg>',
    bookmark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.8c0-.99.81-1.8 1.8-1.8h6.4c.99 0 1.8.81 1.8 1.8V20l-5-3-5 3V4.8Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.8" /></svg>',
    bookmarkFilled: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.8c0-.99.81-1.8 1.8-1.8h6.4c.99 0 1.8.81 1.8 1.8V20l-5-3-5 3V4.8Z" fill="currentColor" /></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.8" /><path d="m15.5 15.5 4.2 4.2" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" /></svg>',
    shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2 19 6v5.2c0 4.3-2.9 7.9-7 9.6-4.1-1.7-7-5.3-7-9.6V6l7-2.8Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.7" /><path d="m9.1 12 1.9 1.9 4-4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7" /></svg>',
    external: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5m-.6-4.4L12 12" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" /><path d="M18 13v4.2c0 1-.8 1.8-1.8 1.8H6.8c-1 0-1.8-.8-1.8-1.8V7.8C5 6.8 5.8 6 6.8 6H11" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" /></svg>'
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    document.getElementById("current-year").textContent = String(new Date().getFullYear());
    configureDriveLink();
    setupMobileNavigation();
    window.addEventListener("hashchange", renderRoute);
    renderRoute();
  }

  function renderRoute() {
    const route = getRoute();
    closeMobileNavigation();
    updateNavigation(route.name);

    if (route.name === "home") {
      main.innerHTML = renderHome();
    } else if (route.name === "explore") {
      main.innerHTML = renderExplore(route);
    } else if (route.name === "watch") {
      main.innerHTML = renderWatch();
    } else if (route.name === "learn") {
      main.innerHTML = renderLearn();
    } else if (route.name === "about") {
      main.innerHTML = renderAbout();
    } else if (route.name === "item") {
      const item = library.find((entry) => entry.id === route.id);
      main.innerHTML = item ? renderDetail(item) : renderNotFound();
    } else {
      main.innerHTML = renderNotFound();
    }

    attachRouteHandlers(route);
    main.focus({ preventScroll: true });
    if (route.anchor) {
      window.requestAnimationFrame(() => {
        const target = document.getElementById(route.anchor);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function getRoute() {
    const raw = window.location.hash.replace(/^#\/?/, "");
    const [pathAndQuery, anchor] = raw.split("#");
    const [path, queryString] = pathAndQuery.split("?");
    const params = new URLSearchParams(queryString || "");
    const segments = path.split("/").filter(Boolean).map((part) => decodeURIComponent(part));
    const routeAnchor = anchor ? decodeURIComponent(anchor) : "";

    if (!segments.length) return { name: "home", anchor: routeAnchor };
    if (["explore", "watch", "learn", "about"].includes(segments[0])) {
      return { name: segments[0], filter: params.get("type") || "", anchor: routeAnchor };
    }
    if (segments[0] === "item" && segments[1]) return { name: "item", id: segments[1], anchor: routeAnchor };
    return { name: "not-found" };
  }

  function updateNavigation(routeName) {
    document.querySelectorAll("[data-nav-link]").forEach((link) => {
      const target = link.getAttribute("href").replace(/^#\/?/, "") || "home";
      link.classList.toggle("is-active", target === routeName);
      if (target === routeName) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function setupMobileNavigation() {
    const button = document.getElementById("mobile-menu-button");
    const nav = document.getElementById("primary-navigation");
    if (!button || !nav) return;

    button.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(isOpen));
      document.body.classList.toggle("is-menu-open", isOpen);
    });

    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMobileNavigation();
    });
  }

  function closeMobileNavigation() {
    const button = document.getElementById("mobile-menu-button");
    const nav = document.getElementById("primary-navigation");
    if (!button || !nav) return;
    nav.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
    document.body.classList.remove("is-menu-open");
  }

  function configureDriveLink() {
    const link = document.getElementById("header-drive-link");
    const label = document.getElementById("header-drive-label");
    if (!link || !label) return;

    if (isSafeUrl(config.driveFolderUrl)) {
      link.href = config.driveFolderUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      label.textContent = config.driveFolderLabel || "Open public library";
    } else {
      link.href = "#/about";
      link.removeAttribute("target");
      link.removeAttribute("rel");
      label.textContent = "Connect Drive";
    }
  }

  function attachRouteHandlers(route) {
    document.querySelectorAll("[data-save-id]").forEach((button) => {
      button.addEventListener("click", () => toggleSaved(button.dataset.saveId, button));
    });

    if (route.name === "explore") attachExploreHandlers();
    if (route.name === "watch") updateSavedCount();

    document.querySelectorAll("[data-scroll-top]").forEach((link) => {
      link.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    });
  }

  function attachExploreHandlers() {
    const grid = document.querySelector("[data-explore-grid]");
    const queryInput = document.querySelector("[data-search-input]");
    if (!grid || !queryInput) return;

    document.querySelectorAll("[data-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        state.exploreFilter = button.dataset.filter;
        document.querySelectorAll("[data-filter]").forEach((chip) => {
          const active = chip === button;
          chip.classList.toggle("is-active", active);
          chip.setAttribute("aria-pressed", String(active));
        });
        applyExploreFilter();
      });
    });

    queryInput.value = state.exploreQuery;
    queryInput.addEventListener("input", (event) => {
      state.exploreQuery = event.target.value.trim().toLowerCase();
      applyExploreFilter();
    });
    applyExploreFilter();
  }

  function applyExploreFilter() {
    const cards = Array.from(document.querySelectorAll("[data-explore-grid] [data-content-card]"));
    const empty = document.querySelector("[data-empty-state]");
    const count = document.querySelector("[data-result-count]");
    let visible = 0;

    cards.forEach((card) => {
      const typeMatches = state.exploreFilter === "all" || card.dataset.type === state.exploreFilter;
      const searchText = card.dataset.searchText || "";
      const queryMatches = !state.exploreQuery || searchText.includes(state.exploreQuery);
      const matches = typeMatches && queryMatches;
      card.classList.toggle("is-hidden", !matches);
      if (matches) visible += 1;
    });

    if (count) count.textContent = `${visible} ${visible === 1 ? "item" : "items"} in the library`;
    if (empty) empty.classList.toggle("is-visible", visible === 0);
  }

  function renderHome() {
    const featured = library.find((item) => item.featured && item.type === "anime") || library[0];
    const trend = library.filter((item) => item.type !== "study").slice(0, 4);
    const study = library.filter((item) => item.type === "study").slice(0, 4);

    return `
      <div class="page home-page">
        <section class="home-hero">
          <div class="container hero-grid">
            <div class="hero-copy">
              <p class="eyebrow">Your quiet corner of the internet</p>
              <h1>Make space for <em>good stories.</em></h1>
              <p class="hero-description">A beautifully simple home for authorised films, serials, and study material — organised so everyone can find the next thing worth their time.</p>
              <div class="button-row">
                <a class="button button-primary" href="#/explore">Explore the library ${icons.arrow}</a>
                <a class="button button-secondary" href="#/learn">Open study shelf</a>
              </div>
              <div class="hero-note">
                <span class="avatar-stack" aria-hidden="true"><span>✦</span><span>↗</span><span>＋</span></span>
                <span><strong>Public by design.</strong> No account required to browse.</span>
              </div>
            </div>
            ${renderHeroArt(featured)}
          </div>
        </section>

        <section class="page-section" aria-labelledby="trending-heading">
          <div class="container">
            <div class="section-heading">
              <div><p class="eyebrow">Fresh from the shelf</p><h2 id="trending-heading">Pick up where curiosity left off.</h2></div>
              <a class="section-link" href="#/explore">See everything <span aria-hidden="true">↗</span></a>
            </div>
            <div class="rail">${trend.map((item, index) => renderCard(item, index)).join("")}</div>
          </div>
        </section>

        <section class="page-section" aria-labelledby="categories-heading">
          <div class="container">
            <div class="section-heading">
              <div><p class="eyebrow">Three ways in</p><h2 id="categories-heading">Find your next small obsession.</h2></div>
              <p>Switch between your viewing queue and your learning queue without losing the thread.</p>
            </div>
            <div class="category-grid">
              <div class="category-tile anime"><p class="eyebrow">01 · animation</p><h3>Worlds to disappear into.</h3><p>Original, licensed, and public-domain animation collected in one bright corner.</p><a href="#/explore?type=anime">Browse anime <span aria-hidden="true">↗</span></a></div>
              <div class="category-tile serials"><p class="eyebrow">02 · serials</p><h3>One more episode.</h3><p>Keep your series queue tidy and easy to return to.</p><a href="#/watch">Open serials <span aria-hidden="true">↗</span></a></div>
              <div class="category-tile study"><p class="eyebrow">03 · study</p><h3>Make progress feel lighter.</h3><p>Notes, guides, and worksheets ready when you are.</p><a href="#/learn">Open study shelf <span aria-hidden="true">↗</span></a></div>
            </div>
          </div>
        </section>

        <section class="page-section" aria-labelledby="feature-heading">
          <div class="container">
            <div class="feature-banner">
              <div>
                <p class="eyebrow">Made for your library</p>
                <h2 id="feature-heading">A public front door for your Google Drive.</h2>
                <p>Keep the design here and the files in a folder you control. Add approved Drive links in one small configuration file, then publish the whole site on GitHub Pages.</p>
                <div class="button-row"><a class="button button-primary" href="#/about">See the setup guide ${icons.arrow}</a><a class="button button-secondary" href="#/about#rights">Read the rights note</a></div>
              </div>
              <div class="feature-stat-grid" aria-label="Kairo features">
                <div class="feature-stat"><strong>01</strong><span>Static and fast on GitHub Pages.</span></div>
                <div class="feature-stat"><strong>∞</strong><span>Browse without creating an account.</span></div>
                <div class="feature-stat"><strong>↗</strong><span>Link to authorised Drive files.</span></div>
                <div class="feature-stat"><strong>0</strong><span>Private keys stored in the browser.</span></div>
              </div>
            </div>
          </div>
        </section>

        <section class="page-section" aria-labelledby="study-preview-heading">
          <div class="container">
            <div class="section-heading">
              <div><p class="eyebrow">Study shelf</p><h2 id="study-preview-heading">Useful things deserve a good home too.</h2></div>
              <a class="section-link" href="#/learn">Visit the study shelf <span aria-hidden="true">↗</span></a>
            </div>
            <div class="content-grid">${study.map((item, index) => renderCard(item, index)).join("")}</div>
          </div>
        </section>
      </div>
    `;
  }

  function renderHeroArt(item) {
    if (!item) return "";
    return `
      <div class="hero-art" aria-hidden="true">
        <div class="hero-poster">
          <div class="poster-art ${escapeAttribute(item.tone || "violet")}" style="background: linear-gradient(145deg, #29204e, #7359da 52%, #c5a9ee)">
            <div class="poster-topline"><span>Kairo / 001</span><span>◌</span></div>
            <div class="poster-copy"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.title)}</strong></div>
            <div class="poster-meta"><span>${escapeHtml(item.year)}</span><span>·</span><span>${escapeHtml(item.duration)}</span></div>
          </div>
        </div>
        <div class="hero-card">
          <div class="hero-card-top"><span>Featured release</span><span class="status-pill">New this week</span></div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.blurb)}</p>
          <div class="hero-card-footer"><span>${escapeHtml(item.label)}</span><a href="#/item/${encodeURIComponent(item.id)}" aria-label="Open ${escapeAttribute(item.title)}">Open title ↗</a></div>
        </div>
      </div>
    `;
  }

  function renderExplore(route) {
    if (["all", "anime", "serial", "study"].includes(route.filter)) state.exploreFilter = route.filter;
    else {
      state.exploreFilter = "all";
      state.exploreQuery = "";
    }

    return `
      <div class="page explore-page">
        <section class="page-hero">
          <div class="container page-hero-inner">
            <div><p class="eyebrow">The full library</p><h1>Take the scenic route.</h1><p class="page-hero-copy">Search all your approved titles, switch shelves, and save a few for later. The catalogue is yours to curate.</p></div>
            <div class="page-hero-mark" aria-hidden="true"></div>
          </div>
        </section>
        <section class="page-section">
          <div class="container">
            <div class="filter-bar">
              <div class="filter-chips" role="group" aria-label="Filter library">
                ${filterChip("all", "All items", state.exploreFilter === "all")}
                ${filterChip("anime", "Anime", state.exploreFilter === "anime")}
                ${filterChip("serial", "Serials", state.exploreFilter === "serial")}
                ${filterChip("study", "Study", state.exploreFilter === "study")}
              </div>
              <label class="search-box">${icons.search}<span class="sr-only">Search the library</span><input data-search-input type="search" placeholder="Search titles, tags..." autocomplete="off" /></label>
            </div>
            <p class="result-count" data-result-count></p>
            <div class="content-grid" data-explore-grid>${library.map((item, index) => renderCard(item, index, true)).join("")}</div>
            <div class="empty-state" data-empty-state><h3>Nothing matches yet.</h3><p>Try a different word or choose another shelf. Your catalogue will appear here as soon as a record fits.</p><a class="button button-secondary" href="#/explore">Clear the search</a></div>
          </div>
        </section>
      </div>
    `;
  }

  function filterChip(value, label, active) {
    return `<button class="filter-chip${active ? " is-active" : ""}" type="button" data-filter="${value}" aria-pressed="${active ? "true" : "false"}">${label}</button>`;
  }

  function renderCard(item, index, searchable) {
    const searchText = [item.title, item.label, item.blurb, ...(item.tags || [])].join(" ").toLowerCase();
    return `
      <article class="content-card" data-content-card data-type="${escapeAttribute(item.type)}"${searchable ? ` data-search-text="${escapeAttribute(searchText)}"` : ""}>
        <a class="poster-link" href="#/item/${encodeURIComponent(item.id)}" aria-label="Open ${escapeAttribute(item.title)}">
          ${renderPoster(item, index)}
        </a>
        <div class="card-copy">
          <div class="card-meta"><span>${escapeHtml(typeLabel(item.type))}</span><span class="card-meta-dot" aria-hidden="true"></span><span>${escapeHtml(item.year)}</span></div>
          <h3><a href="#/item/${encodeURIComponent(item.id)}">${escapeHtml(item.title)}</a></h3>
          <p>${escapeHtml(item.blurb)}</p>
        </div>
      </article>
    `;
  }

  function renderPoster(item, index) {
    const hasSource = isSafeUrl(item.sourceUrl);
    return `
      <div class="poster ${escapeAttribute(item.tone || "violet")}">
        ${hasSource ? `<span class="poster-badge">Ready to open</span>` : `<span class="poster-badge">Link pending</span>`}
        <div class="poster-content">
          <div class="poster-label"><span>${escapeHtml(item.label)}</span><span class="poster-number">${String(index + 1).padStart(2, "0")}</span></div>
          <strong class="poster-title">${escapeHtml(item.title)}</strong>
          <div class="poster-meta"><span>${escapeHtml(item.year)}</span><span>·</span><span>${escapeHtml(item.duration)}</span></div>
        </div>
      </div>
    `;
  }

  function typeLabel(type) {
    return { anime: "Anime", serial: "Serials", study: "Study" }[type] || "Library";
  }

  function renderWatch() {
    const anime = library.filter((item) => item.type === "anime");
    const serials = library.filter((item) => item.type === "serial");
    const spotlight = library.find((item) => item.featured && item.type === "serial") || serials[0] || anime[0];
    const savedItems = library.filter((item) => state.saved.has(item.id));

    return `
      <div class="page watch-page">
        <section class="page-hero">
          <div class="container page-hero-inner">
            <div><p class="eyebrow">Watch queue</p><h1>Stories with somewhere to go.</h1><p class="page-hero-copy">Keep your series and films together, with every source opening in the place you choose.</p></div>
            <div class="page-hero-mark" aria-hidden="true"></div>
          </div>
        </section>
        <section class="page-section">
          <div class="container">
            ${spotlight ? renderWatchSpotlight(spotlight) : ""}
            <div class="watchlist-strip">
              <div><strong>Your saved queue <span class="saved-count" data-saved-count>${state.saved.size}</span></strong><p>Save from any title page. The list stays on this device.</p></div>
              <a class="button button-secondary" href="#/explore">Find something new ${icons.arrow}</a>
            </div>
          </div>
        </section>
        ${savedItems.length ? `<section class="page-section" aria-labelledby="saved-heading"><div class="container"><div class="section-heading"><div><p class="eyebrow">For later</p><h2 id="saved-heading">Your saved queue.</h2></div></div><div class="content-grid">${savedItems.map((item, index) => renderCard(item, index)).join("")}</div></div></section>` : ""}
        <section class="page-section" aria-labelledby="anime-heading">
          <div class="container">
            <div class="section-heading"><div><p class="eyebrow">Animation shelf</p><h2 id="anime-heading">Worlds to disappear into.</h2></div><a class="section-link" href="#/explore">Browse all <span aria-hidden="true">↗</span></a></div>
            <div class="content-grid">${anime.map((item, index) => renderCard(item, index)).join("")}</div>
          </div>
        </section>
        <section class="page-section" aria-labelledby="serial-heading">
          <div class="container">
            <div class="section-heading"><div><p class="eyebrow">Serials shelf</p><h2 id="serial-heading">One more episode.</h2></div><p>Episode-level links can point to separate, approved Drive files.</p></div>
            <div class="content-grid">${serials.map((item, index) => renderCard(item, index)).join("")}</div>
          </div>
        </section>
      </div>
    `;
  }

  function renderWatchSpotlight(item) {
    return `
      <div class="watch-spotlight">
        <div>${renderPoster(item, 0)}</div>
        <div class="watch-spotlight-copy">
          <p class="eyebrow">Spotlight · ${escapeHtml(item.label)}</p>
          <h2>${escapeHtml(item.title)}</h2>
          <p>${escapeHtml(item.description)}</p>
          <div class="button-row"><a class="button button-primary" href="#/item/${encodeURIComponent(item.id)}">Open title ${icons.arrow}</a><a class="button button-secondary" href="#/explore">Keep browsing</a></div>
        </div>
      </div>
    `;
  }

  function renderLearn() {
    const study = library.filter((item) => item.type === "study");
    return `
      <div class="page learn-page">
        <section class="page-hero">
          <div class="container page-hero-inner">
            <div><p class="eyebrow">Study shelf</p><h1>Progress, but make it gentle.</h1><p class="page-hero-copy">Keep the notes, worksheets, and explainers you actually want to return to — without turning learning into another noisy feed.</p></div>
            <div class="page-hero-mark" aria-hidden="true"></div>
          </div>
        </section>
        <section class="page-section">
          <div class="container learn-layout">
            <div class="study-planner"><p class="eyebrow">A tiny plan for today</p><h2>Make the next 45 minutes count.</h2><p>Use the guide as-is or swap the labels for your own routine. Small, visible steps make it easier to begin.</p><div class="planner-list"><div class="planner-item"><span class="planner-number">01</span><div><strong>Choose one question</strong><small>Write down what you want to understand.</small></div><span class="planner-time">05 min</span></div><div class="planner-item"><span class="planner-number">02</span><div><strong>Study the source</strong><small>Read, watch, or listen without multitasking.</small></div><span class="planner-time">25 min</span></div><div class="planner-item"><span class="planner-number">03</span><div><strong>Make a tiny recap</strong><small>Close the loop in three sentences.</small></div><span class="planner-time">10 min</span></div><div class="planner-item"><span class="planner-number">04</span><div><strong>Pick the next step</strong><small>Leave a breadcrumb for tomorrow.</small></div><span class="planner-time">05 min</span></div></div></div>
            <div class="study-note"><p class="eyebrow">Keep it useful</p><h2>Your shelf should serve your brain.</h2><p>Upload notes you created, link to resources you are allowed to share, and keep private class material behind an appropriate sign-in flow.</p><a class="button button-primary" href="#/about#rights">Read the publishing note ${icons.arrow}</a></div>
          </div>
        </section>
        <section class="page-section learn-library" aria-labelledby="learn-library-heading">
          <div class="container"><div class="section-heading"><div><p class="eyebrow">Your reference stack</p><h2 id="learn-library-heading">Notes for future you.</h2></div><a class="section-link" href="#/explore">Explore every shelf <span aria-hidden="true">↗</span></a></div><div class="content-grid">${study.map((item, index) => renderCard(item, index)).join("")}</div></div>
        </section>
      </div>
    `;
  }

  function renderAbout() {
    const driveReady = isSafeUrl(config.driveFolderUrl);
    const contactReady = typeof config.contactEmail === "string" && config.contactEmail.includes("@");
    return `
      <div class="page about-page">
        <section class="page-section">
          <div class="container about-layout">
            <div class="about-lead"><p class="eyebrow">About Kairo</p><h1>A front door, not a filing cabinet.</h1><p>This starter site gives your public library a clear, friendly shape. The website stays static and fast; your approved files stay in the Drive folder you control.</p><div class="rights-callout" id="rights">${icons.shield}<div><strong>Publish responsibly.</strong><p>${escapeHtml(config.rightsNote || "Only publish content you own, have permission to share, or that is in the public domain.")}</p></div></div></div>
            <div class="about-stack">
              <section class="about-card highlight"><p class="eyebrow">Google Drive setup</p><h2>${driveReady ? "Your library link is connected." : "Connect your public library in one minute."}</h2><p>${driveReady ? "The header button now opens the configured Drive folder in a new tab." : "Add an approved public Drive folder URL to SITE_CONFIG in content.js. No API key is needed for normal links."}</p><div class="step-list"><div class="step"><span class="step-index">01</span><div><strong>Create a dedicated Drive folder</strong><p>Keep public media separate from private files.</p></div></div><div class="step"><span class="step-index">02</span><div><strong>Share only approved content</strong><p>Use “Anyone with the link” only when you are happy for people to access it.</p></div></div><div class="step"><span class="step-index">03</span><div><strong>Paste the folder URL</strong><p>Set <code>driveFolderUrl</code> in <code>content.js</code>, then publish to GitHub Pages.</p></div></div></div><a class="button button-primary" href="${driveReady ? escapeAttribute(config.driveFolderUrl) : "#/explore"}"${driveReady ? ' target="_blank" rel="noopener noreferrer"' : ""}>${driveReady ? "Open Drive library" : "Preview the catalogue"} ${icons.external}</a></section>
              <section class="about-card"><p class="eyebrow">What this site can do</p><h2>Simple by design.</h2><p>Distinct pages, search and shelf filters, title detail screens, a device-local saved queue, responsive layouts, and a GitHub Pages deployment workflow are all included.</p></section>
              <section class="about-card" id="contact"><p class="eyebrow">Contact</p><h2>Keep the door open.</h2><p>${contactReady ? "Questions, corrections, or a collaboration? Send a note." : "Add your public contact email to content.js if you want visitors to reach you."}</p>${contactReady ? `<a class="section-link" href="mailto:${escapeAttribute(config.contactEmail)}">Email the library <span aria-hidden="true">↗</span></a>` : ""}</section>
            </div>
          </div>
        </section>
        <section class="page-section"><div class="container contact-strip"><div><strong>Ready to make this yours?</strong><p>Replace the demo records in content.js with your approved titles and links.</p></div><a class="button button-secondary" href="https://github.com/new" target="_blank" rel="noopener noreferrer">Create a GitHub repo ${icons.external}</a></div></section>
      </div>
    `;
  }

  function renderDetail(item) {
    const saved = state.saved.has(item.id);
    const hasSource = isSafeUrl(item.sourceUrl);
    return `
      <div class="page detail-page">
        <div class="container">
          <a class="back-link" href="#/explore">← Back to explore</a>
          <div class="detail-grid">
            <div class="detail-poster">${renderPoster(item, 0)}</div>
            <div class="detail-copy">
              <p class="eyebrow">${escapeHtml(typeLabel(item.type))} · ${escapeHtml(item.label)}</p>
              <h1>${escapeHtml(item.title)}</h1>
              <p class="detail-summary">${escapeHtml(item.description)}</p>
              <div class="detail-meta-row"><span>${escapeHtml(item.year)}</span><span>${escapeHtml(item.duration)}</span><span>${escapeHtml(item.rating)}</span></div>
              <div class="button-row">
                ${hasSource ? `<a class="button button-primary" href="${escapeAttribute(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">Open in Drive ${icons.external}</a>` : `<span class="button button-primary is-disabled" aria-disabled="true">Drive link pending</span>`}
                <button class="button button-secondary" type="button" data-save-id="${escapeAttribute(item.id)}">${saved ? icons.bookmarkFilled : icons.bookmark}<span data-save-label>${saved ? "Saved to queue" : "Save for later"}</span></button>
              </div>
              <div class="detail-tags">${(item.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
              <div class="detail-source-note">${icons.shield}<span><strong>${hasSource ? "Source connected." : "This is a demo record."}</strong> ${hasSource ? "The link opens in a new tab so visitors stay on the public catalogue." : "Add an approved Google Drive URL to this item's sourceUrl in content.js before sharing the site."}</span></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderNotFound() {
    return `<div class="page not-found"><div class="container"><p class="eyebrow">404 · Lost bookmark</p><h1>That page wandered off.</h1><p>The title or shelf you requested does not exist in this catalogue.</p><a class="button button-primary" href="#/">Return home ${icons.arrow}</a></div></div>`;
  }

  function toggleSaved(id, button) {
    if (state.saved.has(id)) state.saved.delete(id);
    else state.saved.add(id);
    saveSaved();

    const saved = state.saved.has(id);
    button.innerHTML = `${saved ? icons.bookmarkFilled : icons.bookmark}<span data-save-label>${saved ? "Saved to queue" : "Save for later"}</span>`;
    updateSavedCount();
  }

  function updateSavedCount() {
    document.querySelectorAll("[data-saved-count]").forEach((element) => {
      element.textContent = String(state.saved.size);
    });
  }

  function loadSaved() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
      return new Set(Array.isArray(parsed) ? parsed.filter((id) => library.some((item) => item.id === id)) : []);
    } catch (error) {
      return new Set();
    }
  }

  function saveSaved() {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(Array.from(state.saved)));
    } catch (error) {
      // Private browsing or a restrictive browser may block local storage.
    }
  }

  function isSafeUrl(value) {
    if (typeof value !== "string" || !value.trim()) return false;
    try {
      const url = new URL(value, window.location.href);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch (error) {
      return false;
    }
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }
})();
