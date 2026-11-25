import json
import re
from html.parser import HTMLParser
from pathlib import Path
siteRoot = Path(__file__).resolve().parent.parent
outputPath = siteRoot / "Assets" / "Script" / "SearchIndex.js"
roadmapDataPath = siteRoot / "Assets" / "Script" / "RoadmapData.js"
contextSeparator = " › "
def cleanText(text):
    return re.sub(r"\s+", " ", text or "").strip()
def shortenText(text, limit=220):
    text = cleanText(text)
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"
class PageIndexer(HTMLParser):
    captureTags = {"h1", "h2", "h3", "title", "summary", "p", "li", "td", "span", "div", "section", "details", "tr"}
    def __init__(self, pagePath):
        super().__init__(convert_charrefs=True)
        self.pagePath = pagePath
        self.entries = []
        self.pageTitle = ""
        self.documentTitle = ""
        self.description = ""
        self.eyebrow = ""
        self.sectionId = ""
        self.sectionTitle = ""
        self.sectionLead = ""
        self.captureStack = []
        self.rowCells = None
        self.cellText = None
        self.rowId = ""
        self.disclosure = None
        self.pendingDefinition = None
    def startCapture(self, kind, identifier=""):
        self.captureStack.append({"kind": kind, "text": [], "id": identifier})
    def handle_starttag(self, tag, attributes):
        attributeMap = dict(attributes)
        classes = (attributeMap.get("class") or "").split()
        identifier = attributeMap.get("id") or ""
        if tag == "meta" and attributeMap.get("name") == "description":
            self.description = attributeMap.get("content") or ""
        if tag == "title":
            self.startCapture("title")
        elif tag == "h1":
            self.startCapture("h1")
        elif tag == "section" and "panel" in classes and identifier:
            self.sectionId = identifier
            self.sectionTitle = ""
            self.sectionLead = ""
        elif tag == "h2" and "panel-title" in classes:
            self.startCapture("sectionTitle")
        elif tag == "h3" and self.sectionId:
            self.startCapture("h3", identifier)
        elif tag == "p" and "hero-eyebrow" in classes:
            self.startCapture("eyebrow")
        elif tag == "p" and "panel-lead" in classes and self.sectionId:
            self.startCapture("sectionLead")
        elif tag == "tr" and self.sectionId:
            self.rowCells = []
            self.rowId = identifier
        elif tag == "td" and self.rowCells is not None:
            self.cellText = []
        elif tag == "details" and "disclosure" in classes and self.sectionId:
            self.disclosure = {"id": identifier, "summary": "", "body": []}
        elif tag == "summary" and self.disclosure is not None:
            self.startCapture("summary")
        elif tag == "span" and "definition-term" in classes and self.sectionId:
            self.startCapture("definitionTerm", identifier)
        elif tag == "span" and "definition-text" in classes and self.sectionId:
            self.startCapture("definitionText")
        elif tag == "li" and self.sectionId and self.rowCells is None:
            self.startCapture("listItem", identifier)
    def handle_endtag(self, tag):
        endingKinds = {"title": {"title"}, "h1": {"h1"}, "h2": {"sectionTitle"}, "h3": {"h3"}, "p": {"eyebrow", "sectionLead"}, "summary": {"summary"}, "span": {"definitionTerm", "definitionText"}, "li": {"listItem"}}
        if tag in endingKinds and self.captureStack and self.captureStack[-1]["kind"] in endingKinds[tag]:
            capture = self.captureStack.pop()
            self.finishCapture(capture)
        if tag == "td" and self.cellText is not None and self.rowCells is not None:
            self.rowCells.append(cleanText("".join(self.cellText)))
            self.cellText = None
        elif tag == "tr" and self.rowCells is not None:
            if self.rowCells and self.rowCells[0]:
                self.addEntry(self.rowCells[0], " · ".join(cell for cell in self.rowCells[1:] if cell), self.rowId)
            self.rowCells = None
        elif tag == "details" and self.disclosure is not None:
            if self.disclosure["summary"]:
                self.addEntry(self.disclosure["summary"], " ".join(self.disclosure["body"]), self.disclosure["id"])
            self.disclosure = None
        elif tag == "section" and self.sectionId and not self.captureStack:
            if self.sectionTitle:
                self.entries.append([self.sectionTitle, self.pageTitle, self.pagePath + "#" + self.sectionId, shortenText(self.sectionLead)])
            self.sectionId = ""
    def handle_data(self, data):
        for capture in self.captureStack:
            capture["text"].append(data)
        if self.cellText is not None:
            self.cellText.append(data)
        if self.disclosure is not None and not (self.captureStack and self.captureStack[-1]["kind"] == "summary"):
            self.disclosure["body"].append(data)
    def finishCapture(self, capture):
        text = cleanText("".join(capture["text"]))
        kind = capture["kind"]
        if kind == "title":
            self.documentTitle = text
        elif kind == "h1" and not self.pageTitle:
            self.pageTitle = text
        elif kind == "eyebrow":
            self.eyebrow = text
        elif kind == "sectionTitle":
            self.sectionTitle = text
        elif kind == "sectionLead":
            self.sectionLead = text
        elif kind == "h3":
            self.addEntry(text, "", capture["id"])
        elif kind == "summary" and self.disclosure is not None:
            self.disclosure["summary"] = text
        elif kind == "definitionTerm":
            self.pendingDefinition = {"term": text, "id": capture["id"]}
        elif kind == "definitionText" and self.pendingDefinition:
            self.addEntry(self.pendingDefinition["term"], text, self.pendingDefinition["id"])
            self.pendingDefinition = None
        elif kind == "listItem" and self.disclosure is None and len(text) > 3:
            self.addEntry(shortenText(text, 110), "", capture["id"])
    def addEntry(self, title, text, identifier=""):
        title = cleanText(title)
        if not title:
            return
        context = self.pageTitle + (contextSeparator + self.sectionTitle if self.sectionTitle else "")
        anchor = identifier or self.sectionId
        self.entries.append([shortenText(title, 120), context, self.pagePath + ("#" + anchor if anchor else ""), shortenText(text)])
