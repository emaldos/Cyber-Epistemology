import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
siteRoot = Path(__file__).resolve().parent.parent
textExtensions = {".html", ".css", ".js", ".py", ".md", ".json", ".svg"}
forbiddenDashes = re.compile("[\u2013\u2014]")
runtimeClasses = {"is-active", "is-hidden", "is-scrolled", "is-menu-open", "is-search-open", "is-selected", "is-copied", "is-visible", "is-stackable", "is-single", "toc", "toc-title", "toc-link", "code-cell", "code-block", "copy-button", "copy"}
class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.identifiers = []
        self.references = []
        self.classes = set()
        self.problems = []
        self.inlineScript = False
        self.bodyRoot = None
        self.hasTopbar = False
        self.hasFooter = False
        self.stylesheets = []
        self.scripts = []
    def handle_starttag(self, tag, attributes):
        attributeMap = dict(attributes)
        position = self.getpos()[0]
        if "id" in attributeMap:
            self.identifiers.append(attributeMap["id"])
        for className in (attributeMap.get("class") or "").split():
            self.classes.add((className, position))
        for name, value in attributes:
            if name == "style":
                self.problems.append(f"line {position}: inline style attribute")
            if name.startswith("on"):
                self.problems.append(f"line {position}: inline event handler {name}")
            if name in ("href", "src") and value:
                self.references.append((tag, value, position))
        if tag == "style":
            self.problems.append(f"line {position}: inline <style> block")
        if tag == "script":
            if "src" not in attributeMap:
                self.inlineScript = True
                self.problems.append(f"line {position}: inline <script> block")
            else:
                self.scripts.append(attributeMap["src"])
        if tag == "link" and attributeMap.get("rel") == "stylesheet":
            self.stylesheets.append(attributeMap.get("href", ""))
        if tag == "img" and "alt" not in attributeMap:
            self.problems.append(f"line {position}: <img> without alt")
        if tag == "body":
            self.bodyRoot = attributeMap.get("data-root")
            if "data-section" not in attributeMap:
                self.problems.append(f"line {position}: <body> missing data-section")
        if attributeMap.get("id") == "site-topbar":
            self.hasTopbar = True
        if attributeMap.get("id") == "site-footer":
            self.hasFooter = True
    def handle_comment(self, data):
        self.problems.append(f"line {self.getpos()[0]}: HTML comment")
def collectCssClasses():
    classes = set(runtimeClasses)
    for stylesheet in (siteRoot / "Assets" / "Style").glob("*.css"):
        classes.update(re.findall(r"\.([a-zA-Z][\w-]*)", re.sub(r"url\([^)]*\)", "", stylesheet.read_text(encoding="utf-8"))))
    for script in (siteRoot / "Assets" / "Script").glob("*.js"):
        if script.name == "SearchIndex.js":
            continue
        source = script.read_text(encoding="utf-8")
        for literal in re.findall(r"className\s*[:=]\s*\"([^\"]+)\"", source) + re.findall(r"classList\.(?:add|toggle|remove)\(\"([^\"]+)\"", source):
            classes.update(literal.split())
    return classes
def collectIdentifiers(path, cache):
    if path not in cache:
        parser = PageParser()
        parser.feed(path.read_text(encoding="utf-8"))
        cache[path] = set(parser.identifiers)
    return cache[path]
def checkTextFile(path, problems):
    text = path.read_text(encoding="utf-8")
    lines = text.split("\n")
    for number, line in enumerate(lines, 1):
        if not line.strip() and number != len(lines):
            problems.append(f"line {number}: blank line")
        if forbiddenDashes.search(line):
            problems.append(f"line {number}: em dash or en dash")
    if path.suffix == ".css":
        if "/*" in text:
            problems.append("CSS comment")
        for number, line in enumerate(lines, 1):
            if line.rstrip().endswith("{") and not line.lstrip().startswith("@media"):
                problems.append(f"line {number}: CSS rule split over several lines")
    if path.suffix == ".js" and path.name != "SearchIndex.js":
        for number, line in enumerate(lines, 1):
            stripped = line.strip()
            if stripped.startswith("//") or stripped.startswith("/*") or re.search(r"[;{})]\s*//", line):
                problems.append(f"line {number}: JavaScript comment")
    if path.suffix == ".py":
        for number, line in enumerate(lines, 1):
            if line.strip().startswith("#"):
                problems.append(f"line {number}: Python comment")
def checkHtmlFile(path, problems, cssClasses, identifierCache):
    parser = PageParser()
    parser.feed(path.read_text(encoding="utf-8"))
    problems.extend(parser.problems)
    expectedRoot = "../" * (len(path.relative_to(siteRoot).parts) - 1)
    if parser.bodyRoot != expectedRoot:
        problems.append(f"<body data-root> is {parser.bodyRoot!r}, expected {expectedRoot!r}")
    if not parser.hasTopbar or not parser.hasFooter:
        problems.append("missing #site-topbar or #site-footer placeholder")
    if expectedRoot + "Assets/Style/Site.css" not in parser.stylesheets:
        problems.append("missing Site.css stylesheet link")
    if expectedRoot + "Assets/Script/Site.js" not in parser.scripts:
        problems.append("missing Site.js script")
    duplicates = sorted({identifier for identifier in parser.identifiers if parser.identifiers.count(identifier) > 1})
    if duplicates:
        problems.append(f"duplicate ids: {duplicates}")
    for className, position in sorted(parser.classes):
        if className not in cssClasses:
            problems.append(f"line {position}: class '{className}' is not defined in Assets/Style")
    ownIdentifiers = set(parser.identifiers)
    for tag, reference, position in parser.references:
        parsed = urlparse(reference)
        if parsed.scheme in ("http", "https"):
            if tag in ("script", "link", "img"):
                problems.append(f"line {position}: remote dependency {reference}")
            continue
        if parsed.scheme in ("mailto", "tel", "data", "javascript"):
            continue
        if reference.startswith("#"):
            if reference[1:] and reference[1:] not in ownIdentifiers:
                problems.append(f"line {position}: missing anchor {reference}")
            continue
        target = (path.parent / parsed.path).resolve()
        if not target.exists():
            problems.append(f"line {position}: broken link {reference}")
            continue
        if target.name not in [child.name for child in target.parent.iterdir()]:
            problems.append(f"line {position}: letter case mismatch {reference}")
        if parsed.fragment and target.suffix == ".html" and parsed.fragment not in collectIdentifiers(target, identifierCache):
            problems.append(f"line {position}: missing anchor {reference}")
def main():
    targets = [Path(argument).resolve() for argument in sys.argv[1:]] or [siteRoot]
    files = []
    for target in targets:
        files.extend([target] if target.is_file() else [path for path in target.rglob("*") if path.is_file() and ".git" not in path.parts])
    cssClasses = collectCssClasses()
    identifierCache = {}
    totalProblems = 0
    for path in sorted(files):
        if path.suffix not in textExtensions:
            continue
        problems = []
        checkTextFile(path, problems)
        if path.suffix == ".html":
            checkHtmlFile(path, problems, cssClasses, identifierCache)
        if problems:
            totalProblems += len(problems)
            print(path.relative_to(siteRoot).as_posix())
            for problem in problems:
                print("  " + problem)
    print(f"{totalProblems} problems in {len(files)} files")
    sys.exit(1 if totalProblems else 0)
if __name__ == "__main__":
    main()
