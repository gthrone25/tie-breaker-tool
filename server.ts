import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Google Gen AI SDK
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY environment variable is missing.");
}

const ai = new GoogleGenAI({
  apiKey: apiKey || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// 1. Analyze Decision Endpoint
app.post("/api/decisions/analyze", async (req, res) => {
  try {
    const { title, context } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required to analyze a decision." });
    }

    const systemPrompt = `You are "The Tiebreaker", a world-class decision analysis expert and logical master. 
Your job is to dissect the user's dilemma with clinical precision, clear reasoning, and a dash of refreshing "tough love".
Provide a comprehensive, high-fidelity, and logically rigorous structured analysis of their decision.

Format your analysis strictly according to the specified JSON schema:
1. "prosCons": Create a list of 4-6 balanced Pros and 4-6 balanced Cons. Assign each an impact score between 1 and 5.
2. "swot": Map the decision's internal Strengths and Weaknesses, as well as external Opportunities and Threats. Assign each an impact of 'high', 'medium', or 'low'.
3. "comparison": Determine the 2-3 major options being compared (if only one is provided, compare "Doing it" vs "Status Quo/Not doing it"). Generate 4-5 relevant comparison criteria (e.g. Cost, Time, Mental Load, Risk). For each criterion, assign an importance weight (1-5) and score each option (1-5) with a clear explanation.
4. "aiVerdict": Give a bold, clear recommendation. State your confidence score (1-100%). Provide a constructive summary and a blunt "tough love" critique checking their biases, fears, or irrational hopes.`;

    const promptText = `Analyze the following decision dilemma:
Decision Title: ${title}
Background Context: ${context || "None provided"}

Analyze the options, create pros & cons, construct a SWOT, compare the options side-by-side, and make a final recommendation. Make sure the response is completely filled out.`;

    // We use gemini-3.5-flash as the standard model for textual tasks
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prosCons: {
              type: Type.OBJECT,
              properties: {
                pros: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      text: { type: Type.STRING },
                      score: { type: Type.INTEGER, description: "Weight of impact (1 to 5)" },
                      category: { type: Type.STRING, description: "e.g. Financial, Emotional, Career, Growth" },
                      description: { type: Type.STRING, description: "Why this pro holds weight" }
                    },
                    required: ["id", "text", "score", "category", "description"]
                  }
                },
                cons: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      text: { type: Type.STRING },
                      score: { type: Type.INTEGER, description: "Cost/risk weight of impact (1 to 5)" },
                      category: { type: Type.STRING, description: "e.g. Financial, Risk, Effort, Time" },
                      description: { type: Type.STRING, description: "Why this con holds weight" }
                    },
                    required: ["id", "text", "score", "category", "description"]
                  }
                }
              },
              required: ["pros", "cons"]
            },
            swot: {
              type: Type.OBJECT,
              properties: {
                strengths: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      text: { type: Type.STRING },
                      impact: { type: Type.STRING, description: "high, medium, or low" },
                      description: { type: Type.STRING }
                    },
                    required: ["id", "text", "impact", "description"]
                  }
                },
                weaknesses: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      text: { type: Type.STRING },
                      impact: { type: Type.STRING, description: "high, medium, or low" },
                      description: { type: Type.STRING }
                    },
                    required: ["id", "text", "impact", "description"]
                  }
                },
                opportunities: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      text: { type: Type.STRING },
                      impact: { type: Type.STRING, description: "high, medium, or low" },
                      description: { type: Type.STRING }
                    },
                    required: ["id", "text", "impact", "description"]
                  }
                },
                threats: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      text: { type: Type.STRING },
                      impact: { type: Type.STRING, description: "high, medium, or low" },
                      description: { type: Type.STRING }
                    },
                    required: ["id", "text", "impact", "description"]
                  }
                }
              },
              required: ["strengths", "weaknesses", "opportunities", "threats"]
            },
            comparison: {
              type: Type.OBJECT,
              properties: {
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "List of options, e.g. ['Buy Tesla Y', 'Buy Audi Q4'] or ['Move to Austin', 'Stay in Seattle']"
                },
                criteria: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING, description: "Criterion name, e.g., 'Cost', 'Commute', 'Convenience'" },
                      importance: { type: Type.INTEGER, description: "1 to 5 weight" },
                      scoresList: {
                        type: Type.ARRAY,
                        description: "Score details for each of the identified options",
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            optionName: { type: Type.STRING },
                            value: { type: Type.INTEGER, description: "1 to 5 rating" },
                            reason: { type: Type.STRING }
                          },
                          required: ["optionName", "value", "reason"]
                        }
                      }
                    },
                    required: ["id", "name", "importance", "scoresList"]
                  }
                }
              },
              required: ["options", "criteria"]
            },
            aiVerdict: {
              type: Type.OBJECT,
              properties: {
                recommendation: { type: Type.STRING },
                confidence: { type: Type.INTEGER, description: "Percentage value from 1 to 100" },
                summary: { type: Type.STRING },
                toughLove: { type: Type.STRING, description: "Brutally honest check on emotional factors or logic traps" },
                keyFactors: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["recommendation", "confidence", "summary", "toughLove", "keyFactors"]
            }
          },
          required: ["prosCons", "swot", "comparison", "aiVerdict"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini AI.");
    }

    const data = JSON.parse(text);

    // Transform scoresList array back to the expected key-value map for simpler frontend use
    if (data.comparison && Array.isArray(data.comparison.criteria)) {
      data.comparison.criteria = data.comparison.criteria.map((crit: any) => {
        const scoresMap: any = {};
        if (Array.isArray(crit.scoresList)) {
          crit.scoresList.forEach((item: any) => {
            scoresMap[item.optionName] = {
              value: item.value,
              reason: item.reason
            };
          });
        }
        
        // Ensure even options with no response are mapped
        data.comparison.options.forEach((opt: string) => {
          if (!scoresMap[opt]) {
            scoresMap[opt] = { value: 3, reason: "Default baseline score" };
          }
        });

        const { scoresList, ...rest } = crit;
        return {
          ...rest,
          scores: scoresMap
        };
      });
    }

    res.json(data);
  } catch (error: any) {
    console.error("Decision analysis failed:", error);
    res.status(500).json({ error: error.message || "Failed to analyze decision." });
  }
});