def indexPage(path):
    relativePath = path.relative_to(siteRoot).as_posix()
    indexer = PageIndexer(relativePath)
    indexer.feed(path.read_text(encoding="utf-8"))
    pageTitle = indexer.pageTitle or indexer.documentTitle
    pageEntry = [pageTitle, indexer.eyebrow or "Page", relativePath, shortenText(indexer.description)]
    return [pageEntry] + indexer.entries
def indexRoadmap():
    if not roadmapDataPath.exists():
        return []
    source = roadmapDataPath.read_text(encoding="utf-8")
    match = re.search(r"=\s*(\{.*\})\s*;?\s*$", source, re.S)
    if not match:
        return []
    data = json.loads(match.group(1))
    entries = []
    for role in data.get("roles", []):
        context = "Roadmap" + contextSeparator + "Career role" + contextSeparator + cleanText(role.get("category", ""))
        text = " · ".join(part for part in [role.get("seniority", ""), role.get("summary", "")] if part)
        entries.append([role["name"], context, "Data/cyber_roadmap.html?role=" + role["id"], shortenText(text)])
    for certification in data.get("certifications", []):
        context = "Roadmap" + contextSeparator + cleanText(certification.get("provider", ""))
        text = " · ".join(part for part in [certification.get("level", ""), certification.get("summary", "")] if part)
        entries.append([certification["name"], context, "Data/cyber_roadmap.html?cert=" + certification["id"], shortenText(text)])
    return entries
def main():
    pages = [siteRoot / "index.html"] + sorted((siteRoot / "Data").rglob("*.html"))
    entries = []
    for page in pages:
        entries.extend(indexPage(page))
    entries.extend(indexRoadmap())
    uniqueEntries = []
    seen = set()
    for entry in entries:
        key = (entry[0].lower(), entry[2])
        if key in seen:
            continue
        seen.add(key)
        uniqueEntries.append(entry)
    outputPath.write_text("window.siteSearchIndex = " + json.dumps(uniqueEntries, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8", newline="\n")
    print(f"Indexed {len(uniqueEntries)} entries from {len(pages)} pages into {outputPath.relative_to(siteRoot).as_posix()} ({outputPath.stat().st_size // 1024} KB)")
if __name__ == "__main__":
    main()
