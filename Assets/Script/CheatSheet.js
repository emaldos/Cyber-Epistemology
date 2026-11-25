(() => {
  "use strict";
  const storageKey = "cyberEpistemology.cheatSheet";
  const flashMessageKey = "cyberEpistemology.cheatSheetMessage";
  const rootPath = document.body.dataset.root || "";
  const content = document.getElementById("cheat-sheet-content");
  if (!content) return;
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
  const createIcon = name => createElement("img", { src: rootPath + "Assets/Icon/" + name, alt: "", "aria-hidden": "true", width: "16", height: "16" });
  const readEntries = () => {
    try {
      const entries = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
      return Array.isArray(entries) ? entries.filter(isValidEntry) : [];
    } catch (error) {
      return [];
    }
  };
  const writeEntries = entries => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(entries));
      return true;
    } catch (error) {
      return false;
    }
  };
  function isValidEntry(entry) {
    return Boolean(entry) && typeof entry.id === "string" && typeof entry.pagePath === "string" && Array.isArray(entry.cells);
  }
  const slugify = text => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const groupEntries = entries => {
    const pages = new Map();
    entries.forEach(entry => {
      if (!pages.has(entry.pagePath)) pages.set(entry.pagePath, { pagePath: entry.pagePath, pageTitle: entry.pageTitle || entry.pagePath, sections: new Map() });
      const sections = pages.get(entry.pagePath).sections;
      if (!sections.has(entry.sectionId)) sections.set(entry.sectionId, { sectionId: entry.sectionId, sectionTitle: entry.sectionTitle || entry.sectionId, headers: entry.headers || [], entries: [] });
      sections.get(entry.sectionId).entries.push(entry);
    });
    return [...pages.values()];
  };
  const showMessage = text => {
    const message = document.querySelector("[data-cheat-sheet-message]");
    if (!message) return;
    message.textContent = text;
    message.hidden = !text;
  };
  const updateCount = count => {
    const badge = document.querySelector("[data-cheat-sheet-count]");
    if (badge) badge.textContent = count + (count === 1 ? " item" : " items");
  };
  const renderEmptyState = () => {
    const links = [["Kali Tools", "Kali_Tools.html"], ["Bash commands", "Commands/Bash.html"], ["PowerShell commands", "Commands/PS.html"], ["Windows 11 paths", "OS/Windows_11.html"]].map(([label, path]) => createElement("a", { className: "link-button", href: rootPath + "Data/" + path, text: label }));
    content.append(createElement("section", { className: "panel", id: "getting-started" }, [createElement("h2", { className: "panel-title", text: "Your cheat sheet is empty" }), createElement("p", { className: "panel-lead", text: "Open any page with a table and press the star next to a command, path or tool. It shows up here, grouped by page, ready to print or export." }), createElement("div", { className: "button-row" }, links)]));
  };
  const removeEntry = (entryIdentifier, row) => {
    const remainingEntries = readEntries().filter(entry => entry.id !== entryIdentifier);
    if (!writeEntries(remainingEntries)) return;
    if (!remainingEntries.length) {
      window.location.reload();
      return;
    }
    const tableWrap = row.closest(".table-wrap");
    const panel = row.closest(".panel");
    row.remove();
    if (!tableWrap.querySelector("tbody tr")) {
      tableWrap.previousElementSibling.remove();
      tableWrap.remove();
    }
    if (!panel.querySelector(".table-wrap")) {
      const tocLink = document.querySelector(".toc-link[href='#" + panel.id + "']");
      if (tocLink) tocLink.remove();
      panel.remove();
    }
    updateCount(remainingEntries.length);
  };
  const createRow = (entry, columnCount) => {
    const row = createElement("tr");
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
      const cell = entry.cells[columnIndex] || { text: "" };
      row.append(createElement("td", {}, [cell.isCommand ? createElement("code", { className: "copy", text: cell.text }) : document.createTextNode(cell.text)]));
    }
    const removeButton = createElement("button", { className: "remove-button", type: "button", "aria-label": "Remove from My Cheat Sheet", title: "Remove" }, [createIcon("Trash.svg")]);
    removeButton.addEventListener("click", () => removeEntry(entry.id, row));
    row.append(createElement("td", { "data-label": "Remove" }, [removeButton]));
    return row;
  };
  const renderPage = page => {
    const panel = createElement("section", { className: "panel", id: "page-" + slugify(page.pagePath) }, [createElement("h2", { className: "panel-title", text: page.pageTitle }), createElement("p", { className: "panel-lead" }, [createElement("a", { href: rootPath + page.pagePath, text: "Open " + page.pageTitle })])]);
    page.sections.forEach(section => {
      const columnCount = Math.max(section.headers.length, ...section.entries.map(entry => entry.cells.length));
      const headerCells = Array.from({ length: columnCount }, (unused, columnIndex) => createElement("th", { text: section.headers[columnIndex] || "" })).concat([createElement("th", { text: "Remove" })]);
      const table = createElement("table", { className: "data-table" }, [createElement("thead", {}, [createElement("tr", {}, headerCells)]), createElement("tbody", {}, section.entries.map(entry => createRow(entry, columnCount)))]);
      panel.append(createElement("h3", {}, [createElement("a", { href: rootPath + page.pagePath + "#" + section.sectionId, text: section.sectionTitle })]), createElement("div", { className: "table-wrap" }, [table]));
    });
    return panel;
  };
  const downloadFile = (fileName, text, mimeType) => {
    const link = createElement("a", { href: URL.createObjectURL(new Blob([text], { type: mimeType })), download: fileName });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };
  const escapeMarkdownCell = text => text.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
  const buildMarkdown = entries => {
    const lines = ["# My Cheat Sheet", "", "Exported from Cyber Epistemology on " + new Date().toISOString().slice(0, 10) + "."];
    groupEntries(entries).forEach(page => {
      lines.push("", "## " + page.pageTitle);
      page.sections.forEach(section => {
        const columnCount = Math.max(section.headers.length, ...section.entries.map(entry => entry.cells.length));
        const headers = Array.from({ length: columnCount }, (unused, columnIndex) => escapeMarkdownCell(section.headers[columnIndex] || ""));
        lines.push("", "### " + section.sectionTitle, "", "| " + headers.join(" | ") + " |", "|" + headers.map(() => " --- ").join("|") + "|");
        section.entries.forEach(entry => lines.push("| " + Array.from({ length: columnCount }, (unused, columnIndex) => {
          const cell = entry.cells[columnIndex] || { text: "" };
          const text = escapeMarkdownCell(cell.text);
          return cell.isCommand && text ? "`" + text.replace(/`/g, "'") + "`" : text;
        }).join(" | ") + " |"));
      });
    });
    return lines.join("\n") + "\n";
  };
  const importBackup = file => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      try {
        const importedEntries = JSON.parse(reader.result);
        if (!Array.isArray(importedEntries)) throw new Error("Not a list");
        const validEntries = importedEntries.filter(isValidEntry);
        const mergedEntries = new Map(readEntries().map(entry => [entry.id, entry]));
        validEntries.forEach(entry => mergedEntries.set(entry.id, entry));
        if (!writeEntries([...mergedEntries.values()])) throw new Error("Storage full");
        window.sessionStorage.setItem(flashMessageKey, "Restored " + validEntries.length + (validEntries.length === 1 ? " item" : " items") + " from the backup.");
        window.location.reload();
      } catch (error) {
        showMessage("That file is not a valid My Cheat Sheet backup.");
      }
    });
    reader.readAsText(file);
  };
  const bindToolbar = () => {
    const importInput = document.querySelector("[data-import-input]");
    const actions = {
      "print": () => window.print(),
      "export-markdown": () => {
        const entries = readEntries();
        if (!entries.length) return showMessage("Star a few items first, then export.");
        downloadFile("My_Cheat_Sheet.md", buildMarkdown(entries), "text/markdown");
      },
      "export-backup": () => downloadFile("My_Cheat_Sheet_Backup.json", JSON.stringify(readEntries(), null, 2), "application/json"),
      "import-backup": () => importInput && importInput.click(),
      "clear": () => {
        if (!readEntries().length || !window.confirm("Remove every item from your cheat sheet? This cannot be undone.")) return;
        writeEntries([]);
        window.location.reload();
      }
    };
    document.querySelectorAll("[data-action]").forEach(button => button.addEventListener("click", () => actions[button.dataset.action]()));
    if (importInput) importInput.addEventListener("change", () => {
      if (importInput.files[0]) importBackup(importInput.files[0]);
      importInput.value = "";
    });
  };
  const entries = readEntries();
  updateCount(entries.length);
  if (entries.length) groupEntries(entries).forEach(page => content.append(renderPage(page)));
  else renderEmptyState();
  bindToolbar();
  const flashMessage = window.sessionStorage.getItem(flashMessageKey);
  if (flashMessage) {
    window.sessionStorage.removeItem(flashMessageKey);
    showMessage(flashMessage);
  }
})();
