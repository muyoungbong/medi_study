const form = document.querySelector("#composer");
const questionInput = document.querySelector("#question");
const conversation = document.querySelector("#conversation");
const status = document.querySelector("#status");
const send = document.querySelector("#send");
const reset = document.querySelector("#reset");
let previousQuestions = [];

function renderMessage(label, text, className) {
  const message = document.createElement("article");
  message.className = "message " + className;
  const heading = document.createElement("h2");
  heading.textContent = label;
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  message.append(heading, paragraph);
  conversation.append(message);
  return message;
}

function renderSources(message, sources) {
  if (!sources.length) return;

  const { title, url } = sources[0];
  const pages = [...new Set(sources.map(source => source.page).filter(Number.isInteger))]
    .sort((first, second) => first - second);
  const line = document.createElement("p");
  line.append("출처 · ");

  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = title + (pages.length ? " " + pages.join(", ") + "쪽" : "");
  line.append(link);
  message.append(line);
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const question = questionInput.value.trim();
  if (!question || send.disabled) return;

  send.disabled = reset.disabled = true;
  status.textContent = "참고 문서에서 근거를 찾고 있습니다…";
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, previousQuestions }),
      signal: AbortSignal.timeout(55_000)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      status.textContent = result.error || "요청이 지연됐습니다. 다시 시도해 주세요.";
      return;
    }
    renderMessage("내 질문", question, "question");
    const message = renderMessage("문서 답변", result.answer, "answer");
    renderSources(message, result.sources);
    previousQuestions = [...previousQuestions, question].slice(-3);
    if (questionInput.value.trim() === question) questionInput.value = "";
    reset.hidden = false;
    status.textContent = "";
    message.scrollIntoView({ block: "nearest" });
  } catch {
    status.textContent = "연결을 확인하고 다시 시도해 주세요.";
  } finally {
    send.disabled = reset.disabled = false;
  }
});

reset.addEventListener("click", () => {
  conversation.replaceChildren();
  previousQuestions = [];
  reset.hidden = true;
  status.textContent = "";
  questionInput.value = "";
  questionInput.focus();
});
