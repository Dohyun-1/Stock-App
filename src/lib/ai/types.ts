export type MarketSnapshot = {
  symbol: string;
  companyName: string;
  sector: string;
  price: number;
  marketCap: number;
  volume: number;
  volatility: number;
  momentum: number;
  liquidity: number;
};

export type PortfolioInput = {
  holdings: { symbol: string; sector: string; weight: number; value: number }[];
};

export type EconomicEventInput = {
  event_name: string;
  date: string;
  importance: "low" | "medium" | "high";
  expected_value: string;
  previous_value: string;
};

export type PortfolioAnalysis = {
  diversification: number;
  riskConcentration: number;
  sectorExposure: Record<string, number>;
  volatilityRisk: number;
  portfolioScore: number;
  riskWarnings: string[];
  improvementSuggestions: string[];
};

export type AgentOpinion = {
  agentName: "Value Investor" | "Macro Investor" | "Growth Investor" | "Momentum Trader" | "Risk Manager";
  symbol: string;
  action: "buy" | "sell" | "hold";
  confidence: number;
  rationale: string;
};

export type DebateResult = {
  initialOpinions: AgentOpinion[];
  critiques: { from: string; to: string; symbol: string; challenge: string }[];
  defenses: { agent: string; symbol: string; defense: string }[];
  finalRecommendations: AgentOpinion[];
  consensusScore: number;
};

export type RecommendationOutput = {
  portfolio_score: number;
  portfolio_score_max: number;
  risk_warnings: string[];
  improvement_suggestions: string[];
  recommended_trades: { symbol: string; action: "buy" | "sell" | "hold"; reason: string }[];
  portfolio_adjustments: string[];
  risk_alerts: string[];
  confidence_score: number;
  confidence_score_max: number;
  symbol_evidence: Record<
    string,
    {
      final_action: "buy" | "sell" | "hold";
      why: string;
      agent_opinions: { agent: string; action: "buy" | "sell" | "hold"; confidence: number; rationale: string }[];
    }
  >;
  debate: DebateResult;
};
