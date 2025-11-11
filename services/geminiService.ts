import { GoogleGenAI, Type } from "@google/genai";
import { StockDataPoint, AIAnalysisResult, AIModel, CompanyProfile, NewsArticle, StockInfo, AIComprehensiveAnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    signal: {
      type: Type.STRING,
      description: "The trading signal: 'BUY', 'SELL', or 'HOLD'.",
      enum: ['BUY', 'SELL', 'HOLD'],
    },
    confidence: {
      type: Type.NUMBER,
      description: "Confidence score from 1 (low) to 5 (high)."
    },
    summary: {
      type: Type.ARRAY,
      description: "A list of 2-3 concise bullet points summarizing the key takeaways and reasoning for the signal.",
      items: {
        type: Type.STRING,
      },
    },
    entryPrice: {
      type: Type.NUMBER,
      description: "Suggested entry price for a BUY/SELL signal. Omit for HOLD."
    },
    targetPrice: {
      type: Type.NUMBER,
      description: "Potential profit-taking target price. Omit for HOLD."
    },
    stopLoss: {
      type: Type.NUMBER,
      description: "Suggested stop-loss price to manage risk. Omit for HOLD."
    },
    sellStrategy: {
      type: Type.STRING,
      description: "A concise, actionable strategy for when to sell or exit the position. For a BUY signal, suggest profit targets or stop-loss adjustments. For a SELL signal, suggest where to cover. For a HOLD, suggest what conditions would change the signal. E.g., 'Consider taking profit near the recent high of $175.50, or selling if the price drops below the 50-hour SMA.'"
    },
  },
  required: ['signal', 'confidence', 'summary'],
};

const comprehensiveAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        valuation: {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING, description: "A concise summary (2-3 sentences) of the company's current valuation status (e.g., overvalued, undervalued, fairly valued) and the primary reasons why." },
                keyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2-3 bullet points highlighting key valuation metrics or observations." }
            },
            required: ['summary', 'keyPoints']
        },
        financialHealth: {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING, description: "A brief summary of the company's financial health, mentioning cash flow, debt levels, and profitability." },
                keyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2-3 bullet points on specific financial strengths or weaknesses (e.g., 'Strong balance sheet with low debt-to-equity ratio.')." }
            },
            required: ['summary', 'keyPoints']
        },
        technologicalEdge: {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING, description: "An overview of the company's competitive advantage in terms of technology, innovation, or market position." },
                keyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2-3 bullet points detailing specific technological strengths, patents, or market leadership." }
            },
            required: ['summary', 'keyPoints']
        },
        riskFactors: {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING, description: "A summary of the primary risks facing the company, such as competition, regulatory issues, or market shifts." },
                keyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2-3 bullet points on specific, tangible risks." }
            },
            required: ['summary', 'keyPoints']
        },
        investmentThesis: {
            type: Type.STRING,
            description: "A concluding paragraph (4-5 sentences) summarizing the overall investment outlook. This should synthesize all the above points into a coherent, actionable thesis for a potential investor."
        },
    },
    required: ['valuation', 'financialHealth', 'technologicalEdge', 'riskFactors', 'investmentThesis']
};


