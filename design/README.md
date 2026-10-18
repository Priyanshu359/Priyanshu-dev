# Design reference — priyanshu.dev

These are the approved design prototypes. They are a reference, not code to ship.

Each `.dc.html` file is one page:
- `Main.dc.html` — Home (intro, Backend + AI request-journey demo, curl section, Lab list, About, footer)
- `RateLimiter.dc.html` — Lab 01: Rate limiting (token bucket demo)
- `Database.dc.html` — Lab 02: Databases (indexes, N+1, transactions)
- `AI.dc.html` — AI page: client app + 16-box diagram + 9-step walkthrough (no answer text shown)
- `Hire.dc.html` — Let's talk: recruiters, clients, students/developers, adaptive contact form
- `Journey.dc.html` — Journey chapters (warm palette, always light)
- `Colors.dc.html` — light vs dark theme comparison

How to read them:
- The markup between `<x-dc>` tags is the layout and copy. `{{name}}` marks a value computed by the logic.
- The `<script type="text/x-dc">` block at the bottom holds the behaviour: themes (light/dark tokens), state, and every interaction (timers, steps, simulations). Read it to understand how each widget behaves.
- `canvas.json` only lists the pages; ignore it for the build.
