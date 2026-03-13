import { NextRequest, NextResponse } from "next/server";
import { quoteRaw, quoteSummaryRaw } from "@/lib/yahoo";
import { fetchSecFinancials, type SecFinancials } from "@/lib/sec-xbrl";
import { fetchKrFinancials, type DartFinancials } from "@/lib/dart-financial";

type Obj = { [key: string]: unknown };

function raw(v: unknown): number | null {
  if (v && typeof v === "object" && "raw" in (v as Obj)) return (v as Obj).raw as number;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

function fmt(v: unknown): string {
  if (v && typeof v === "object" && "fmt" in (v as Obj)) return String((v as Obj).fmt ?? "");
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return "";
}

function g(obj: Obj | undefined | null, key: string): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  return (obj as Obj)[key];
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

async function translateToKorean(text: string): Promise<string> {
  if (!text || text.length < 10) return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=${encodeURIComponent(text.slice(0, 4000))}`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return text;
    const json = await res.json();
    const translated = (json?.[0] as [string][] | undefined)?.map((s) => s[0]).join("") ?? text;
    return translated || text;
  } catch {
    return text;
  }
}

/**
 * Picks the best value from multiple sources.
 * Priority: SEC EDGAR / DART (regulatory filing) > Yahoo Finance (market data)
 * For market-derived metrics (price, volume, PE, etc.), Yahoo is preferred.
 */
function pickBest<T>(
  filingValue: T | null | undefined,
  yahooValue: T | null | undefined,
): { value: T; source: string } | null {
  if (filingValue != null) return { value: filingValue, source: "filing" };
  if (yahooValue != null) return { value: yahooValue, source: "yahoo" };
  return null;
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  const isKR = /\.(KS|KQ)$/i.test(symbol);
  const ticker = symbol.replace(/\..*$/, "");

  try {
    const yahooPromise = Promise.all([
      quoteRaw(symbol),
      quoteSummaryRaw(symbol).catch(() => null),
    ]);

    const filingPromise: Promise<SecFinancials | DartFinancials | null> = isKR
      ? fetchKrFinancials(symbol).catch(() => null)
      : fetchSecFinancials(ticker).catch(() => null);

    const [[q7, summary], filingData] = await Promise.all([yahooPromise, filingPromise]);

    if (!q7) return NextResponse.json({ error: "No quote data" }, { status: 404 });

    const sd = (summary ? g(summary as Obj, "summaryDetail") ?? {} : {}) as Obj;
    const ks = (summary ? g(summary as Obj, "defaultKeyStatistics") ?? {} : {}) as Obj;
    const fd = (summary ? g(summary as Obj, "financialData") ?? {} : {}) as Obj;
    const ce = (summary ? g(summary as Obj, "calendarEvents") ?? {} : {}) as Obj;
    const ap = (summary ? g(summary as Obj, "assetProfile") ?? g(summary as Obj, "summaryProfile") ?? {} : {}) as Obj;
    const et = (summary ? g(summary as Obj, "earningsTrend") ?? {} : {}) as Obj;
    const eh = (summary ? g(summary as Obj, "earningsHistory") ?? {} : {}) as Obj;
    const hasSummary = !!summary;

    const earnings = (g(ce, "earnings") ?? {}) as Obj;
    const earningsDateArr = g(earnings, "earningsDate") as Obj[] | undefined;
    const earningsStart = earningsDateArr?.[0] ? fmt(earningsDateArr[0]) : (q7.earningsTimestamp ? new Date(Number(q7.earningsTimestamp) * 1000).toISOString() : "");
    const earningsEnd = earningsDateArr?.[1] ? fmt(earningsDateArr[1]) : (q7.earningsTimestampEnd ? new Date(Number(q7.earningsTimestampEnd) * 1000).toISOString() : earningsStart);

    const v = (key: string) => q7[key];

    // --- Build source tracking ---
    const dataSources: Record<string, string> = {};
    const sec = filingData && "capex" in filingData ? (filingData as SecFinancials) : null;
    const dart = filingData && "source" in filingData && ((filingData as DartFinancials).source === "DART" || (filingData as DartFinancials).source === "네이버 금융")
      ? (filingData as DartFinancials)
      : null;

    const filingSource = sec ? "SEC EDGAR" : dart ? dart.source : null;

    // For financial fundamentals, prefer regulatory filing data
    const pickFinancial = (filingVal: number | null | undefined, yahooVal: number | null | undefined, field: string) => {
      const result = pickBest(filingVal, yahooVal);
      if (result) dataSources[field] = result.source === "filing" ? (filingSource ?? "Yahoo Finance") : "Yahoo Finance";
      return result?.value ?? null;
    };

    // Revenue, income, balance sheet from SEC/DART filings
    const filedRevenue = sec?.totalRevenue?.value ?? dart?.totalRevenue?.value ?? null;
    const filedNetIncome = sec?.netIncome?.value ?? dart?.netIncome?.value ?? null;
    const filedGrossProfit = sec?.grossProfit?.value ?? null;
    const filedOperatingIncome = sec?.operatingIncome?.value ?? dart?.operatingIncome?.value ?? null;
    const filedEbitda = sec?.ebitda?.value ?? null;
    const filedEPS = sec?.dilutedEPS?.value ?? dart?.dilutedEPS?.value ?? null;
    const filedTotalAssets = sec?.totalAssets?.value ?? dart?.totalAssets?.value ?? null;
    const filedTotalLiabilities = sec?.totalLiabilities?.value ?? dart?.totalLiabilities?.value ?? null;
    const filedEquity = sec?.stockholdersEquity?.value ?? dart?.stockholdersEquity?.value ?? null;
    const filedCash = sec?.totalCash?.value ?? null;
    const filedDebt = sec?.totalDebt?.value ?? dart?.totalDebt?.value ?? null;
    const filedShares = sec?.sharesOutstanding?.value ?? null;
    const filedOCF = sec?.operatingCashflow?.value ?? null;
    const filedFCF = sec?.freeCashflow ?? null;
    const filedDTE = sec?.debtToEquity ?? dart?.debtToEquity ?? null;
    const filedCurrentRatio = sec?.currentRatio?.value ?? null;
    const filedBookValue = sec?.bookValuePerShare ?? null;
    const filedROE = sec?.returnOnEquity ?? dart?.returnOnEquity ?? null;
    const filedROA = sec?.returnOnAssets ?? dart?.returnOnAssets ?? null;
    const filedProfitMargin = sec?.profitMargin ?? dart?.profitMargin ?? null;
    const filedGrossMargin = sec?.grossMargin ?? null;
    const filedOpMargin = sec?.operatingMargin ?? dart?.operatingMargin ?? null;

    const data: Record<string, unknown> = {
      // Market data (always from Yahoo - most current)
      dayLow: num(v("regularMarketDayLow")) ?? raw(g(sd, "dayLow")),
      dayHigh: num(v("regularMarketDayHigh")) ?? raw(g(sd, "dayHigh")),
      fiftyTwoWeekLow: num(v("fiftyTwoWeekLow")) ?? raw(g(sd, "fiftyTwoWeekLow")),
      fiftyTwoWeekHigh: num(v("fiftyTwoWeekHigh")) ?? raw(g(sd, "fiftyTwoWeekHigh")),
      previousClose: num(v("regularMarketPreviousClose")) ?? num(v("previousClose")) ?? raw(g(sd, "previousClose")),
      open: num(v("regularMarketOpen")) ?? raw(g(sd, "open")),
      volume: num(v("regularMarketVolume")) ?? raw(g(sd, "volume")),
      averageVolume: num(v("averageDailyVolume3Month")) ?? raw(g(sd, "averageVolume")),
      marketCap: num(v("marketCap")) ?? raw(g(sd, "marketCap")),
      beta: num(v("beta")) ?? raw(g(sd, "beta") ?? g(ks, "beta")),
      trailingPE: num(v("trailingPE")) ?? raw(g(sd, "trailingPE")),
      forwardDividendRate: num(v("dividendRate")) ?? raw(g(sd, "dividendRate")),
      forwardDividendYield: num(v("dividendYield")) ?? raw(g(sd, "dividendYield")),
      earningsStart,
      earningsEnd,
      targetMeanPrice: num(v("targetMeanPrice")) ?? raw(g(fd, "targetMeanPrice")),
      currentPrice: num(v("regularMarketPrice")) ?? raw(g(fd, "currentPrice")),
      forwardPE: num(v("forwardPE")) ?? raw(g(ks, "forwardPE") ?? g(sd, "forwardPE")),
      pegRatio: num(v("pegRatio")) ?? raw(g(ks, "pegRatio")),
      priceToSalesTrailing12Months: num(v("priceToSalesTrailing12Months")) ?? raw(g(sd, "priceToSalesTrailing12Months")),
      priceToBook: num(v("priceToBook")) ?? raw(g(ks, "priceToBook")),

      // Market data sources
      ...(() => {
        for (const k of [
          "dayLow", "dayHigh", "fiftyTwoWeekLow", "fiftyTwoWeekHigh", "previousClose", "open",
          "volume", "averageVolume", "marketCap", "beta", "trailingPE", "forwardPE",
          "forwardDividendRate", "forwardDividendYield", "targetMeanPrice", "currentPrice",
          "pegRatio", "priceToSalesTrailing12Months", "priceToBook",
        ]) dataSources[k] = "Yahoo Finance";
        return {};
      })(),

      // Valuation (from Yahoo - market-derived)
      enterpriseValue: raw(g(ks, "enterpriseValue")),
      evToRevenue: raw(g(ks, "enterpriseToRevenue")),
      evToEbitda: raw(g(ks, "enterpriseToEbitda")),

      // Financial fundamentals (prefer SEC/DART filing data)
      fiscalYearEnd: hasSummary ? fmt(g(ks, "lastFiscalYearEnd")) : "",
      mostRecentQuarter: hasSummary ? fmt(g(ks, "mostRecentQuarter")) : "",
      profitMargin: pickFinancial(filedProfitMargin, raw(g(fd, "profitMargins")), "profitMargin"),
      operatingMargin: pickFinancial(filedOpMargin, raw(g(fd, "operatingMargins")), "operatingMargin"),
      returnOnAssets: pickFinancial(filedROA, raw(g(fd, "returnOnAssets")), "returnOnAssets"),
      returnOnEquity: pickFinancial(filedROE, raw(g(fd, "returnOnEquity")), "returnOnEquity"),
      totalRevenue: pickFinancial(filedRevenue, raw(g(fd, "totalRevenue")), "totalRevenue"),
      revenuePerShare: raw(g(fd, "revenuePerShare")),
      quarterlyRevenueGrowth: raw(g(fd, "revenueGrowth")),
      grossProfit: pickFinancial(filedGrossProfit, raw(g(fd, "grossProfits")), "grossProfit"),
      ebitda: pickFinancial(filedEbitda, raw(g(fd, "ebitda")), "ebitda"),
      netIncomeToCommon: pickFinancial(filedNetIncome, raw(g(ks, "netIncomeToCommon")), "netIncomeToCommon"),
      dilutedEPS: pickFinancial(filedEPS, num(v("epsTrailingTwelveMonths")) ?? raw(g(ks, "trailingEps")), "dilutedEPS"),
      quarterlyEarningsGrowth: raw(g(ks, "earningsQuarterlyGrowth")),

      totalCash: pickFinancial(filedCash, raw(g(fd, "totalCash")), "totalCash"),
      totalCashPerShare: raw(g(fd, "totalCashPerShare")),
      totalDebt: pickFinancial(filedDebt, raw(g(fd, "totalDebt")), "totalDebt"),
      debtToEquity: pickFinancial(filedDTE, raw(g(fd, "debtToEquity")), "debtToEquity"),
      currentRatio: pickFinancial(filedCurrentRatio, raw(g(fd, "currentRatio")), "currentRatio"),
      bookValue: pickFinancial(filedBookValue, num(v("bookValue")) ?? raw(g(ks, "bookValue")), "bookValue"),

      operatingCashflow: pickFinancial(filedOCF, raw(g(fd, "operatingCashflow")), "operatingCashflow"),
      freeCashflow: pickFinancial(filedFCF, raw(g(fd, "freeCashflow")), "freeCashflow"),

      // SEC-specific additional data
      operatingIncome: filedOperatingIncome,
      totalAssets: filedTotalAssets,
      totalLiabilities: filedTotalLiabilities,
      stockholdersEquity: filedEquity,

      fiftyTwoWeekChange: raw(g(ks, "52WeekChange")) ?? (() => {
        const p = num(v("fiftyTwoWeekChangePercent"));
        return p != null ? p / 100 : null;
      })(),
      sp50052WeekChange: raw(g(ks, "SandP52WeekChange")),
      fiftyDayAverage: num(v("fiftyDayAverage")) ?? raw(g(sd, "fiftyDayAverage")),
      twoHundredDayAverage: num(v("twoHundredDayAverage")) ?? raw(g(sd, "twoHundredDayAverage")),
      averageVolume10Day: num(v("averageDailyVolume10Day")) ?? raw(g(sd, "averageDailyVolume10Day")),
      sharesOutstanding: pickFinancial(filedShares, num(v("sharesOutstanding")) ?? raw(g(ks, "sharesOutstanding")), "sharesOutstanding"),
      impliedSharesOutstanding: raw(g(ks, "impliedSharesOutstanding")),
      floatShares: raw(g(ks, "floatShares")),
      heldPercentInsiders: raw(g(ks, "heldPercentInsiders")),
      heldPercentInstitutions: raw(g(ks, "heldPercentInstitutions")),
      sharesShort: raw(g(ks, "sharesShort")),
      shortRatio: raw(g(ks, "shortRatio")),
      sharesShortPriorMonth: raw(g(ks, "sharesShortPriorMonth")),

      trailingAnnualDividendRate: num(v("trailingAnnualDividendRate")) ?? raw(g(sd, "trailingAnnualDividendRate")),
      trailingAnnualDividendYield: num(v("trailingAnnualDividendYield")) ?? raw(g(sd, "trailingAnnualDividendYield")),
      fiveYearAvgDividendYield: raw(g(sd, "fiveYearAvgDividendYield")),
      payoutRatio: raw(g(sd, "payoutRatio")),
      dividendDate: v("dividendDate") ? new Date(Number(v("dividendDate")) * 1000).toISOString() : fmt(g(sd, "dividendDate")),
      exDividendDate: v("exDividendDate") ? new Date(Number(v("exDividendDate")) * 1000).toISOString() : fmt(g(sd, "exDividendDate")),
      lastSplitFactor: String(g(ks, "lastSplitFactor") ?? ""),
      lastSplitDate: fmt(g(ks, "lastSplitDate")),

      netAssets: raw(g(sd, "totalAssets")),
      navPrice: raw(g(sd, "navPrice")),
      expenseRatio: raw(g(ks, "annualReportExpenseRatio") ?? g(sd, "annualReportExpenseRatio")),
      currency: String(v("currency") ?? v("financialCurrency") ?? "USD"),

      companyName: String(v("longName") ?? v("shortName") ?? g(ap, "longName") ?? g(ap, "shortName") ?? ""),
      sector: String(g(ap, "sector") ?? v("sector") ?? ""),
      industry: String(g(ap, "industry") ?? v("industry") ?? ""),
      city: String(g(ap, "city") ?? ""),
      state: String(g(ap, "state") ?? ""),
      country: String(g(ap, "country") ?? ""),
      website: String(g(ap, "website") ?? ""),
      longBusinessSummary: "",
      fullTimeEmployees: num(g(ap, "fullTimeEmployees") as number) ?? null,

      grossMargin: pickFinancial(filedGrossMargin, raw(g(fd, "grossMargins")), "grossMargin"),
      roic: (() => {
        const ebit = filedOperatingIncome ?? raw(g(fd, "operatingIncome")) ?? raw(g(fd, "ebit"));
        if (ebit == null) return null;
        const rawTaxRate = raw(g(fd, "taxRate"));
        const taxRate = rawTaxRate != null
          ? Math.abs(rawTaxRate > 1 ? rawTaxRate / 100 : rawTaxRate)
          : 0.21;
        const nopat = ebit * (1 - taxRate);
        const bookEquity = filedEquity ?? raw(g(fd, "totalStockholderEquity"));
        const totalDebt = filedDebt ?? raw(g(fd, "totalDebt"));
        const cash = filedCash ?? raw(g(fd, "totalCash"));
        if (bookEquity == null && totalDebt == null) return null;
        const investedCapital = (totalDebt ?? 0) + (bookEquity ?? 0) - (cash ?? 0);
        if (investedCapital <= 0) return null;
        return nopat / investedCapital;
      })(),

      revenueGrowth: raw(g(fd, "revenueGrowth")),
      earningsGrowth: raw(g(fd, "earningsGrowth")),

      ...(() => {
        const trends = g(et, "trend") as Obj[] | undefined;
        const currentTrend = trends?.find((t: Obj) => String(g(t, "period")) === "0q") as Obj | undefined;
        const epsEst = currentTrend ? raw(g(currentTrend, "earningsEstimate") ? g(g(currentTrend, "earningsEstimate") as Obj, "avg") : undefined) : null;
        const revEst = currentTrend ? raw(g(currentTrend, "revenueEstimate") ? g(g(currentTrend, "revenueEstimate") as Obj, "avg") : undefined) : null;

        const history = g(eh, "history") as Obj[] | undefined;
        const lastEarnings = history?.[history.length - 1] as Obj | undefined;
        const epsActual = lastEarnings ? raw(g(lastEarnings, "epsActual")) : null;
        const epsExpected = lastEarnings ? raw(g(lastEarnings, "epsEstimate")) : null;
        const epsSurprise = lastEarnings ? raw(g(lastEarnings, "surprisePercent")) : null;

        return {
          epsEstimate: epsEst,
          revenueEstimate: revEst,
          lastEpsActual: epsActual,
          lastEpsEstimate: epsExpected,
          epsSurprisePercent: epsSurprise,
        };
      })(),

      hasSummary,

      // Data source metadata
      dataSources,
      filingSource: filingSource ?? null,
      filingPeriod: sec?.lastFilingDate ?? dart?.lastFilingDate ?? null,
    };

    if (filedOperatingIncome) dataSources["operatingIncome"] = filingSource ?? "Filing";
    if (filedTotalAssets) dataSources["totalAssets"] = filingSource ?? "Filing";
    if (filedTotalLiabilities) dataSources["totalLiabilities"] = filingSource ?? "Filing";
    if (filedEquity) dataSources["stockholdersEquity"] = filingSource ?? "Filing";

    const rawSummary = String(g(ap, "longBusinessSummary") ?? "");
    const rawSector = data.sector as string;
    const rawIndustry = data.industry as string;

    const [translatedSummary, translatedSector, translatedIndustry] = await Promise.all([
      rawSummary ? translateToKorean(rawSummary) : Promise.resolve(""),
      rawSector ? translateToKorean(rawSector) : Promise.resolve(""),
      rawIndustry ? translateToKorean(rawIndustry) : Promise.resolve(""),
    ]);

    data.longBusinessSummary = translatedSummary;
    if (translatedSector) data.sector = translatedSector;
    if (translatedIndustry) data.industry = translatedIndustry;

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
