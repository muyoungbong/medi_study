# Medi Study

Google Drive의 [노자 도덕경 전문 해설 PDF](https://drive.google.com/file/d/1yXLG3D3L2dCd7Nd6vvp7lkb1GQZOfW4q/view)를 검색해 한국어로 답하는 RAG 챗봇입니다. Gemini File Search가 관련 문서 구간을 검색합니다. 서버는 파일 인용이 포함된 응답을 표시하고, 인용이 없으면 근거를 찾지 못했다고 안내합니다.

## 참고 문서 수동 등록 (선택 사항)

1. Drive에서 `dodeokgyung.pdf`(154쪽)를 내려받습니다.
2. Node.js 22 환경에서 `npm install`을 실행합니다.
3. `.env.example`을 `.env.local`로 복사하고 Gemini API 키를 `GEMINI_API_KEY`에 입력합니다.
4. 아래 명령으로 내려받은 문서를 등록합니다. 이 명령은 파일을 Gemini File Search에 업로드하고 검색용 인덱스를 생성합니다.

   ```sh
   npm run index:document -- "/path/to/dodeokgyung.pdf"
   ```

5. 작업이 끝나면 출력된 `GEMINI_FILE_SEARCH_STORE` 값을 복사합니다. 문서를 교체할 때는 새 파일로 인덱스를 만들고 Vercel 설정의 저장소 값을 바꿉니다.

## Vercel 배포

기본 설정에서는 Vercel 빌드가 Drive에서 PDF를 내려받아 한 번 등록하고 이후 배포에서도 검색 저장소를 재사용합니다. Gemini 키와 모델을 Production 환경에 설정합니다. 이미 등록한 저장소를 사용하려면 수동 등록 절차에 따라 저장소 이름을 입력합니다.

GitHub 저장소를 Vercel에 가져오고 프레임워크 프리셋을 **Other**로 설정합니다. 기존 저장소 하위 폴더에 앱을 추가할 경우 Vercel의 **Root Directory**를 해당 폴더로 지정합니다.

| 환경변수 | 값 |
| --- | --- |
| `GEMINI_API_KEY` | Gemini API 키 |
| `GEMINI_MODEL` | Gemini Interactions API와 File Search를 지원하는 모델 ID |
| `GEMINI_FILE_SEARCH_STORE` | 선택 사항. 이미 등록한 `fileSearchStores/…` 값 |

환경변수를 저장한 뒤 새로 배포합니다. 앱 서버는 요청 시 Gemini API를 호출합니다. Drive 링크는 원문 열기에 사용하므로 원문을 보려면 Drive 권한이 필요합니다. 앱 접근 권한은 Vercel 프로젝트에서 설정합니다.

## 배포 확인

- ‘도덕경 1장에서 무명과 유명은 각각 무엇을 뜻하나요?’라고 질문해 답변과 문서 출처를 확인합니다.
- 문서와 무관한 질문을 입력해 근거 부족 안내가 나오는지 확인합니다.
- 두 번째 질문에서 앞선 질문의 내용을 가리켜 대화 맥락이 전달되는지 확인합니다.

[Gemini File Search 문서](https://ai.google.dev/gemini-api/docs/file-search) · [Vercel 환경변수 문서](https://vercel.com/docs/environment-variables)
