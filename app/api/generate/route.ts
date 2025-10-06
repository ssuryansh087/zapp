// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = "gemini-2.5-pro";

type Stack = "react-native" | "flutter";
type VirtualFile = {
  path: string;
  content: string;
  type: "file";
};
type VirtualFilesystem = {
  [path: string]: VirtualFile;
};

// --- PROMPT ENGINEERING ---

const INITIAL_PROJECT_PROMPT = (prompt: string, stack: Stack) => `
You are an expert ${stack} project architect and a senior UI/UX designer specializing in the Apple VisionOS aesthetic. A user wants to build an application based on the following prompt: "${prompt}".

Your task is to generate a complete, production-ready starting file structure. The design language MUST be ultra-minimal, glassy, and inspired by VisionOS. This means using blurred backgrounds, translucency (glassmorphism), rounded corners, and subtle gradients.

**CRITICAL REQUIREMENTS for React Native:**
- Create a visually stunning, VisionOS-inspired interface using the principles of glassmorphism.
- You MUST use the 'react-native-paper' component library for core UI elements like Buttons, TextInputs, etc., but style them to fit the glassy aesthetic.
- When generating the package.json, you MUST include "react-native-paper" and "react-native-blur" in the dependencies.
- Use the <BlurView> component from 'react-native-blur' for translucent backgrounds.
- Pay close attention to a clean color palette, generous spacing, and modern typography.

**CRITICAL REQUIREMENTS for Flutter:**
- The MaterialApp widget MUST include \`debugShowCheckedModeBanner: false,\`.
- Use widgets like \`BackdropFilter\` with \`ImageFilter.blur\` to achieve the glassmorphism effect.

**Output:**
Return a single JSON object where keys are the full file paths and values are the complete source code for that file. The output MUST be only the raw JSON object.
`;

const PLANNER_PROMPT = (prompt: string, fileTree: string, stack: Stack) => `
You are an expert ${stack} project architect. A user wants to modify their project with the following request: "${prompt}".

Here is the current file structure of the project:
${fileTree}

Based on the user's request, create a step-by-step plan. Return a JSON array of "actions".
Valid actions are: "CREATE_FILE", "MODIFY_FILE".
For each action, provide the file path and a concise, one-sentence task description for another AI to execute. Do not suggest adding dependencies.

**Example Response:**
[
  { "action": "CREATE_FILE", "path": "src/services/authService.js", "task": "Create a new file to handle Firebase authentication logic." },
  { "action": "MODIFY_FILE", "path": "src/screens/HomeScreen.js", "task": "Import the new authService and add a logout button." }
]
`;

const EXECUTOR_PROMPT = (
  task: string,
  relevantFiles: VirtualFile[],
  fileTree: string
) => `
You are an expert programmer and UI designer specializing in the Apple VisionOS aesthetic (glassmorphism, translucency, blurred backgrounds). Your task is to execute a single step in a larger plan.
**Task:** ${task}

**CRITICAL STYLING RULE:** The UI must adhere to a minimal, glassy, VisionOS-inspired design. For React Native, use 'react-native-paper' and 'react-native-blur'. For Flutter, use 'BackdropFilter'.
Here is the full directory tree for context:
${fileTree}

Here are the full contents of the relevant file(s) you need to read or modify.
${relevantFiles
  .map(
    (f) =>
      `\n--- START OF FILE: ${f.path} ---\n${f.content}\n--- END OF FILE: ${f.path} ---`
  )
  .join("\n")}

Return ONLY the complete, updated source code for the single file you were asked to modify or create. Do not include markdown fences, file paths, or explanations.
`;

// This prompt creates the single, self-contained preview file for Flutter.
const FLUTTER_PREVIEW_GENERATOR_PROMPT = (fileSystem: VirtualFilesystem) => `
You are a Flutter preview generator. Your task is to combine a multi-file Flutter project into a single, runnable 'main.dart' file for a preview environment like DartPad.

Here is the entire project's file system:
${JSON.stringify(fileSystem, null, 2)}

CRITICAL RULES:
// ... (other rules)
- The MaterialApp widget MUST include \`debugShowCheckedModeBanner: false,\`.
- **CRUCIAL: For all placeholder images, you MUST use \`Image.network('https://picsum.photos/seed/picsum/WIDTH/HEIGHT')\`, replacing WIDTH and HEIGHT. Do NOT use \`via.placeholder.com\` or \`Image.asset\`, as they are blocked by browser security (CORS).**
- Do not use any icons that are not part of the standard 'Icons' class.
- Output ONLY the raw Dart code.
`;

