/**
 * DART (Data Analysis, Retrieval and Transfer) Open API
 * 한국 상장기업의 공식 재무제표 데이터를 금융감독원 전자공시시스템에서 가져옵니다.
 *
 * API: https://opendart.fss.or.kr/api/fnlttSinglAcnt.json
 * Requires: DART_API_KEY environment variable
 *
 * Fallback: DART API 키가 없으면 네이버 금융에서 재무 데이터를 스크래핑합니다.
 */

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

export type DartFinancials = {
  entityName: string;
  totalRevenue: { value: number; period: string } | null;
  netIncome: { value: number; period: string } | null;
  totalAssets: { value: number; period: string } | null;
  totalLiabilities: { value: number; period: string } | null;
  stockholdersEquity: { value: number; period: string } | null;
  operatingIncome: { value: number; period: string } | null;
  totalDebt: { value: number; period: string } | null;
  dilutedEPS: { value: number; period: string } | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;
  profitMargin: number | null;
  debtToEquity: number | null;
  operatingMargin: number | null;
  lastFilingDate: string;
  source: "DART" | "네이버 금융";
};

type DartAccount = {
  rcept_no: string;
  bsns_year: string;
  stock_code: string;
  reprt_code: string;
  account_nm: string;
  fs_div: string; // CFS = consolidated, OFS = individual
  sj_div: string; // IS = income statement, BS = balance sheet
  thstrm_amount: string; // current period amount
  frmtrm_amount?: string; // previous period amount
};

function parseAmount(s: string | undefined): number | null {
  if (!s) return null;
  const cleaned = s.replace(/,/g, "").trim();
  if (!cleaned || cleaned === "-" || cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

async function fetchDartFinancials(stockCode: string): Promise<DartFinancials | null> {
  const apiKey = process.env.DART_API_KEY;
  if (!apiKey) return null;

  const code = stockCode.replace(/\.(KS|KQ)$/i, "");
  const year = new Date().getFullYear();
  const reprtCodes = ["11011", "11014", "11012", "11013"]; // Annual, Q3, Q2, Q1

  for (const reprtCode of reprtCodes) {
    for (const yr of [year, year - 1]) {
      try {
        const url = `https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?crtfc_key=${apiKey}&corp_code=&stock_code=${code}&bsns_year=${yr}&reprt_code=${reprtCode}&fs_div=CFS`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) continue;
        const json = await res.json();
        if (json.status !== "000" || !json.list?.length) continue;

        const accounts: DartAccount[] = json.list;
        const find = (sj: string, name: string) => {
          const match = accounts.find(
            (a) => a.sj_div === sj && a.account_nm.includes(name) && a.fs_div === "CFS"
          );
          if (!match) return null;
          const val = parseAmount(match.thstrm_amount);
          if (val == null) return null;
          return { value: val, period: `${yr}` };
        };

        const revenue = find("IS", "매출액") ?? find("IS", "수익(매출액)") ?? find("IS", "영업수익");
        const netInc = find("IS", "당기순이익") ?? find("IS", "당기순손익");
        const opInc = find("IS", "영업이익") ?? find("IS", "영업손익");
        const assets = find("BS", "자산총계");
        const liabilities = find("BS", "부채총계");
        const equity = find("BS", "자본총계");

        if (!revenue && !assets) continue;

        const borrowings = find("BS", "차입금") ?? find("BS", "단기차입금");
        const bonds = find("BS", "사채");
        const longTermDebt = find("BS", "장기차입금");
        const financialDebt = (() => {
          const parts = [borrowings, bonds, longTermDebt].filter(Boolean);
          if (parts.length === 0) return null;
          const total = parts.reduce((s, p) => s + p!.value, 0);
          return { value: total, period: parts[0]!.period };
        })();

        const roeVal = netInc && equity && equity.value > 0 ? netInc.value / equity.value : null;
        const roaVal = netInc && assets && assets.value > 0 ? netInc.value / assets.value : null;
        const pmVal = netInc && revenue && revenue.value > 0 ? netInc.value / revenue.value : null;
        const debtForRatio = financialDebt ?? liabilities;
        const dteVal = debtForRatio && equity && equity.value > 0 ? (debtForRatio.value / equity.value) * 100 : null;
        const omVal = opInc && revenue && revenue.value > 0 ? opInc.value / revenue.value : null;

        const epsAccount = accounts.find(
          (a) => a.account_nm.includes("주당이익") && a.fs_div === "CFS"
        );
        const epsVal = epsAccount ? parseAmount(epsAccount.thstrm_amount) : null;

        return {
          entityName: "",
          totalRevenue: revenue,
          netIncome: netInc,
          totalAssets: assets,
          totalLiabilities: liabilities,
          stockholdersEquity: equity,
          operatingIncome: opInc,
          totalDebt: financialDebt ?? liabilities,
          dilutedEPS: epsVal ? { value: epsVal, period: `${yr}` } : null,
          returnOnEquity: roeVal,
          returnOnAssets: roaVal,
          profitMargin: pmVal,
          debtToEquity: dteVal,
          operatingMargin: omVal,
          lastFilingDate: `${yr}`,
          source: "DART",
        };
      } catch {
        continue;
      }
    }
  }
  return null;
}

async function fetchNaverFinancials(stockCode: string): Promise<DartFinancials | null> {
  try {
    const code = stockCode.replace(/\.(KS|KQ)$/i, "");
    const url = `https://finance.naver.com/item/main.naver?code=${code}`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    const extractNum = (pattern: RegExp): number | null => {
      const match = html.match(pattern);
      if (!match) return null;
      const val = match[1].replace(/,/g, "").trim();
      const n = Number(val);
      return Number.isFinite(n) ? n : null;
    };

    const roeMatch = html.match(/ROE\s*<[^>]*>\s*([\d.,\-]+)/);
    const roeVal = roeMatch ? Number(roeMatch[1].replace(/,/g, "")) / 100 : null;

    const perMatch = html.match(/PER\s*<[^>]*>\s*([\d.,\-]+)/);
    const per = perMatch ? Number(perMatch[1].replace(/,/g, "")) : null;

    const epsMatch = html.match(/EPS\s*<[^>]*>\s*([\d.,\-]+)/);
    const eps = epsMatch ? Number(epsMatch[1].replace(/,/g, "")) : null;

    const _ = extractNum; // suppress unused warning
    void _;
    void per;

    return {
      entityName: "",
      totalRevenue: null,
      netIncome: null,
      totalAssets: null,
      totalLiabilities: null,
      stockholdersEquity: null,
      operatingIncome: null,
      totalDebt: null,
      dilutedEPS: eps ? { value: eps, period: new Date().getFullYear().toString() } : null,
      returnOnEquity: roeVal,
      returnOnAssets: null,
      profitMargin: null,
      debtToEquity: null,
      operatingMargin: null,
      lastFilingDate: new Date().getFullYear().toString(),
      source: "네이버 금융",
    };
  } catch {
    return null;
  }
}

export async function fetchKrFinancials(stockCode: string): Promise<DartFinancials | null> {
  const dart = await fetchDartFinancials(stockCode);
  if (dart) return dart;
  return fetchNaverFinancials(stockCode);
}
