(() => {
  "use strict";
  const millisecondsPerDay = 86400000;
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const kindLabels = { study: "Study", review: "Review and buffer", exam: "Exam prep" };
  const parseIsoDate = text => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(text || ""));
    if (!match) return null;
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    return date.getUTCMonth() === Number(match[2]) - 1 && date.getUTCDate() === Number(match[3]) ? date : null;
  };
  const formatIsoDate = date => date.toISOString().slice(0, 10);
  const addDays = (date, days) => new Date(date.getTime() + days * millisecondsPerDay);
  const toMonday = date => addDays(date, -((date.getUTCDay() + 6) % 7));
  const nextMonday = today => addDays(today, (8 - today.getUTCDay()) % 7);
  const formatDisplayDate = isoDate => {
    const date = parseIsoDate(isoDate);
    return date ? date.getUTCDate() + " " + monthNames[date.getUTCMonth()] + " " + date.getUTCFullYear() : "";
  };
  const uniqueBy = (items, keyOf) => {
    const seen = new Set();
    return items.filter(item => {
      const key = keyOf(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  const uniqueSitePages = items => uniqueBy(items, item => item.path);
  const uniqueLinks = items => uniqueBy(items, item => item.label + "|" + item.url);
  const selectModules = (field, levelId) => field.modules.filter(module => levelId === "beginner" || module.level !== "beginner");
  const planSlots = (modules, hoursPerWeek, reviewEveryWeeks) => {
    const slots = [];
    let currentWeek = null;
    let studyWeeksSinceBreak = 0;
    let breakStartIndex = 0;
    const pushBreak = slot => {
      slots.push(slot);
      studyWeeksSinceBreak = 0;
      breakStartIndex = slots.length;
    };
    const closeStudyWeek = skipReview => {
      if (!currentWeek || !currentWeek.segments.length) return;
      slots.push(currentWeek);
      currentWeek = null;
      studyWeeksSinceBreak += 1;
      if (!skipReview && studyWeeksSinceBreak >= reviewEveryWeeks) pushBreak({ kind: "review", fromIndex: breakStartIndex, toIndex: slots.length - 1 });
    };
    modules.forEach((module, moduleIndex) => {
      const hasCertification = Boolean(module.milestone && module.milestone.certification);
      let remainingHours = module.baseHours;
      while (remainingHours > 0) {
        if (!currentWeek) currentWeek = { kind: "study", segments: [], hours: 0 };
        const takenHours = Math.min(hoursPerWeek - currentWeek.hours, remainingHours);
        currentWeek.segments.push({ moduleIndex, hours: takenHours });
        currentWeek.hours += takenHours;
        remainingHours -= takenHours;
        if (currentWeek.hours >= hoursPerWeek) closeStudyWeek(remainingHours === 0 && hasCertification);
      }
      if (hasCertification) {
        closeStudyWeek(true);
        pushBreak({ kind: "exam", moduleIndex });
      }
    });
    closeStudyWeek(true);
    return slots;
  };
  const sliceActivities = (activities, partIndex, partCount) => {
    if (!activities.length) return [];
    const from = Math.floor(partIndex * activities.length / partCount);
    const to = Math.floor((partIndex + 1) * activities.length / partCount);
    return to > from ? activities.slice(from, to) : [activities[Math.min(from, activities.length - 1)]];
  };
  const buildSchedule = options => {
    const { field, levelId, hoursPerWeek, startDate, reviewEveryWeeks = 7 } = options;
    const modules = selectModules(field, levelId);
    const slots = planSlots(modules, hoursPerWeek, reviewEveryWeeks);
    const partCounts = new Map();
    const firstSlotByModule = new Map();
    const lastSlotByModule = new Map();
    slots.forEach((slot, slotIndex) => (slot.segments || []).forEach(segment => {
      partCounts.set(segment.moduleIndex, (partCounts.get(segment.moduleIndex) || 0) + 1);
      if (!firstSlotByModule.has(segment.moduleIndex)) firstSlotByModule.set(segment.moduleIndex, slotIndex);
      lastSlotByModule.set(segment.moduleIndex, slotIndex);
    }));
    const examSlotByModule = new Map(slots.map((slot, slotIndex) => [slot, slotIndex]).filter(([slot]) => slot.kind === "exam").map(([slot, slotIndex]) => [slot.moduleIndex, slotIndex]));
    const partsSeen = new Map();
    const firstMonday = toMonday(startDate);
    const weeks = slots.map((slot, slotIndex) => {
      const weekStart = addDays(firstMonday, slotIndex * 7);
      const week = { number: slotIndex + 1, startDate: formatIsoDate(weekStart), endDate: formatIsoDate(addDays(weekStart, 6)), kind: slot.kind, topic: "", activities: [], sitePages: [], studyFrom: [], practiceOn: [], hours: hoursPerWeek, milestones: [] };
      if (slot.kind === "study") {
        const topics = [];
        slot.segments.forEach(segment => {
          const module = modules[segment.moduleIndex];
          const partCount = partCounts.get(segment.moduleIndex);
          const partIndex = partsSeen.get(segment.moduleIndex) || 0;
          partsSeen.set(segment.moduleIndex, partIndex + 1);
          topics.push(partCount > 1 ? module.title + " (part " + (partIndex + 1) + " of " + partCount + ")" : module.title);
          week.activities.push(...sliceActivities(module.activities, partIndex, partCount));
          week.sitePages.push(...module.sitePages);
          week.studyFrom.push(...module.studyFrom);
          week.practiceOn.push(...module.practiceOn);
          if (module.milestone && partIndex === 0) {
            const examSlotIndex = examSlotByModule.get(segment.moduleIndex);
            week.milestones.push(examSlotIndex === undefined ? module.milestone.text : module.milestone.text + " for week " + (examSlotIndex + 1));
          }
        });
        week.topic = topics.join(" + ");
        week.hours = slot.hours;
      }
      if (slot.kind === "review") {
        const reviewedModules = [...new Set(slots.slice(slot.fromIndex, slot.toIndex + 1).flatMap(reviewed => (reviewed.segments || []).map(segment => segment.moduleIndex)))].map(moduleIndex => modules[moduleIndex]);
        week.topic = "Review and buffer week";
        week.activities = ["Review: reread your notes from weeks " + (slot.fromIndex + 1) + " to " + (slot.toIndex + 1) + " and update your cheat sheet", "Practice lab: redo the hardest lab of the last weeks without hints", "Catch up on anything you did not finish, or rest"];
        week.sitePages = reviewedModules.flatMap(module => module.sitePages);
        week.practiceOn = reviewedModules.flatMap(module => module.practiceOn);
      }
      if (slot.kind === "exam") {
        const module = modules[slot.moduleIndex];
        week.topic = "Exam prep: " + module.milestone.certification;
        week.activities = ["Review: take timed practice exams and fix every weak objective", "Practice lab: repeat the hardest labs from this block under time pressure", "Check the exam rules, ID requirements and your test setup"];
        week.sitePages = module.sitePages.slice();
        week.studyFrom = module.studyFrom.slice();
        week.practiceOn = module.practiceOn.slice();
        week.milestones.push("Sit the " + module.milestone.certification + " exam at the end of this week");
      }
      week.sitePages = uniqueSitePages(week.sitePages).slice(0, 5);
      week.studyFrom = uniqueLinks(week.studyFrom).slice(0, 5);
      week.practiceOn = uniqueLinks(week.practiceOn).slice(0, 5);
      return week;
    });
    const totalHours = weeks.reduce((sum, week) => sum + week.hours, 0);
    const milestones = weeks.flatMap(week => week.milestones.map(text => ({ week: week.number, endDate: week.endDate, text })));
    return { fieldId: field.id, fieldName: field.name, levelId, hoursPerWeek, startDate: weeks.length ? weeks[0].startDate : formatIsoDate(firstMonday), endDate: weeks.length ? weeks[weeks.length - 1].endDate : formatIsoDate(firstMonday), totalHours, weeks, milestones };
  };
  const describeSitePage = (page, resolveSitePath) => page.label + " (" + resolveSitePath(page.path) + ")";
  const describeLink = link => link.label + " (" + link.url + ")";
  const describePractice = link => "[" + link.kind + "] " + describeLink(link);
  const escapeCsvCell = value => {
    let text = String(value === undefined || value === null ? "" : value);
    if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
    return "\"" + text.replace(/"/g, "\"\"") + "\"";
  };
  const buildCsv = (plan, options = {}) => {
    const resolveSitePath = options.resolveSitePath || (path => path);
    const doneWeeks = new Set(options.doneWeeks || []);
    const header = ["Week", "Start", "End", "Type", "Topic", "What to do", "Site pages", "Study from", "Practice on", "Hours", "Milestones", "Done"];
    const rows = plan.weeks.map(week => [week.number, week.startDate, week.endDate, kindLabels[week.kind], week.topic, week.activities.join("\n"), week.sitePages.map(page => describeSitePage(page, resolveSitePath)).join("\n"), week.studyFrom.map(describeLink).join("\n"), week.practiceOn.map(describePractice).join("\n"), week.hours, week.milestones.join("\n"), doneWeeks.has(week.number) ? "Yes" : "No"]);
    return "\uFEFF" + [header, ...rows].map(row => row.map(escapeCsvCell).join(",")).join("\r\n") + "\r\n";
  };
  const escapeMarkdownCell = value => String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
  const escapeMarkdownLabel = value => String(value).replace(/([\\[\]])/g, "\\$1");
  const markdownLink = (label, target) => "[" + escapeMarkdownLabel(label) + "](" + String(target).replace(/\s/g, "%20").replace(/\)/g, "%29") + ")";
  const buildMarkdown = (plan, options = {}) => {
    const resolveSitePath = options.resolveSitePath || (path => path);
    const doneWeeks = new Set(options.doneWeeks || []);
    const lines = ["# Study plan: " + plan.fieldName, "", "- Level: " + (options.levelLabel || plan.levelId), "- Hours per week: " + plan.hoursPerWeek, "- Dates: " + plan.startDate + " to " + plan.endDate + " (" + plan.weeks.length + " weeks, " + plan.totalHours + " hours)", ""];
    if (plan.milestones.length) lines.push("## Milestones", "", ...plan.milestones.map(milestone => "- Week " + milestone.week + ": " + milestone.text), "");
    lines.push("## Schedule", "", "| Done | Week | Dates | Topic | What to do | Site pages | Study from | Practice on | Hours | Milestones |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");
    plan.weeks.forEach(week => {
      const cells = [doneWeeks.has(week.number) ? "Yes" : "", week.number + (week.kind === "study" ? "" : " (" + kindLabels[week.kind] + ")"), week.startDate + " to " + week.endDate, escapeMarkdownCell(week.topic), escapeMarkdownCell(week.activities.join("\n")), escapeMarkdownCell(week.sitePages.map(page => markdownLink(page.label, resolveSitePath(page.path))).join("\n")), escapeMarkdownCell(week.studyFrom.map(link => markdownLink(link.label, link.url)).join("\n")), escapeMarkdownCell(week.practiceOn.map(link => link.kind + ": " + markdownLink(link.label, link.url)).join("\n")), week.hours, escapeMarkdownCell(week.milestones.join("\n"))];
      lines.push("| " + cells.join(" | ") + " |");
    });
    return lines.join("\n") + "\n";
  };
  const escapeIcsText = value => String(value).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  const utf8Length = character => {
    const codePoint = character.codePointAt(0);
    if (codePoint < 0x80) return 1;
    if (codePoint < 0x800) return 2;
    return codePoint < 0x10000 ? 3 : 4;
  };
  const foldIcsLine = line => {
    const parts = [];
    let current = "";
    let currentLength = 0;
    let limit = 75;
    for (const token of line.match(/\\.|[\s\S]/gu) || []) {
      const tokenLength = [...token].reduce((sum, part) => sum + utf8Length(part), 0);
      if (currentLength + tokenLength > limit) {
        parts.push(current);
        current = "";
        currentLength = 0;
        limit = 74;
      }
      current += token;
      currentLength += tokenLength;
    }
    parts.push(current);
    return parts.join("\r\n ");
  };
  const compactDate = isoDate => isoDate.replace(/-/g, "");
  const formatIcsTimestamp = date => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const buildIcs = (plan, options = {}) => {
    const resolveSitePath = options.resolveSitePath || (path => path);
    const timestamp = formatIcsTimestamp(options.now || new Date());
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Cyber Epistemology//Study Planner//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:" + escapeIcsText("Study plan: " + plan.fieldName)];
    plan.weeks.forEach(week => {
      const description = [...week.activities, "Hours: " + week.hours];
      if (week.sitePages.length) description.push("Site pages: " + week.sitePages.map(page => describeSitePage(page, resolveSitePath)).join(", "));
      if (week.studyFrom.length) description.push("Study from: " + week.studyFrom.map(describeLink).join(", "));
      if (week.practiceOn.length) description.push("Practice on: " + week.practiceOn.map(describePractice).join(", "));
      if (week.milestones.length) description.push("Milestones: " + week.milestones.join(", "));
      lines.push("BEGIN:VEVENT", "UID:" + plan.fieldId + "-" + compactDate(plan.startDate) + "-week-" + week.number + "@study-planner.cyber-epistemology", "DTSTAMP:" + timestamp, "DTSTART;VALUE=DATE:" + compactDate(week.startDate), "DTEND;VALUE=DATE:" + compactDate(formatIsoDate(addDays(parseIsoDate(week.endDate), 1))), "SUMMARY:" + escapeIcsText("Week " + week.number + ": " + week.topic), "DESCRIPTION:" + escapeIcsText(description.join("\n")), "TRANSP:TRANSPARENT", "END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    return lines.map(foldIcsLine).join("\r\n") + "\r\n";
  };
  window.studyPlanner = Object.freeze({ parseIsoDate, formatIsoDate, toMonday, nextMonday, buildSchedule, buildCsv, buildMarkdown, buildIcs, foldIcsLine, escapeIcsText, escapeCsvCell });
  const data = window.studyPlanData;
  const form = document.querySelector("[data-study-form]");
  if (!data || !form) return;
  const rootPath = document.body.dataset.root || "";
  const storageKey = data.storageKey || "cyberEpistemology.studyPlan";
  const fieldSelect = form.querySelector("[data-study-field]");
  const levelSelect = form.querySelector("[data-study-level]");
  const hoursSelect = form.querySelector("[data-study-hours]");
  const startInput = form.querySelector("[data-study-start]");
  const fieldSummary = document.querySelector("[data-study-field-summary]");
  const summary = document.querySelector("[data-study-summary]");
  const tableBody = document.querySelector("[data-study-body]");
  const progressBar = document.querySelector("[data-study-progress]");
  const progressText = document.querySelector("[data-study-progress-text]");
  const statusMessage = document.querySelector("[data-study-status]");
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
  const createExternalLink = link => createElement("a", { href: link.url, target: "_blank", rel: "noopener noreferrer", text: link.label });
  const createList = items => createElement("ul", { className: "study-list" }, items.map(item => createElement("li", {}, [item])));
  const todayUtc = () => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  };
  const findField = fieldId => data.fields.find(field => field.id === fieldId);
  const findLevel = levelId => data.levels.find(level => level.id === levelId);
  const defaultSettings = () => ({ fieldId: data.fields[0].id, levelId: data.levels[0].id, hoursPerWeek: data.defaultHoursPerWeek, startDate: formatIsoDate(nextMonday(todayUtc())) });
  const normalizeSettings = candidate => {
    const fallback = defaultSettings();
    const startDate = parseIsoDate(candidate && candidate.startDate);
    const hoursPerWeek = Number(candidate && candidate.hoursPerWeek);
    return {
      fieldId: candidate && findField(candidate.fieldId) ? candidate.fieldId : fallback.fieldId,
      levelId: candidate && findLevel(candidate.levelId) ? candidate.levelId : fallback.levelId,
      hoursPerWeek: data.hoursPerWeekOptions.includes(hoursPerWeek) ? hoursPerWeek : fallback.hoursPerWeek,
      startDate: startDate ? formatIsoDate(toMonday(startDate)) : fallback.startDate
    };
  };
  const readStoredPlan = () => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(storageKey) || "null");
      if (!stored || typeof stored !== "object") return null;
      return { settings: normalizeSettings(stored), doneWeeks: Array.isArray(stored.doneWeeks) ? stored.doneWeeks.filter(Number.isInteger) : [] };
    } catch (error) {
      return null;
    }
  };
  const storedPlan = readStoredPlan();
  const state = { settings: storedPlan ? storedPlan.settings : defaultSettings(), doneWeeks: new Set(storedPlan ? storedPlan.doneWeeks : []), plan: null, hasRendered: false };
  const savePlan = () => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ ...state.settings, doneWeeks: [...state.doneWeeks].sort((first, second) => first - second), savedAt: new Date().toISOString() }));
      return true;
    } catch (error) {
      return false;
    }
  };
  const announce = text => {
    if (!statusMessage) return;
    statusMessage.textContent = text;
    statusMessage.hidden = !text;
  };
  const sameSettings = (first, second) => ["fieldId", "levelId", "hoursPerWeek", "startDate"].every(key => first[key] === second[key]);
  const fillSelect = (select, options) => {
    select.replaceChildren(...options.map(option => createElement("option", { value: String(option.value), text: option.label })));
  };
  const populateForm = () => {
    fillSelect(fieldSelect, data.fields.map(field => ({ value: field.id, label: field.name })));
    fillSelect(levelSelect, data.levels.map(level => ({ value: level.id, label: level.label })));
    fillSelect(hoursSelect, data.hoursPerWeekOptions.map(hours => ({ value: hours, label: hours + " hours" })));
  };
  const updateFieldSummary = () => {
    if (!fieldSummary) return;
    const field = findField(fieldSelect.value);
    const level = findLevel(levelSelect.value);
    fieldSummary.textContent = field ? field.summary + " Roadmap track: " + field.roadmapTrack + "." + (level ? " " + level.description : "") : "";
  };
  const writeFormValues = () => {
    fieldSelect.value = state.settings.fieldId;
    levelSelect.value = state.settings.levelId;
    hoursSelect.value = String(state.settings.hoursPerWeek);
    startInput.value = state.settings.startDate;
    updateFieldSummary();
  };
  const createDefinition = (term, value) => createElement("div", { className: "definition" }, [createElement("span", { className: "definition-term", text: term }), createElement("span", { className: "definition-text", text: value })]);
  const renderSummary = () => {
    if (!summary) return;
    const plan = state.plan;
    const level = findLevel(state.settings.levelId);
    const grid = createElement("div", { className: "definition-grid study-summary-grid" }, [createDefinition("Total weeks", String(plan.weeks.length)), createDefinition("Total hours", plan.totalHours + " hours at " + plan.hoursPerWeek + " per week"), createDefinition("Dates", formatDisplayDate(plan.startDate) + " to " + formatDisplayDate(plan.endDate)), createDefinition("Field and level", plan.fieldName + ", " + (level ? level.label : plan.levelId))]);
    const milestoneList = plan.milestones.length ? createElement("ul", { className: "study-milestones" }, plan.milestones.map(milestone => createElement("li", {}, [createElement("strong", { text: "Week " + milestone.week + ": " }), milestone.text]))) : createElement("p", { text: "No certification milestones in this plan." });
    summary.replaceChildren(grid, createElement("h3", { text: "Milestones" }), milestoneList);
  };
  const updateProgress = () => {
    const total = state.plan.weeks.length;
    const done = state.plan.weeks.filter(week => state.doneWeeks.has(week.number)).length;
    const percent = total ? Math.round(done / total * 100) : 0;
    if (progressBar) {
      progressBar.max = total || 1;
      progressBar.value = done;
    }
    if (progressText) progressText.textContent = done + " of " + total + " weeks done (" + percent + " percent)";
  };
  const createPracticeItem = link => createElement("span", { className: "study-practice-item" }, [createElement("span", { className: link.kind === "CTF" ? "tag" : "tag tag-neutral", text: link.kind }), createExternalLink(link)]);
  const createCell = (label, children, className) => createElement("td", className ? { "data-label": label, className } : { "data-label": label }, children);
  const createRow = week => {
    const isDone = state.doneWeeks.has(week.number);
    const checkbox = createElement("input", { type: "checkbox", "data-week": String(week.number), "aria-label": "Week " + week.number + " done" });
    checkbox.checked = isDone;
    const weekLabel = [createElement("span", { text: "Week " + week.number })];
    if (week.kind !== "study") weekLabel.push(createElement("span", { className: week.kind === "exam" ? "tag tag-medium" : "tag tag-low", text: kindLabels[week.kind] }));
    const dates = [createElement("time", { datetime: week.startDate, text: formatDisplayDate(week.startDate) }), " to ", createElement("time", { datetime: week.endDate, text: formatDisplayDate(week.endDate) })];
    const row = createElement("tr", { className: "study-week-" + week.kind + (isDone ? " study-week-done" : "") }, [
      createCell("Week", [createElement("span", { className: "study-week-label" }, weekLabel)]),
      createCell("Dates", dates, "study-dates"),
      createCell("Topic", [week.topic], "study-topic"),
      createCell("What to do", [createList(week.activities)], "study-activities"),
      createCell("Site pages", [createList(week.sitePages.map(page => createElement("a", { href: rootPath + page.path, text: page.label })))]),
      createCell("Study from", [createList(week.studyFrom.map(createExternalLink))]),
      createCell("Practice on", [createList(week.practiceOn.map(createPracticeItem))]),
      createCell("Hours", [String(week.hours)]),
      createCell("Milestones", week.milestones.length ? [createList(week.milestones.map(text => createElement("strong", { text })))] : []),
      createCell("Done", [createElement("label", { className: "study-done" }, [checkbox, createElement("span", { text: "Done" })])])
    ]);
    return row;
  };
  const pageFilterInput = document.querySelector("[data-page-filter]");
  const correctPageFilterCount = () => {
    const counter = document.querySelector("[data-page-filter-count]");
    if (!counter) return;
    const total = document.querySelectorAll(".content .data-table tbody tr, .content .disclosure, .content .card, .content .definition, .content .checklist li").length;
    counter.textContent = counter.textContent.replace(/^(\d+ of )\d+$/, "$1" + total).replace(/^\d+( items)$/, total + "$1");
  };
  const syncPageFilter = () => {
    if (!pageFilterInput || !state.hasRendered) return;
    pageFilterInput.dispatchEvent(new Event("input"));
    correctPageFilterCount();
  };
  if (pageFilterInput) ["input", "keydown"].forEach(eventName => pageFilterInput.addEventListener(eventName, () => window.setTimeout(correctPageFilterCount)));
  const renderPlan = () => {
    const field = findField(state.settings.fieldId);
    state.plan = buildSchedule({ field, levelId: state.settings.levelId, hoursPerWeek: state.settings.hoursPerWeek, startDate: parseIsoDate(state.settings.startDate), reviewEveryWeeks: data.reviewEveryWeeks });
    const weekNumbers = new Set(state.plan.weeks.map(week => week.number));
    state.doneWeeks = new Set([...state.doneWeeks].filter(number => weekNumbers.has(number)));
    renderSummary();
    tableBody.replaceChildren(...state.plan.weeks.map(createRow));
    updateProgress();
    syncPageFilter();
    state.hasRendered = true;
  };
  const readFormSettings = () => ({ fieldId: fieldSelect.value, levelId: levelSelect.value, hoursPerWeek: Number(hoursSelect.value), startDate: startInput.value });
  const resolveSitePath = path => {
    try {
      return new URL(rootPath + path, document.baseURI).href;
    } catch (error) {
      return path;
    }
  };
  const downloadFile = (fileName, text, mimeType) => {
    const link = createElement("a", { href: URL.createObjectURL(new Blob([text], { type: mimeType })), download: fileName });
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };
  const exportOptions = () => ({ resolveSitePath, doneWeeks: [...state.doneWeeks], levelLabel: (findLevel(state.settings.levelId) || {}).label });
  const fileBaseName = () => "Study_Plan_" + state.plan.fieldId.replace(/[^a-z0-9]+/gi, "_") + "_" + state.plan.startDate;
  const actions = {
    "export-csv": () => {
      downloadFile(fileBaseName() + ".csv", buildCsv(state.plan, exportOptions()), "text/csv;charset=utf-8");
      announce("CSV file downloaded.");
    },
    "export-markdown": () => {
      downloadFile(fileBaseName() + ".md", buildMarkdown(state.plan, exportOptions()), "text/markdown;charset=utf-8");
      announce("Markdown file downloaded.");
    },
    "export-ics": () => {
      downloadFile(fileBaseName() + ".ics", buildIcs(state.plan, exportOptions()), "text/calendar;charset=utf-8");
      announce("Calendar file downloaded with " + state.plan.weeks.length + " weekly events.");
    },
    print: () => window.print(),
    "clear-done": () => {
      state.doneWeeks.clear();
      tableBody.querySelectorAll("input[data-week]").forEach(checkbox => {
        checkbox.checked = false;
        checkbox.closest("tr").classList.remove("study-week-done");
      });
      updateProgress();
      announce(savePlan() ? "All done marks cleared." : "Done marks cleared, but this browser could not save the change.");
    }
  };
  form.addEventListener("submit", event => {
    event.preventDefault();
    const requested = readFormSettings();
    if (!parseIsoDate(requested.startDate)) {
      announce("Choose a valid start date.");
      startInput.focus();
      return;
    }
    const settings = normalizeSettings(requested);
    const settingsChanged = !sameSettings(settings, state.settings);
    if (settingsChanged) state.doneWeeks.clear();
    state.settings = settings;
    startInput.value = settings.startDate;
    renderPlan();
    const isSaved = savePlan();
    const parts = ["Plan generated: " + state.plan.weeks.length + " weeks, " + state.plan.totalHours + " hours, ending " + formatDisplayDate(state.plan.endDate) + "."];
    if (settings.startDate !== requested.startDate) parts.push("The start date was moved to Monday " + formatDisplayDate(settings.startDate) + ".");
    if (settingsChanged) parts.push("Done marks were reset for the new plan.");
    if (!isSaved) parts.push("This browser could not save the plan.");
    announce(parts.join(" "));
  });
  fieldSelect.addEventListener("change", updateFieldSummary);
  levelSelect.addEventListener("change", updateFieldSummary);
  tableBody.addEventListener("change", event => {
    const checkbox = event.target.closest("input[data-week]");
    if (!checkbox) return;
    const weekNumber = Number(checkbox.dataset.week);
    if (checkbox.checked) state.doneWeeks.add(weekNumber);
    else state.doneWeeks.delete(weekNumber);
    checkbox.closest("tr").classList.toggle("study-week-done", checkbox.checked);
    updateProgress();
    const isSaved = savePlan();
    announce("Week " + weekNumber + (checkbox.checked ? " marked as done." : " marked as not done.") + (isSaved ? "" : " This browser could not save the change."));
  });
  document.querySelectorAll("[data-study-action]").forEach(button => button.addEventListener("click", () => {
    const action = actions[button.dataset.studyAction];
    if (action) action();
  }));
  populateForm();
  writeFormValues();
  renderPlan();
  if (storedPlan) announce("Restored your saved plan.");
})();
