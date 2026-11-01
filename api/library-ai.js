
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const message = req.body?.message;

  if (
    typeof message !== "string" ||
    !message.trim() ||
    message.length > 2000
  ) {
    return res.status(400).json({
      error: "Invalid question"
    });
  }

  try {
    const { data: books, error } = await supabase.rpc(
      "search_books",
      { search_query: message.trim() }
    );

    if (error) throw error;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",

      config: {
        systemInstruction: `
You are Library QR Finder AI Assistant.

Help users discover books and library features.

Use the actual book records supplied.
Recommend relevant books.
Explain their floor, section and shelf.
Never invent book availability or locations.
Explain that users can submit book requests.
Do not invent borrowing or fine policies.
Use friendly, simple language.
        `,
        maxOutputTokens: 500
      },

      contents: `
User question:
${message.trim()}

Supabase book search results:
${JSON.stringify(books || [])}

Answer the user's question using these records.
      `
    });

    return res.status(200).json({
      answer: response.text || "Sorry, I could not generate an answer.",
      books_found: (books || []).length
    });

  } catch (error) {
    console.error("Library AI error:", error.message);

    return res.status(500).json({
      error: "The library assistant is temporarily unavailable."
    });
  }
}
