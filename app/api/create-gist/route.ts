import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }

    const res = await fetch("https://api.github.com/gists", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        description: "Zapp Flutter preview",
        public: true,
        files: {
          "main.dart": { content: code },
        },
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Failed to create gist");
    }

    const data = await res.json();
    const gistId = data.id;

    return NextResponse.json({ gistId });
  } catch (err: any) {
    console.error("Gist creation error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create gist" },
      { status: 500 }
    );
  }
}