// This prompt creates the single, self-contained preview file for React Native.
const RN_TO_BROWSER_PREVIEW_PROMPT = (reactNativeCode: string) => `
You are an expert web developer. Convert the following React Native code into a single, self-contained block of JSX code that can run directly in a browser with React and Tailwind CSS.
CRITICAL RULES:
1.  Output ONLY the raw JSX code block. No markdown fences.
2.  NO IMPORTS OR EXPORTS.
3.  Define the component as a constant named "App". Example: \`const App = () => { ... };\`.
4.  Use Tailwind CSS for All Styling.
5.  The root element must be a \`<div>\` with \`className="w-full h-full bg-white overflow-y-auto"\`.

React Native Code to Convert:
\`\`\`jsx
${reactNativeCode}
\`\`\`
`;

// --- HELPER FUNCTIONS ---
function extractJson(text: string) {
  const match = text.match(/```json\n([\s\S]*?)\n```/);
  if (match) {
    return JSON.parse(match[1]);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Received invalid JSON from AI model.");
  }
}
function extractCode(text: string) {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .substring(cleaned.indexOf("\n") + 1, cleaned.lastIndexOf("```"))
      .trim();
  }
  return cleaned;
}

// --- MAIN API LOGIC ---
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, stack, virtualFilesystem, activeFile } = body;

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    const model = genAI.getGenerativeModel({ model: MODEL });

    let updatedFilesystem: VirtualFilesystem;
    let newActiveFile = activeFile;

    if (!virtualFilesystem) {
      // --- 1A. INITIAL PROJECT GENERATION ---
      const result = await model.generateContent(
        INITIAL_PROJECT_PROMPT(prompt, stack)
      );
      const filesObject = extractJson(result.response.text());
      updatedFilesystem = {};
      for (const path in filesObject) {
        updatedFilesystem[path] = {
          path,
          content: filesObject[path],
          type: "file",
        };
      }
      newActiveFile =
        Object.keys(updatedFilesystem).find(
          (p) =>
            p.includes("screen") || p.includes("view") || p.includes("page")
        ) || Object.keys(updatedFilesystem)[0];
    } else {
      // --- 1B. ITERATIVE MODIFICATION ---
      updatedFilesystem = { ...virtualFilesystem };
      const fileTree = Object.keys(updatedFilesystem).join("\n");
      const planResult = await model.generateContent(
        PLANNER_PROMPT(prompt, fileTree, stack)
      );
      const plan = extractJson(planResult.response.text());

      for (const action of plan) {
        const relevantFiles = Object.values(updatedFilesystem).filter(
          (p) =>
            p.path.includes(action.path.split("/").pop() || "main") ||
            p.path.includes("service")
        );
        const execResult = await model.generateContent(
          EXECUTOR_PROMPT(action.task, relevantFiles, fileTree)
        );
        const newContent = extractCode(execResult.response.text());
        updatedFilesystem[action.path] = {
          path: action.path,
          content: newContent,
          type: "file",
        };
        newActiveFile = action.path; // Set the last modified file as active
      }
    }

    // --- 2. PREVIEW GENERATION (The new hybrid step) ---
    let activeFilePreviewCode = null;

    if (stack === "flutter") {
      const previewResult = await model.generateContent(
        FLUTTER_PREVIEW_GENERATOR_PROMPT(updatedFilesystem)
      );
      activeFilePreviewCode = extractCode(previewResult.response.text());
    } else if (stack === "react-native") {
      const fileToPreview =
        newActiveFile && updatedFilesystem[newActiveFile]?.content;
      if (fileToPreview) {
        const previewResult = await model.generateContent(
          RN_TO_BROWSER_PREVIEW_PROMPT(fileToPreview)
        );
        activeFilePreviewCode = extractCode(previewResult.response.text());
      }
    }

    // --- 3. SEND RESPONSE ---
    return NextResponse.json({
      virtualFilesystem: updatedFilesystem,
      activeFile: newActiveFile,
      activeFilePreviewCode, // This is the single-file code for the previewer
    });
  } catch (err: any) {
    console.error("Error in /api/generate:", err);
    return NextResponse.json(
      { error: err?.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
