import React, { useState } from "react";

/**
 * PUBLIC_INTERFACE
 * StockExplorer - Main container for stock search, info, and chart.
 * Uses color scheme: #1a237e (primary), #f5f5f5 (secondary), #ffb300 (accent).
 * 
 * All-in-one component as per assignment. This code fetches real stock data 
 * from Yahoo Finance (via public APIs), but for a real app, 
 * production-grade backend API proxy is recommended.
 */

const COLORS = {
  primary: "#1a237e",
  secondary: "#f5f5f5",
  accent: "#ffb300",
  bg: "#ffffff"
};

// Helper for small "Loader"
function Loader() {
  return (
    <div style={{ textAlign: "center", color: COLORS.primary, padding: "12px" }}>
      <span style={{ fontWeight: 500, letterSpacing: 1 }}>Loading...</span>
    </div>
  );
}

// Stock info card
function StockInfoCard({ stockInfo }) {
  if (!stockInfo) return null;

  return (
    <div
      style={{
        background: COLORS.secondary,
        borderRadius: 12,
        padding: "20px 32px",
        margin: "24px 0 10px 0",
        boxShadow: "0 1px 8px 0 rgba(26,35,126,0.05)",
        display: "flex",
        alignItems: "flex-start",
        gap: "32px",
        color: COLORS.primary,
      }}
      aria-label="company info"
    >
      <div>
        <div style={{ fontWeight: 600, fontSize: 22, color: COLORS.primary }}>
          {stockInfo.shortName || stockInfo.longName || "---"}
          <span style={{
            fontWeight: 400, fontSize: 16, color: COLORS.accent, marginLeft: 10,
          }}>
            [{stockInfo.symbol}]
          </span>
        </div>
        {stockInfo.sector && (
          <div style={{ fontSize: 15, color: COLORS.primary, marginTop: 2 }}>
            Sector: <strong style={{ color: COLORS.accent }}>{stockInfo.sector}</strong>
          </div>
        )}
        {stockInfo.industry && (
          <div style={{ fontSize: 14 }}>{stockInfo.industry}</div>
        )}
        {stockInfo.website && (
          <div>
            <a
              href={stockInfo.website}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: COLORS.primary, textDecoration: "underline", fontSize: 13,
              }}
            >
              {stockInfo.website.replace(/^https?:\/\//, "")}
            </a>
          </div>
        )}
      </div>
      <div style={{
        marginLeft: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        minWidth: 130,
      }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: "#333" }}>
          ${stockInfo.regularMarketPrice?.toFixed(2) ?? "--"}
        </div>
        <div style={{
          color: stockInfo.regularMarketChangePercent > 0
            ? "#2E7D32"
            : stockInfo.regularMarketChangePercent < 0
              ? "#C62828"
              : "#555",
          fontWeight: 600,
          fontSize: 14,
          marginTop: 2
        }}>
          {stockInfo.regularMarketChangePercent !== undefined &&
            (stockInfo.regularMarketChangePercent > 0 ? "▲ " :
              stockInfo.regularMarketChangePercent < 0 ? "▼ " : "")}
          {stockInfo.regularMarketChangePercent?.toFixed(2) ?? "--"}%
        </div>
        {stockInfo.marketCap && (
          <div style={{ fontSize: 13, marginTop: 6 }}>
            Market Cap: <b>${abbrevMarketCap(stockInfo.marketCap)}</b>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper to format market cap (B, M)
function abbrevMarketCap(val) {
  if (!val) return "--";
  if (val >= 1e12) return (val / 1e12).toFixed(2) + "T";
  if (val >= 1e9) return (val / 1e9).toFixed(2) + "B";
  if (val >= 1e6) return (val / 1e6).toFixed(2) + "M";
  if (val >= 1e3) return (val / 1e3).toFixed(2) + "K";
  return val.toString();
}

// Chart timeframes and labels
const TIMEFRAMES = [
  { label: "1D", value: "1d", interval: "5m" },
  { label: "1M", value: "1mo", interval: "1d" },
  { label: "6M", value: "6mo", interval: "1d" },
  { label: "1Y", value: "1y", interval: "1wk" },
];

// Chart Area (render SVG)
function PriceChart({ data, timeframe, height = 220 }) {
  if (!data || !data.length) return (
    <div style={{ padding: 40, minHeight: height, textAlign: "center" }}>
      No chart data found.
    </div>
  );
  // Compute SVG points
  const min = Math.min(...data.map(pt => pt.close));
  const max = Math.max(...data.map(pt => pt.close));
  const padding = 32;
  const width = 720;
  const chartH = height - padding * 2;

  const getY = v => padding + chartH - ((v - min) / (max - min || 1)) * chartH;

  // Responsive X steps
  const step = width / (data.length - 1 || 1);

  const points = data.map((pt, i) =>
    `${i * step},${getY(pt.close)}`
  ).join(" ");

  // Axis labels (start, mid, end)
  const firstDate = new Date(data[0].date);
  const lastDate = new Date(data[data.length - 1].date);
  let midDate;
  if (data.length > 3) {
    midDate = new Date(data[Math.floor(data.length / 2)].date);
  }

  const priceFmt = v => "$" + v.toFixed(2);

  return (
    <div style={{
      background: COLORS.secondary,
      borderRadius: 12,
      boxShadow: "0 1px 8px 0 rgba(26,35,126,0.06)",
      padding: 22,
      marginTop: 8,
      marginBottom: 18,
    }}>
      <svg width={width} height={height} style={{ width: "100%", height: height }}>
        {/* Axes lines */}
        <line x1={0} y1={height - padding} x2={width} y2={height - padding} stroke="#BBB" strokeDasharray="3,4" />
        <line x1={padding} y1={0} x2={padding} y2={height} stroke="#EEE" strokeDasharray="4,3" />
        {/* Area line */}
        <polyline
          fill="none"
          stroke={COLORS.primary}
          strokeWidth={2.8}
          points={points}
        />
        {/* Area underneath line */}
        <polygon
          points={`${points} ${width},${height-padding} 0,${height-padding}`}
          fill={COLORS.accent + "33"}
        />
        {/* Spots for min/max */}
        <circle
          cx={data.findIndex(pt => pt.close === max) * step}
          cy={getY(max)}
          r={5}
          fill={COLORS.accent}
          stroke="#fff"
          strokeWidth={2}
        />
        <circle
          cx={data.findIndex(pt => pt.close === min) * step}
          cy={getY(min)}
          r={4}
          fill="#789"
          stroke="#fff"
          strokeWidth={2}
        />

        {/* Min/Max text */}
        <text x={0} y={getY(max) - 10} fontSize="13" fill={COLORS.primary} fontWeight="bold">
          {priceFmt(max)}
        </text>
        <text x={0} y={getY(min) + 15} fontSize="12" fill="#789">
          {priceFmt(min)}
        </text>

        {/* Date labels */}
        <text x={0} y={height - 6} fontSize="12" fill="#888">
          {firstDate.toLocaleDateString().slice(0, 5)}
        </text>
        {midDate && (
          <text x={width / 2 - 35} y={height - 6} fontSize="12" fill="#888">
            {midDate.toLocaleDateString().slice(0, 5)}
          </text>
        )}
        <text x={width - 65} y={height - 6} fontSize="12" fill="#888">
          {lastDate.toLocaleDateString().slice(0, 5)}
        </text>
      </svg>
    </div>
  );
}

// Main Component
function StockExplorer() {
  const [ticker, setTicker] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [stockInfo, setStockInfo] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[1]); // default 1mo

  // Fetch company & price info when ticker changes
  React.useEffect(() => {
    if (!query) {
      setStockInfo(null);
      setHistory([]);
      setError("");
      return;
    }

    let isCancelled = false;
    async function fetchAll() {
      setLoading(true);
      setError("");
      setStockInfo(null);
      setHistory([]);
      // Yahoo Finance API: (for demonstration) - real apps should proxy to avoid CORS and quota
      try {
        // 1. Quote/Profile
        const res = await fetch(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${query}?modules=price,assetProfile`);
        if (!res.ok) throw new Error("Not found or rate limited.");
        const data = await res.json();
        const priceData = data.quoteSummary?.result?.[0]?.price || {};
        const profile = data.quoteSummary?.result?.[0]?.assetProfile || {};
        const combined = { ...priceData, ...profile, symbol: query.toUpperCase() };
        setStockInfo(combined);

        // 2. Historical price
        const { value, interval } = timeframe;
        // Calculate unix timestamps for range
        const now = Math.floor(Date.now() / 1000);
        let period1;
        if (value === "1d") period1 = now - 2 * 24 * 60 * 60;
        else if (value === "1mo") period1 = now - 31 * 24 * 60 * 60;
        else if (value === "6mo") period1 = now - 182 * 24 * 60 * 60;
        else if (value === "1y") period1 = now - 366 * 24 * 60 * 60;
        else period1 = now - 30 * 24 * 60 * 60;
        const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${query}?interval=${interval}&period1=${period1}&period2=${now}`;
        const chartRes = await fetch(chartUrl);
        const chartData = await chartRes.json();
        if (!chartData.chart?.result?.length) throw new Error("No chart data.");
        const candle = chartData.chart.result[0];
        const timestamps = candle.timestamp || [];
        const closes = candle.indicators?.quote?.[0]?.close || [];
        // Build history data: [{date, close}]
        const hist = [];
        for (let i = 0; i < timestamps.length; i++)
          if (closes[i] !== null && !isNaN(closes[i]))
            hist.push({
              date: timestamps[i] * 1000,
              close: closes[i],
            });
        setHistory(hist);
      } catch (err) {
        setError("Could not fetch stock data.");
        setStockInfo(null);
        setHistory([]);
      }
      setLoading(false);
    }
    fetchAll();
    return () => { isCancelled = true; };
    // only change when query or timeframe
    // eslint-disable-next-line
  }, [query, timeframe]);

  // On form submit
  function handleSearch(e) {
    e.preventDefault();
    if (!ticker.trim()) return;
    setQuery(ticker.trim().toUpperCase());
  }

  function handleTimeframe(frame) {
    setTimeframe(frame);
  }

  return (
    <div style={{
      background: COLORS.bg,
      minHeight: "100vh",
      fontFamily: "'Inter','Roboto',sans-serif",
      color: COLORS.primary
    }}>
      {/* Top nav bar */}
      <nav style={{
        width: "100%",
        background: COLORS.primary,
        padding: "16px 0",
        boxShadow: "0 2px 8px 0 rgba(26,35,126,0.08)",
        position: "relative",
      }}>
        <div style={{
          maxWidth: 900, margin: "0 auto", display: "flex",
          alignItems: "center", justifyContent: "space-between", padding: "0 28px",
        }}>
          <span style={{ fontWeight: 600, fontSize: 20, color: "#fff", letterSpacing: 2 }}>
            <span style={{ color: COLORS.accent, marginRight: 4 }}>*</span>StockExplorer
          </span>
          <a href="https://finance.yahoo.com/" rel="noopener noreferrer" target="_blank"
            style={{
              fontSize: 14, textDecoration: "none", color: COLORS.accent, background: "#fff6e7", borderRadius: 6,
              padding: "6px 15px", fontWeight: 500, boxShadow: "0 1px 4px #ffc76c30"
            }}>
            Yahoo Finance
          </a>
        </div>
      </nav>

      <main style={{
        maxWidth: 900,
        margin: "52px auto 0 auto",
        padding: "0 28px",
        boxSizing: "border-box"
      }}>
        <form
          onSubmit={handleSearch}
          style={{
            display: "flex",
            gap: "0",
            alignItems: "center",
            background: COLORS.primary,
            borderRadius: 12,
            boxShadow: "0 2px 8px 0 rgba(26,35,126,0.07)",
            padding: "10px 22px",
            marginTop: 30
          }}
          aria-label="Stock ticker search"
        >
          <input
            type="text"
            placeholder="Enter stock ticker (e.g. AAPL, TSLA)"
            value={ticker}
            onChange={e => setTicker(e.target.value)}
            style={{
              flex: 2,
              background: "transparent",
              color: "#fff",
              fontSize: 18,
              border: "none",
              outline: "none",
              padding: "8px 2px",
              fontWeight: 500,
              letterSpacing: 1.5
            }}
            aria-label="stock ticker"
          />
          <button
            type="submit"
            style={{
              background: COLORS.accent,
              color: COLORS.primary,
              border: "none",
              borderRadius: 6,
              padding: "10px 26px",
              fontWeight: 600,
              fontSize: 17,
              marginLeft: 16,
              cursor: "pointer",
              boxShadow: "0 1px 8px #ffb30018",
              transition: "background 0.15s"
            }}
            aria-label="search stock"
          >
            Search
          </button>
        </form>

        {loading && <Loader />}

        {error && (
          <div style={{
            background: "#fff4ee",
            color: "#c62828",
            margin: "26px 0 0 0",
            padding: "12px 22px",
            borderRadius: 9,
            fontWeight: 500,
            maxWidth: 510
          }}>
            {error}
          </div>
        )}

        {!loading && stockInfo && (
          <StockInfoCard stockInfo={stockInfo} />
        )}

        {/* Timeframe selectors */}
        {stockInfo && (
          <div style={{ display: "flex", gap: 22, margin: "12px 0 4px 2px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 500, color: COLORS.primary, fontSize: 16 }}>Price Trend</span>
            {TIMEFRAMES.map(frame => (
              <button
                key={frame.value}
                onClick={() => handleTimeframe(frame)}
                style={{
                  background: frame.value === timeframe.value ? COLORS.accent : COLORS.secondary,
                  color: frame.value === timeframe.value ? COLORS.primary : COLORS.primary,
                  border: "none",
                  borderRadius: 5,
                  padding: "7px 18px",
                  fontWeight: frame.value === timeframe.value ? 700 : 500,
                  fontSize: 15,
                  margin: "0 2px",
                  marginRight: 4,
                  boxShadow: frame.value === timeframe.value
                    ? "0 1px 10px #ffb30028"
                    : "none",
                  cursor: "pointer",
                  outline: "none"
                }}
                aria-pressed={frame.value === timeframe.value}
              >
                {frame.label}
              </button>
            ))}
          </div>
        )}

        {/* Interactive chart */}
        {stockInfo && !loading && (
          <PriceChart data={history} timeframe={timeframe} height={230} />
        )}

      </main>
      <footer style={{
        width: "100%",
        textAlign: "center",
        padding: "24px 0",
        color: "#999",
        fontSize: 15,
        marginTop: 76,
        borderTop: "1px solid #e5e7ef"
      }}>
        Powered by Yahoo Finance | Built with ♥ for StockExplorer
      </footer>
    </div>
  );
}

export default StockExplorer;
