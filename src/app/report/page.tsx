"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { InspectionSession } from "@/types/inspection";
import { generateReport } from "@/lib/report";

function useStoredSession(): InspectionSession | null {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("storage", cb);
      return () => window.removeEventListener("storage", cb);
    },
    () => {
      const data = localStorage.getItem("current_inspection");
      return data ? (JSON.parse(data) as InspectionSession) : null;
    },
    () => null
  );
}

export default function ReportPage() {
  const router = useRouter();
  const session = useStoredSession();
  const [notes, setNotes] = useState(() => {
    if (typeof window === "undefined") return "";
    const data = localStorage.getItem("current_inspection");
    if (!data) return "";
    try {
      return (JSON.parse(data) as InspectionSession).notes || "";
    } catch {
      return "";
    }
  });

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const criticalCount = session.issues.filter((i) => i.severity === "critical").length;
  const majorCount = session.issues.filter((i) => i.severity === "major").length;
  const minorCount = session.issues.filter((i) => i.severity === "minor").length;
  const infoCount = session.issues.filter((i) => i.severity === "info").length;
  const completedCount = session.checklist.filter((c) => c.status === "completed").length;

  function handleDownloadPdf() {
    if (!session) return;
    const updatedSession = { ...session, notes };
    const doc = generateReport(updatedSession);
    doc.save(`ironhand-inspection-${new Date().toISOString().split("T")[0]}.pdf`);
  }

  function handleNewInspection() {
    localStorage.removeItem("current_inspection");
    router.push("/");
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 pt-8 text-center border-b border-gray-800">
        <div className="inline-flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded bg-amber-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-lg font-bold">Inspection Report</span>
        </div>
        <p className="text-xs text-gray-500">Review and export your findings</p>
      </header>

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full space-y-6">
        {/* Session Details */}
        <div className="bg-[#1a1a2e] rounded-xl p-4 border border-gray-800">
          <h2 className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-3">
            Inspection Details
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Address</span>
              <span>{session.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Inspector</span>
              <span>{session.inspectorName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Panel</span>
              <span>{session.panelType} - {session.serviceAmps}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Date</span>
              <span>{new Date(session.startedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Summary Boxes */}
        <div>
          <h2 className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-3">
            Summary
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-[#1a1a2e] rounded-lg p-3 border border-gray-800 text-center">
              <p className="text-2xl font-bold">{completedCount}/{session.checklist.length}</p>
              <p className="text-xs text-gray-400">Checklist Items</p>
            </div>
            <div className="bg-[#1a1a2e] rounded-lg p-3 border border-gray-800 text-center">
              <p className="text-2xl font-bold">{session.issues.length}</p>
              <p className="text-xs text-gray-400">Issues Found</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-red-600/20 border border-red-800 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-red-400">{criticalCount}</p>
              <p className="text-[10px] text-red-400">Critical</p>
            </div>
            <div className="bg-orange-600/20 border border-orange-800 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-orange-400">{majorCount}</p>
              <p className="text-[10px] text-orange-400">Major</p>
            </div>
            <div className="bg-yellow-600/20 border border-yellow-800 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-yellow-400">{minorCount}</p>
              <p className="text-[10px] text-yellow-400">Minor</p>
            </div>
            <div className="bg-blue-600/20 border border-blue-800 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-blue-400">{infoCount}</p>
              <p className="text-[10px] text-blue-400">Info</p>
            </div>
          </div>
        </div>

        {/* Issues List */}
        {session.issues.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-3">
              Issues Found
            </h2>
            <div className="space-y-2">
              {session.issues.map((issue) => (
                <div
                  key={issue.id}
                  className="bg-[#1a1a2e] rounded-lg p-3 border border-gray-800"
                >
                  <div className="flex items-start gap-2">
                    <span className={`severity-${issue.severity} text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0`}>
                      {issue.severity}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{issue.title}</p>
                      {issue.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{issue.description}</p>
                      )}
                      {issue.necReference && (
                        <p className="text-[10px] text-amber-600 mt-1">{issue.necReference}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Checklist Summary */}
        <div>
          <h2 className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-3">
            Checklist
          </h2>
          <div className="space-y-1">
            {session.checklist.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-sm py-1">
                {item.status === "completed" ? (
                  <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : item.status === "skipped" ? (
                  <svg className="w-4 h-4 text-yellow-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                )}
                <span className={item.status === "completed" ? "text-gray-400" : item.status === "not_started" ? "text-gray-500" : ""}>
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <h2 className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-2">
            Inspector Notes
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes for the report..."
            rows={4}
            className="w-full bg-[#1a1a2e] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="space-y-3 pb-6">
          <button
            onClick={handleDownloadPdf}
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold py-3 rounded-xl text-base flex items-center justify-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download PDF Report
          </button>
          <button
            onClick={handleNewInspection}
            className="w-full bg-[#1a1a2e] border border-gray-700 text-gray-300 py-3 rounded-xl text-base transition-colors hover:bg-[#25253e]"
          >
            Start New Inspection
          </button>
        </div>
      </main>
    </div>
  );
}
