import { NextResponse } from "next/server";

const MAX_INPUT_LENGTH = 12_000;

export async function POST(request: Request) {
  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (text.length < 3) {
    return NextResponse.json(
      { error: "Please enter a longer prompt to scan." },
      { status: 400 }
    );
  }

  if (text.length > MAX_INPUT_LENGTH) {
    return NextResponse.json(
      { error: `Prompt is too long. Limit is ${MAX_INPUT_LENGTH} characters.` },
      { status: 400 }
    );
  }

  const detectorUrl = process.env.DETECTOR_API_URL;
  if (!detectorUrl) {
    return NextResponse.json(
      { error: "Detector backend is not configured yet. Set DETECTOR_API_URL." },
      { status: 503 }
    );
  }

  try {
    const upstream = await fetch(`${detectorUrl.replace(/\/$/, "")}/detect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      cache: "no-store",
    });

    const payload = await upstream.json();
    return NextResponse.json(payload, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the detector backend." },
      { status: 502 }
    );
  }
}
