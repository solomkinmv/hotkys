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
import { exportService, type ExportResult } from "@/lib/services/export-service";

interface ExportDialogProps {
  app: CustomApp;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CONTRIBUTION_GUIDE_URL = "https://github.com/solomkinmv/shortcuts-disco/blob/main/CONTRIBUTING.md";
const GITHUB_ISSUES_URL = "https://github.com/solomkinmv/shortcuts-disco/issues/new";

export function ExportDialog({ app, open, onOpenChange }: ExportDialogProps) {
  const [activeTab, setActiveTab] = useState<"json" | "pr">("json");
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedPr, setCopiedPr] = useState(false);
  const [clipboardError, setClipboardError] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, [open, app.id]);

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
      const setCopied = type === "json" ? setCopiedJson : setCopiedPr;
      setCopied(true);
      timers.current.push(setTimeout(() => setCopied(false), 2000));
    } catch { setClipboardError("Could not copy to the clipboard. Download the JSON or select and copy the text below."); }
  };

  const downloadJson = () => {
    if (!exportState.result) return;

    const blob = new Blob([exportState.result.json], { type: "application/json" });
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Export {app.name}</DialogTitle>
          <DialogDescription>
            Download your public app JSON, then follow the contribution guide to open a pull request.
          </DialogDescription>
        </DialogHeader>

        {clipboardError ? <p role="alert" className="text-sm text-destructive">{clipboardError}</p> : null}
        {exportState.result && (
          <div className="flex gap-2 border-b pb-2">
            <Button
              variant={activeTab === "json" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("json")}
            >
              JSON
            </Button>
            <Button
              variant={activeTab === "pr" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("pr")}
            >
              Contribution Summary
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-hidden flex flex-col min-h-[300px]">
          {exportState.error ? (
            <div
              className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
              role="alert"
            >
              {exportState.error}
            </div>
          ) : exportState.result && activeTab === "json" ? (
            <>
              <div className="flex-1 overflow-auto bg-muted rounded-md p-4">
                <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                  {exportState.result.json}
                </pre>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(exportState.result.json, "json")}
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
                <Button variant="outline" onClick={downloadJson} className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </>
          ) : exportState.result ? (
            <>
              <div className="flex-1 overflow-auto bg-muted rounded-md p-4">
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
                      Copy Summary
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : null}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button variant="ghost" asChild><a href={GITHUB_ISSUES_URL} target="_blank" rel="noopener noreferrer">Report an Issue</a></Button>
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