const getPrompt = (
    ticker: string, 
    currentPrice: number, 
    historicalData: StockDataPoint[], 
    indicators: { [key: string]: number | null | undefined }
) => {
    const indicatorLabels: Record<string, string> = {
        sma10: '10-Hour Simple Moving Average (SMA10)',
        sma50: '50-Hour Simple Moving Average (SMA50)',
        rsi: '14-Hour Relative Strength Index (RSI)',
        macd: 'MACD Line (12-26 EMA)'
    };

    let indicatorText = Object.entries(indicators)
        .map(([key, value]) => {
            if (value !== null && value !== undefined) {
                return `- ${indicatorLabels[key] || key}: ${value.toFixed(2)}`;
            }
            return null;
        })
        .filter(Boolean)
        .join('\n');

    if (!indicatorText) {
        indicatorText = "No specific technical indicators were selected for this analysis. Analyze based on price and volume action alone.";
    }

    return `
    You are an expert stock market analyst AI for a sophisticated trading application. Your analysis must be purely technical and data-driven, based on the full historical context and the specific indicators provided.
    Your audience is experienced traders who need clear, actionable signals.

    Analyze the stock with ticker: ${ticker}
    Current Price: ${currentPrice.toFixed(2)}

    Hourly Data (Price and Volume) covering the last 100 hours:
    ${JSON.stringify(historicalData.slice(-100), null, 2)}
    
    Key Technical Indicators Provided:
    ${indicatorText}

    Task:
    Based *only* on the provided historical data and the selected indicators, generate a trading signal and an exit strategy.
    1.  **Analyze the Full History & Provided Indicators**: Look for long-term trends, support/resistance levels, chart patterns, and signals from the given indicators.
    2.  **Determine Signal**:
        - A BUY signal is appropriate in an uptrend, on a bullish breakout from a pattern, or a confirmed bounce from a strong support level, especially if confirmed by the provided indicators.
        - A SELL signal is appropriate in a downtrend, on a bearish breakdown, or a rejection from key resistance, especially if confirmed by the provided indicators.
        - A HOLD signal is appropriate in a sideways/consolidating market with no clear directional bias from the provided data.
    3.  **Define Exit Strategy**: Provide a clear \`sellStrategy\`. This is crucial.
        - For a BUY, when should the user take profit or cut losses?
        - For a SELL, define specific cover points. Crucially, if suggesting to cover, mention technical indicator conditions that would signal an exit, such as 'RSI moving above 50' or 'a bullish MACD crossover'.
        - For a HOLD, what price action would trigger a BUY or SELL? Be specific with price levels or indicator-based conditions.

    Provide your response as a JSON object that conforms to the specified schema. Do not add any extra commentary or disclaimers outside of the JSON structure.
  `;
}

const getComprehensivePrompt = (profile: CompanyProfile, news: NewsArticle[], info: StockInfo) => {
    // Sanitize news to avoid overly large payloads
    const summarizedNews = news.map(({ title, summary, publishedAt }) => ({ title, summary, publishedAt }));

    return `
    You are a senior financial analyst AI providing a deep-dive investment report for an experienced investor. Your analysis must be objective, data-driven, and based *only* on the comprehensive information provided below. Do not use any external knowledge.

    **Company Profile:**
    ${JSON.stringify(profile, null, 2)}

    **Recent News (last few days):**
    ${JSON.stringify(summarizedNews, null, 2)}

    **Current Market Data:**
    ${JSON.stringify({ price: info.price, change: info.change, changePercent: info.changePercent, volume: info.volume, marketCap: info.marketCap }, null, 2)}

    **Task:**
    Synthesize all the provided information to generate a structured investment report. Your report should be concise yet insightful.
    
    1.  **Valuation:** Assess if the company seems overvalued, undervalued, or fairly valued based on its profile (sector, industry) and market cap. Consider the news sentiment.
    2.  **Financial Health:** Analyze the company's description for clues about its financial stability. Is it a market leader? Does recent news suggest strength or weakness? Comment on potential debt or profitability based on the narrative.
    3.  **Technological Edge:** Based on the company description and news, identify its key technological advantages, innovations, or strong market position.
    4.  **Risk Factors:** Identify potential risks. Are there regulatory concerns mentioned in the news? Is there strong competition noted in its profile? Are there supply chain issues?
    5.  **Investment Thesis:** Conclude with a cohesive investment thesis that ties everything together. What is the overall story for this company as an investment right now?

    Provide your response as a single JSON object that conforms to the specified schema. Do not add any extra commentary, disclaimers, or markdown formatting outside of the JSON structure.
    `;
};