// 2. Chat/Follow-up Consultation Endpoint
app.post("/api/decisions/chat", async (req, res) => {
  try {
    const { decision, message, history } = req.body;

    if (!decision || !message) {
      return res.status(400).json({ error: "Decision state and message are required." });
    }

    const systemPrompt = `You are "The Tiebreaker", an expert decision coach. The user is actively consulting you about a specific dilemma they defined:
Decision: "${decision.title}"
Context: "${decision.context || "None provided"}"

Current AI Verdict recommendation was: "${decision.aiVerdict?.recommendation || "Pending"}" with summary: "${decision.aiVerdict?.summary || ""}"

Be conversational, logical, practical, and highly direct. Avoid flowery prefaces or generic pleasantries. Help them pressure-test their assumptions.
If they ask you to add or modify components of their analysis (e.g. "Add a con about charging infrastructure" or "Make financial score 5 stars"), structure your answer by suggesting updates. 

Your final response must be in JSON format conforming to this schema:
{
  "reply": "Your conversational answer to the user",
  "suggestedUpdates": {
    "addPro": [ { "text": "...", "score": 4, "category": "...", "description": "..." } ],
    "addCon": [ { "text": "...", "score": 3, "category": "...", "description": "..." } ],
    "addStrength": [ { "text": "...", "impact": "high" | "medium" | "low", "description": "..." } ],
    "addWeakness": [ { "text": "...", "impact": "high" | "medium" | "low", "description": "..." } ],
    "addOpportunity": [ { "text": "...", "impact": "high" | "medium" | "low", "description": "..." } ],
    "addThreat": [ { "text": "...", "impact": "high" | "medium" | "low", "description": "..." } ],
    "addCriterion": [ { "name": "...", "importance": 4, "scoresList": [ { "optionName": "...", "value": 4, "reason": "..." } ] } ]
  }
}
All arrays in "suggestedUpdates" should be empty unless the user explicitly requested to add, modify, or extend the parameters of the decision matrix.`;

    const chatHistoryParts = (history || []).map((h: any) => ({
      role: h.sender === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: h.message }]
    }));

    // Add current user prompt
    chatHistoryParts.push({
      role: 'user' as const,
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: chatHistoryParts,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            suggestedUpdates: {
              type: Type.OBJECT,
              properties: {
                addPro: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      score: { type: Type.INTEGER },
                      category: { type: Type.STRING },
                      description: { type: Type.STRING }
                    },
                    required: ["text", "score", "category", "description"]
                  }
                },
                addCon: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      score: { type: Type.INTEGER },
                      category: { type: Type.STRING },
                      description: { type: Type.STRING }
                    },
                    required: ["text", "score", "category", "description"]
                  }
                },
                addStrength: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      impact: { type: Type.STRING },
                      description: { type: Type.STRING }
                    },
                    required: ["text", "impact", "description"]
                  }
                },
                addWeakness: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      impact: { type: Type.STRING },
                      description: { type: Type.STRING }
                    },
                    required: ["text", "impact", "description"]
                  }
                },
                addOpportunity: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      impact: { type: Type.STRING },
                      description: { type: Type.STRING }
                    },
                    required: ["text", "impact", "description"]
                  }
                },
                addThreat: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      impact: { type: Type.STRING },
                      description: { type: Type.STRING }
                    },
                    required: ["text", "impact", "description"]
                  }
                },
                addCriterion: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      importance: { type: Type.INTEGER },
                      scoresList: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            optionName: { type: Type.STRING },
                            value: { type: Type.INTEGER },
                            reason: { type: Type.STRING }
                          },
                          required: ["optionName", "value", "reason"]
                        }
                      }
                    },
                    required: ["name", "importance", "scoresList"]
                  }
                }
              }
            }
          },
          required: ["reply"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from chat service.");
    }

    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Consultation chat failed:", error);
    res.status(500).json({ error: error.message || "Consultation chat error." });
  }
});

// Configure Vite / static file serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
