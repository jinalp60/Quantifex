import YahooFinance from 'yahoo-finance2'

// yahoo-finance2 v3+ requires an explicit instance
const yahooFinance = new YahooFinance()

export interface Fundamentals {
  dividendYieldPct: number | null
  dividendPerShare: number | null
  peRatio: number | null
  forwardPE: number | null
  earningsGrowth: number | null
  revenueGrowth: number | null
  dcfValue: number | null
  notes: string
}

/**
 * Fetch fundamental metrics (dividends, P/E, growth) and compute a simple
 * dividend-discount (DCF-style) reference value when possible.
 *
 * This is purely informational and does NOT make buy/sell recommendations.
 */
export async function fetchFundamentals(symbol: string): Promise<Fundamentals | null> {
  const symbolUpper = symbol.toUpperCase()

  try {
    console.log("calling fundas");
    // Use quoteSummary to retrieve detailed fundamental modules
    const summaryResult: any = await yahooFinance.quoteSummary(symbolUpper, {
      // include price in case some ratios live there; add financialData + stats + summary
      modules: ['price', 'summaryDetail', 'defaultKeyStatistics', 'financialData'] as any,
    })

    // v3 can return either { result: [ ... ] } or a direct object; handle both
    const result = summaryResult?.result?.[0] ?? summaryResult ?? {}
    const summary = result.summaryDetail ?? {}
    const stats = result.defaultKeyStatistics ?? {}
    const fin = result.financialData ?? {}

    // Yield: prefer trailing annual yield; fall back to stated dividendYield
    const rawDividendYield =
      summary.trailingAnnualDividendYield ??
      summary.dividendYield ??
      stats.trailingAnnualDividendYield ??
      stats.dividendYield
    const dividendYieldPct =
      rawDividendYield != null ? Math.round(Number(rawDividendYield) * 10000) / 100 : null

    // Dividend per share: trailingAnnualDividendRate or stated dividendRate
    const rawDividendRate =
      summary.trailingAnnualDividendRate ??
      summary.dividendRate ??
      stats.trailingAnnualDividendRate ??
      stats.dividendRate
    const dividendPerShare =
      rawDividendRate != null ? Math.round(Number(rawDividendRate) * 100) / 100 : null

    // P/E ratios
    const pe =
      summary.trailingPE ??
      summary.peRatio ??
      stats.trailingPE ??
      stats.peRatio ??
      fin.trailingPE ??
      null
    const peRatio = pe != null ? Math.round(Number(pe) * 100) / 100 : null

    const forward =
      summary.forwardPE ??
      stats.forwardPE ??
      fin.forwardPE ??
      null
    const forwardPE = forward != null ? Math.round(Number(forward) * 100) / 100 : null

    const earningsGrowth =
      fin.earningsGrowth != null
        ? Math.round(Number(fin.earningsGrowth) * 10000) / 100
        : stats.earningsGrowth != null
        ? Math.round(Number(stats.earningsGrowth) * 10000) / 100
        : null // percent

    const revenueGrowth =
      fin.revenueGrowth != null
        ? Math.round(Number(fin.revenueGrowth) * 10000) / 100
        : null // percent

    // Simple dividend discount model (Gordon growth) used as a reference only.
    let dcfValue: number | null = null
    if (dividendPerShare != null) {
      const requiredReturn = 0.08 // 8% required return
      const growthRate =
        earningsGrowth != null
          ? Math.min(Math.max(earningsGrowth / 100, 0), 0.05)
          : revenueGrowth != null
          ? Math.min(Math.max(revenueGrowth / 100, 0), 0.05)
          : 0.02 // conservative default 2%

      if (growthRate < requiredReturn) {
        dcfValue =
          Math.round(
            (dividendPerShare * (1 + growthRate) / (requiredReturn - growthRate)) * 100
          ) / 100
      }
    }

    const notesParts: string[] = []

    if (dividendYieldPct != null) {
      notesParts.push(
        `The stock currently offers an estimated dividend yield of approximately ${dividendYieldPct.toFixed(
          2
        )}%.`
      )
    }

    if (peRatio != null) {
      notesParts.push(
        `The trailing P/E ratio is around ${peRatio.toFixed(
          2
        )}, which can be compared to its sector or market averages for context.`
      )
    }

    if (earningsGrowth != null) {
      notesParts.push(
        `Recent earnings growth is approximately ${earningsGrowth.toFixed(
          2
        )}% per year, based on the latest available data.`
      )
    } else if (revenueGrowth != null) {
      notesParts.push(
        `Recent revenue growth is approximately ${revenueGrowth.toFixed(
          2
        )}% per year, based on the latest available data.`
      )
    }

    if (dcfValue != null) {
      notesParts.push(
        `Using a simplified dividend-discount (DCF-style) model with conservative assumptions, a reference value of approximately $${dcfValue.toFixed(
          2
        )} per share is estimated. This is an analytical reference point, not a price target or recommendation.`
      )
    }

    const notes =
      notesParts.length > 0
        ? notesParts.join(' ')
        : 'Fundamental data is limited or unavailable for this symbol, so only price-based analysis is shown.'

    return {
      dividendYieldPct,
      dividendPerShare,
      peRatio,
      forwardPE,
      earningsGrowth,
      revenueGrowth,
      dcfValue,
      notes,
    }
  } catch (error) {
    console.error(`Error fetching fundamentals for ${symbolUpper}:`, error)
    return null
  }
}


