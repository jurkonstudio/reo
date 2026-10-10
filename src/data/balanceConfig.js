// Every tunable number for the economy lives here.
export const START_CASH = 5_000_000; // cents ($50,000)
export const MARKET = {
  feeRate: 0.02,        // fee charged on gross value, both buying and selling
  spread: 0.08,         // ask = mid * (1 + spread/2), bid = mid * (1 - spread/2)
  volatility: 0.15,     // daily mid price = base * (1 +/- volatility), deterministic from seed+day
  historyDays: 14,
};
