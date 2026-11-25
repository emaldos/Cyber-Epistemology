(() => {
  "use strict";
  const siteName = "Cyber Epistemology";
  const siteVersion = "V3";
  const repositoryUrl = "https://github.com/emaldos/Cyber-Epistemology";
  const navigationItems = [
    { key: "home", label: "Home", path: "index.html", icon: "Home.png" },
    { key: "system-files", label: "System Files", path: "Data/System_Files_Info.html", icon: "Folder.png" },
    { key: "commands", label: "Commands", path: "Data/Commands.html", icon: "Terminal.png" },
    { key: "kali-tools", label: "Kali Tools", path: "Data/Kali_Tools.html", icon: "KaliLinux.png" },
    { key: "roadmap", label: "Roadmap", path: "Data/cyber_roadmap.html", icon: "Roadmap.png" },
    { key: "websites", label: "Websites", path: "Data/Cyber_Websites.html", icon: "Globe.png" },
    { key: "awareness", label: "Awareness", path: "Data/Maximum_Security.html", icon: "Awareness.png" }
  ];
  const rootPath = document.body.dataset.root || "";
  const currentSection = document.body.dataset.section || "";
  const iconPath = name => rootPath + "Assets/Icon/" + name;
  const createElement = (tagName, properties = {}, children = []) => {
    const element = document.createElement(tagName);
    Object.entries(properties).forEach(([name, value]) => {
      if (name === "className") element.className = value;
      else if (name === "text") element.textContent = value;
      else element.setAttribute(name, value);
    });
    children.forEach(child => element.append(child));
    return element;
  };
  const createIcon = (name, className = "") => createElement("img", { src: iconPath(name), alt: "", "aria-hidden": "true", className, width: "20", height: "20" });
  const createNavigationLink = item => {
    const link = createElement("a", { href: rootPath + item.path, className: "main-nav-link" + (item.key === currentSection ? " is-active" : "") }, [createIcon(item.icon), createElement("span", { text: item.label })]);
    if (item.key === currentSection) link.setAttribute("aria-current", "page");
    return link;
  };
  const createSearchBox = () => {
    const results = createElement("div", { className: "search-results", id: "site-search-results", role: "listbox", hidden: "" });
    const input = createElement("input", { className: "search-input", type: "search", placeholder: "Search the site", autocomplete: "off", spellcheck: "false", "aria-label": "Search the site", "aria-controls": "site-search-results", "aria-expanded": "false" });
    const field = createElement("label", { className: "search-field" }, [createIcon("Search.svg"), input, createElement("kbd", { className: "search-hint", text: "/" })]);
    return createElement("div", { className: "search", "data-search": "" }, [field, results]);
  };
  const renderTopbar = () => {
    const topbar = document.getElementById("site-topbar");
    if (!topbar) return null;
    topbar.className = "topbar";
    const brandLogo = createElement("img", { className: "brand-logo", src: rootPath + "Assets/Image/Logo.webp", alt: "", width: "38", height: "38" });
    const brand = createElement("a", { className: "brand", href: rootPath + "index.html", "aria-label": siteName + " home" }, [brandLogo, createElement("span", { className: "brand-name", text: siteName }), createElement("span", { className: "version-badge", text: siteVersion })]);
    const mainNavigation = createElement("nav", { className: "main-nav", "aria-label": "Main" }, navigationItems.map(createNavigationLink));
    const searchToggle = createElement("button", { className: "icon-button search-toggle", type: "button", "aria-label": "Open search" }, [createIcon("Search.svg")]);
    const menuButton = createElement("button", { className: "icon-button menu-button", type: "button", "aria-label": "Open menu", "aria-expanded": "false", "aria-controls": "site-mobile-menu" }, [createIcon("Menu.png")]);
    const actions = createElement("div", { className: "topbar-actions" }, [createSearchBox(), searchToggle, menuButton]);
    topbar.append(createElement("div", { className: "topbar-inner" }, [brand, mainNavigation, actions]));
    const mobileMenu = createElement("nav", { className: "mobile-menu", id: "site-mobile-menu", "aria-label": "Mobile" }, navigationItems.concat([{ key: "about", label: "About", path: "Data/About.html", icon: "Shield.svg" }]).map(createNavigationLink));
    topbar.after(mobileMenu);
    menuButton.addEventListener("click", () => {
      const isOpen = topbar.classList.toggle("is-menu-open");
      topbar.classList.remove("is-search-open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.replaceChildren(createIcon(isOpen ? "Close.svg" : "Menu.png"));
    });
    searchToggle.addEventListener("click", () => {
      const isOpen = topbar.classList.toggle("is-search-open");
      topbar.classList.remove("is-menu-open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.replaceChildren(createIcon("Menu.png"));
      searchToggle.replaceChildren(createIcon(isOpen ? "Close.svg" : "Search.svg"));
      if (isOpen) topbar.querySelector(".search-input").focus();
    });
    return topbar;
  };
  const renderFooter = () => {
    const footer = document.getElementById("site-footer");
    if (!footer) return;
    footer.className = "footer";
    const copyright = createElement("span", { text: "© " + new Date().getFullYear() + " " + siteName + " · " + siteVersion + " · Learn. Secure. Share." });
    const links = createElement("div", { className: "footer-links" }, [createElement("a", { href: rootPath + "index.html", text: "Home" }), createElement("a", { href: rootPath + "Data/About.html", text: "About" }), createElement("a", { href: repositoryUrl, text: "GitHub" })]);
    footer.append(createElement("div", { className: "footer-inner" }, [copyright, links]));
  };
  const watchScroll = topbar => {
    if (!topbar) return;
    const backToTop = createElement("button", { className: "icon-button back-to-top", type: "button", "aria-label": "Back to top" }, [createIcon("ArrowUp.svg")]);
    backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    document.body.append(backToTop);
    let lastScrollPosition = window.scrollY;
    window.addEventListener("scroll", () => {
      const scrollPosition = window.scrollY;
      const isBusy = topbar.classList.contains("is-menu-open") || topbar.classList.contains("is-search-open") || topbar.contains(document.activeElement);
      if (scrollPosition > lastScrollPosition + 6 && scrollPosition > 160 && !isBusy) topbar.classList.add("is-hidden");
      else if (scrollPosition < lastScrollPosition - 6 || scrollPosition < 160) topbar.classList.remove("is-hidden");
      topbar.classList.toggle("is-scrolled", scrollPosition > 8);
      backToTop.classList.toggle("is-visible", scrollPosition > 700);
      lastScrollPosition = scrollPosition;
    }, { passive: true });
  };
  let searchIndexPromise = null;
  const loadSearchIndex = () => {
    if (window.siteSearchIndex) return Promise.resolve(window.siteSearchIndex);
    if (!searchIndexPromise) {
      searchIndexPromise = new Promise(resolve => {
        const script = createElement("script", { src: rootPath + "Assets/Script/SearchIndex.js" });
        script.addEventListener("load", () => resolve(window.siteSearchIndex || []));
        script.addEventListener("error", () => resolve([]));
        document.head.append(script);
      });
    }
    return searchIndexPromise;
  };
  const normalizeText = text => (text || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
  const escapeRegularExpression = text => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const appendHighlightedText = (element, text, terms) => {
    if (!terms.length) {
      element.textContent = text;
      return;
    }
    const pattern = new RegExp("(" + terms.map(escapeRegularExpression).join("|") + ")", "ig");
    text.split(pattern).forEach((part, index) => {
      if (!part) return;
      element.append(index % 2 === 1 ? createElement("mark", { text: part }) : document.createTextNode(part));
    });
  };
  const scoreEntry = (entry, query, terms) => {
    const [title, context, path, text] = entry;
    const normalizedTitle = normalizeText(title);
    const normalizedContext = normalizeText(context);
    const haystack = normalizedTitle + " " + normalizedContext + " " + normalizeText(text);
    if (!terms.every(term => haystack.includes(term))) return 0;
    let score = 1;
    if (normalizedTitle === query) score += 1000;
    else if (normalizedTitle.startsWith(query)) score += 500;
    else if (normalizedTitle.includes(query)) score += 300;
    terms.forEach(term => {
      if (normalizedTitle.includes(term)) score += 60;
      if (normalizedContext.includes(term)) score += 15;
    });
    if (!path.includes("#")) score += 40;
    return score;
  };
  const searchEntries = (index, rawQuery) => {
    const query = normalizeText(rawQuery).trim();
    const terms = query.split(/\s+/).filter(Boolean);
    if (!terms.length) return { matches: [], terms };
    const matches = index.map(entry => ({ entry, score: scoreEntry(entry, query, terms) })).filter(match => match.score > 0).sort((first, second) => second.score - first.score || first.entry[0].length - second.entry[0].length);
    return { matches, terms };
  };
  const initializeSearch = container => {
    const input = container.querySelector(".search-input");
    const results = container.querySelector(".search-results");
    if (!input || !results) return;
    let selectedIndex = -1;
    const closeResults = () => {
      results.hidden = true;
      input.setAttribute("aria-expanded", "false");
      selectedIndex = -1;
    };
    const updateSelection = () => {
      const links = [...results.querySelectorAll(".search-result")];
      links.forEach((link, index) => link.classList.toggle("is-selected", index === selectedIndex));
      if (links[selectedIndex]) links[selectedIndex].scrollIntoView({ block: "nearest" });
    };
    const renderResults = async () => {
      const index = await loadSearchIndex();
      const { matches, terms } = searchEntries(index, input.value);
      results.replaceChildren();
      selectedIndex = -1;
      if (!terms.length) {
        closeResults();
        return;
      }
      const visibleMatches = matches.slice(0, 24);
      if (!visibleMatches.length) results.append(createElement("div", { className: "search-empty", text: "No results for \"" + input.value.trim() + "\"" }));
      else results.append(createElement("div", { className: "search-summary", text: matches.length + (matches.length === 1 ? " result" : " results") + (matches.length > visibleMatches.length ? ", showing the top " + visibleMatches.length : "") }));
      visibleMatches.forEach(({ entry }) => {
        const [title, context, path, text] = entry;
        const titleElement = createElement("span", { className: "search-result-title" });
        appendHighlightedText(titleElement, title, terms);
        const textElement = createElement("span", { className: "search-result-text" });
        appendHighlightedText(textElement, text.slice(0, 160), terms);
        const link = createElement("a", { className: "search-result", href: rootPath + path, role: "option" }, [titleElement, createElement("span", { className: "search-result-context", text: context })]);
        if (text) link.append(textElement);
        link.addEventListener("click", closeResults);
        results.append(link);
      });
      results.hidden = false;
      input.setAttribute("aria-expanded", "true");
    };
    input.addEventListener("input", renderResults);
    input.addEventListener("focus", () => {
      loadSearchIndex();
      if (input.value.trim()) renderResults();
    });
    input.addEventListener("keydown", event => {
      const links = [...results.querySelectorAll(".search-result")];
      if (event.key === "ArrowDown" && links.length) {
        event.preventDefault();
        selectedIndex = (selectedIndex + 1) % links.length;
        updateSelection();
      } else if (event.key === "ArrowUp" && links.length) {
        event.preventDefault();
        selectedIndex = (selectedIndex - 1 + links.length) % links.length;
        updateSelection();
      } else if (event.key === "Enter") {
        const target = links[selectedIndex] || links[0];
        if (target) {
          event.preventDefault();
          closeResults();
          window.location.href = target.href;
        }
      } else if (event.key === "Escape") {
        closeResults();
        input.blur();
      }
    });
    document.addEventListener("click", event => {
      if (!container.contains(event.target) && !event.target.closest(".search-toggle")) closeResults();
    });
  };
  const watchShortcuts = topbar => {
    document.addEventListener("keydown", event => {
      const activeTag = document.activeElement ? document.activeElement.tagName : "";
      const isTyping = activeTag === "INPUT" || activeTag === "TEXTAREA" || (document.activeElement && document.activeElement.isContentEditable);
      const isShortcut = (event.key === "/" && !isTyping) || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k");
      if (!isShortcut) return;
      event.preventDefault();
      const homeSearch = document.querySelector(".home-search .search-input");
      if (homeSearch) {
        homeSearch.focus();
        return;
      }
      if (!topbar) return;
      topbar.classList.remove("is-hidden");
      if (window.matchMedia("(max-width: 760px)").matches) topbar.classList.add("is-search-open");
      topbar.querySelector(".search-input").focus();
    });
  };
  const copyText = async text => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      const helper = createElement("textarea", { readonly: "" });
      helper.value = text;
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.append(helper);
      helper.select();
      const isCopied = document.execCommand("copy");
      helper.remove();
      return isCopied;
    }
  };
  const createCopyButton = getText => {
    const button = createElement("button", { className: "copy-button", type: "button", "aria-label": "Copy to clipboard", title: "Copy" }, [createIcon("Copy.svg")]);
    button.addEventListener("click", async () => {
      if (!(await copyText(getText()))) return;
      button.classList.add("is-copied");
      button.replaceChildren(createIcon("Check.svg"));
      setTimeout(() => {
        button.classList.remove("is-copied");
        button.replaceChildren(createIcon("Copy.svg"));
      }, 1400);
    });
    return button;
  };
  const enhanceContent = () => {
    document.querySelectorAll(".data-table").forEach(table => {
      const labels = [...table.querySelectorAll("thead th")].map(header => header.textContent.trim());
      if (labels.length && !table.hasAttribute("data-no-stack")) table.classList.add("is-stackable");
      table.querySelectorAll("tbody tr").forEach(row => [...row.children].forEach((cell, index) => {
        if (labels[index] && !cell.hasAttribute("data-label")) cell.setAttribute("data-label", labels[index]);
      }));
    });
    document.querySelectorAll("code.copy").forEach(code => {
      const wrapper = createElement("span", { className: "code-cell" });
      code.before(wrapper);
      wrapper.append(code, createCopyButton(() => code.textContent));
    });
    document.querySelectorAll("pre > code").forEach(code => {
      const preformatted = code.parentElement;
      if (preformatted.parentElement.classList.contains("code-block")) return;
      const wrapper = createElement("div", { className: "code-block" });
      preformatted.before(wrapper);
      wrapper.append(preformatted, createCopyButton(() => code.textContent));
    });
    document.querySelectorAll("a[href^='http']").forEach(link => {
      if (link.hostname === window.location.hostname) return;
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    });
  };
  const buildTableOfContents = () => {
    const tableOfContents = document.querySelector("[data-toc]");
    const panels = [...document.querySelectorAll(".content > .panel[id]")];
    if (!tableOfContents || panels.length < 2) {
      if (tableOfContents) tableOfContents.remove();
      document.querySelectorAll(".layout").forEach(layout => layout.classList.add("is-single"));
      return;
    }
    tableOfContents.classList.add("toc");
    tableOfContents.setAttribute("aria-label", "On this page");
    tableOfContents.append(createElement("p", { className: "toc-title", text: "On this page" }));
    const linksById = new Map();
    panels.forEach(panel => {
      const heading = panel.querySelector(".panel-title");
      const link = createElement("a", { className: "toc-link", href: "#" + panel.id, text: heading ? heading.textContent.trim() : panel.id });
      linksById.set(panel.id, link);
      tableOfContents.append(link);
    });
    if (!("IntersectionObserver" in window)) return;
    const visiblePanels = new Set();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting ? visiblePanels.add(entry.target) : visiblePanels.delete(entry.target));
      const firstVisible = panels.find(panel => visiblePanels.has(panel));
      if (!firstVisible) return;
      linksById.forEach((link, id) => link.classList.toggle("is-active", id === firstVisible.id));
    }, { rootMargin: "-80px 0px -55% 0px" });
    panels.forEach(panel => observer.observe(panel));
  };
  const initializePageFilter = () => {
    const input = document.querySelector("[data-page-filter]");
    if (!input) return;
    const counter = document.querySelector("[data-page-filter-count]");
    const panels = [...document.querySelectorAll(".content > .panel")];
    const itemSelector = ".data-table tbody tr, .disclosure, .card, .definition, .checklist li";
    const totalItems = document.querySelectorAll(".content " + itemSelector.split(", ").join(", .content ")).length;
    const applyFilter = () => {
      const terms = normalizeText(input.value).trim().split(/\s+/).filter(Boolean);
      let visibleCount = 0;
      panels.forEach(panel => {
        const items = [...panel.querySelectorAll(itemSelector)];
        const headingText = normalizeText((panel.querySelector(".panel-title") || {}).textContent || "");
        const isHeadingMatch = terms.length > 0 && terms.every(term => headingText.includes(term));
        let panelHasMatch = !terms.length || isHeadingMatch;
        items.forEach(item => {
          const isMatch = !terms.length || isHeadingMatch || terms.every(term => normalizeText(item.textContent).includes(term));
          item.hidden = !isMatch;
          if (isMatch) {
            visibleCount += 1;
            panelHasMatch = true;
          }
        });
        if (!items.length && terms.length && !isHeadingMatch) panelHasMatch = terms.every(term => normalizeText(panel.textContent).includes(term));
        panel.hidden = !panelHasMatch;
        const tocLink = document.querySelector(".toc-link[href='#" + panel.id + "']");
        if (tocLink) tocLink.hidden = !panelHasMatch;
      });
      if (counter) counter.textContent = terms.length ? visibleCount + " of " + totalItems : totalItems + " items";
    };
    input.addEventListener("input", applyFilter);
    input.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        input.value = "";
        applyFilter();
      }
    });
    applyFilter();
  };
  const topbar = renderTopbar();
  renderFooter();
  watchScroll(topbar);
  watchShortcuts(topbar);
  document.querySelectorAll("[data-search]").forEach(initializeSearch);
  enhanceContent();
  buildTableOfContents();
  initializePageFilter();
})();
