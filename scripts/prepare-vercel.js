import { mkdir, writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { GoogleGenAI } from "@google/genai";

const key = process.env.GEMINI_API_KEY?.trim();
const model = process.env.GEMINI_MODEL?.trim().replace(/^models\//, "");
const override = process.env.GEMINI_FILE_SEARCH_STORE?.trim();
const storePattern = /^fileSearchStores\/[a-z0-9-]+$/;
const displayName = "medi-study-dodeokgyung-1yXLG3D3L2dCd7Nd6vvp7lkb1GQZOfW4q";
const downloadUrl = "https://drive.usercontent.google.com/download?id=1yXLG3D3L2dCd7Nd6vvp7lkb1GQZOfW4q&export=download&confirm=t";

async function findOrIndex(apiKey) {
  const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "v1beta" } });
  const stores = await ai.fileSearchStores.list();
  for await (const candidate of stores) {
    if (candidate.displayName === displayName && storePattern.test(candidate.name) &&
        Number(candidate.activeDocumentsCount) === 1) {
      return candidate.name;
    }
  }

  const response = await fetch(downloadUrl, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error("Drive PDF 다운로드 실패 (HTTP " + response.status + ")");
  const pdf = Buffer.from(await response.arrayBuffer());
  if (pdf.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("Drive에서 PDF를 내려받지 못했습니다.");
  }

  const store = await ai.fileSearchStores.create({ config: { displayName } });
  if (!storePattern.test(store.name)) throw new Error("Gemini 검색 저장소를 만들지 못했습니다.");
  let operation = await ai.fileSearchStores.uploadToFileSearchStore({
    file: new Blob([pdf], { type: "application/pdf" }),
    fileSearchStoreName: store.name,
    config: { displayName: "dodeokgyung.pdf", mimeType: "application/pdf" }
  });

  const deadline = Date.now() + 8 * 60_000;
  while (!operation.done && Date.now() < deadline) {
    await delay(4000);
    operation = await ai.operations.get({ operation });
  }
  if (operation.error) throw new Error("Gemini가 PDF 인덱싱을 완료하지 못했습니다.");
  if (!operation.done) throw new Error("PDF 인덱싱 시간이 초과되었습니다.");
  return store.name;
}

try {
  if (process.env.VERCEL_ENV === "production" && (!key || !model)) {
    throw new Error("Vercel Production에 GEMINI_API_KEY와 GEMINI_MODEL을 설정해 주세요.");
  }
  if (override && !storePattern.test(override)) {
    throw new Error("GEMINI_FILE_SEARCH_STORE는 fileSearchStores/… 형식이어야 합니다.");
  }
  const store = override || (key && model ? await findOrIndex(key) : "");
  const directory = new URL("../lib/", import.meta.url);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL("document-store.json", directory), JSON.stringify({ store }) + "\n");
  if (store) console.log("도덕경 문서 검색 준비 완료");
} catch (error) {
  const message = String(error?.message ?? error);
  console.error(key ? message.replaceAll(key, "[숨김]") : message);
  process.exitCode = 1;
}
