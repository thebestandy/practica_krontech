# e-Scraps

E-Scraps is an Open-Source Intelligence data visualization platform designed to aggregate, analyze, and map connections between different entities in Romania, our ideal was to develop an platform that provides a libre, open source tool to help anyone with a computer systematically access Romanian news, legal sources, amongst others, as our attempt for transparency in an otherwise pretty obfuscated govt system.

The platform allows users to perform deep-dive searches on individuals and companies across multiple Romanian public databases, institutional registries, and media outlets. The results are streamed in real-time via WebSockets and can be visually mapped onto an interactive node type graph to uncover relationships between entities.

![UI Preview](demo.png)

## Features

*   **Real-time Scraping Engine:** Utilizes a robust Python/FastAPI backend with WebSocket integration to stream scraping progress and results directly to the client.
*   **Interactive Node Graph:** Send search results (Persons, Companies, Documents, Media) to a visual workspace to build out connection maps and relationship networks.
*   **Comprehensive Data Sources:** Built-in scrapers for a wide array of Romanian institutions and publications (see Supported Sources).
*   **Smart Entity Resolution:** Automatically detects if a search target is a CUI (Company Registration Number) or a name, and resolves it accordingly via the ANAF API.
*   **Authentication & Workspaces:** Secure user authentication with support for distinct projects and notes.


## Supported Data Sources (Scrapers)

The platform aggregates data from a diverse set of sources:

**Institutions & Registries:**
*   **ANAF** (Financial data, VAT status, administrators)
*   **Portal Just** (Court cases and legal history)
*   **ANI** (Wealth and interest declarations)
*   **SEAP / SICAP** (Public procurement and contracts)

**Journalism & News (Investigative & Mainstream):**
*   Recorder
*   RiseProject
*   Ziarul Financiar (ZF)
*   Adevărul
*   Digi24
*   G4Media
*   Hotnews

**Other:**
*   Social Media Profiles
*   DuckDuckGo (General web search)


The team who worked on this project:

* Andrei Scurtu - *Team Leader*, came up with the project idea, docker orchestation, dashboard, scrapers, scraper integration, scraper backend, frontend UI
* Robert Cozma - UI website design, scrapers, selenium experiments, animations
* Denisa Turea - UI website design, ANAF scraper
* Zoltan Csabai  - UI website design, all scrapers, scraper formatting
* Andrei Rotaru - Enterprise page
* Catalin Palade - Authentication (backend - django)
* Raul Oncioiu - Authentication (frontend - Login, Register pages)


