const { checkPassword } = require("./_auth");
const { putFile } = require("./_github");

function slugify(str) {
  return (str || "")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function todayStr() {
  const d = new Date();
  const tz = new Date(d.getTime() + 9 * 60 * 60 * 1000); // KST
  return tz.toISOString().slice(0, 10);
}

function buildMarkdown({ url, platform, title, category, memo, imagePath, date }) {
  const safeTitle = title ? title.replace(/\r?\n/g, " ").trim() : "(제목 없음)";
  return `---
url: ${url}
platform: ${platform}
title: "${safeTitle.replace(/"/g, '\\"')}"
category: ${category || "미분류"}
date: ${date}
thumbnail: ${imagePath || ""}
---

Reference:
${safeTitle} (${url})

Category:
${category || "[editorial / information / youth / beauty / food / etc.]"}

Typography:
- 제목 크기:
- 제목 weight:
- 본문:
- 정렬:
- 특징:

Composition:
- grid:
- focal point:
- image/text ratio:
- overlap:
- margin:

Color:
- dominant:
- secondary:
- accent:
- saturation:

Image:
- photography / illustration / collage
- crop
- lighting
- retouching

Texture:
- grain
- paper
- shadow
- material
- etc.

Good:
${memo ? memo : "(아직 미작성)"}

Bad:
(아직 미작성)

Reusable Principle:
(아직 미작성 - 나중에 Claude와 함께 분석해서 채워넣기)
`;
}

async function downloadImageBase64(imageUrl) {
  const res = await fetch(imageUrl, {
    headers: {
      "User-Agent":
        "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    },
  });
  if (!res.ok) throw new Error("이미지 다운로드 실패");
  const contentType = res.headers.get("content-type") || "";
  const ext = contentType.includes("png")
    ? "png"
    : contentType.includes("webp")
    ? "webp"
    : "jpg";
  const buf = Buffer.from(await res.arrayBuffer());
  return { base64: buf.toString("base64"), ext };
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST만 지원합니다." });
    return;
  }
  if (!checkPassword(req, res)) return;

  const { url, platform, title, thumbnailUrl, category, memo } = req.body || {};
  if (!url) {
    res.status(400).json({ error: "url이 필요합니다." });
    return;
  }

  const date = todayStr();
  const base = slugify(title) || Math.random().toString(36).slice(2, 8);
  const slug = `${date}-${platform || "ref"}-${base}`;

  let imagePath = null;
  if (thumbnailUrl) {
    try {
      const { base64, ext } = await downloadImageBase64(thumbnailUrl);
      imagePath = `references/images/${slug}.${ext}`;
      await putFile({
        path: imagePath,
        contentBase64: base64,
        message: `이미지 추가: ${slug}`,
      });
    } catch (e) {
      // 이미지 저장 실패해도 텍스트 레퍼런스는 계속 저장
      imagePath = null;
    }
  }

  const markdown = buildMarkdown({
    url,
    platform,
    title,
    category,
    memo,
    imagePath,
    date,
  });
  const mdPath = `references/${slug}.md`;

  try {
    await putFile({
      path: mdPath,
      contentBase64: Buffer.from(markdown, "utf-8").toString("base64"),
      message: `레퍼런스 등록: ${slug}`,
    });
    res.status(200).json({
      ok: true,
      slug,
      mdPath,
      imagePath,
      imageSaved: Boolean(imagePath),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
