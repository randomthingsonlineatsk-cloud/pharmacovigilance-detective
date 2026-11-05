# Pharmacovigilance Detective

A game for classifying fictional adverse-event case reports.

**Live demo:** https://pharmacovigilance-detective.randomthingsonlineatsk.workers.dev (once deployed)

> This is a fictional, educational demonstration. Do not use it for real patient data, clinical decisions or regulatory submissions.

## Features
- Classify cases by seriousness, expectedness, causality and reporting timeline
- Causality scales: Naranjo, WHO-UMC and others
- Reference sections on aggregate reporting, signal detection, coding dictionaries and regulators
- ICSR-building exercise and achievement badges
- Shared leaderboard and cross-device sync codes (Convex), with a browser-only fallback
- "Ask the Detective": a rule-based classifier (weighted terms, a second-topic hint, and a seriousness / expectedness / causality read-out for pasted cases)

## Tech stack
TanStack Start, React, Tailwind CSS, Convex (leaderboard and sync codes). Prerendered and hosted on Cloudflare Workers.

## Run locally
```
npm install --legacy-peer-deps
npm run dev
```
Without `VITE_CONVEX_URL` the leaderboard and sync codes work in the browser's localStorage only.

## Deploy (Cloudflare Workers)
- Build variable: `NITRO_PRESET=node-server`
- Build command: `npm install --legacy-peer-deps && npm run build`
- Deploy command: `npx wrangler deploy --assets .output/public --name pharmacovigilance-detective --compatibility-date 2026-01-01`
- Optional build variable `VITE_CONVEX_URL` for the shared leaderboard and sync codes.

## Backend (Convex)
`npx convex dev --configure new`, then `npx convex deploy`. The earlier AI classifier from the Macaly version was replaced with a keyword-based one that runs in the browser, so no AI service or API key is needed.

## Attribution
Created by **Khan Gulrez Shagufa Fazal Ahmed**.

If you reuse or adapt this project, please credit the original author and link back to https://github.com/randomthingsonlineatsk-cloud/pharmacovigilance-detective. The Apache License 2.0 requires you to keep the `LICENSE` and `NOTICE` files with any copy you distribute.

## License
Licensed under the [Apache License 2.0](LICENSE). Copyright 2026 Khan Gulrez Shagufa Fazal Ahmed.
