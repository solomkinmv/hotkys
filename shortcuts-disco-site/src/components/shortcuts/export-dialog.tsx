"use client";

import { useMemo, useState } from "react";
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

const GITHUB_ISSUES_URL = "https://github.com/solomkinmv/hotkys/issues/new";

export function ExportDialog({ app, open, onOpenChange }: ExportDialogProps) {
  const [activeTab, setActiveTab] = useState<"json" | "pr">("json");
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedPr, setCopiedPr] = useState(false);

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
    await navigator.clipboard.writeText(text);
    if (type === "json") {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } else {
      setCopiedPr(true);
      setTimeout(() => setCopiedPr(false), 2000);
    }
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
            Export your custom app to contribute to the project via GitHub PR
          </DialogDescription>
        </DialogHeader>

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
              PR Description
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
                      Copy Description
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
          <Button asChild>
            <a
              href={GITHUB_ISSUES_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open GitHub Issue
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
