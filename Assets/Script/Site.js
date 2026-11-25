(() => {
  "use strict";
  const siteName = "Cyber Epistemology";
  const siteVersion = "V3";
  const repositoryUrl = "https://github.com/emaldos/Cyber-Epistemology";
  const homeItem = { label: "Home", description: "Start page and site search", path: "index.html", icon: "Home.svg" };
  const navigationGroups = [
    { key: "system-files", label: "Operating Systems", sections: ["system-files"], items: [
      { label: "All systems", description: "Compare every platform side by side", path: "Data/System_Files_Info.html", icon: "Folder.svg", isOverview: true },
      { label: "Windows 11", path: "Data/OS/Windows_11.html", icon: "Windows11.svg" },
      { label: "Windows Server", path: "Data/OS/Windows_Server.html", icon: "WindowsServer.svg" },
      { label: "macOS", path: "Data/OS/macOS.html", icon: "MacOs.svg" },
      { label: "iOS", path: "Data/OS/IOS.html", icon: "Ios.svg" },
      { label: "Android", path: "Data/OS/Android.html", icon: "Android.svg" },
      { label: "Ubuntu Server", path: "Data/OS/Ubuntu_Server.html", icon: "UbuntuServer.svg" },
      { label: "Kali Linux", path: "Data/OS/Kali_Linux.html", icon: "KaliLinux.svg" }
    ] },
    { key: "commands", label: "Commands", sections: ["commands"], items: [
      { label: "All shells", description: "The same task in Bash, PowerShell and CMD", path: "Data/Commands.html", icon: "Terminal.svg", isOverview: true },
      { label: "Bash", description: "Linux and macOS shell", path: "Data/Commands/Bash.html", icon: "Bash.svg" },
      { label: "macOS Terminal", description: "zsh, launchctl, security and logs", path: "Data/Commands/macOS.html", icon: "MacOs.svg" },
      { label: "PowerShell", description: "Windows, servers and Active Directory", path: "Data/Commands/PS.html", icon: "PowerShell.svg" },
      { label: "CMD", description: "Classic Command Prompt and batch", path: "Data/Commands/CMD.html", icon: "CommandPrompt.svg" }
    ] },
    { key: "guides", label: "Guides", sections: ["guides"], items: [
      { label: "Cloud Security", description: "AWS, Azure and GCP CLI and IAM", path: "Data/Guides/Cloud_Security.html", icon: "Cloud.svg" },
      { label: "Ports and Protocols", description: "Common ports and what to check", path: "Data/Guides/Ports_And_Protocols.html", icon: "Ports.svg" },
      { label: "Wireshark Filters", description: "Display and capture filters by task", path: "Data/Guides/Wireshark_Filters.html", icon: "Wireshark.svg" }
    ] },
    { key: "tools", label: "Tools", sections: ["kali-tools", "websites", "utilities", "cheat-sheet"], items: [
      { label: "Kali Tools", description: "Tools for each phase of an assessment", path: "Data/Kali_Tools.html", icon: "KaliLinux.svg" },
      { label: "Utilities", description: "Encode, decode, hash, JWT and subnets", path: "Data/Utilities.html", icon: "Utilities.svg" },
      { label: "My Cheat Sheet", description: "Everything you starred, ready to print", path: "Data/My_Cheat_Sheet.html", icon: "Star.svg" },
      { label: "Cyber Websites", description: "Labs, CTFs, threat intel and OSINT", path: "Data/Cyber_Websites.html", icon: "Globe.svg" }
    ] },
    { key: "learn", label: "Learn", sections: ["start-here", "study-planner", "roadmap", "awareness", "glossary", "about"], items: [
      { label: "Start Here", description: "Guided paths for your role", path: "Data/Start_Here.html", icon: "StartHere.svg" },
      { label: "Study Planner", description: "A weekly schedule you can export", path: "Data/Study_Planner.html", icon: "Calendar.svg" },
      { label: "Certification Roadmap", description: "Certifications by career track and level", path: "Data/cyber_roadmap.html", icon: "Roadmap.svg" },
      { label: "Personal Security", description: "Passwords, passkeys, phishing and backups", path: "Data/Maximum_Security.html", icon: "Awareness.svg" },
      { label: "Glossary", description: "Security terms in plain language", path: "Data/Glossary.html", icon: "Glossary.svg" },
      { label: "About", description: "The project and how pages are reviewed", path: "Data/About.html", icon: "Shield.svg" }
    ] }
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
  const normalizePagePath = pathname => pathname.replace(/index\.html$/, "");
  const isCurrentPage = path => normalizePagePath(new URL(rootPath + path, document.baseURI).pathname) === normalizePagePath(window.location.pathname);
  const createMenuLink = item => {
    const text = createElement("span", { className: "menu-link-text" }, [createElement("span", { className: "menu-link-label", text: item.label })]);
    if (item.description) text.append(createElement("span", { className: "menu-link-description", text: item.description }));
    const link = createElement("a", { href: rootPath + item.path, className: "menu-link" + (item.isOverview ? " is-overview" : "") }, [createIcon(item.icon, "menu-link-icon"), text]);
    if (isCurrentPage(item.path)) link.setAttribute("aria-current", "page");
    return link;
  };
  const createNavigationGroup = group => {
    const panelId = "site-menu-" + group.key;
    const isActive = group.sections.includes(currentSection);
    const trigger = createElement("button", { className: "main-nav-trigger" + (isActive ? " is-active" : ""), type: "button", "aria-expanded": "false", "aria-controls": panelId }, [createElement("span", { text: group.label }), createIcon("Chevron.svg", "main-nav-chevron")]);
    const panel = createElement("div", { className: "main-nav-panel" + (group.items.length > 5 ? " is-wide" : ""), id: panelId, hidden: "" }, group.items.map(createMenuLink));
    return createElement("div", { className: "main-nav-group" }, [trigger, panel]);
  };
  const setupNavigationGroups = navigation => {
    const groups = [...navigation.querySelectorAll(".main-nav-group")];
    const setGroupOpen = (group, isOpen) => {
      group.classList.toggle("is-open", isOpen);
      group.querySelector(".main-nav-trigger").setAttribute("aria-expanded", String(isOpen));
      group.querySelector(".main-nav-panel").hidden = !isOpen;
    };
    const closeOtherGroups = openGroup => groups.forEach(group => { if (group !== openGroup) setGroupOpen(group, false); });
    groups.forEach(group => {
      const trigger = group.querySelector(".main-nav-trigger");
      let closeTimer = null;
      let isOpenedByHover = false;
      trigger.addEventListener("click", () => {
        const willOpen = isOpenedByHover || !group.classList.contains("is-open");
        isOpenedByHover = false;
        closeOtherGroups(group);
        setGroupOpen(group, willOpen);
      });
      trigger.addEventListener("keydown", event => {
        if (event.key !== "ArrowDown") return;
        event.preventDefault();
        closeOtherGroups(group);
        setGroupOpen(group, true);
        group.querySelector(".menu-link").focus();
      });
      group.addEventListener("pointerenter", event => {
        if (event.pointerType !== "mouse") return;
        clearTimeout(closeTimer);
        if (!group.classList.contains("is-open")) isOpenedByHover = true;
        closeOtherGroups(group);
        setGroupOpen(group, true);
      });
      group.addEventListener("pointerleave", event => {
        if (event.pointerType !== "mouse") return;
        closeTimer = setTimeout(() => {
          isOpenedByHover = false;
          setGroupOpen(group, false);
        }, 200);
      });
      group.addEventListener("focusout", event => { if (!group.contains(event.relatedTarget)) setGroupOpen(group, false); });
      group.addEventListener("keydown", event => {
        if (event.key !== "Escape" || !group.classList.contains("is-open")) return;
        setGroupOpen(group, false);
        trigger.focus();
      });
    });
    document.addEventListener("click", event => { if (!navigation.contains(event.target)) closeOtherGroups(null); });
  };
  const createMobileMenu = () => {
    const sections = navigationGroups.map(group => createElement("div", { className: "mobile-menu-group" }, [createElement("p", { className: "mobile-menu-title", text: group.label }), createElement("div", { className: "mobile-menu-links" }, group.items.map(createMenuLink))]));
    return createElement("nav", { className: "mobile-menu", id: "site-mobile-menu", "aria-label": "Mobile" }, [createElement("div", { className: "mobile-menu-links" }, [createMenuLink(homeItem)]), ...sections]);
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
    const brand = createElement("a", { className: "brand", href: rootPath + "index.html", "aria-label": siteName + " home" }, [brandLogo, createElement("span", { className: "brand-name", text: siteName })]);
    const mainNavigation = createElement("nav", { className: "main-nav", "aria-label": "Main" }, navigationGroups.map(createNavigationGroup));
    const searchToggle = createElement("button", { className: "icon-button search-toggle", type: "button", "aria-label": "Open search" }, [createIcon("Search.svg")]);
    const menuButton = createElement("button", { className: "icon-button menu-button", type: "button", "aria-label": "Open menu", "aria-expanded": "false", "aria-controls": "site-mobile-menu" }, [createIcon("Menu.svg")]);
    const actions = createElement("div", { className: "topbar-actions" }, [createSearchBox(), searchToggle, menuButton]);
    topbar.append(createElement("div", { className: "topbar-inner" }, [brand, mainNavigation, actions]));
    setupNavigationGroups(mainNavigation);
    const mobileMenu = createMobileMenu();
    topbar.after(mobileMenu);
    const setMobileMenuOpen = isOpen => {
      topbar.classList.toggle("is-menu-open", isOpen);
      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.replaceChildren(createIcon(isOpen ? "Close.svg" : "Menu.svg"));
    };
    menuButton.addEventListener("click", () => {
      const isOpen = !topbar.classList.contains("is-menu-open");
      topbar.classList.remove("is-search-open");
      setMobileMenuOpen(isOpen);
      if (isOpen) mobileMenu.querySelector(".menu-link").focus();
    });
    document.addEventListener("keydown", event => {
      if (event.key !== "Escape" || !topbar.classList.contains("is-menu-open")) return;
      setMobileMenuOpen(false);
      menuButton.focus();
    });
    document.addEventListener("click", event => {
      if (topbar.classList.contains("is-menu-open") && !topbar.contains(event.target) && !mobileMenu.contains(event.target)) setMobileMenuOpen(false);
    });
    searchToggle.addEventListener("click", () => {
      const isOpen = topbar.classList.toggle("is-search-open");
      setMobileMenuOpen(false);
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
    const offlineStatus = createElement("span", { className: "offline-status", "data-offline-status": "", hidden: "" }, [createIcon("Offline.svg"), createElement("span", { text: "Available offline" })]);
    footer.append(createElement("div", { className: "footer-inner" }, [copyright, offlineStatus, links]));
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
  const cheatSheetStorageKey = "cyberEpistemology.cheatSheet";
  const readCheatSheet = () => {
    try {
      const entries = JSON.parse(window.localStorage.getItem(cheatSheetStorageKey) || "[]");
      return Array.isArray(entries) ? entries : [];
    } catch (error) {
      return [];
    }
  };
  const writeCheatSheet = entries => {
    try {
      window.localStorage.setItem(cheatSheetStorageKey, JSON.stringify(entries));
      return true;
    } catch (error) {
      return false;
    }
  };
  const currentPagePath = () => {
    const sitePath = new URL(rootPath || "./", document.baseURI).pathname;
    return decodeURIComponent(window.location.pathname.slice(sitePath.length)) || "index.html";
  };
  const readCellText = cell => {
    const cellCopy = cell.cloneNode(true);
    cellCopy.querySelectorAll(".star-button, .copy-button").forEach(element => element.remove());
    cellCopy.querySelectorAll(".tag, .attack-tag").forEach(element => element.after(" "));
    return cellCopy.textContent.replace(/\s+/g, " ").trim();
  };
  const createStarButton = (row, table, panel, starredIdentifiers) => {
    const pagePath = currentPagePath();
    const cells = [...row.children];
    const entryIdentifier = pagePath + "#" + panel.id + "|" + readCellText(cells[0]);
    const button = createElement("button", { className: "star-button", type: "button" });
    const renderState = isStarred => {
      const label = isStarred ? "Remove from My Cheat Sheet" : "Add to My Cheat Sheet";
      button.classList.toggle("is-starred", isStarred);
      button.setAttribute("aria-pressed", String(isStarred));
      button.setAttribute("aria-label", label);
      button.title = label;
      button.replaceChildren(createIcon(isStarred ? "StarFilled.svg" : "Star.svg"));
    };
    renderState(starredIdentifiers.has(entryIdentifier));
    button.addEventListener("click", () => {
      const entries = readCheatSheet();
      const isStarred = entries.some(entry => entry.id === entryIdentifier);
      const pageTitle = (document.querySelector(".hero-title") || document.querySelector("title")).textContent.trim();
      const sectionTitle = ((panel.querySelector(".panel-title") || {}).textContent || "").trim();
      const headers = [...table.querySelectorAll("thead th")].map(header => header.textContent.trim());
      const newEntry = { id: entryIdentifier, pagePath, pageTitle, sectionId: panel.id, sectionTitle, headers, cells: cells.map(cell => ({ text: readCellText(cell), isCommand: Boolean(cell.querySelector("code.copy")) })), savedAt: new Date().toISOString() };
      const updatedEntries = isStarred ? entries.filter(entry => entry.id !== entryIdentifier) : entries.concat([newEntry]);
      if (writeCheatSheet(updatedEntries)) renderState(!isStarred);
    });
    return button;
  };
  const addStarButtons = () => {
    if (document.body.hasAttribute("data-no-stars")) return;
    const starredIdentifiers = new Set(readCheatSheet().map(entry => entry.id));
    document.querySelectorAll(".content > .panel[id] .data-table tbody tr").forEach(row => {
      const firstCell = row.children[0];
      if (firstCell) firstCell.append(createStarButton(row, row.closest(".data-table"), row.closest(".panel[id]"), starredIdentifiers));
    });
  };
  const registerOfflineSupport = () => {
    if (!("serviceWorker" in navigator)) return;
    const isSecureOrigin = window.location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(window.location.hostname);
    if (!isSecureOrigin) return;
    navigator.serviceWorker.register(rootPath + "ServiceWorker.js").then(() => navigator.serviceWorker.ready).then(() => {
      const status = document.querySelector("[data-offline-status]");
      if (status) status.hidden = false;
    }).catch(() => {});
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
  addStarButtons();
  buildTableOfContents();
  initializePageFilter();
  registerOfflineSupport();
})();
