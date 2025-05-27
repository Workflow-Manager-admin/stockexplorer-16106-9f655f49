import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
import datetime
import yfinance as yf

# PUBLIC_INTERFACE
class StockResponse(BaseModel):
    ticker: str
    shortName: str = ""
    longName: str = ""
    sector: str = ""
    industry: str = ""
    website: str = ""
    regularMarketPrice: float = None
    regularMarketChangePercent: float = None
    marketCap: float = None
    timestamp: float = None

DB_PATH = os.environ.get("STOCK_DB_PATH", "stock_data.db")

def get_db_conn():
    """Return a connection to the SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Create stock_data table if not exists."""
    conn = get_db_conn()
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS stock_data (
        id INTEGER PRIMARY KEY,
        ticker TEXT NOT NULL,
        shortName TEXT,
        longName TEXT,
        sector TEXT,
        industry TEXT,
        website TEXT,
        regularMarketPrice REAL,
        regularMarketChangePercent REAL,
        marketCap REAL,
        timestamp REAL -- Unix timestamp when data was fetched
    );
    """)
    conn.commit()
    conn.close()

def save_stock_data(ticker: str, info: dict):
    """Save stock data to db."""
    conn = get_db_conn()
    conn.execute("""
        INSERT INTO stock_data (
            ticker, shortName, longName, sector, industry, website,
            regularMarketPrice, regularMarketChangePercent, marketCap, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        ticker.upper(),
        info.get("shortName", ""),
        info.get("longName", ""),
        info.get("sector", ""),
        info.get("industry", ""),
        info.get("website", ""),
        info.get("regularMarketPrice"),
        info.get("regularMarketChangePercent"),
        info.get("marketCap"),
        datetime.datetime.utcnow().timestamp()
    ))
    conn.commit()
    conn.close()

def fetch_recent_stock_data(ticker: str, freshness_secs=300):
    """Return the most recent stock data for ticker if within freshness window (default 5 min)."""
    conn = get_db_conn()
    result = conn.execute(
        "SELECT * FROM stock_data WHERE ticker=? ORDER BY timestamp DESC LIMIT 1",
        (ticker.upper(),)
    ).fetchone()
    conn.close()
    if result:
        # If data is fresher than freshness_secs, return it
        if datetime.datetime.utcnow().timestamp() - result["timestamp"] <= freshness_secs:
            return dict(result)
    return None

# Initialize DB at startup
init_db()

app = FastAPI(
    title="Stock Data API",
    description="Fetch stock data via yfinance API and store in local database",
    version="1.0"
)

# Allow CORS from localhost:3000 for dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "http://localhost:3000", "https://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# PUBLIC_INTERFACE
@app.get("/api/stock/{ticker}", response_model=StockResponse)
def get_stock(ticker: str):
    """
    Fetch stock data for the given ticker, using cached value if recent.
    Falls back to yfinance if not cached. Stores all successful fetches.
    """
    ticker = ticker.strip().upper()
    # Check recent cache
    cached = fetch_recent_stock_data(ticker)
    if cached:
        return StockResponse(**cached)
    
    try:
        stock = yf.Ticker(ticker)
        info = stock.info  # This calls Yahoo API
        
        # yfinance sometimes returns (None, or minimal) if ticker is bad
        if "regularMarketPrice" not in info or info.get("regularMarketPrice") is None:
            raise HTTPException(status_code=404, detail="Ticker not found or no market price.")
        
        # Compose info for response and save
        filtered_info = {
            "shortName": info.get("shortName", ""),
            "longName": info.get("longName", ""),
            "sector": info.get("sector", ""),
            "industry": info.get("industry", ""),
            "website": info.get("website", ""),
            "regularMarketPrice": info.get("regularMarketPrice"),
            "regularMarketChangePercent": info.get("regularMarketChangePercent"),
            "marketCap": info.get("marketCap"),
        }
        save_stock_data(ticker, filtered_info)
        filtered_info["ticker"] = ticker
        filtered_info["timestamp"] = datetime.datetime.utcnow().timestamp()
        return StockResponse(**filtered_info)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not fetch stock data: {str(e)}")
