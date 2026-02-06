import { AnalysisResult, GeminiMessage, DetectedIssue, Severity } from "@/types/inspection";

const SYSTEM_PROMPT = `You are an expert residential electrical inspector AI assistant. You help licensed electricians perform thorough panel inspections following the NEC (National Electrical Code) 2023 standards.

When analyzing images of electrical panels, you should:
1. Identify visible components (breakers, bus bars, wiring, grounding, labels, etc.)
2. Detect potential code violations or safety issues
3. Provide specific NEC references for any findings
4. Give clear, actionable guidance

Format your analysis as JSON with this structure:
{
  "components": ["list of identified components"],
  "issues": [
    {
      "title": "Brief issue title",
      "description": "Detailed description of the issue",
      "severity": "critical|major|minor|info",
      "necReference": "NEC section reference",
      "location": "Where in the panel this was observed"
    }
  ],
  "guidance": "Overall guidance text for the inspector"
}

Severity levels:
- critical: Immediate safety hazard, fire risk, or electrocution danger
- major: Code violation that needs correction
- minor: Best practice recommendation or minor code concern
- info: Informational observation, no action needed

Be specific and precise. Do not speculate about things you cannot clearly see in the image. If you cannot determine something from the image, say so.`;

export class GeminiClient {
  private apiKey: string;
  private conversationHistory: GeminiMessage[] = [];
  private model = "gemini-2.0-flash";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  resetConversation() {
    this.conversationHistory = [];
  }

  async analyzeImage(
    imageBase64: string,
    mimeType: string,
    prompt: string
  ): Promise<AnalysisResult> {
    const userMessage: GeminiMessage = {
      role: "user",
      parts: [
        {
          inlineData: {
            mimeType,
            data: imageBase64,
          },
        },
        {
          text: prompt || "Analyze this electrical panel image. Identify components and any potential issues or code violations.",
        },
      ],
    };

    this.conversationHistory.push(userMessage);

    const response = await this.callApi();
    const text = this.extractText(response);

    this.conversationHistory.push({
      role: "model",
      parts: [{ text }],
    });

    return this.parseAnalysis(text);
  }

  async chat(message: string): Promise<string> {
    const userMessage: GeminiMessage = {
      role: "user",
      parts: [{ text: message }],
    };

    this.conversationHistory.push(userMessage);

    const response = await this.callApi();
    const text = this.extractText(response);

    this.conversationHistory.push({
      role: "model",
      parts: [{ text }],
    });

    return text;
  }

  async getInspectionGuidance(checklistItemTitle: string, checklistItemHowTo: string): Promise<string> {
    return this.chat(
      `I'm now inspecting: "${checklistItemTitle}". The standard procedure is: ${checklistItemHowTo}. Please provide additional tips or things to watch for during this step of the inspection.`
    );
  }

  private async callApi(): Promise<Record<string, unknown>> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const body = {
      contents: this.conversationHistory,
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${err}`);
    }

    return res.json();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractText(response: any): string {
    return (
      response?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "No response from AI."
    );
  }

  private parseAnalysis(text: string): AnalysisResult {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          components: parsed.components ?? [],
          issues: (parsed.issues ?? []).map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (issue: any): DetectedIssue => ({
              title: issue.title ?? "Unknown Issue",
              description: issue.description ?? "",
              severity: (["critical", "major", "minor", "info"].includes(issue.severity)
                ? issue.severity
                : "info") as Severity,
              necReference: issue.necReference ?? "",
              location: issue.location ?? "",
            })
          ),
          guidance: parsed.guidance ?? "",
        };
      } catch {
        // Fall through to default
      }
    }

    return {
      components: [],
      issues: [],
      guidance: text,
    };
  }
}
