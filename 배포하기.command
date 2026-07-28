#!/bin/bash
# 더블클릭하면 index.html 수정분을 GitHub Pages에 올립니다.
cd "$(dirname "$0")" || exit 1

if [ -z "$(git status --porcelain)" ]; then
  echo "바뀐 내용이 없습니다."
else
  git add -A
  git commit -q -m "캐러셀 업데이트 $(date '+%Y-%m-%d %H:%M')"
  git push -q origin main || { echo "푸시 실패"; read -n 1 -s; exit 1; }
  echo "올렸습니다. 1~2분 뒤 반영됩니다."
fi

echo "주소: https://sssoyi.github.io/carousel/"
echo "(창을 닫으셔도 됩니다)"
read -n 1 -s
