# Cyber Epistemology V3
A free, practical cyber security knowledge base. Plain HTML, CSS and JavaScript: no build step, no frameworks and no online dependencies.
Live site: https://emaldos.github.io/Cyber-Epistemology/
## Quick start
1. Download the repository ZIP from GitHub, or clone it.
2. Open `index.html` in your browser. Everything works straight from disk.
To serve it locally instead:
```bash
git clone https://github.com/emaldos/Cyber-Epistemology.git
cd Cyber-Epistemology
python -m http.server 8080
```
Then open http://localhost:8080/
## What is inside
| Section | Page | Content |
| --- | --- | --- |
| Home | `index.html` | Site search, sections and platforms |
| System Files | `Data/System_Files_Info.html` | Cross platform quick map and links to each platform |
| Platforms | `Data/OS/*.html` | Windows 11, Windows Server, macOS, iOS, Android, Ubuntu Server, Kali Linux |
| Commands | `Data/Commands.html` | Same task in three shells |
| Shells | `Data/Commands/*.html` | Bash, PowerShell, CMD |
| Kali Tools | `Data/Kali_Tools.html` | Tools by assessment phase |
| Roadmap | `Data/cyber_roadmap.html` | Interactive certification roadmap |
| Websites | `Data/Cyber_Websites.html` | Checked links to labs, intel, sandboxes and knowledge bases |
| Awareness | `Data/Maximum_Security.html` | Personal security habits |
| About | `Data/About.html` | Mission, review process, contributing |
## New in V3
- Site wide search on every page (press `/` or `Ctrl K`), plus a filter on each page.
- One shared top bar, footer, design system and script instead of copies in every page.
- Automatic table of contents with scroll tracking, copy buttons, tables that stack on phones.
- All content reviewed and updated for November 2026.
- Images optimized: the background went from 1.4 MB to 42 KB.
## Project structure
```
index.html
Data/                 pages
  Commands/           Bash, PowerShell, CMD
  OS/                 one page per platform
Assets/
  Style/Site.css      shared design system
  Style/Roadmap.css   roadmap only styles
  Script/Site.js      top bar, footer, search, filter, table of contents, copy buttons
  Script/SearchIndex.js   generated search index
  Script/Roadmap.js, RoadmapData.js
  Icon/               local icons
  Image/              logo, favicon, background
Tools/
  BuildSearchIndex.py rebuilds Assets/Script/SearchIndex.js
  CheckSite.py        checks links, anchors, classes and code style
```
## Editing content
1. Copy the structure of an existing page in `Data/`. Every page sets `data-root` (path back to the root) and `data-section` (which top bar item is active) on `<body>`.
2. Use only the components in `Assets/Style/Site.css`: `panel`, `data-table`, `tag`, `callout`, `checklist`, `steps`, `disclosure`, `card-grid`, `definition-grid`. Put commands in `<code class="copy">` to get a copy button.
3. To add a top bar item, edit `navigationItems` in `Assets/Script/Site.js`.
4. Rebuild the search index and run the checks:
```bash
python Tools/BuildSearchIndex.py
python Tools/CheckSite.py
```
## Code style
No blank lines, no comments, one CSS rule per line, HTML, CSS and JS in separate files, local assets only, and no em dash or en dash characters.
## License
GNU General Public License v3.0. See `LICENSE`.
