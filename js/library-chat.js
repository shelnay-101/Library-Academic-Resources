
async function askLibraryAI(message) {
  const response = await fetch("/api/library-ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "AI request failed");
  }

  return data.answer;
}


const aiForm = document.getElementById("ai-form");
const aiQuestion = document.getElementById("ai-question");
const aiMessages = document.getElementById("ai-messages");

aiForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const question = aiQuestion.value.trim();

  if (!question) return;

  const userMessage = document.createElement("p");
  userMessage.textContent = "You: " + question;
  aiMessages.appendChild(userMessage);

  aiQuestion.value = "";

  const loading = document.createElement("p");
  loading.textContent = "AI is thinking...";
  aiMessages.appendChild(loading);

  try {
    const answer = await askLibraryAI(question);

    loading.textContent = "AI: " + answer;

  } catch (error) {
    loading.textContent =
      "Sorry, the assistant is unavailable. Please try again.";
  }
});

