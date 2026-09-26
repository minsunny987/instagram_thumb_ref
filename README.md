# 레퍼런스 저장소 (Instagram / Pinterest → GitHub 마크다운 동기화)

인스타그램·핀터레스트 링크를 붙여넣으면 썸네일/제목을 자동으로 가져와서
이 저장소 안의 `references/` 폴더에 마크다운 파일 + 이미지로 저장하는
개인용 웹앱입니다. PC와 모바일 어디서든 같은 주소로 접속해서 쓸 수 있고,
저장한 내용은 모두 이 GitHub 저장소에 커밋되어 자동으로 동기화됩니다.

- 인스타그램: og:image 태그를 읽어 썸네일/제목을 시도합니다. **인스타그램은
  자동 수집이 100% 보장되지 않아요** (비공개 계정, 정책 변경 등으로 실패할
  수 있음) — 실패하면 앱에서 직접 이미지 URL/제목을 입력할 수 있습니다.
- 핀터레스트: 공식 oEmbed API를 사용해서 안정적으로 가져와집니다.
- 저장된 항목은 프로젝트에서 쓰는 `01_STYLE_LIBRARY.md`와 같은 항목
  구조(Typography/Composition/Color/...)로 뼈대만 만들어두고, 세부 분석은
  나중에 직접 채우거나 Claude에게 분석을 요청하면 됩니다.

---

## 1. 배포 전 준비 — GitHub Personal Access Token 만들기

이 앱이 저장소에 파일을 커밋하려면 쓰기 권한이 있는 토큰이 필요합니다.

1. GitHub 우측 상단 프로필 → **Settings** → 왼쪽 메뉴 맨 아래
   **Developer settings** → **Personal access tokens** → **Fine-grained tokens**
2. **Generate new token** 클릭
3. Token name: `instagram-thumb-ref-app` 등 원하는 이름
4. Expiration: 원하는 기간 (예: 1년)
5. Repository access: **Only select repositories** → `instagram_thumb_ref` 선택
6. Permissions → **Repository permissions** → **Contents**: `Read and write` 로 설정
7. **Generate token** → 나오는 토큰 문자열을 복사해서 안전한 곳에 잠깐 보관
   (이 화면을 벗어나면 다시 볼 수 없어요)

---

## 2. 이 코드를 저장소에 올리기

이 폴더(`instagram_thumb_ref/`)의 파일 전체를 본인의
`https://github.com/minsunny987/instagram_thumb_ref` 저장소에 올립니다.

터미널에서:

```bash
git clone https://github.com/minsunny987/instagram_thumb_ref.git
cd instagram_thumb_ref
# 이 zip/폴더 안의 파일들을 여기로 복사해 넣기
git add .
git commit -m "레퍼런스 저장 앱 초기 세팅"
git push
```

---

## 3. Vercel에 배포하기 (무료)

1. https://vercel.com 접속 → GitHub 계정으로 로그인
2. **Add New... → Project**
3. `instagram_thumb_ref` 저장소 선택 → **Import**
4. Framework Preset은 자동으로 "Other"로 잡힙니다. 그대로 두고
   **Environment Variables**에 아래 4개를 추가:

   | Key | Value |
   |---|---|
   | `GITHUB_TOKEN` | 1번에서 만든 토큰 |
   | `GITHUB_OWNER` | `minsunny987` |
   | `GITHUB_REPO` | `instagram_thumb_ref` |
   | `APP_PASSWORD` | 앱 접속용으로 쓸 비밀번호 (아무거나, 본인만 알면 됨) |

5. **Deploy** 클릭 → 1분 정도 후 `https://instagram-thumb-ref.vercel.app`
   같은 주소가 생깁니다.

이후 이 주소로 PC 브라우저에서 접속하거나, 모바일 브라우저에서 접속한 뒤
"홈 화면에 추가"를 하면 앱처럼 아이콘이 생겨서 바로 쓸 수 있어요.

---

## 4. 사용법

1. 배포된 주소로 접속 → 2번에서 정한 `APP_PASSWORD` 입력
2. 인스타그램/핀터레스트 링크를 붙여넣고 **불러오기**
3. 자동으로 가져온 제목/썸네일을 확인 (실패하면 직접 입력)
4. 카테고리 선택, 메모 입력 (선택) 후 **레퍼런스로 등록**
5. 저장 즉시 GitHub 저장소의 `references/` 폴더에 커밋됩니다
   - `references/2026-09-26-instagram-xxxx.md`
   - `references/images/2026-09-26-instagram-xxxx.jpg`
6. 아래 갤러리에서 저장된 레퍼런스를 바로 확인할 수 있어요 (PC/모바일 공용,
   git이 쌓이는 대로 실시간으로 보입니다)

---

## 코드 구조

```
public/            정적 프론트엔드 (HTML/CSS/JS, PWA)
api/fetch-meta.js  URL을 받아 썸네일/제목 자동 수집
api/save.js        GitHub 저장소에 마크다운 + 이미지 커밋
api/list.js        저장된 레퍼런스 목록 조회
api/_github.js     GitHub Contents API 공용 헬퍼
api/_auth.js       간단한 비밀번호 체크
references/        저장된 레퍼런스가 쌓이는 폴더
```

## 나중에 바꾸고 싶을 때

- 카테고리 목록: `public/index.html`의 `<select id="category-input">` 수정
- 비밀번호: Vercel 프로젝트 설정의 `APP_PASSWORD` 환경변수만 바꾸면 됨
  (재배포 필요)
- 마크다운 템플릿(Typography/Color 등 항목): `api/save.js`의
  `buildMarkdown` 함수 수정
