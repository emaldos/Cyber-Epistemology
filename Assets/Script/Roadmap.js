(() => {
  "use strict";
  const data = window.roadmapData;
  const rolesContainer = document.querySelector("[data-roadmap-roles]");
  if (!data || !rolesContainer) return;
  const rootPath = document.body.dataset.root || "";
  const levelOrder = ["Foundation", "Associate", "Professional", "Expert"];
  const seniorityOrder = ["Entry", "Mid", "Senior", "Expert"];
  const categoryOrder = data.categories || ["Defense", "Offense", "Cloud and Engineering", "Governance and Leadership"];
  const priorityGroups = [
    { key: "prerequisites", priority: "Prerequisite", label: "Get these first", className: "roadmap-priority roadmap-priority-prerequisite" },
    { key: "core", priority: "Core", label: "Employers ask for these most", className: "roadmap-priority roadmap-priority-core" },
    { key: "recommended", priority: "Recommended", label: "Strong additions", className: "roadmap-priority roadmap-priority-recommended" },
    { key: "optional", priority: "Optional", label: "Specialist or nice to have", className: "roadmap-priority roadmap-priority-optional" }
  ];
  const usagePriorityOrder = ["core", "recommended", "optional", "prerequisites"];
  const levelClassNames ={ Foundation: "tag tag-low", Associate: "tag", Professional: "tag tag-medium", Expert: "tag tag-high" };
  const parameterNames = { category: "category", seniority: "seniority", query: "q", role: "role", level: "level", certificationQuery: "cq", certification: "cert" };
  const certificationsById = new Map(data.certifications.map(certification => [certification.id, certification]));
  const rolesById = new Map(data.roles.map(role => [role.id, role]));
  const certificationsFor = (role, key) => (role[key] || []).map(identifier => certificationsById.get(identifier)).filter(Boolean);
  const usageByCertification = new Map();
  const previousRolesById = new Map();
  data.roles.forEach(role => {
    priorityGroups.forEach(group => certificationsFor(role, group.key).forEach(certification => {
      if (!usageByCertification.has(certification.id)) usageByCertification.set(certification.id, []);
      usageByCertification.get(certification.id).push({ role, group });
    }));
    (role.nextRoles || []).forEach(nextIdentifier => {
      if (!previousRolesById.has(nextIdentifier)) previousRolesById.set(nextIdentifier, []);
      previousRolesById.get(nextIdentifier).push(role);
    });
  });
  const sortedRoles = [...data.roles].sort((first, second) => categoryOrder.indexOf(first.category) - categoryOrder.indexOf(second.category) || seniorityOrder.indexOf(first.seniority) - seniorityOrder.indexOf(second.seniority));
  const sortedCertifications = [...data.certifications].sort((first, second) => levelOrder.indexOf(first.level) - levelOrder.indexOf(second.level) || first.name.localeCompare(second.name));
  const normalizeText = text => String(text || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
  const matchesQuery = (searchText, query) => normalizeText(query).split(/\s+/).filter(Boolean).every(term => searchText.includes(term));
  const shortName = certification => certification.short || (certification.name.match(/\(([^()]+)\)$/) || [])[1] || (certification.provider === "Microsoft" && certification.code) || certification.name;
  const roleSearchText = new Map(data.roles.map(role => [role.id, normalizeText([role.name, role.category, role.seniority, role.summary, ...(role.skills || []), ...priorityGroups.flatMap(group => certificationsFor(role, group.key).map(certification => [certification.name, certification.code, certification.id].join(" ")))].join(" "))]));
  const certificationSearchText = new Map(data.certifications.map(certification => [certification.id, normalizeText([certification.name, certification.provider, certification.level, certification.code, certification.format, certification.summary, certification.note, certification.id, ...(usageByCertification.get(certification.id) || []).map(usage => usage.role.name)].join(" "))]));
  const createElement = (tagName, properties = {}, children = []) => {
    const element = document.createElement(tagName);
    Object.entries(properties).forEach(([name, value]) => {
      if (value === undefined || value === null || value === false) return;
      if (name === "className") element.className = value;
      else if (name === "text") element.textContent = value;
      else element.setAttribute(name, value === true ? "" : value);
    });
    children.forEach(child => element.append(child));
    return element;
  };
  const categoryButtons = [...document.querySelectorAll("[data-roadmap-category]")];
  const senioritySelect = document.querySelector("[data-roadmap-seniority]");
  const roleSearchInput = document.querySelector("[data-roadmap-search]");
  const roleCount = document.querySelector("[data-roadmap-role-count]");
  const roleDetail = document.querySelector("[data-roadmap-role-detail]");
  const pathsContainer = document.querySelector("[data-roadmap-paths]");
  const levelSelect = document.querySelector("[data-roadmap-level]");
  const certificationSearchInput = document.querySelector("[data-roadmap-certification-search]");
  const certificationCount = document.querySelector("[data-roadmap-certification-count]");
  const certificationsContainer = document.querySelector("[data-roadmap-certifications]");
  const dialog = document.querySelector("[data-roadmap-dialog]");
  const dialogTitle = document.querySelector("[data-roadmap-dialog-title]");
  const dialogBody = document.querySelector("[data-roadmap-dialog-body]");
  const dialogCloseButton = document.querySelector("[data-roadmap-dialog-close]");
  const readState = () => {
    const parameters = new URLSearchParams(window.location.search);
    const value = key => (parameters.get(parameterNames[key]) || "").trim();
    return {
      category: categoryOrder.includes(value("category")) ? value("category") : "",
      seniority: seniorityOrder.includes(value("seniority")) ? value("seniority") : "",
      query: value("query"),
      role: rolesById.has(value("role")) ? value("role") : "",
      level: levelOrder.includes(value("level")) ? value("level") : "",
      certificationQuery: value("certificationQuery"),
      certification: certificationsById.has(value("certification")) ? value("certification") : ""
    };
  };
  let state = readState();
  let dialogTrigger = null;
  const writeState = mode => {
    const url = new URL(window.location.href);
    Object.entries(parameterNames).forEach(([key, name]) => {
      if (state[key]) url.searchParams.set(name, state[key]);
      else url.searchParams.delete(name);
    });
    if (url.href === window.location.href) return;
    try {
      if (mode === "push") window.history.pushState(null, "", url.href);
      else window.history.replaceState(null, "", url.href);
    } catch {
      return;
    }
  };
  const scrollBehavior = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  const createLevelTag = certification => createElement("span", { className: levelClassNames[certification.level] || "tag", text: certification.level });
  const createRoleButton = (role, metaText) => {
    const button = createElement("button", { type: "button", className: "roadmap-role-link", "aria-current": role.id === state.role ? "true" : false }, [createElement("span", { className: "roadmap-role-link-name", text: role.name })]);
    if (metaText) button.append(createElement("span", { className: "roadmap-role-link-meta", text: metaText }));
    button.addEventListener("click", () => {
      dialogTrigger = null;
      state.certification = "";
      closeDialog();
      selectRole(role.id, true);
    });
    return button;
  };
  const createCertificationButton = (certification, showUsage) => {
    const meta = createElement("span", { className: "roadmap-certification-meta" }, [createLevelTag(certification), createElement("span", { className: "roadmap-certification-provider", text: certification.provider + (certification.code ? " · " + certification.code : "") })]);
    if (showUsage) {
      const usageCount = (usageByCertification.get(certification.id) || []).length;
      meta.append(createElement("span", { className: "roadmap-certification-usage", text: usageCount + (usageCount === 1 ? " role" : " roles") }));
    }
    const button = createElement("button", { type: "button", className: "roadmap-certification-button", "aria-haspopup": "dialog" }, [createElement("span", { className: "roadmap-certification-name", text: certification.name }), meta]);
    button.addEventListener("click", () => openCertification(certification.id, button));
    return button;
  };
  const createRoleCard = role => {
    const coreNames = certificationsFor(role, "core").map(shortName).join(", ");
    const button = createElement("button", { type: "button", className: "roadmap-role-card", "aria-pressed": String(role.id === state.role) }, [
      createElement("span", { className: "roadmap-role-card-header" }, [createElement("span", { className: "roadmap-role-card-title", text: role.name }), createElement("span", { className: "tag tag-neutral", text: role.seniority })]),
      createElement("span", { className: "roadmap-role-card-text", text: role.summary }),
      createElement("span", { className: "roadmap-role-card-meta", text: coreNames ? "Core: " + coreNames : "No core certification" })
    ]);
    button.addEventListener("click", () => selectRole(role.id, true));
    return button;
  };
  const renderRoles = () => {
    const visibleRoles = sortedRoles.filter(role => (!state.category || role.category === state.category) && (!state.seniority || role.seniority === state.seniority) && matchesQuery(roleSearchText.get(role.id), state.query));
    const groups = categoryOrder.map(category => ({ category, roles: visibleRoles.filter(role => role.category === category) })).filter(group => group.roles.length);
    rolesContainer.replaceChildren(...groups.map(group => createElement("div", { className: "roadmap-role-group" }, [
      createElement("h3", { className: "roadmap-group-title", text: group.category }),
      createElement("ul", { className: "roadmap-role-grid", "aria-label": group.category + " roles" }, group.roles.map(role => createElement("li", {}, [createRoleCard(role)])))
    ])));
    if (!visibleRoles.length) rolesContainer.append(createElement("p", { className: "empty-state", text: "No roles match these filters." }));
    if (roleCount) roleCount.textContent = visibleRoles.length + " of " + data.roles.length + " roles";
  };
  const createRoleLinkSection = (title, roles) => [
    createElement("h4", { className: "roadmap-detail-heading", text: title }),
    createElement("ul", { className: "roadmap-role-links" }, roles.map(role => createElement("li", {}, [createRoleButton(role, role.seniority)])))
  ];
  const renderRoleDetail = () => {
    if (!roleDetail) return;
    const role = rolesById.get(state.role);
    if (!role) {
      roleDetail.replaceChildren(createElement("p", { className: "roadmap-detail-empty", text: "Select a role above, or a step in a career path, to see its skills and certifications here." }));
      return;
    }
    const parts = [
      createElement("h3", { className: "roadmap-detail-title", tabindex: "-1", "data-roadmap-detail-title": true, text: role.name }),
      createElement("div", { className: "roadmap-detail-meta" }, [createElement("span", { className: "tag", text: role.category }), createElement("span", { className: "tag tag-neutral", text: role.seniority })]),
      createElement("p", { className: "roadmap-detail-summary", text: role.summary })
    ];
    if ((role.skills || []).length) parts.push(createElement("h4", { className: "roadmap-detail-heading", text: "Key skills" }), createElement("ul", { className: "roadmap-skill-list" }, role.skills.map(skill => createElement("li", { className: "tag tag-neutral", text: skill }))));
    priorityGroups.forEach(group => {
      const certifications = certificationsFor(role, group.key);
      if (!certifications.length) return;
      parts.push(
        createElement("h4", { className: "roadmap-detail-heading" }, [createElement("span", { className: group.className, text: group.priority }), createElement("span", { text: group.label })]),
        createElement("ul", { className: "roadmap-certification-chips", "aria-label": group.priority + " certifications" }, certifications.map(certification => createElement("li", {}, [createCertificationButton(certification, false)])))
      );
    });
    if ((role.notes || []).length) parts.push(createElement("div", { className: "callout callout-tip roadmap-notes" }, role.notes.map(note => createElement("p", { text: note }))));
    const previousRoles = previousRolesById.get(role.id) || [];
    const nextRoles = (role.nextRoles || []).map(identifier => rolesById.get(identifier)).filter(Boolean);
    if (previousRoles.length) parts.push(...createRoleLinkSection("Often comes after", previousRoles));
    if (nextRoles.length) parts.push(...createRoleLinkSection("Next roles", nextRoles));
    else parts.push(createElement("h4", { className: "roadmap-detail-heading", text: "Next roles" }), createElement("p", { className: "roadmap-detail-empty", text: "This is the top of its track. Move sideways into another role or into leadership." }));
    roleDetail.replaceChildren(...parts);
  };
  const renderPaths = () => {
    if (!pathsContainer) return;
    pathsContainer.replaceChildren(...(data.paths || []).map(path => createElement("div", { className: "roadmap-path" }, [
      createElement("h3", { className: "roadmap-path-title", text: path.name }),
      createElement("p", { className: "roadmap-path-summary", text: path.summary }),
      createElement("ol", { className: "roadmap-path-steps", "aria-label": path.name + " steps" }, path.roles.map(identifier => rolesById.get(identifier)).filter(Boolean).map(role => createElement("li", { className: "roadmap-path-step" }, [createRoleButton(role, role.seniority)])))
    ])));
  };
  const renderCertifications = () => {
    if (!certificationsContainer) return;
    const visibleCertifications = sortedCertifications.filter(certification => (!state.level || certification.level === state.level) && matchesQuery(certificationSearchText.get(certification.id), state.certificationQuery));
    const groups = levelOrder.map(level => ({ level, certifications: visibleCertifications.filter(certification => certification.level === level) })).filter(group => group.certifications.length);
    certificationsContainer.replaceChildren(...groups.map(group => createElement("div", { className: "roadmap-certification-group" }, [
      createElement("h3", { className: "roadmap-group-title", text: group.level + " (" + group.certifications.length + ")" }),
      createElement("ul", { className: "roadmap-certification-list", "aria-label": group.level + " certifications" }, group.certifications.map(certification => createElement("li", {}, [createCertificationButton(certification, true)])))
    ])));
    if (!visibleCertifications.length) certificationsContainer.append(createElement("p", { className: "empty-state", text: "No certifications match these filters." }));
    if (certificationCount) certificationCount.textContent = visibleCertifications.length + " of " + data.certifications.length + " certifications";
  };
  const renderCertificationDialog = certification => {
    dialogTitle.textContent = certification.name;
    const facts = createElement("dl", { className: "roadmap-facts" });
    [["Provider", certification.provider], ["Level", certification.level], ["Exam code", certification.code], ["Format", certification.format]].forEach(([term, value]) => {
      if (value) facts.append(createElement("div", { className: "roadmap-fact" }, [createElement("dt", { text: term }), createElement("dd", { text: value })]));
    });
    const parts = [facts, createElement("p", { className: "roadmap-dialog-summary", text: certification.summary })];
    if (certification.note) parts.push(createElement("div", { className: "callout" }, [createElement("p", { text: certification.note })]));
    if (/^https:\/\//.test(certification.url || "")) parts.push(createElement("p", {}, [createElement("a", { className: "link-button", href: certification.url, target: "_blank", rel: "noopener noreferrer" }, [createElement("span", { text: "Official page" }), createElement("img", { src: rootPath + "Assets/Icon/External.svg", alt: "", width: "14", height: "14" })])]));
    const usages = [...(usageByCertification.get(certification.id) || [])].sort((first, second) => usagePriorityOrder.indexOf(first.group.key) - usagePriorityOrder.indexOf(second.group.key));
    parts.push(createElement("h3", { className: "roadmap-dialog-heading", text: "Roles that use it" }));
    if (usages.length) parts.push(createElement("ul", { className: "roadmap-usage-list" }, usages.map(usage => createElement("li", { className: "roadmap-usage-item" }, [createRoleButton(usage.role, usage.role.category + " · " + usage.role.seniority), createElement("span", { className: usage.group.className, text: usage.group.priority })]))));
    else parts.push(createElement("p", { text: "Not mapped to a role yet." }));
    dialogBody.replaceChildren(...parts);
  };
  const showCertificationDialog = () => {
    const certification = certificationsById.get(state.certification);
    if (!dialog || !certification) return;
    renderCertificationDialog(certification);
    if (!dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
    dialogBody.scrollTop = 0;
    if (dialogCloseButton) dialogCloseButton.focus();
  };
  const openCertification = (certificationIdentifier, trigger) => {
    if (!certificationsById.has(certificationIdentifier)) return;
    dialogTrigger = trigger || document.activeElement;
    state.certification = certificationIdentifier;
    writeState("replace");
    showCertificationDialog();
  };
  const closeDialog = () => {
    if (!dialog || !dialog.open) return;
    if (typeof dialog.close === "function") dialog.close();
    else {
      dialog.removeAttribute("open");
      dialog.dispatchEvent(new Event("close"));
    }
  };
  const focusRoleDetail = () => {
    if (!roleDetail) return;
    const panel = roleDetail.closest(".panel") || roleDetail;
    panel.hidden = false;
    panel.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
    const title = roleDetail.querySelector("[data-roadmap-detail-title]");
    if (title) title.focus({ preventScroll: true });
  };
  const renderSelection = () => {
    renderRoles();
    renderRoleDetail();
    renderPaths();
  };
  const selectRole = (roleIdentifier, shouldFocus) => {
    if (!rolesById.has(roleIdentifier)) return;
    state.role = roleIdentifier;
    writeState("push");
    renderSelection();
    if (shouldFocus) focusRoleDetail();
  };
  const syncControls = () => {
    categoryButtons.forEach(button => button.setAttribute("aria-pressed", String((button.dataset.roadmapCategory || "") === state.category)));
    if (senioritySelect) senioritySelect.value = state.seniority;
    if (levelSelect) levelSelect.value = state.level;
    if (roleSearchInput && roleSearchInput.value.trim() !== state.query) roleSearchInput.value = state.query;
    if (certificationSearchInput && certificationSearchInput.value.trim() !== state.certificationQuery) certificationSearchInput.value = state.certificationQuery;
  };
  const updateRoleFilters = () => {
    syncControls();
    writeState("replace");
    renderRoles();
  };
  const updateCertificationFilters = () => {
    syncControls();
    writeState("replace");
    renderCertifications();
  };
  const clearOnEscape = (input, key, update) => input.addEventListener("keydown", event => {
    if (event.key !== "Escape" || !input.value) return;
    event.preventDefault();
    input.value = "";
    state[key] = "";
    update();
  });
  categoryButtons.forEach(button => button.addEventListener("click", () => {
    state.category = button.dataset.roadmapCategory || "";
    updateRoleFilters();
  }));
  if (senioritySelect) senioritySelect.addEventListener("change", () => {
    state.seniority = senioritySelect.value;
    updateRoleFilters();
  });
  if (roleSearchInput) {
    roleSearchInput.addEventListener("input", () => {
      state.query = roleSearchInput.value.trim();
      updateRoleFilters();
    });
    clearOnEscape(roleSearchInput, "query", updateRoleFilters);
  }
  if (levelSelect) levelSelect.addEventListener("change", () => {
    state.level = levelSelect.value;
    updateCertificationFilters();
  });
  if (certificationSearchInput) {
    certificationSearchInput.addEventListener("input", () => {
      state.certificationQuery = certificationSearchInput.value.trim();
      updateCertificationFilters();
    });
    clearOnEscape(certificationSearchInput, "certificationQuery", updateCertificationFilters);
  }
  if (dialog) {
    dialog.addEventListener("close", () => {
      if (state.certification) {
        state.certification = "";
        writeState("replace");
      }
      if (dialogTrigger && document.contains(dialogTrigger)) dialogTrigger.focus();
      dialogTrigger = null;
    });
    dialog.addEventListener("click", event => {
      if (event.target === dialog) closeDialog();
    });
    dialog.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeDialog();
    });
  }
  if (dialogCloseButton) dialogCloseButton.addEventListener("click", closeDialog);
  window.addEventListener("popstate", () => {
    state = readState();
    syncControls();
    renderSelection();
    renderCertifications();
    if (state.certification) showCertificationDialog();
    else closeDialog();
  });
  syncControls();
  renderSelection();
  renderCertifications();
  if (state.role && !state.certification) window.requestAnimationFrame(focusRoleDetail);
  if (state.certification) showCertificationDialog();
})();
