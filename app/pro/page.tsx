/* FILE: app/pro/page.tsx */

import Image from "next/image";
import MembersClient from "./MembersClient";

/** 
 * Paste this ENTIRE array in place of the truncated example.
 */
const FULL_SERIES_LIST = [
  { series_id: "A191RL1A225NBEA", description: "Real Personal Consumption Expenditures" },
  { series_id: "AHETPI", description: "\"Average Hourly Earnings: Total Private, All Employees\"" },
  { series_id: "AWHMAN", description: "Average Weekly Hours of Manufacturing Employees: Total Private" },
  { series_id: "AWHNONAG", description: "Average Weekly Hours of Production and Nonsupervisory Employees: Total Private" },
  { series_id: "BUSINV", description: "Business Inventories" },
  { series_id: "CFNAI", description: "Chicago Fed National Activity Index" },
  { series_id: "CIVPART", description: "Civilian Employment–Population Ratio" },
  { series_id: "CLF16OV", description: "Civilian Labor Force" },
  { series_id: "CP", description: "Corporate Profits After Tax (Seasonally Adjusted)" },
  { series_id: "CPIAUCSL", description: "Consumer Price Index for All Urban Consumers: All Items" },
  { series_id: "CPILFESL", description: "Core Consumer Price Index (Excludes Food and Energy)" },
  { series_id: "CSUSHPINSA", description: "S&P/Case‑Shiller U.S. National Home Price Index" },
  { series_id: "CUSR0000SEHA", description: "Consumer Price Index for Urban Wage Earners and Clerical Workers: All Items" },
  { series_id: "DCOILWTICO", description: "West Texas Intermediate (WTI) Crude Oil Price" },
  { series_id: "DGORDER", description: "Durable Goods Orders" },
  { series_id: "DGS10", description: "10‑Year Treasury Constant Maturity Rate" },
  { series_id: "DGS1MO", description: "1‑Month Treasury Constant Maturity Rate" },
  { series_id: "DGS2", description: "2‑Year Treasury Constant Maturity Rate" },
  { series_id: "DGS30", description: "30‑Year Treasury Constant Maturity Rate" },
  { series_id: "DGS3MO", description: "3‑Month Treasury Bill: Secondary Market Rate" },
  { series_id: "DGS5", description: "5‑Year Treasury Constant Maturity Rate" },
  { series_id: "DGS6MO", description: "6‑Month Treasury Bill: Secondary Market Rate" },
  { series_id: "DHHNGSP", description: "Henry Hub Natural Gas Spot Price" },
  { series_id: "DJIA", description: "Dow Jones Industrial Average" },
  { series_id: "DSPIC96", description: "Real Disposable Personal Income" },
  { series_id: "EXHOSLUSM495S", description: "Existing Home Sales" },
  { series_id: "EXPGS", description: "Exports of Goods and Services" },
  { series_id: "FEDFUNDS", description: "Effective Federal Funds Rate" },
  { series_id: "GDP", description: "Gross Domestic Product (Nominal)" },
  { series_id: "GDPC1", description: "Real Gross Domestic Product (Chained 2012 Dollars)" },
  { series_id: "GDPCA", description: "Gross Domestic Product: Chain-type Price Index" },
  { series_id: "GDPDEF", description: "Gross Domestic Product Deflator" },
  { series_id: "GDPPOT", description: "Potential Gross Domestic Product" },
  { series_id: "GFDEBTN", description: "Federal Debt: Total Public Debt" },
  { series_id: "GNPCA", description: "Gross National Product, Chain-type Price Index" },
  { series_id: "GPDI", description: "Gross Private Domestic Investment" },
  { series_id: "HOUST", description: "Housing Starts" },
  { series_id: "ICSA", description: "Initial Unemployment Claims" },
  { series_id: "IMPGS", description: "Imports of Goods and Services" },
  { series_id: "INDPRO", description: "Industrial Production Index" },
  { series_id: "IPFINAL", description: "Industrial Production: Final Products" },
  { series_id: "IPMAN", description: "Industrial Production: Manufacturing" },
  { series_id: "IPMANNS", description: "Industrial Production: Manufacturing (Not Seasonally Adjusted)" },
  { series_id: "JTSJOL", description: "Job Openings (JOLTS)" },
  { series_id: "M1REAL", description: "Real M1 Money Stock" },
  { series_id: "M1SL", description: "M1 Money Stock" },
  { series_id: "M2REAL", description: "Real M2 Money Stock" },
  { series_id: "M2SL", description: "M2 Money Stock" },
  { series_id: "MORTGAGE15US", description: "15‑Year Fixed Rate Mortgage Average" },
  { series_id: "MORTGAGE30US", description: "30‑Year Fixed Rate Mortgage Average" },
  { series_id: "NETEXP", description: "Net Exports of Goods and Services" },
  { series_id: "NFCI", description: "National Financial Conditions Index" },
  { series_id: "PAYEMS", description: "Total Nonfarm Payrolls" },
  { series_id: "PAYNSA", description: "Total Nonfarm Payrolls: Not Seasonally Adjusted" },
  { series_id: "PCEC", description: "Personal Consumption Expenditures" },
  { series_id: "PCEPI", description: "Personal Consumption Expenditures: Price Index" },
  { series_id: "PERMITNSA", description: "New Private Housing Units Authorized by Building Permits" },
  { series_id: "PI", description: "Personal Income" },
  { series_id: "PPIACO", description: "Producer Price Index for All Commodities" },
  { series_id: "PPIITM", description: "Producer Price Index: Intermediate Materials" },
  { series_id: "PSAVERT", description: "Personal Savings Rate" },
  { series_id: "RECPROUSM156N", description: "Real Estate Price Index: U.S. All-Transactions" },
  { series_id: "RSAFS", description: "Retail Sales" },
  { series_id: "SP500", description: "S&P 500 Index" },
  { series_id: "STLFSI", description: "St. Louis Financial Stress Index" },
  { series_id: "T10Y2Y", description: "10‑Year Treasury Minus 2‑Year Treasury Yield Spread" },
  { series_id: "T10YIE", description: "10‑Year Breakeven Inflation Rate" },
  { series_id: "T5YIE", description: "5‑Year Breakeven Inflation Rate" },
  { series_id: "TCU", description: "Capacity Utilization: Total Industry" },
  { series_id: "TEDRATE", description: "TED Spread" },
  { series_id: "TOTALSA", description: "Total Vehicle Sales" },
  { series_id: "TOTALSL", description: "Consumer Credit Outstanding (Total)" },
  { series_id: "TOTCI", description: "Total Construction Spending" },
  { series_id: "TWEXB", description: "Trade Weighted U.S. Dollar Index" },
  { series_id: "U6RATE", description: "U6 Unemployment Rate" },
  { series_id: "UMCSENT", description: "University of Michigan Consumer Sentiment Index" },
  { series_id: "UNRATE", description: "Civilian Unemployment Rate" },
  { series_id: "UNRATENSA", description: "Civilian Unemployment Rate: Not Seasonally Adjusted" },
  { series_id: "USREC", description: "US Recession Probabilities (NBER-based)" },
  { series_id: "VIXCLS", description: "CBOE Volatility Index" },
  { series_id: "W875RX1", description: "Federal Surplus/Deficit as Percent of GDP" },
  { series_id: "WALCL", description: "Total Assets of the Federal Reserve (H.4.1 Data)" },
];

export default async function ProPage() {
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Centered Logo Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image
                src="/prettyfred-logo.png"
                alt="PrettyFRED Logo"
                width={600}
                height={300}
                priority
              />
            </div>
          </div>

          {/* Pass your full array to MembersClient */}
          <MembersClient allSeriesList={FULL_SERIES_LIST} />
        </div>
      </div>

      {/* Footer links with bottom spacing */}
      <footer className="mt-8 mb-8 flex justify-center space-x-6">
        <a href="/privacy-policy" className="underline">
          Privacy Policy
        </a>
        <a href="/terms-of-service" className="underline">
          Terms of Service
        </a>
        <a
          href="https://billing.stripe.com/p/login/bIYcNjb9M6id5Og7ss"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Manage Subscription
        </a>
      </footer>
    </>
  );
}