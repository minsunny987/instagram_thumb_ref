// 아주 가벼운 비밀번호 체크. 레포/앱 URL은 공개지만 저장(쓰기) API는
// APP_PASSWORD 환경변수와 일치하는 값을 헤더로 보낼 때만 동작하게 막는다.
function checkPassword(req, res) {
  const required = process.env.APP_PASSWORD;
  if (!required) return true; // 설정 안 했으면 통과 (로컬 테스트용)
  const provided = req.headers["x-app-password"];
  if (provided === required) return true;
  res.status(401).json({ error: "비밀번호가 올바르지 않습니다." });
  return false;
}

module.exports = { checkPassword };
