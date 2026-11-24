import { stat } from "node:fs/promises";
import { basename } from "node:path";
import { setTimeout } from "node:timers/promises";
import { GoogleGenAI } from "@google/genai";

async function indexDocument(file, apiKey) {
  const info = await stat(file);
  if (!info.isFile() || info.size === 0) throw new Error("내용이 있는 참고 문서 파일을 지정해 주세요.");

  const ai = new GoogleGenAI({ apiKey });
  const store = await ai.fileSearchStores.create({ config: { displayName: "medi_study" } });
  if (!store.name) throw new Error("문서 검색 저장소를 만들지 못했습니다.");
  console.error("문서 인덱싱 중 " + store.name);

  let operation = await ai.fileSearchStores.uploadToFileSearchStore({
    file,
    fileSearchStoreName: store.name,
    config: { displayName: basename(file) }
  });

  const deadline = Date.now() + 10 * 60 * 1000;
  while (!operation.done && Date.now() < deadline) {
    await setTimeout(4000);
    operation = await ai.operations.get({ operation });
  }

  if (operation.error) throw new Error("Gemini가 문서 인덱싱을 완료하지 못했습니다.");
  if (!operation.done) throw new Error("시간 초과. 동일 작업을 재실행하기 전에 생성된 저장소를 확인해 주세요.");
  console.log("GEMINI_FILE_SEARCH_STORE=" + store.name);
}

try {
  const file = process.argv[2];
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!file || !apiKey) {
    throw new Error("GEMINI_API_KEY 설정 후 npm run index:document -- <문서 파일>을 실행해 주세요.");
  }
  await indexDocument(file, apiKey);
} catch (error) {
  const message = String(error?.message ?? error);
  const key = process.env.GEMINI_API_KEY?.trim();
  console.error(key ? message.replaceAll(key, "[숨김]") : message);
  process.exitCode = 1;
}
