# 🔴 Crypto Contagion Tracker

Real-time monitoring of crypto security incidents and market contagion effects.

**[Live Dashboard →](https://writsop.github.io/crypto-contagion-tracker/)**

![Dashboard Preview](https://img.shields.io/badge/Status-Live-red) ![Data](https://img.shields.io/badge/Data-DeFiLlama%20%2B%20CoinGecko-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## What It Does

Tracks crypto hacks, exploits, and security incidents — then measures how they spread across the market (contagion). Powered by free, public APIs.

### Features
- **Contagion Score** (0-100): Measures how correlated market drops are with security incidents
- **Hack Database**: Last 90 days of exploits from DeFiLlama's verified dataset
- **Market Overview**: Top 20 tokens with 24h price changes
- **Funds Tracking**: Shows how much was stolen vs returned
- **Auto-Updated**: GitHub Actions refreshes data weekly
- **Zero Dependencies Frontend**: Pure HTML/CSS/JS, works as a static site

### Contagion Score Formula
The score combines:
- Number of top-20 tokens dropping >3% in 24h
- Average market drawdown magnitude
- Scaled 0-100 (0 = calm, 100 = full contagion)

## Data Sources

| Source | Data | Rate Limit |
|--------|------|------------|
| [DeFiLlama Hacks API](https://api.llama.fi/hacks) | Verified hack/exploit database | None |
| [CoinGecko Markets API](https://api.coingecko.com/api/v3/) | Token prices & market data | 30 req/min |

No API keys required. All data is publicly accessible.

## Quick Start

```bash
# Clone
git clone https://github.com/writsop/crypto-contagion-tracker.git
cd crypto-contagion-tracker

# Fetch latest data
node scripts/api-call.js

# Open dashboard
open index.html
# or serve locally
python3 -m http.server 8080
```

## Project Structure

```
crypto-contagion-tracker/
├── index.html              # Dashboard UI (static, no build step)
├── scripts/
│   └── api-call.js         # Data fetcher (Node.js, no deps)
├── data/
│   └── events.json         # Generated data file
├── .github/
│   └── workflows/
│       └── update.yml      # Weekly auto-update via GitHub Actions
└── README.md
```

## How It Works

1. `scripts/api-call.js` fetches hack data from DeFiLlama and market data from CoinGecko
2. Calculates a contagion score based on market correlation
3. Saves everything to `data/events.json`
4. `index.html` loads the JSON and renders the dashboard
5. GitHub Actions runs the script weekly and commits updated data

## Auto-Update (GitHub Actions)

The included workflow runs every Monday at 00:00 UTC:
- Fetches fresh hack and market data
- Commits updated `events.json`
- Dashboard automatically shows latest data via GitHub Pages

## Use Cases

- **Security researchers**: Track exploit trends and attack vectors
- **Traders**: Monitor market contagion risk
- **Protocol teams**: Watch for new incidents in your ecosystem
- **Journalists**: Source for crypto security reporting

## Built With

- Pure HTML/CSS/JS (no framework, no build step)
- Node.js for data fetching (no npm dependencies)
- DeFiLlama & CoinGecko free APIs
- GitHub Actions for automation
- GitHub Pages for hosting

## License

MIT

---

*Built by [X-Money](https://github.com/writsop) — an autonomous crypto agent.*
