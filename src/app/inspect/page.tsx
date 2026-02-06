"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { CameraManager } from "@/lib/camera";
import { GeminiClient } from "@/lib/gemini";
import { SpeechManager } from "@/lib/speech";
import { createChecklist, getCategories } from "@/lib/checklist";
import {
  InspectionSession,
  InspectionIssue,
  ChecklistItem,
  Severity,
  AnalysisResult,
} from "@/types/inspection";

function InspectPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraRef = useRef<CameraManager | null>(null);
  const geminiRef = useRef<GeminiClient | null>(null);
  const speechRef = useRef<SpeechManager | null>(null);

  // Session state
  const [session, setSession] = useState<InspectionSession>(() => ({
    id: uuidv4(),
    startedAt: Date.now(),
    completedAt: null,
    address: searchParams.get("address") || "Not specified",
    inspectorName: searchParams.get("inspector") || "Not specified",
    panelType: searchParams.get("panelType") || "Main Panel",
    serviceAmps: searchParams.get("serviceAmps") || "200A",
    checklist: createChecklist(),
    issues: [],
    notes: "",
  }));

  // UI state
  const [cameraActive, setCameraActive] = useState(false);
  const [activeTab, setActiveTab] = useState<"camera" | "checklist" | "issues">("camera");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [selectedChecklistItem, setSelectedChecklistItem] = useState<ChecklistItem | null>(null);
  const [showAddIssue, setShowAddIssue] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New issue form
  const [newIssueTitle, setNewIssueTitle] = useState("");
  const [newIssueDesc, setNewIssueDesc] = useState("");
  const [newIssueSeverity, setNewIssueSeverity] = useState<Severity>("major");
  const [newIssueNec, setNewIssueNec] = useState("");

  // Initialize services
  useEffect(() => {
    const apiKey = localStorage.getItem("gemini_api_key");
    if (!apiKey) {
      router.push("/");
      return;
    }

    geminiRef.current = new GeminiClient(apiKey);
    speechRef.current = new SpeechManager();

    return () => {
      cameraRef.current?.stop();
      speechRef.current?.stop();
    };
  }, [router]);

  // Start camera
  const startCamera = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      cameraRef.current = new CameraManager();
      await cameraRef.current.start(videoRef.current);
      setCameraActive(true);
      setError(null);
    } catch (err) {
      setError(`Camera error: ${err instanceof Error ? err.message : "Could not access camera"}`);
    }
  }, []);

  // Capture and analyze
  const captureAndAnalyze = useCallback(async () => {
    if (!cameraRef.current || !geminiRef.current) return;

    const frame = cameraRef.current.captureFrame();
    if (!frame) return;

    setCapturedPhoto(frame.dataUrl);
    setAnalyzing(true);
    setError(null);

    try {
      const contextPrompt = selectedChecklistItem
        ? `I am currently inspecting: "${selectedChecklistItem.title}" (${selectedChecklistItem.necReference}). ${selectedChecklistItem.howToInspect}. Analyze this image with that focus in mind, but also note any other issues you see.`
        : "Analyze this electrical panel image. Identify all visible components and any potential code violations or safety issues.";

      const result = await geminiRef.current.analyzeImage(
        frame.base64,
        frame.mimeType,
        contextPrompt
      );
      setAnalysisResult(result);

      setChatMessages((prev) => [
        ...prev,
        { role: "system", text: "Image captured and analyzed." },
        { role: "model", text: result.guidance },
      ]);

      // Auto-add detected issues
      if (result.issues.length > 0) {
        const newIssues: InspectionIssue[] = result.issues.map((issue) => ({
          id: uuidv4(),
          checklistItemId: selectedChecklistItem?.id ?? null,
          title: issue.title,
          description: issue.description,
          severity: issue.severity,
          necReference: issue.necReference,
          photoDataUrl: frame.dataUrl,
          annotation: issue.location,
          timestamp: Date.now(),
        }));

        setSession((prev) => ({
          ...prev,
          issues: [...prev.issues, ...newIssues],
        }));
      }

      // Voice feedback
      if (voiceEnabled && speechRef.current) {
        const summary =
          result.issues.length > 0
            ? `Found ${result.issues.length} potential issue${result.issues.length > 1 ? "s" : ""}. ${result.issues[0].title}. ${result.guidance}`
            : `Analysis complete. ${result.guidance}`;
        speechRef.current.speak(summary);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      setError(msg);
      setChatMessages((prev) => [...prev, { role: "system", text: `Error: ${msg}` }]);
    } finally {
      setAnalyzing(false);
    }
  }, [selectedChecklistItem, voiceEnabled]);

  // Chat with AI
  const sendChat = useCallback(async () => {
    if (!chatInput.trim() || !geminiRef.current) return;

    const message = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: message }]);

    try {
      const response = await geminiRef.current.chat(message);
      setChatMessages((prev) => [...prev, { role: "model", text: response }]);

      if (voiceEnabled && speechRef.current) {
        speechRef.current.speak(response);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Chat failed";
      setChatMessages((prev) => [...prev, { role: "system", text: `Error: ${msg}` }]);
    }
  }, [chatInput, voiceEnabled]);

  // Voice input
  const toggleVoiceInput = useCallback(() => {
    if (!speechRef.current) return;

    if (speechRef.current.listening) {
      speechRef.current.stopListening();
    } else {
      speechRef.current.startListening((text) => {
        setChatInput(text);
      });
    }
  }, []);

  // Checklist operations
  const updateChecklistStatus = useCallback(
    (itemId: string, status: ChecklistItem["status"]) => {
      setSession((prev) => ({
        ...prev,
        checklist: prev.checklist.map((item) =>
          item.id === itemId ? { ...item, status } : item
        ),
      }));
    },
    []
  );

  // Add manual issue
  const addManualIssue = useCallback(() => {
    if (!newIssueTitle.trim()) return;

    const issue: InspectionIssue = {
      id: uuidv4(),
      checklistItemId: selectedChecklistItem?.id ?? null,
      title: newIssueTitle,
      description: newIssueDesc,
      severity: newIssueSeverity,
      necReference: newIssueNec,
      photoDataUrl: capturedPhoto,
      annotation: "",
      timestamp: Date.now(),
    };

    setSession((prev) => ({
      ...prev,
      issues: [...prev.issues, issue],
    }));

    setNewIssueTitle("");
    setNewIssueDesc("");
    setNewIssueSeverity("major");
    setNewIssueNec("");
    setShowAddIssue(false);
  }, [newIssueTitle, newIssueDesc, newIssueSeverity, newIssueNec, selectedChecklistItem, capturedPhoto]);

  // Remove issue
  const removeIssue = useCallback((issueId: string) => {
    setSession((prev) => ({
      ...prev,
      issues: prev.issues.filter((i) => i.id !== issueId),
    }));
  }, []);

  // Finish inspection
  const finishInspection = useCallback(() => {
    const completedSession = {
      ...session,
      completedAt: Date.now(),
    };

    // Store session in localStorage for the report page
    localStorage.setItem("current_inspection", JSON.stringify(completedSession));

    cameraRef.current?.stop();
    speechRef.current?.stop();

    router.push("/report");
  }, [session, router]);

  const categories = getCategories(session.checklist);
  const completedCount = session.checklist.filter((c) => c.status === "completed").length;

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a]">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-3 py-2 bg-[#111] border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/")} className="text-gray-400 p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="w-6 h-6 rounded bg-amber-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-sm font-semibold">Ironhand</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {completedCount}/{session.checklist.length}
          </span>
          <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${(completedCount / session.checklist.length) * 100}%` }}
            />
          </div>
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-1.5 rounded ${voiceEnabled ? "text-amber-500" : "text-gray-500"}`}
            title={voiceEnabled ? "Disable voice" : "Enable voice"}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {voiceEnabled ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 18.75a.75.75 0 01-.75-.75V6a.75.75 0 011.5 0v12a.75.75 0 01-.75.75zM9 9.75A.75.75 0 018.25 9V6a.75.75 0 011.5 0v3a.75.75 0 01-.75.75z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="flex border-b border-gray-800 shrink-0">
        {(["camera", "checklist", "issues"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors ${
              activeTab === tab
                ? "text-amber-500 border-b-2 border-amber-500"
                : "text-gray-500"
            }`}
          >
            {tab === "camera" && "Camera"}
            {tab === "checklist" && `Checklist (${completedCount}/${session.checklist.length})`}
            {tab === "issues" && `Issues (${session.issues.length})`}
          </button>
        ))}
      </nav>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-900/50 border-b border-red-800 px-3 py-2 text-xs text-red-300 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 ml-2">X</button>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* CAMERA TAB */}
        {activeTab === "camera" && (
          <div className="h-full flex flex-col">
            {/* Camera View */}
            <div className="relative flex-1 bg-black">
              <video
                ref={videoRef}
                className="camera-video"
                playsInline
                muted
                autoPlay
              />

              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111]">
                  <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                  <button
                    onClick={startCamera}
                    className="bg-amber-500 text-black font-semibold px-6 py-2.5 rounded-lg"
                  >
                    Start Camera
                  </button>
                </div>
              )}

              {analyzing && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-white">Analyzing panel...</p>
                  </div>
                </div>
              )}

              {/* Camera controls overlay */}
              {cameraActive && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                  <button
                    onClick={captureAndAnalyze}
                    disabled={analyzing}
                    className="w-16 h-16 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 rounded-full flex items-center justify-center shadow-lg transition-colors"
                  >
                    <svg className="w-8 h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Active checklist item indicator */}
              {selectedChecklistItem && (
                <div className="absolute top-3 left-3 right-3 bg-black/80 rounded-lg px-3 py-2 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-amber-500 uppercase tracking-wide">Inspecting</p>
                    <p className="text-xs text-white">{selectedChecklistItem.title}</p>
                  </div>
                  <button
                    onClick={() => setSelectedChecklistItem(null)}
                    className="text-gray-400 text-xs"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Analysis Results & Chat */}
            <div className="h-48 bg-[#111] border-t border-gray-800 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                {chatMessages.length === 0 && (
                  <p className="text-xs text-gray-500 text-center mt-4">
                    Start the camera and capture a photo to begin analysis.
                    You can also ask questions about electrical codes.
                  </p>
                )}
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`text-xs px-2 py-1.5 rounded ${
                      msg.role === "user"
                        ? "bg-amber-500/20 text-amber-200 ml-8"
                        : msg.role === "system"
                          ? "bg-gray-800 text-gray-400 text-center italic"
                          : "bg-[#1a1a2e] text-gray-300 mr-8"
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
                {analysisResult && analysisResult.components.length > 0 && (
                  <div className="text-xs bg-[#1a1a2e] rounded px-2 py-1.5 mr-8">
                    <p className="text-amber-500 font-medium mb-1">Components Identified:</p>
                    <p className="text-gray-400">{analysisResult.components.join(", ")}</p>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2 px-3 py-2 border-t border-gray-800">
                <button
                  onClick={toggleVoiceInput}
                  className={`shrink-0 p-2 rounded ${speechRef.current?.listening ? "bg-red-500/20 text-red-400" : "text-gray-500"}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                </button>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder="Ask about electrical codes..."
                  className="flex-1 bg-[#1a1a2e] border border-gray-700 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={sendChat}
                  disabled={!chatInput.trim()}
                  className="shrink-0 bg-amber-500 disabled:bg-gray-700 text-black px-3 py-1.5 rounded text-xs font-medium"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CHECKLIST TAB */}
        {activeTab === "checklist" && (
          <div className="h-full overflow-y-auto pb-20">
            {categories.map((category) => (
              <div key={category} className="border-b border-gray-800">
                <h3 className="px-4 py-2 text-xs font-semibold text-amber-500 uppercase tracking-wider bg-[#111] sticky top-0 z-10">
                  {category}
                </h3>
                {session.checklist
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <div
                      key={item.id}
                      className={`px-4 py-3 border-b border-gray-800/50 ${
                        selectedChecklistItem?.id === item.id ? "bg-amber-500/10" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Status button */}
                        <button
                          onClick={() => {
                            const next =
                              item.status === "not_started"
                                ? "in_progress"
                                : item.status === "in_progress"
                                  ? "completed"
                                  : item.status === "completed"
                                    ? "not_started"
                                    : "not_started";
                            updateChecklistStatus(item.id, next);
                          }}
                          className={`mt-0.5 w-5 h-5 rounded shrink-0 border flex items-center justify-center ${
                            item.status === "completed"
                              ? "bg-green-600 border-green-600"
                              : item.status === "in_progress"
                                ? "bg-amber-500/30 border-amber-500"
                                : "border-gray-600"
                          }`}
                        >
                          {item.status === "completed" && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {item.status === "in_progress" && (
                            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse-dot" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium ${item.status === "completed" ? "text-gray-500 line-through" : ""}`}>
                              {item.title}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                          <p className="text-[10px] text-amber-600 mt-1">{item.necReference}</p>
                        </div>

                        {/* Focus camera on this item */}
                        <button
                          onClick={() => {
                            setSelectedChecklistItem(
                              selectedChecklistItem?.id === item.id ? null : item
                            );
                            if (selectedChecklistItem?.id !== item.id) {
                              setActiveTab("camera");
                              if (voiceEnabled && speechRef.current) {
                                speechRef.current.speak(
                                  `Now inspecting: ${item.title}. ${item.howToInspect}`
                                );
                              }
                            }
                          }}
                          className="shrink-0 p-1.5 text-gray-500 hover:text-amber-500"
                          title="Focus camera on this item"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        )}

        {/* ISSUES TAB */}
        {activeTab === "issues" && (
          <div className="h-full overflow-y-auto pb-20">
            {/* Add Issue Button */}
            <div className="p-3 border-b border-gray-800">
              <button
                onClick={() => setShowAddIssue(!showAddIssue)}
                className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-400 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Issue Manually
              </button>
            </div>

            {/* Add Issue Form */}
            {showAddIssue && (
              <div className="p-3 border-b border-gray-800 bg-[#111] animate-slide-up space-y-3">
                <input
                  type="text"
                  value={newIssueTitle}
                  onChange={(e) => setNewIssueTitle(e.target.value)}
                  placeholder="Issue title"
                  className="w-full bg-[#1a1a2e] border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
                <textarea
                  value={newIssueDesc}
                  onChange={(e) => setNewIssueDesc(e.target.value)}
                  placeholder="Description"
                  rows={2}
                  className="w-full bg-[#1a1a2e] border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500 resize-none"
                />
                <div className="flex gap-2">
                  <select
                    value={newIssueSeverity}
                    onChange={(e) => setNewIssueSeverity(e.target.value as Severity)}
                    className="flex-1 bg-[#1a1a2e] border border-gray-700 rounded px-3 py-2 text-sm"
                  >
                    <option value="critical">Critical</option>
                    <option value="major">Major</option>
                    <option value="minor">Minor</option>
                    <option value="info">Info</option>
                  </select>
                  <input
                    type="text"
                    value={newIssueNec}
                    onChange={(e) => setNewIssueNec(e.target.value)}
                    placeholder="NEC ref"
                    className="flex-1 bg-[#1a1a2e] border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addManualIssue}
                    disabled={!newIssueTitle.trim()}
                    className="flex-1 bg-amber-500 disabled:bg-gray-700 text-black py-2 rounded text-sm font-medium"
                  >
                    Add Issue
                  </button>
                  <button
                    onClick={() => setShowAddIssue(false)}
                    className="px-4 py-2 bg-gray-800 text-gray-400 rounded text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Issues List */}
            {session.issues.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">No issues found yet</p>
                <p className="text-xs mt-1">Capture photos to detect issues automatically</p>
              </div>
            ) : (
              session.issues.map((issue) => (
                <div key={issue.id} className="px-4 py-3 border-b border-gray-800/50">
                  <div className="flex items-start gap-3">
                    <span
                      className={`severity-${issue.severity} text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 mt-0.5`}
                    >
                      {issue.severity}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{issue.title}</p>
                      {issue.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{issue.description}</p>
                      )}
                      {issue.necReference && (
                        <p className="text-[10px] text-amber-600 mt-1">{issue.necReference}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeIssue(issue.id)}
                      className="text-gray-600 hover:text-red-400 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {issue.photoDataUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={issue.photoDataUrl}
                      alt="Issue photo"
                      className="mt-2 w-full max-h-32 object-cover rounded"
                    />
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="shrink-0 px-3 py-2 bg-[#111] border-t border-gray-800 flex gap-2">
        <button
          onClick={finishInspection}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Finish &amp; Generate Report
        </button>
      </div>
    </div>
  );
}

export default function InspectPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <InspectPageContent />
    </Suspense>
  );
}
