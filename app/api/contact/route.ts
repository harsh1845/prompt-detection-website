import { NextResponse } from "next/server";
import { Resend } from "resend";

const emailOk = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;

export async function POST(request: Request) {
  let body: { email?: string; needs?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = (body.email ?? "").trim();
  const needs = (body.needs ?? "").trim();

  if (!emailOk(email)) {
    return NextResponse.json(
      { error: "Please enter a valid business email." },
      { status: 400 }
    );
  }

  if (needs.length < 10) {
    return NextResponse.json(
      { error: "Please describe your needs in a bit more detail." },
      { status: 400 }
    );
  }

  if (needs.length > 4000) {
    return NextResponse.json(
      { error: "Needs description is too long." },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL;

  if (!apiKey || !to) {
    console.error(
      "Missing RESEND_API_KEY or CONTACT_EMAIL. Set them in .env.local to deliver contact form emails."
    );
    return NextResponse.json(
      {
        error:
          "Contact form is not configured yet. Please set CONTACT_EMAIL and RESEND_API_KEY.",
      },
      { status: 503 }
    );
  }

  const resend = new Resend(apiKey);
  const from =
    process.env.CONTACT_FROM ?? "PromptGuard <onboarding@resend.dev>";

  try {
    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: email,
      subject: `New PromptGuard inquiry from ${email}`,
      text: [
        "New get-in-touch submission from the PromptGuard site.",
        "",
        `Business email: ${email}`,
        "",
        "Needs:",
        needs,
      ].join("\n"),
      html: `
        <div style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
          <p style="margin: 0 0 12px;">New get-in-touch submission from the PromptGuard site.</p>
          <p style="margin: 0 0 8px;"><strong>Business email:</strong> ${escapeHtml(email)}</p>
          <p style="margin: 16px 0 6px;"><strong>Needs:</strong></p>
          <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(needs)}</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Could not send your message. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact send failed:", err);
    return NextResponse.json(
      { error: "Could not send your message. Please try again." },
      { status: 502 }
    );
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
