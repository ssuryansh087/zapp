// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, Part } from "@google/generative-ai";

type Stack = "react-native" | "flutter";

const MODEL = "gemini-2.5-flash";

// Find this constant in your app/api/generate/route.ts and replace it with this new version.

// Find this constant in your app/api/generate/route.ts and update rule #7

const RN_TO_NEXTJS_TEMPLATE = (reactNativeCode: string) => `
You are an expert web developer specializing in converting React Native code to a browser-runnable React component with Tailwind CSS.

**Task:** Convert the following React Native code into a single, self-contained block of JSX code that can run directly in a browser.

**CRITICAL RULES:**
1.  **Output ONLY the raw JSX code block.** Do not include markdown fences (\`\`\`) or any explanations.
2.  **NO IMPORTS OR EXPORTS.** Do NOT include \`import React...\` or \`export default App\`. Assume 'React' and 'ReactDOM' are already available globally on the window object.
3.  **Define the component as a constant named "App".** For example: \`const App = () => { ... };\`.
4.  **Use Tailwind CSS for All Styling:** Convert React Native \`StyleSheet\` objects into Tailwind CSS classes. Use the \`className\` attribute.
5.  **Map Components to HTML:** Convert <View> to <div>, <Text> to <p>/<span>, <TouchableOpacity> to <button>, etc.
6.  **Preserve State & Logic:** Keep all \`useState\` hooks and handler functions.
7.  **Fill the Container:** The root element must be a \`<div>\` that fills its parent container and enables vertical scrolling if needed. Use this exact className: \`className="w-full h-full bg-white overflow-y-auto"\`. DO NOT use fixed pixel widths or heights like w-[393px].

**React Native Code to Convert:**
\`\`\`jsx
${reactNativeCode}
\`\`\`
`;

// Keep the rest of your API file the same as the previous version...
// ... (The two-step RN generation logic, Flutter logic, etc.)
// ... The only change needed is the prompt above.

// --- The original RN prompts are now only used for the first, intermediate step ---
const RN_INITIAL_TEMPLATE = (prompt: string) => `
Create a React Native screen component for: "${prompt}"
Requirements:
- Export a functional component named "Screen"
- Use React Native components (View, Text, ScrollView, etc.)
- Include StyleSheet for styling
- Use hooks if needed (useState, useEffect, etc.)
- DO NOT use the 'ref' prop or the 'useRef' hook.
Output only the code, no explanations.
`;

const RN_CHANGE_TEMPLATE = (prompt: string, code: string) => `
Modify this React Native code according to: "${prompt}"

Current code:
${code}

Return the complete modified code file. Do not use refs. Output only code, no explanations.
`;

// --- Flutter prompts are unchanged ---
const FLUTTER_INITIAL_TEMPLATE = (prompt: string) => `...`; // Keep your existing Flutter prompt
const FLUTTER_CHANGE_TEMPLATE = (prompt: string, code: string) => `...`; // Keep your existing Flutter prompt

function extractCode(text: string): string {
  let cleaned = text.trim();
  const fence = "```";
  if (cleaned.startsWith(fence)) {
    cleaned = cleaned.substring(cleaned.indexOf("\n") + 1);
    if (cleaned.endsWith(fence)) {
      cleaned = cleaned.substring(0, cleaned.lastIndexOf("\n"));
    }
  }
  return cleaned.trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, stack, code: previousCode } = body;

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    const model = genAI.getGenerativeModel({ model: MODEL });

    // --- NEW TWO-STEP LOGIC FOR REACT NATIVE ---
    if (stack === "react-native") {
      // STEP 1: Generate the React Native code as a blueprint.
      const rnPrompt = previousCode
        ? RN_CHANGE_TEMPLATE(prompt, previousCode.rn) // Assume previousCode is now { rn, next }
        : RN_INITIAL_TEMPLATE(prompt);

      const rnResult = await model.generateContent(rnPrompt);
      const rnCode = extractCode(rnResult.response.text());

      if (!rnCode || rnCode.length < 50) {
        throw new Error("Failed to generate intermediate React Native code.");
      }

      // STEP 2: Convert the React Native blueprint to a Next.js component.
      const nextJsPrompt = RN_TO_NEXTJS_TEMPLATE(rnCode);
      const nextJsResult = await model.generateContent(nextJsPrompt);
      const nextJsCode = extractCode(nextJsResult.response.text());

      if (!nextJsCode || nextJsCode.length < 50) {
        throw new Error("Failed to convert React Native code to Next.js.");
      }

      // Return both codes so we can ask for modifications later
      return NextResponse.json({ code: { rn: rnCode, next: nextJsCode } });
    }

    // --- Unchanged Flutter Logic ---
    if (stack === "flutter") {
      const flutterPrompt = previousCode
        ? FLUTTER_CHANGE_TEMPLATE(prompt, previousCode)
        : FLUTTER_INITIAL_TEMPLATE(prompt);

      const result = await model.generateContent(flutterPrompt);
      const newCode = extractCode(result.response.text());

      if (!newCode || newCode.length < 50) {
        throw new Error("Failed to generate valid Flutter code");
      }
      return NextResponse.json({ code: newCode });
    }

    return NextResponse.json({ error: "Invalid stack" }, { status: 400 });
  } catch (err: any) {
    console.error("Error in /api/generate:", err);
    return NextResponse.json(
      { error: err?.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
