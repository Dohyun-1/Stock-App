#!/bin/sh
# EMFILE 방지 (macOS: 파일 감시 개수 초과)
ulimit -n 65536 2>/dev/null || true
# 네이티브 감시 대신 폴링 사용 → EMFILE 오류 제거 (감시 파일 수 제한 없음)
export WATCHPACK_POLLING=true
exec npx next dev -p 3008 -H 0.0.0.0
