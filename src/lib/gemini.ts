import { GeminiMessage } from "@/types/inspection";

const SYSTEM_PROMPT = `You are an experienced residential electrical inspector. The user is going to show you images of a residential electrical panel. As they slowly pan across the panel, call out anything you see — code violations, safety hazards, signs of amateur work, anything that doesn't look right. Reference NEC codes when relevant.

On the first image, start by telling the user what type of panel this is and your overall first impression. On subsequent images, continue the conversation naturally — point out new things you notice, follow up on earlier observations, and respond to any questions.

Be conversational and direct, like you're standing next to the user coaching them through the inspection. Keep responses concise but thorough. If you can't see something clearly, say so rather than guessing.`;

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

  get isFirstMessage(): boolean {
    return this.conversationHistory.length === 0;
  }

  async sendImage(imageBase64: string, mimeType: string, text?: string): Promise<string> {
    const parts: GeminiMessage["parts"] = [
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
    ];

    if (text) {
      parts.push({ text });
    } else if (this.isFirstMessage) {
      parts.push({
        text: "Here's the panel. What do you see?",
      });
    } else {
      parts.push({
        text: "Here's another view. What do you notice?",
      });
    }

    this.conversationHistory.push({ role: "user", parts });

    const response = await this.callApi();
    const responseText = this.extractText(response);

    this.conversationHistory.push({
      role: "model",
      parts: [{ text: responseText }],
    });

    return responseText;
  }

  async chat(message: string): Promise<string> {
    this.conversationHistory.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await this.callApi();
    const text = this.extractText(response);

    this.conversationHistory.push({
      role: "model",
      parts: [{ text }],
    });

    return text;
  }

  private async callApi(): Promise<Record<string, unknown>> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const body = {
      contents: this.conversationHistory,
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
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
}
