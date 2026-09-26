const { checkPassword } = require("./_auth");
const { listDir, rawUrl } = require("./_github");

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    val = val.replace(/^"(.*)"$/, "$1");
    out[key] = val;
  }
  return out;
}

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "GET만 지원합니다." });
    return;
  }
  if (!checkPassword(req, res)) return;

  try {
    const files = await listDir("references");
    const mdFiles = files.filter((f) => f.type === "file" && f.name.endsWith(".md"));

    // 최신순 정렬 (파일명이 날짜로 시작하므로 문자열 정렬로 충분)
    mdFiles.sort((a, b) => (a.name < b.name ? 1 : -1));

    const results = await Promise.all(
      mdFiles.map(async (f) => {
        try {
          const raw = await fetch(rawUrl(`references/${f.name}`)).then((r) =>
            r.text()
          );
          const fm = parseFrontmatter(raw);
          return {
            file: f.name,
            url: fm.url || null,
            platform: fm.platform || null,
            title: fm.title || null,
            category: fm.category || null,
            date: fm.date || null,
            thumbnail: fm.thumbnail ? rawUrl(fm.thumbnail) : null,
          };
        } catch {
          return { file: f.name, error: true };
        }
      })
    );

    res.status(200).json({ items: results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
