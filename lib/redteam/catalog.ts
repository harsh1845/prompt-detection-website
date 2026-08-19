import catalogJson from "./corpora/catalog.json";
import jailbreak from "./corpora/jailbreak.json";
import injection from "./corpora/injection.json";
import promptLeak from "./corpora/prompt_leak.json";
import benign from "./corpora/benign_hard_negatives.json";
import proprietary from "./corpora/proprietary.json";

export const MAX_CUSTOM_ITEMS = 50;
export const MAX_ITEMS_HARD_CAP = 100;

export type ExpectedLabel = "attack" | "benign";

export type CorpusItem = {
  id: string;
  corpus: string;
  text: string;
  expected: ExpectedLabel;
  tags: string[];
};

type PackFile = {
  id: string;
  name: string;
  items: {
    id: string;
    expected: string;
    tags?: string[];
    text: string;
  }[];
};

const PACK_FILES: Record<string, PackFile> = {
  jailbreak,
  injection,
  prompt_leak: promptLeak,
  benign_hard_negatives: benign,
  proprietary,
};

export type CorpusPackMeta = {
  id: string;
  name: string;
  category: string;
  description: string;
  itemCount: number;
};

export function listCorpusPacks(): CorpusPackMeta[] {
  return catalogJson.packs.map((pack) => {
    const file = PACK_FILES[pack.id];
    return {
      id: pack.id,
      name: pack.name,
      category: pack.category,
      description: pack.description,
      itemCount: file?.items.length ?? 0,
    };
  });
}

export function parseCustomPrompts(
  raw: string,
  cap = MAX_CUSTOM_ITEMS
): CorpusItem[] {
  const items: CorpusItem[] = [];

  const lines = raw.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    let text = lines[index].trim();
    if (!text) continue;

    let expected: ExpectedLabel = "attack";
    if (text.toLowerCase().startsWith("benign:")) {
      expected = "benign";
      text = text.slice(7).trim();
    }
    if (!text) continue;

    items.push({
      id: `custom-${String(index + 1).padStart(3, "0")}`,
      corpus: "custom",
      text,
      expected,
      tags: ["custom"],
    });

    if (items.length >= cap) break;
  }

  return items;
}

export function resolveCorpusItems(
  corpusIds: string[],
  customText = "",
  maxItems = MAX_ITEMS_HARD_CAP
): CorpusItem[] {
  const items: CorpusItem[] = [];
  const seen = new Set<string>();

  for (const packId of corpusIds) {
    const pack = PACK_FILES[packId];
    if (!pack) continue;
    for (const row of pack.items) {
      const text = row.text.trim();
      if (!text || seen.has(text)) continue;
      seen.add(text);
      items.push({
        id: row.id,
        corpus: packId,
        text,
        expected: row.expected === "benign" ? "benign" : "attack",
        tags: row.tags ?? [],
      });
    }
  }

  for (const row of parseCustomPrompts(customText)) {
    if (seen.has(row.text)) continue;
    seen.add(row.text);
    items.push(row);
  }

  const cap = Math.max(1, Math.min(maxItems, MAX_ITEMS_HARD_CAP));
  return items.slice(0, cap);
}
