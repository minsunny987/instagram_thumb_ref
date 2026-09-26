const { checkPassword } = require("./_auth");

function detectPlatform(url) {
  const h = new URL(url).hostname.replace(/^www\./, "");
  if (h.includes("pinterest.") || h === "pin.it") return "pinterest";
  if (h.includes("instagram.com")) return "instagram";
  return "other";
}

function extractMeta(html, property) {
  // og:xxx 또는 twitter:xxx meta 태그에서 content 값을 뽑아낸다.
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
      "i"
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return m[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"');
  }
  return null;
}

async function fetchPinterestMeta(url) {
  const oembedUrl = `https://www.pinterest.com/oembed.json?url=${encodeURIComponent(
    url
  )}`;
  const res = await fetch(oembedUrl);
  if (!res.ok) throw new Error("Pinterest oEmbed 조회 실패");
  const data = await res.json();
  return {
    title: data.title || null,
    thumbnailUrl: data.thumbnail_url || null,
    author: data.author_name || null,
  };
}

async function fetchOgMeta(url) {
  // Instagram/기타: facebookexternalhit UA로 요청하면 og 태그가 서버에서
  // 그대로 렌더링되어 오는 경우가 많다 (완전히 보장되지는 않음).
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
      "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
    },
    redirect: "follow",
  });
  const html = await res.text();
  return {
    title: extractMeta(html, "og:title"),
    thumbnailUrl: extractMeta(html, "og:image"),
    author: extractMeta(html, "og:site_name"),
  };
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST만 지원합니다." });
    return;
  }
  if (!checkPassword(req, res)) return;

  const { url } = req.body || {};
  if (!url) {
    res.status(400).json({ error: "url이 필요합니다." });
    return;
  }

  let platform;
  try {
    platform = detectPlatform(url);
  } catch {
    res.status(400).json({ error: "올바른 URL이 아닙니다." });
    return;
  }

  try {
    let meta;
    if (platform === "pinterest") {
      meta = await fetchPinterestMeta(url);
    } else {
      meta = await fetchOgMeta(url);
    }
    res.status(200).json({
      platform,
      title: meta.title || null,
      thumbnailUrl: meta.thumbnailUrl || null,
      author: meta.author || null,
      fetched: Boolean(meta.title || meta.thumbnailUrl),
    });
  } catch (e) {
    // 자동 수집 실패 - 프론트에서 수동 입력으로 대체하도록 안내
    res.status(200).json({
      platform,
      title: null,
      thumbnailUrl: null,
      author: null,
      fetched: false,
      error: e.message,
    });
  }
};
