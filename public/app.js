const PW_KEY = "ref_app_password";

const $ = (id) => document.getElementById(id);

function getPassword() {
  return localStorage.getItem(PW_KEY) || "";
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-app-password": getPassword(),
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    localStorage.removeItem(PW_KEY);
    showGate("비밀번호가 올바르지 않습니다.");
    throw new Error("unauthorized");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "요청 실패");
  return data;
}

function showGate(errorMsg) {
  $("gate").classList.remove("hidden");
  $("app").classList.add("hidden");
  $("gate-error").textContent = errorMsg || "";
}

function showApp() {
  $("gate").classList.add("hidden");
  $("app").classList.remove("hidden");
  loadGallery();
}

// --- 게이트(비밀번호) ---
$("gate-submit").addEventListener("click", async () => {
  const val = $("gate-input").value.trim();
  if (!val) return;
  localStorage.setItem(PW_KEY, val);
  try {
    await api("/api/list");
    showApp();
  } catch (e) {
    // showGate가 401에서 이미 처리
  }
});
$("gate-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("gate-submit").click();
});

$("logout-btn").addEventListener("click", () => {
  localStorage.removeItem(PW_KEY);
  showGate();
});

// --- 레퍼런스 추가 ---
let lastFetchedPlatform = "other";

$("fetch-btn").addEventListener("click", async () => {
  const url = $("url-input").value.trim();
  if (!url) return;
  $("fetch-status").textContent = "불러오는 중...";
  $("preview").classList.add("hidden");
  try {
    const data = await api("/api/fetch-meta", {
      method: "POST",
      body: JSON.stringify({ url }),
    });
    lastFetchedPlatform = data.platform || "other";
    $("title-input").value = data.title || "";
    $("thumb-input").value = data.thumbnailUrl || "";
    $("preview-img").src = data.thumbnailUrl || "";
    $("preview").classList.remove("hidden");
    $("fetch-status").textContent = data.fetched
      ? "자동으로 정보를 가져왔어요. 확인 후 등록하세요."
      : "자동 수집에 실패했어요. 제목/썸네일을 직접 입력해주세요.";
  } catch (e) {
    $("fetch-status").textContent = "오류: " + e.message;
  }
});

$("save-btn").addEventListener("click", async () => {
  const url = $("url-input").value.trim();
  const title = $("title-input").value.trim();
  const thumbnailUrl = $("thumb-input").value.trim();
  const category = $("category-input").value;
  const memo = $("memo-input").value.trim();
  if (!url) return;

  $("save-status").textContent = "저장 중...";
  try {
    const data = await api("/api/save", {
      method: "POST",
      body: JSON.stringify({
        url,
        platform: lastFetchedPlatform,
        title,
        thumbnailUrl,
        category,
        memo,
      }),
    });
    $("save-status").textContent = data.imageSaved
      ? "저장 완료!"
      : "저장 완료! (이미지는 저장되지 않았어요)";
    $("url-input").value = "";
    $("title-input").value = "";
    $("thumb-input").value = "";
    $("memo-input").value = "";
    $("category-input").value = "";
    $("preview").classList.add("hidden");
    loadGallery();
  } catch (e) {
    $("save-status").textContent = "오류: " + e.message;
  }
});

// --- 갤러리 ---
async function loadGallery() {
  const gallery = $("gallery");
  const empty = $("gallery-empty");
  gallery.innerHTML = "";
  try {
    const data = await api("/api/list");
    const items = data.items || [];
    if (items.length === 0) {
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");
    for (const item of items) {
      const a = document.createElement("a");
      a.className = "ref-card";
      a.href = item.url || "#";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.innerHTML = `
        <img src="${item.thumbnail || ""}" alt="" loading="lazy" onerror="this.style.opacity=0.2" />
        <div class="ref-info">
          <span class="ref-badge">${item.category || "미분류"}</span>
          <p class="ref-title">${escapeHtml(item.title || "(제목 없음)")}</p>
          <div class="ref-meta">
            <span>${item.platform || ""}</span>
            <span>${item.date || ""}</span>
          </div>
        </div>
      `;
      gallery.appendChild(a);
    }
  } catch (e) {
    // 401은 api()가 처리
  }
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

$("refresh-btn").addEventListener("click", loadGallery);

// --- 시작 ---
if (getPassword()) {
  api("/api/list").then(showApp).catch(() => {});
} else {
  showGate();
}

// --- PWA service worker ---
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
