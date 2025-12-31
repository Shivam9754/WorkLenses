
import { AnalysisResult } from "../types";

// Backend API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Retry Helper
async function retryOperation<T>(operation: () => Promise<T>, retries = 2, delay = 2000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (retries <= 0) throw error;
    
    // Check if it's a network error
    const isNetworkError = error.message?.includes('fetch failed') || 
                           error.message?.includes('Network') || 
                           error.status === 503;
    
    if (isNetworkError) {
      console.warn(`[WorkLens] Network hiccup detected. Retrying intelligence link... Attempts left: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryOperation(operation, retries - 1, delay * 2); // Exponential backoff
    }
    
    throw error;
  }
}

/**
 * Perform a deep intelligence scan on the provided file using the WorkLens persona.
 * Now uses backend API to keep API keys secure.
 */
export const analyzeFileContent = async (
  fileName: string, 
  contentSnippet: string, 
  type: string,
  base64Data?: string,
  mimeType?: string
): Promise<AnalysisResult> => {
  
  const isMedia = type.includes('audio') || type.includes('video') || type.includes('mp4') || type.includes('mp3');
  
  // WorkLens Universal Analysis Prompt
  const prompt = `
    You are WorkLens, an elite Universal Analyst. 
    Target File: "${fileName}"
    ${!base64Data ? `Context Preview (Full analysis pending on backend): "${contentSnippet}"` : ''}

    **YOUR MISSION:** 
    1. **DETECT** the domain immediately (Is this a Legal Contract? Engineering Spec? Investment Deck? Fiction Manuscript? Academic Paper?).
    2. **ADOPT** the persona of the harshest, most expensive consultant in that field.
    3. **CRITIQUE** the content. Do not just summarize. Tear it apart. Find the holes.

    **STRICT OUTPUT FORMAT (Markdown):**
    Render your response in clean Markdown. Follow this structure exactly, adapting the bracketed terms to the detected domain:

    # 1. The Verdict (Big Picture)
    *   **Document Type:** [e.g., Series A Term Sheet / MRI Report / Screenplay]
    *   **Intended Audience:** [Who is this for?]
    *   **Quality Score:** [Rate 1-10 based on clarity and completeness]
    *   **Bottom Line:** [One brutal sentence summary. e.g., "Standard agreement, but Clause 4 is a trap." or "Great plot concept, but dialogue is weak."]

    ---

    # 2. Deep Dive Analysis (Section by Section)
    (Identify the top 3 critical themes/clauses/chapters and analyze them with high intensity:)

    ## 🔍 [Theme/Section Name]
    **✅ The Strong Points:**
    *   [What is accurate, well-written, or advantageous?]
    *   [Specific quote or data point that is solid]

    **⚠️ The Gaps & Weaknesses (CRITICAL):**
    *   [What is missing? What is vague?]
    *   [Where is the logic flawed?]
    *   [Legal/Business/Logic Risk: e.g., "No indemnity clause found" or "ROI calculation ignores inflation"]

    **💡 The "Pro" Insight:**
    *   [The secret sauce. A strategic tip, a negotiation counter-move, or an exam tip depending on context.]

    ---
    (Repeat for 2-3 more key sections)

    ---

    # 3. Final Action Plan
    *   **Immediate Action:** [The very next thing the user must do]
    *   **Hidden Risk:** [The biggest "Gotcha" in the file]
  `;

  try {
    const response = await retryOperation(async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          contentSnippet,
          type,
          base64Data,
          mimeType,
          prompt
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Analysis failed');
      }

      return res.json();
    });

    return { markdown: response.markdown || "Analysis failed to generate output." };

  } catch (e: any) {
    console.error("Gemini Analysis Error:", e);
    
    // Provide a user-friendly error
    if (e.message?.includes('fetch failed') || e.message?.includes('Network')) {
      return {
        markdown: `# Connection Issue\n\nUnable to connect to the analysis backend.\n\n**Action Required:**\n* Ensure the backend server is running on ${API_BASE_URL}\n* Check your network connection\n* Try again in a moment`
      };
    }

    return {
      markdown: `# Analysis Error\nThe intelligence engine encountered an unexpected error while processing ${fileName}.\n\nError details: ${String(e.message)}`
    };
  }
};

/**
 * Handles the GPT-style chat interaction for a specific file context.
 */
export const queryFileIntelligence = async (query: string, fileContext: string): Promise<string> => {
  try {
    const response = await retryOperation(async () => {
      const res = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: 'query',
          contentSnippet: fileContext,
          type: 'text',
          prompt: `
            System: You are WorkLens, a ruthless and precise Deal Intelligence Analyst.
            Document Context: ${fileContext}
            User Query: ${query}
            
            Response Protocol: Be concise. Focus on financial impact and legal risk. Use bullet points if listing items.
          `
        })
      });

      if (!res.ok) {
        throw new Error('Query failed');
      }

      return res.json();
    });
    
    return response.markdown || "I was unable to retrieve a specific answer from the intelligence pool.";
  } catch (error) {
    console.error("Chat Query Error", error);
    return "Connection to intelligence core failed. Please retry.";
  }
};
