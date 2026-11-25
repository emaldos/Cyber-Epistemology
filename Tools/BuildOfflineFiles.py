import hashlib
import json
from pathlib import Path
siteRoot = Path(__file__).resolve().parent.parent
outputPath = siteRoot / "Assets" / "Script" / "OfflineFiles.js"
cachedFolders = ["Data", "Assets"]
cachedRootFiles = ["index.html", "Manifest.webmanifest"]
skippedSuffixes = {".py", ".md"}
def collectFiles():
    files = [siteRoot / name for name in cachedRootFiles if (siteRoot / name).exists()]
    for folder in cachedFolders:
        files.extend(path for path in sorted((siteRoot / folder).rglob("*")) if path.is_file() and path.suffix not in skippedSuffixes and path != outputPath)
    return files
def main():
    files = collectFiles()
    digest = hashlib.sha256()
    for path in files:
        digest.update(path.relative_to(siteRoot).as_posix().encode("utf-8"))
        digest.update(path.read_bytes())
    relativePaths = [path.relative_to(siteRoot).as_posix() for path in files] + [outputPath.relative_to(siteRoot).as_posix()]
    payload = {"version": digest.hexdigest()[:12], "files": relativePaths}
    outputPath.write_text("self.offlineFiles = " + json.dumps(payload, separators=(",", ":")) + ";\n", encoding="utf-8", newline="\n")
    totalBytes = sum(path.stat().st_size for path in files)
    print(f"Listed {len(relativePaths)} files ({totalBytes // 1024} KB) for offline use, version {payload['version']}")
if __name__ == "__main__":
    main()