const getCustomModelAnalysis = async (model: AIModel, prompt: string): Promise<any> => {
    if (!model.url) {
        throw new Error("Custom model URL is not defined.");
    }
    
    // This payload structure is common for OpenAI-compatible APIs (like Ollama, LmStudio)
    const payload = {
        // model: model.id, // Some endpoints might require this, some infer from URL.
        messages: [
            {
                role: "system",
                content: "You are an expert stock market analyst AI. Your response must be a valid JSON object conforming to the user-provided schema. Do not add any extra text or markdown.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        temperature: 0.5,
        // response_format: { "type": "json_object" }, // Modern way, but not all servers support it
    };

    const response = await fetch(model.url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // 'Authorization': 'Bearer YOUR_API_KEY' // Needed for some services, but not typically for local ones.
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Custom model API request failed with status ${response.status}: ${errorBody}`);
    }
    
    const responseData = await response.json();
    
    // Response format can vary. Common paths are `choices[0].message.content` or `content`.
    // We will try to find the JSON string in the response.
    let jsonString: string;
    if (responseData.choices && responseData.choices[0] && responseData.choices[0].message) {
      jsonString = responseData.choices[0].message.content;
    } else if (responseData.content) {
      jsonString = responseData.content;
    } else {
      throw new Error("Unable to find valid content in custom model response.");
    }

    // The model might wrap the JSON in markdown backticks.
    const cleanedJsonString = jsonString.replace(/^```json\s*|```\s*$/g, '').trim();

    return JSON.parse(cleanedJsonString);
};

const getGoogleModelAnalysis = async (model: AIModel, prompt: string, schema: any): Promise<any> => {
    const response = await ai.models.generateContent({
        model: model.id,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        }
    });
    
    const resultJson = response.text.trim();
    return JSON.parse(resultJson);
};


export const getTradingAnalysis = async (
    ticker: string,
    historicalData: StockDataPoint[],
    indicators: {
        sma10?: number | null;
        sma50?: number | null;
        rsi?: number | null;
        macd?: number | null;
    },
    model: AIModel
): Promise<AIAnalysisResult> => {
    const currentPrice = historicalData[historicalData.length - 1].price;
    const prompt = getPrompt(ticker, currentPrice, historicalData, indicators);

    try {
        let result: AIAnalysisResult;
        if (model.provider === 'custom') {
            result = await getCustomModelAnalysis(model, prompt);
        } else {
            result = await getGoogleModelAnalysis(model, prompt, analysisSchema);
        }
        return result;
    } catch (error) {
        console.error("Error generating trading analysis:", error);
        if (error instanceof Error) {
            throw new Error(`AI Analysis Failed: ${error.message}`);
        }
        throw new Error("An unknown error occurred during AI analysis.");
    }
};

export const getComprehensiveCompanyAnalysis = async (
    profile: CompanyProfile,
    news: NewsArticle[],
    info: StockInfo,
    model: AIModel
): Promise<AIComprehensiveAnalysisResult> => {
    const prompt = getComprehensivePrompt(profile, news, info);
    try {
        let result: AIComprehensiveAnalysisResult;
        if (model.provider === 'custom') {
            result = await getCustomModelAnalysis(model, prompt);
        } else {
            result = await getGoogleModelAnalysis(model, prompt, comprehensiveAnalysisSchema);
        }
        return result;
    } catch (error) {
        console.error("Error generating comprehensive company analysis:", error);
        if (error instanceof Error) {
            throw new Error(`AI Company Analysis Failed: ${error.message}`);
        }
        throw new Error("An unknown error occurred during AI company analysis.");
    }
};


export const testCustomModelConnection = async (url: string): Promise<{ ok: boolean; message: string }> => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "health-check",
                messages: [{ role: "user", content: "Is this endpoint available? Respond with a single word." }],
                max_tokens: 5,
            }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
        }
        
        return { ok: true, message: 'Connection successful.' };

    } catch (error: any) {
        if (error.name === 'AbortError') {
            return { ok: false, message: 'Request timed out after 5 seconds.' };
        }
        return { ok: false, message: error.message || 'An unknown network error occurred.' };
    }
};