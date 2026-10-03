"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Copy, Download, ExternalLink } from "lucide-react";
import type { CustomApp } from "@/lib/model/user/user-models";
import {
  exportService,
  type ExportResult,
} from "@/lib/services/export-service";

interface ExportDialogProps {
  app: CustomApp;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CONTRIBUTION_GUIDE_URL =
  "https://github.com/solomkinmv/hotkys/blob/main/CONTRIBUTING.md";
const GITHUB_ISSUES_URL = "https://github.com/solomkinmv/hotkys/issues/new";

export function ExportDialog({ app, open, onOpenChange }: ExportDialogProps) {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    [open, app.id],
  );
  const [activeTab, setActiveTab] = useState<"json" | "pr">("json");
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedPr, setCopiedPr] = useState(false);
  const [clipboardError, setClipboardError] = useState<string | null>(null);

  const exportState = useMemo<
    { result: ExportResult; error: null } | { result: null; error: string }
  >(() => {
    try {
      return { result: exportService.exportCustomApp(app), error: null };
    } catch (error) {
      return {
        result: null,
        error:
          error instanceof Error
            ? error.message
            : "Unable to export this custom app.",
      };
    }
  }, [app]);

  const copyToClipboard = async (text: string, type: "json" | "pr") => {
    setClipboardError(null);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setClipboardError(
        "Unable to copy. You can select the text below or download the JSON instead.",
      );
      return;
    }
    if (type === "json") {
      setCopiedJson(true);
      timers.current.push(setTimeout(() => setCopiedJson(false), 2000));
    } else {
      setCopiedPr(true);
      timers.current.push(setTimeout(() => setCopiedPr(false), 2000));
    }
  };

  const downloadJson = () => {
    if (!exportState.result) return;

    const blob = new Blob([exportState.result.json], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${app.slug}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col overflow-hidden rounded-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export {app.name}</DialogTitle>
          <DialogDescription>
            Download a copy or prepare a contribution. Your app stays private
            until you choose to share it.
          </DialogDescription>
        </DialogHeader>

        {exportState.result && (
          <div
            role="group"
            aria-label="Export format"
            className="flex gap-1 rounded-xl border bg-muted/40 p-1"
          >
            <Button
              variant={activeTab === "json" ? "default" : "ghost"}
              size="sm"
              aria-pressed={activeTab === "json"}
              onClick={() => setActiveTab("json")}
            >
              App data
            </Button>
            <Button
              variant={activeTab === "pr" ? "default" : "ghost"}
              size="sm"
              aria-pressed={activeTab === "pr"}
              onClick={() => setActiveTab("pr")}
            >
              Contribution text
            </Button>
          </div>
        )}

        {clipboardError && (
          <p role="alert" className="text-sm text-destructive">
            {clipboardError}
          </p>
        )}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {exportState.error ? (
            <div
              className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
              role="alert"
            >
              {exportState.error}
            </div>
          ) : exportState.result && activeTab === "json" ? (
            <>
              <div className="flex-1 overflow-auto rounded-xl border bg-muted/40 p-4">
                <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                  {exportState.result.json}
                </pre>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() =>
                    copyToClipboard(exportState.result.json, "json")
                  }
                  className="flex-1"
                >
                  {copiedJson ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy JSON
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadJson}
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download JSON
                </Button>
              </div>
            </>
          ) : exportState.result ? (
            <>
              <div className="flex-1 overflow-auto rounded-xl border bg-muted/40 p-4">
                <pre className="text-sm whitespace-pre-wrap break-words">
                  {exportState.result.prDescription}
                </pre>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() =>
                    copyToClipboard(exportState.result.prDescription, "pr")
                  }
                  className="flex-1"
                >
                  {copiedPr ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Description
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : null}
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          To contribute, download the JSON and follow the contribution guide to
          open a pull request. Your app stays private until you submit it.
        </p>
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button variant="ghost" asChild>
            <a
              href={GITHUB_ISSUES_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Report an Issue
            </a>
          </Button>
          <Button asChild>
            <a
              href={CONTRIBUTION_GUIDE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Contribution Guide
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
