import { ImageResponse } from "next/og";
import { getAppShortcutsBySlug, getAllShortcuts } from "@/lib/shortcuts";
import { keymapMatchesTitle, serializeKeymap } from "@/lib/model/keymap-utils";
import { readFile } from "fs/promises";
import { join } from "path";
import {
  AtomicShortcut,
  Section,
  SectionShortcut,
} from "@/lib/model/internal/internal-models";
import { Modifiers } from "@/lib/model/internal/modifiers";

export const dynamic = "force-static";

export const alt = "App Shortcuts Cheat Sheet";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const modifierSymbols: Record<string, string> = {
  [Modifiers.command]: "⌘",
  [Modifiers.control]: "⌃",
  [Modifiers.option]: "⌥",
  [Modifiers.shift]: "⇧",
  [Modifiers.win]: "Win",
};

const baseKeySymbols: Record<string, string> = {
  left: "←",
  right: "→",
  up: "↑",
  down: "↓",
  pageup: "PgUp",
  pagedown: "PgDn",
  home: "Home",
  end: "End",
  space: "Space",
  capslock: "⇪",
  backspace: "⌫",
  tab: "⇥",
  esc: "Esc",
  enter: "↩",
};

function formatBaseKey(base: string): string {
  return baseKeySymbols[base] ?? base.toUpperCase();
}

function formatModifier(modifier: Modifiers): string {
  return modifierSymbols[modifier] ?? modifier;
}

function getShortcutKeys(shortcut: SectionShortcut): string[][] {
  if (shortcut.sequence.length === 0) return [];

  return shortcut.sequence.map((atomic: AtomicShortcut) => {
    const modifiers = atomic.modifiers.map(formatModifier);
    const base = formatBaseKey(atomic.base);
    return [...modifiers, base];
  });
}

const kbdStyle = {
  backgroundColor: "#e2e8f0",
  border: "1px solid #cbd5e0",
  borderRadius: "4px",
  padding: "0 5px",
  fontSize: 12,
  color: "#2d3748",
  fontWeight: 500,
  boxShadow: "0 1px 1px rgba(0,0,0,0.1)",
  height: "18px",
  minWidth: "18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export async function generateStaticParams() {
  return getAllShortcuts().applications.flatMap((app) =>
    app.keymaps.map((keymap) => ({
      slug: app.slug,
      keymap: serializeKeymap(keymap),
    }))
  );
}

// Load logo as base64 data URI
async function loadLogo(): Promise<string> {
  const logoPath = join(process.cwd(), "public", "hotkys-logo-300x166.png");
  const logoBuffer = await readFile(logoPath);
  return `data:image/png;base64,${logoBuffer.toString("base64")}`;
}

const fontDefinitions = [
  { file: "NotoSans-Regular.ttf", name: "Noto Sans", weight: 400 as const },
  { file: "NotoSans-Bold.ttf", name: "Noto Sans", weight: 700 as const },
  { file: "NotoSansSymbols-Regular.ttf", name: "Noto Sans Symbols", weight: 400 as const },
  { file: "NotoSansMath-Regular.ttf", name: "Noto Sans Math", weight: 400 as const },
  { file: "NotoSansSymbols2-Regular.ttf", name: "Noto Sans Symbols 2", weight: 400 as const },
];
async function loadFonts() {
  return Promise.all(fontDefinitions.map(async ({ file, name, weight }) => {
    const bytes = await readFile(join(process.cwd(), "src/assets/fonts", file));
    if (bytes.readUInt32BE(0) !== 0x00010000 && bytes.toString("ascii", 0, 4) !== "OTTO") throw new Error(`Invalid social-card font: ${file}`);
    return { name, weight, style: "normal" as const, data: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer };
  }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string; keymap: string }>;
}) {
  const resolvedParams = await params;
  const app = getAppShortcutsBySlug(resolvedParams.slug);

  if (!app) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            backgroundColor: "#4a5568",
            color: "white",
            fontSize: 48,
          }}
        >
          App not found
        </div>
      ),
      { ...size }
    );
  }

  const [fonts, logoSrc] = await Promise.all([loadFonts(), loadLogo()]);
  const keymap = app.keymaps.find((k) =>
    keymapMatchesTitle(k, resolvedParams.keymap)
  ) ?? app.keymaps[0];
  const sections = keymap.sections.slice(0, 4);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#4a5568",
          padding: "40px",
          fontFamily: "Noto Sans, Noto Sans Symbols, Noto Sans Symbols 2, Noto Sans Math",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span
              style={{
                fontSize: 56,
                fontWeight: 700,
                color: "white",
              }}
            >
              {app.name}
            </span>
            <span
              style={{
                fontSize: 24,
                color: "#cbd5e0",
              }}
            >
              Keyboard Shortcuts Cheat Sheet
            </span>
          </div>
          <img alt=""
            src={logoSrc}
            width={120}
            height={66}
            style={{
              objectFit: "contain",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            flex: 1,
          }}
        >
          {sections.map((section: Section) => (
            <div
              key={section.title}
              style={{
                display: "flex",
                flexDirection: "column",
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "16px",
                width: "544px",
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#4a5568",
                  marginBottom: "10px",
                }}
              >
                {section.title}
              </span>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                }}
              >
                {section.hotkeys.slice(0, 6).map((hotkey, idx) => {
                  const keyGroups = getShortcutKeys(hotkey);
                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: 13,
                      }}
                    >
                      <span
                        style={{
                          color: "#2d3748",
                          maxWidth: "55%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {hotkey.title}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                        {keyGroups.map((keys, groupIdx) => (
                          <div key={groupIdx} style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                            {groupIdx > 0 && (
                              <span style={{ color: "#718096", fontSize: 10, margin: "0 2px" }}>then</span>
                            )}
                            {keys.map((key, keyIdx) => (
                              <span key={keyIdx} style={kbdStyle}>{key}</span>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
