# StockPro — Comprehensive Stock Investment Platform

A hackathon stock app. Real-time market info, company analysis, portfolio calculation, and investment guides — built for Korean investors.

## Features

1. **Market Info** — Real-time indices by country (US/Korea/Japan/Europe), economic calendar
2. **Company Analysis** — SEC EDGAR (US) and DART (Korea) filings, plus PER, PBR, ROE, etc.
3. **Return Calculator** — Historical returns for ratio mixes such as SCHD:QQQ:SPY 3:5:2
4. **Investor 13F** — Track filings from famous investors (Buffett, ARK, Bridgewater, etc.)
5. **Investment Guide** — How to use tax-advantaged accounts (ISA, IRP, pensions)
6. **Comments** — Per-page comment threads

## How to Run

```bash
cd stock-hackathon
npm install
npm run build
npm start
```

Open **http://localhost:4000** in your browser (use `npm run start:3005` if port 4000 conflicts).

> If you hit an `EMFILE` error in dev mode (`npm run dev`), build and run with `npm start` as shown above.

### Troubleshooting connection

1. **Confirm the server is running** — after `npm start`, the terminal should print "Ready"
2. **Check the URL** — `http://localhost:3005` (port 3005)
3. **Try 127.0.0.1** — `http://127.0.0.1:3005`
4. **Firewall** — check whether macOS firewall is blocking Node
5. **Incognito/private window** — rule out browser-extension interference

## Deployment

- **Vercel:** (add the deployed URL here, e.g., https://itakeurmoney.vercel.app)
- **GitHub:** https://github.com/Dohyun-1/Stock-App

## Environment Variables (optional)

- `DART_API_KEY` — DART filings Open API key (issued at dart.fss.or.kr)

## Tech Stack

- Next.js 14, TypeScript, Tailwind CSS
- Yahoo Finance API (fetch), SEC EDGAR, DART API
- Recharts (charts)
