#!/bin/bash
# Usage: ./publish.sh [version]   e.g. ./publish.sh v1.1.0
set -e
V="${1:-v1.1.0}"
git init
git add .
git commit -m "Azmari Bet $V" || true
git branch -M main
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/Nahom1927/Azmari-Bet.git
git tag -f "$V"
git push -u origin main --force
git push -f origin "$V"
echo ""
echo "Live: https://nahom1927.github.io/Azmari-Bet/"
echo "Release: https://github.com/Nahom1927/Azmari-Bet/releases/new?tag=$V"
