# Google OAuth "invalid_client" / 401 해결

## 원인

- **invalid_client (401)**: Google이 “이 앱(클라이언트)”을 인식하지 못함.
- 주로 다음 중 하나입니다.
  1. **Vercel 환경 변수**에 넣은 Client ID / Secret이 Google Cloud와 다르거나 비어 있음.
  2. **배포 URL**이 Google OAuth 클라이언트의 “승인된 리디렉션 URI”에 없음.

---

## 1. Vercel 환경 변수 확인

1. Vercel 대시보드 → 프로젝트 → **Settings** → **Environment Variables**
2. 다음 변수가 **Production / Preview**에 설정돼 있는지 확인:

| 이름 | 설명 | 비고 |
|------|------|------|
| `GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID | `.apps.googleusercontent.com` 로 끝남 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 클라이언트 비밀 | 공백 없이 복사 |
| `NEXTAUTH_URL` | 배포된 앱 URL | 예: `https://프로젝트명.vercel.app` (끝에 `/` 없이) |
| `NEXTAUTH_SECRET` | NextAuth 암호화용 | 랜덤 문자열 권장 |

3. **저장 후 반드시 Redeploy** (환경 변수 변경은 재배포 후 적용).

---

## 2. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/) → 프로젝트 선택.
2. **API 및 서비스** → **사용자 인증 정보**.
3. 사용 중인 **OAuth 2.0 클라이언트 ID** (웹 애플리케이션) 선택.

### 승인된 리디렉션 URI에 추가

- **리디렉션 URI** 목록에 다음을 **정확히** 추가 (프로젝트 URL에 맞게 수정):

```
https://프로젝트명.vercel.app/api/auth/callback/google
```

- 예: 도메인이 `my-stock-app.vercel.app` 이면  
  `https://my-stock-app.vercel.app/api/auth/callback/google`
- **저장** 후 수 분 기다리면 반영됨.

### 클라이언트 ID / 비밀번호

- **클라이언트 ID**: Vercel의 `GOOGLE_CLIENT_ID`와 **완전히 동일**해야 함.
- **클라이언트 비밀**: 새로 만들었다면 Google에서 복사한 값을 Vercel `GOOGLE_CLIENT_SECRET`에 다시 넣고 재배포.

---

## 3. 체크리스트

- [ ] Google Cloud에서 OAuth 동의 화면이 “테스트” 이상으로 게시됨.
- [ ] Vercel에 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET` 설정.
- [ ] `NEXTAUTH_URL` = `https://실제배포도메인.vercel.app` (슬래시 없음).
- [ ] Google “승인된 리디렉션 URI”에 `https://실제배포도메인.vercel.app/api/auth/callback/google` 추가.
- [ ] 환경 변수 수정 후 Vercel에서 **Redeploy** 실행.

---

## 4. 로컬에서만 사용할 때

- 로컬: `NEXTAUTH_URL=http://localhost:3008`
- Google 리디렉션 URI에 `http://localhost:3008/api/auth/callback/google` 추가.

이후에도 401이 나오면, Vercel에 설정한 `GOOGLE_CLIENT_ID` 값(앞뒤 일부만 가려서)과 사용 중인 Vercel URL을 알려주면 다음 단계로 짚어볼 수 있습니다.
