# StockPro - 종합 주식 투자 플랫폼

해커톤용 주식 앱. 한국인을 위한 실시간 시장 정보, 기업 분석, 포트폴리오 계산, 투자 가이드.

## 기능

1. **시장 정보** - 국가별(미국/한국/일본/유럽) 실시간 지수, 경제 캘린더
2. **기업 분석** - SEC EDGAR(미국), DART(한국) 공시 및 PER, PBR, ROE 등
3. **수익률 계산** - SCHD:QQQ:SPY 3:5:2 등 비율별 역사적 수익률
4. **투자자 13F** - 버핏, ARK, 브리지워터 등 유명 투자자 공시 추적
5. **투자 가이드** - ISA, IRP, 연금 등 세제 혜택 활용 가이드
6. **댓글** - 각 페이지별 댓글

## 실행 방법

```bash
cd stock-hackathon
npm install
npm run build
npm start
```

브라우저에서 **http://localhost:4000** 접속 (포트 충돌 시 3005: `npm run start:3005`)

> 개발 모드(`npm run dev`) 사용 시 EMFILE 에러가 나면, 위처럼 빌드 후 `npm start`로 실행하세요.

### 접속이 안 될 때

1. **서버를 실행했는지 확인** – 터미널에 `npm start` 실행 후 "Ready" 메시지가 나와야 함
2. **URL 확인** – `http://localhost:3005` (포트 3005)
3. **127.0.0.1로 시도** – `http://127.0.0.1:3005`
4. **방화벽** – Mac 방화벽이 Node를 차단하는지 확인
5. **시크릿/프라이빗 창** – 브라우저 확장 프로그램 영향 제거

## 환경변수 (선택)

- `DART_API_KEY` - DART 공시 Open API 키 (dart.fss.or.kr에서 발급)

## 기술 스택

- Next.js 14, TypeScript, Tailwind CSS
- Yahoo Finance API (fetch), SEC EDGAR, DART API
- Recharts (차트)
