# 📈 StockPro — Comprehensive Stock Investment Platform

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Hackathon](https://img.shields.io/badge/built_for-hackathon-FF6F61?style=flat-square)](#)
[![Status](https://img.shields.io/badge/status-educational-yellow?style=flat-square)](#-disclaimer)

A hackathon stock app for **Korean investors** — real-time market info, company analysis, portfolio calculation, and investment guides — all in one place.

> [!IMPORTANT]
> This project is built **for educational and hackathon purposes only**. See the [Disclaimer](#-disclaimer) before you read further.

---

## 📑 Table of Contents

- [Disclaimer](#-disclaimer)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Data Sources](#-data-sources)
- [Quickstart](#-quickstart)
- [Troubleshooting](#-troubleshooting)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [License](#-license)

---

## ⚠️ Disclaimer

> **This is NOT investment advice.** StockPro is an **educational** hackathon project. Nothing in this repository constitutes financial, investment, legal, or tax advice.
>
> - Market data is sourced from public APIs and may be delayed, incomplete, or inaccurate.
> - Historical returns shown in the calculator are not indicative of future results.
> - Filings tracked via SEC EDGAR and DART are public information surfaced for **research convenience only** — they are not recommendations.
> - You alone are responsible for your investment decisions. Consult a licensed financial advisor before acting on anything you see here.
> - By using this app you agree the authors are not liable for any losses, damages, or decisions made on the basis of its output.

---

## ✨ Features

1. **🌐 Market Info** — Real-time indices by country (US / Korea / Japan / Europe) and an economic calendar
2. **🏢 Company Analysis** — SEC EDGAR (US) and DART (Korea) filings, plus PER, PBR, ROE, and other ratios
3. **📊 Return Calculator** — Historical returns for ratio mixes such as **SCHD : QQQ : SPY = 3 : 5 : 2**
4. **💼 Investor 13F** — Track filings from famous investors (Buffett, ARK, Bridgewater, etc.)
5. **🇰🇷 Investment Guide** — How to use tax-advantaged accounts (ISA, IRP, pensions)
6. **💬 Comments** — Per-page comment threads

---

## 🛠 Tech Stack

| Layer | Tool |
|------|------|
| Framework | [Next.js 14](https://nextjs.org) (App Router) |
| Language | TypeScript |
| Styling | [Tailwind CSS](https://tailwindcss.com) |
| Charts | [Recharts](https://recharts.org) |
| Hosting | Vercel |

---

## 📡 Data Sources

| Provider | Used for | API Key |
|----------|----------|---------|
| [Yahoo Finance](https://finance.yahoo.com) | Real-time quotes, historical prices | None (public) |
| [SEC EDGAR](https://www.sec.gov/edgar) | US company filings + 13F | None (public) |
| [DART](https://dart.fss.or.kr) | Korean company filings | `DART_API_KEY` |

> Attribution: market data ©️ Yahoo Finance, SEC EDGAR, DART. This project is not affiliated with or endorsed by any of these providers.

---

## 🚀 Quickstart

```bash
git clone https://github.com/Dohyun-1/Stock-App.git
cd Stock-App/stock-hackathon
npm install
npm run build
npm start
```

Open **http://localhost:4000** in your browser.

> If port 4000 conflicts, use `npm run start:3005` and visit **http://localhost:3005**.

### Dev mode

```bash
npm run dev
```

> If you hit an `EMFILE` error in dev mode, run `npm run build && npm start` instead.

---

## 🩹 Troubleshooting

<details>
<summary><b>The browser can't reach the app — click for fixes</b></summary>

1. **Confirm the server is running** — after `npm start`, the terminal should print **"Ready"**
2. **Check the URL** — `http://localhost:3005` (port 3005)
3. **Try the loopback IP** — `http://127.0.0.1:3005`
4. **Firewall** — confirm macOS firewall isn't blocking Node
5. **Browser extensions** — try an incognito / private window

</details>

---

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DART_API_KEY` | optional | DART filings Open API key (issued at [dart.fss.or.kr](https://dart.fss.or.kr)) |

Copy `.env.example` to `.env.local` and fill in any keys you need.

---

## 🚢 Deployment

- **Vercel** — (add the deployed URL here, e.g. `https://itakeurmoney.vercel.app`)
- **GitHub** — [github.com/Dohyun-1/Stock-App](https://github.com/Dohyun-1/Stock-App)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Dohyun-1/Stock-App)

---

## 📄 License

[MIT](LICENSE) © 2026 Dohyun Ryu

---

> 🛑 **Reminder:** Educational use only. Not financial advice. See [Disclaimer](#-disclaimer).
