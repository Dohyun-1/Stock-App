import fs from "fs";
import path from "path";

export type PortfolioRecord = {
  id: string;
  userId: string;
  name: string;
  baseCurrency: string;
  createdAt: string;
  updatedAt: string;
};

export type HoldingRecord = {
  id: string;
  portfolioId: string;
  symbol: string;
  companyName: string;
  sector: string;
  shares: number;
  averagePrice: number;
  createdAt: string;
  updatedAt: string;
};

export type TransactionRecord = {
  id: string;
  portfolioId: string;
  symbol: string;
  type: "buy" | "sell";
  shares: number;
  price: number;
  amount: number;
  createdAt: string;
};

export type PortfolioDB = {
  portfolios: PortfolioRecord[];
  holdings: HoldingRecord[];
  transactions: TransactionRecord[];
};

export type WatchlistRecord = {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type WatchlistItemRecord = {
  id: string;
  watchlistId: string;
  symbol: string;
  createdAt: string;
  updatedAt: string;
};

export type WatchlistDB = {
  watchlists: WatchlistRecord[];
  items: WatchlistItemRecord[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const PORTFOLIO_FILE = path.join(DATA_DIR, "portfolios.json");
const WATCHLIST_FILE = path.join(DATA_DIR, "watchlists.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson<T>(file: string, fallback: T): T {
  ensureDir();
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(fallback, null, 2), "utf-8");
    return fallback;
  }
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(file: string, data: T) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

export function readPortfolioDB(): PortfolioDB {
  return readJson<PortfolioDB>(PORTFOLIO_FILE, { portfolios: [], holdings: [], transactions: [] });
}

export function writePortfolioDB(data: PortfolioDB) {
  writeJson(PORTFOLIO_FILE, data);
}

export function readWatchlistDB(): WatchlistDB {
  return readJson<WatchlistDB>(WATCHLIST_FILE, { watchlists: [], items: [] });
}

export function writeWatchlistDB(data: WatchlistDB) {
  writeJson(WATCHLIST_FILE, data);
}

export function getUserIdFromRequestHeader(userHeader: string | null): string {
  return userHeader?.trim() || "demo-user";
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
