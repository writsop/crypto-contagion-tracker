// Crypto Contagion Tracker - Data Fetcher
// Fetches recent crypto security incidents and market impact data
// Uses free APIs (no API key required for basic data)

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'events.json');

// Free crypto news/hack sources
const SOURCES = [
  {
    name: 'rekt-news',
    url: 'https://api.coingecko.com/api/v3/status_updates?per_page=50',
    parser: parseCoingeckoUpdates
  }
];

// Fetch with timeout and error handling
async function fetchJSON(url, headers = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

// Parse CoinGecko status updates for security-related events
function parseCoingeckoUpdates(data) {
  if (!data?.status_updates) return [];
  return data.status_updates
    .filter(u => {
      const text = (u.description || '').toLowerCase();
      return text.includes('hack') || text.includes('exploit') || 
             text.includes('breach') || text.includes('vulnerability') ||
             text.includes('attack') || text.includes('incident') ||
             text.includes('security') || text.includes('compromised');
    })
    .map(u => ({
      timestamp: u.created_at,
      entity: u.project?.name || 'Unknown',
      type: categorizeEvent(u.description),
      summary: u.description?.substring(0, 500) || '',
      source: 'CoinGecko'
    }));
}

// Fetch known major crypto hacks from DeFiLlama
async function fetchDefiLlamaHacks() {
  try {
    const data = await fetchJSON('https://api.llama.fi/hacks');
    if (!Array.isArray(data)) return [];
    
    // Get hacks from last 90 days
    const cutoff = Date.now() - (90 * 24 * 60 * 60 * 1000);
    return data
      .filter(h => (h.date * 1000) > cutoff)
      .sort((a, b) => b.date - a.date)
      .slice(0, 30)
      .map(h => ({
        timestamp: new Date(h.date * 1000).toISOString(),
        entity: h.name || 'Unknown Protocol',
        type: h.technique || 'exploit',
        amountLost: h.amount || 0,
        chain: h.chain || 'Unknown',
        summary: `${h.name} lost $${formatAmount(h.amount)} via ${h.technique || 'unknown exploit'} on ${h.chain || 'unknown chain'}`,
        source: 'DeFiLlama',
        classification: h.classification || 'Hack',
        returnedFunds: h.returnedFunds || 0
      }));
  } catch (err) {
    console.error('DeFiLlama fetch failed:', err.message);
    return [];
  }
}

// Fetch market data for contagion analysis
async function fetchMarketContagion() {
  try {
    // Get top 20 tokens' 24h price changes
    const data = await fetchJSON(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&sparkline=false&price_change_percentage=1h%2C24h%2C7d'
    );
    if (!Array.isArray(data)) return null;
    
    const changes = data.map(c => ({
      symbol: c.symbol?.toUpperCase(),
      name: c.name,
      price: c.current_price,
      change24h: c.price_change_percentage_24h,
      change7d: c.price_change_percentage_7d_in_currency,
      marketCap: c.market_cap
    }));
    
    // Calculate contagion score: how correlated are the drops?
    const negativeCount = changes.filter(c => c.change24h < -3).length;
    const avgChange = changes.reduce((s, c) => s + (c.change24h || 0), 0) / changes.length;
    
    return {
      timestamp: new Date().toISOString(),
      topTokens: changes,
      contagionScore: Math.min(100, Math.round(negativeCount * 10 + Math.abs(Math.min(0, avgChange)) * 5)),
      marketSentiment: avgChange > 2 ? 'bullish' : avgChange < -2 ? 'bearish' : 'neutral',
      avgChange24h: Math.round(avgChange * 100) / 100
    };
  } catch (err) {
    console.error('Market data fetch failed:', err.message);
    return null;
  }
}

function categorizeEvent(text) {
  if (!text) return 'unknown';
  const t = text.toLowerCase();
  if (t.includes('hack') || t.includes('exploit')) return 'hack';
  if (t.includes('rug') || t.includes('scam')) return 'scam';
  if (t.includes('bridge')) return 'bridge-exploit';
  if (t.includes('flash loan')) return 'flash-loan';
  if (t.includes('phishing')) return 'phishing';
  return 'security-incident';
}

function formatAmount(amount) {
  if (!amount) return '0';
  if (amount >= 1e9) return (amount / 1e9).toFixed(1) + 'B';
  if (amount >= 1e6) return (amount / 1e6).toFixed(1) + 'M';
  if (amount >= 1e3) return (amount / 1e3).toFixed(0) + 'K';
  return amount.toFixed(0);
}

async function main() {
  console.log('🔍 Fetching crypto contagion data...');
  
  // Fetch hack data from DeFiLlama (most reliable free source)
  const hacks = await fetchDefiLlamaHacks();
  console.log(`  Found ${hacks.length} recent hacks from DeFiLlama`);
  
  // Fetch market contagion data
  const market = await fetchMarketContagion();
  console.log(`  Market contagion score: ${market?.contagionScore || 'N/A'}`);
  
  // Calculate total losses
  const totalLost = hacks.reduce((s, h) => s + (h.amountLost || 0), 0);
  const totalReturned = hacks.reduce((s, h) => s + (h.returnedFunds || 0), 0);
  
  // Build output
  const output = {
    lastUpdated: new Date().toISOString(),
    summary: {
      totalHacks90d: hacks.length,
      totalLost90d: totalLost,
      totalReturned90d: totalReturned,
      netLost90d: totalLost - totalReturned,
      contagionScore: market?.contagionScore || 0,
      marketSentiment: market?.marketSentiment || 'unknown'
    },
    market: market,
    recentHacks: hacks,
    meta: {
      sources: ['DeFiLlama Hacks API', 'CoinGecko Markets API'],
      generatedBy: 'crypto-contagion-tracker',
      version: '1.0.0'
    }
  };
  
  // Ensure data directory exists
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  
  fs.writeFileSync(DATA_FILE, JSON.stringify(output, null, 2));
  console.log(`\n✅ Data saved to ${DATA_FILE}`);
  console.log(`📊 Summary: ${hacks.length} hacks, $${formatAmount(totalLost)} lost, contagion score: ${market?.contagionScore || 'N/A'}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
