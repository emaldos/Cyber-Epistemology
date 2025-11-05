# Cyber-Epistemology

A minimalist, dark-themed static site that organizes practical cyber/IT knowledge into quick, focused pages. Pure HTML/CSS, no build step, no frameworks.

## Quick Start

**Windows (recommended)**

1. Download the ZIP from GitHub.
2. Unzip it anywhere.
3. Double-click `Home.html`.

**macOS / Linux (or optional local server)**

```bash
git clone https://github.com/emaldos/Cyber-Epistemology.git
cd Cyber-Epistemology
python -m http.server 8080
# Visit: http://localhost:8080/Home.html
```

## What’s Inside

* **Home**: entry page linking to the main knowledge areas.
* **Commands**: Bash, PowerShell, and Windows CMD quick references.
* **Operating Systems**: focused pages for common OS flavors (Windows/macOS/Linux/Android/iOS).
* **Kali Tools**: curated links and categories for Kali Linux tooling.
* **About**: short mission and back-to-Home.

## Project Structure

```
│   Home.html
│
├───Data
│   │   About.html
│   │   Commands.html
│   │   Kali Tools Start Page.html
│   │   Kali_Tools.html
│   │   System_Files_Info.html
│   │
│   ├───Commands
│   │       Bash.html
│   │       CMD.html
│   │       PS.html
│   │
│   └───OS
│           Android.html
│           IOS.html
│           Kali_Linux.html
│           macOS.html
│           Ubuntu_Server.html
│           Windows_11.html
│           Windows_Server.html
│
└───Image
        Android.png
        Bash.png
        CMD.png
        Command.png
        Commands.png
        Home.png
        IOS.png
        KaliLinux.png
        Logo.png
        MacOS.png
        Nav.png
        PS.png
        UbuntuServer.png
        Win11.png
        WinServer.png
```

## Key Pages (relative links)

* `Home.html`
* `Data/Commands.html`

  * `Data/Commands/Bash.html`
  * `Data/Commands/PS.html`
  * `Data/Commands/CMD.html`
* `Data/System_Files_Info.html`
* `Data/Kali Tools Start Page.html`
* `Data/Kali_Tools.html`
* `Data/OS/Windows_11.html`
* `Data/OS/Windows_Server.html`
* `Data/OS/macOS.html`
* `Data/OS/Ubuntu_Server.html`
* `Data/OS/Kali_Linux.html`
* `Data/OS/Android.html`
* `Data/OS/IOS.html`
* `Data/About.html`

## Design & Accessibility

* Dark mode by default; high-contrast text and large hit targets.
* Glassy UI elements with subtle blur; focus outlines for keyboard users.
* Responsive layout; works well on desktop and mobile.
* Lightweight: no JS required for core navigation.

## Conventions

* **Language**: English only.
* **Style**: keep pages short, scannable, and practical.
* **Assets**: icons live under `Image/`; reference with relative paths.
* **File names**: prefer consistent casing and underscores; avoid spaces where possible (e.g., consider renaming `Kali Tools Start Page.html` → `Kali_Tools_Start_Page.html` in a future commit).

## Contributing

* Keep content concise and actionable.
* Preserve the minimal, dark, glassy aesthetic.
* Avoid adding dependencies or build tools.
