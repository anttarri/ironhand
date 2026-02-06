export type Severity = "critical" | "major" | "minor" | "info";

export type InspectionStatus = "not_started" | "in_progress" | "completed" | "skipped";

export interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  necReference: string;
  howToInspect: string;
  status: InspectionStatus;
}

export interface InspectionIssue {
  id: string;
  checklistItemId: string | null;
  title: string;
  description: string;
  severity: Severity;
  necReference: string;
  photoDataUrl: string | null;
  annotation: string;
  timestamp: number;
}

export interface InspectionSession {
  id: string;
  startedAt: number;
  completedAt: number | null;
  address: string;
  inspectorName: string;
  panelType: string;
  serviceAmps: string;
  checklist: ChecklistItem[];
  issues: InspectionIssue[];
  notes: string;
}

export interface GeminiMessage {
  role: "user" | "model";
  parts: GeminiPart[];
}

export interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface AnalysisResult {
  components: string[];
  issues: DetectedIssue[];
  guidance: string;
}

export interface DetectedIssue {
  title: string;
  description: string;
  severity: Severity;
  necReference: string;
  location: string;
}
