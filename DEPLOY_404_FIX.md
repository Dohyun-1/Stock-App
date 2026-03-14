# Vercel 404 NOT_FOUND 해결 가이드

## 1. 제안한 수정 (Fix)

- **`vercel.json` 추가**  
  - `framework: "nextjs"`, `buildCommand: "npm run build"` 로 명시해, Vercel이 이 프로젝트를 Next.js 앱으로 인식하고 올바르게 빌드·실행하도록 했습니다.
- **Vercel 프로젝트 설정**
  - **Root Directory**: **비워 두기** (이 저장소는 이미 앱 루트가 repo 루트이므로 `stock-hackathon` 같은 하위 폴더를 지정하면 "does not exist" 오류가 납니다.)
  - **Build Command**: 비워 두면 `vercel.json`의 `buildCommand` 또는 자동 감지 사용.
  - **Output Directory**: 비워 두기 (Next.js는 `.next` 사용, 자동 처리됨).

배포 후에도 404가 나오면 아래 체크리스트를 순서대로 확인하세요.

---

## 2. 근본 원인 (Root cause)

- **코드가 하던 일 vs 필요한 일**
  - Vercel은 클론한 저장소의 **Root Directory**에서만 빌드를 실행합니다.  
  - 여기서는 repo 루트 = 앱 루트(패키지·소스가 있는 곳)인데, Root Directory를 `stock-hackathon`으로 두면 Vercel은 “저장소 루트 아래의 `stock-hackathon` 폴더”를 찾습니다.  
  - GitHub에는 그 이름의 **폴더가 없고**(앱이 repo 루트에 있음), 그래서 **지정한 Root Directory가 존재하지 않는다**는 오류가 나고, 빌드가 제대로 되지 않거나 잘못된 경로를 바라보게 됩니다.
- **이 오류가 나는 조건**
  - Root Directory에 **실제로 존재하지 않는 경로**를 적었을 때.  
  - 또는 Root Directory는 맞는데 **프레임워크/빌드 설정이 잘못**되어, 빌드는 되지만 “앱”으로 인식되지 않아 404가 나는 경우.
- **착각/ oversight**
  - “로컬 폴더 이름이 stock-hackathon이니까 Vercel에도 같은 이름을 넣어야 한다”고 생각한 경우.  
  - 실제로 중요한 것은 **Git에 푸시된 구조**: 푸시된 루트에 `package.json`·`src`가 있으면 Root Directory는 **비어 있어야** 합니다.

---

## 3. 개념 이해 (Concept)

- **404 NOT_FOUND가 있는 이유**
  - “이 경로에는 리소스가 없다”라고 클라이언트와 플랫폼에 알리기 위함입니다.  
  - Vercel의 404는 **배포·라우팅 단계**에서 “그 URL에 해당하는 배포/앱/파일을 찾지 못했다”는 뜻일 수 있습니다 (앱 내부의 Next.js 404와는 다를 수 있음).
- **올바른 멘텔 모델**
  - **저장소 구조** = GitHub에 올라간 디렉터리 구조.  
  - **Root Directory** = “그 중에서 빌드할 때 작업 디렉터리로 쓸 경로”.  
  - 로컬 폴더 이름과 Vercel Root Directory는 **독립**: “Git 기준으로 어디가 앱 루트인가?”만 맞으면 됩니다.
- **프레임워크/언어 설계**
  - Vercel은 Root Directory에서 `package.json` 등을 보고 프레임워크를 추측합니다.  
  - `vercel.json`으로 `framework`·`buildCommand`를 주면, 추측 실패로 인한 잘못된 빌드/실행을 줄일 수 있습니다.

---

## 4. 주의할 점 (Warning signs)

- **다시 발생할 수 있는 경우**
  - 새 Vercel 프로젝트를 만들 때 Root Directory를 “로컬 하위 폴더 이름”으로 넣는 경우.  
  - monorepo로 바꾼 뒤, 앱이 있는 하위 폴더만 지정해야 하는데 repo 루트를 그대로 둔 경우(또는 그 반대).
- **비슷한 실수**
  - Netlify, Railway 등에서 “Base directory” / “Root”를 잘못 지정해 404나 빌드 실패가 나는 경우.  
  - 같은 repo를 여러 배포 서비스에 연결할 때, 한쪽만 “앱 루트”를 맞추고 다른 쪽은 맞추지 않는 경우.
- **코드/설정 냄새**
  - Vercel 대시보드에서 Root Directory가 비어 있지 않은데, repo에는 그 이름의 폴더가 없음.  
  - 빌드 로그에 “No such file or directory” 또는 “Root Directory does not exist”가 보임.

---

## 5. 대안 및 트레이드오프 (Alternatives)

- **Root Directory 비우기 (현재 권장)**  
  - repo 루트 = 앱 루트일 때 사용.  
  - 장점: 설정 단순, 실수 여지 적음.  
  - 단점: monorepo에서는 사용 불가.

- **실제 monorepo인 경우**  
  - 예: `repo/apps/web/` 이 Next 앱이면 Root Directory를 `apps/web` 로 지정.  
  - 트레이드오프: 구조가 명확해지지만, 경로를 잘못 쓰면 동일한 404/빌드 실패가 난다.

- **vercel.json 없이 자동 감지에만 의존**  
  - 가능하지만, 감지 실패 시 404나 빌드 오류 원인 파악이 어렵다.  
  - `vercel.json`으로 `framework`·`buildCommand`를 고정해 두면 재현·디버깅이 쉬워진다.

---

## 체크리스트 (배포 후 404일 때)

1. [ ] **Vercel → Settings → General → Root Directory** 가 비어 있는지 확인.
2. [ ] **Deployments** 탭에서 최근 배포가 **Ready (초록)** 인지 확인. 실패(빨강)면 빌드 로그 확인.
3. [ ] 접속 URL이 **배포 URL**과 일치하는지 확인 (예: `https://프로젝트명.vercel.app/`).  
      팀/프로덕션 도메인을 쓴다면, 해당 도메인이 올바른 배포에 연결돼 있는지 확인.
4. [ ] **홈(/)으로만** 먼저 접속해 보기 (예: `https://xxx.vercel.app/`).  
      특정 경로만 404면 앱 라우팅 문제일 수 있음.
5. [ ] 변경 사항 반영 후 **Redeploy** 한 번 실행.

이대로 적용한 뒤에도 404가 나오면,  
- 접속한 **정확한 URL**  
- Vercel **Deployments** 탭의 해당 배포 상태(Ready/Failed)  
- **빌드 로그** 마지막 부분(에러 메시지)  
을 알려주면 다음 원인까지 짚을 수 있습니다.
