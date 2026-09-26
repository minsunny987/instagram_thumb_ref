// GitHub Contents API에 파일을 만들거나 읽기 위한 공용 헬퍼.
// 필요한 환경변수:
//   GITHUB_TOKEN   - repo contents 쓰기 권한이 있는 Personal Access Token
//   GITHUB_OWNER   - 예: minsunny987
//   GITHUB_REPO    - 예: instagram_thumb_ref
//   GITHUB_BRANCH  - 기본값 "main"

const API_BASE = "https://api.github.com";

function repoInfo() {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  const token = process.env.GITHUB_TOKEN;
  if (!owner || !repo || !token) {
    throw new Error(
      "GITHUB_OWNER / GITHUB_REPO / GITHUB_TOKEN 환경변수가 설정되어 있지 않습니다."
    );
  }
  return { owner, repo, branch, token };
}

async function githubRequest(path, options = {}) {
  const { token } = repoInfo();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "instagram-thumb-ref-app",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`GitHub API 오류 (${res.status}): ${text}`);
    err.status = res.status;
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

// path 예: "references/2026-09-26-instagram-abc123.md"
// contentBase64: base64로 인코딩된 파일 내용
// 이미 파일이 있으면 update(sha 필요), 없으면 create
async function putFile({ path, contentBase64, message }) {
  const { owner, repo, branch } = repoInfo();
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");

  // 기존 파일 sha 조회 (있으면 업데이트, 없으면 새로 생성)
  let sha;
  try {
    const existing = await githubRequest(
      `/repos/${owner}/${repo}/contents/${encodedPath}?ref=${branch}`
    );
    sha = existing?.sha;
  } catch (e) {
    if (e.status !== 404) throw e;
  }

  return githubRequest(`/repos/${owner}/${repo}/contents/${encodedPath}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: contentBase64,
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
}

async function listDir(path) {
  const { owner, repo, branch } = repoInfo();
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  try {
    const data = await githubRequest(
      `/repos/${owner}/${repo}/contents/${encodedPath}?ref=${branch}`
    );
    return Array.isArray(data) ? data : [];
  } catch (e) {
    if (e.status === 404) return [];
    throw e;
  }
}

function rawUrl(path) {
  const { owner, repo, branch } = repoInfo();
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}

module.exports = { repoInfo, githubRequest, putFile, listDir, rawUrl };
