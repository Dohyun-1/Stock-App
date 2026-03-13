# 주식류 앱 배포 가이드 (Vercel)

## 1. GitHub에 코드 올리기

1. https://github.com/new 에서 새 저장소 생성 (예: `stock-app`)
2. 터미널에서 프로젝트 폴더로 이동 후:

```bash
cd "/Users/dohyun/Desktop/무제 폴더/stock-hackathon"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/내아이디/저장소이름.git
git push -u origin main
```

## 2. Vercel에 배포

1. https://vercel.com 접속 → **Sign Up** (GitHub 계정으로 로그인)
2. **Add New...** → **Project**
3. **Import** 할 GitHub 저장소 선택 → **Deploy** 클릭
4. 배포가 끝나면 `https://프로젝트이름.vercel.app` 주소가 생깁니다.

## 3. 환경 변수 설정 (Google 로그인용)

Vercel 대시보드에서 **Project → Settings → Environment Variables** 에 추가:

| 이름 | 값 | 비고 |
|------|-----|------|
| `NEXTAUTH_URL` | `https://프로젝트이름.vercel.app` | 배포 후 나온 주소 |
| `NEXTAUTH_SECRET` | 아무 랜덤 문자열 32자 이상 | 예: `openssl rand -base64 32` 로 생성 |
| `GOOGLE_CLIENT_ID` | (기존 .env.local 값) | |
| `GOOGLE_CLIENT_SECRET` | (기존 .env.local 값) | |

저장 후 **Redeploy** 한 번 실행.

## 4. Google OAuth 리디렉션 URI 추가

1. https://console.cloud.google.com/apis/credentials
2. 사용 중인 OAuth 2.0 클라이언트 ID 클릭
3. **승인된 리디렉션 URI** 에 추가:
   - `https://프로젝트이름.vercel.app/api/auth/callback/google`
4. 저장

---

이후 코드 수정 시 GitHub에 `git push` 하면 Vercel이 자동으로 다시 배포합니다.
