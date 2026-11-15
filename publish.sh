#!/bin/bash
# Publishes Azmari Bet to https://github.com/Nahom1927/Azmari-Bet
set -e
git init
git add .
git commit -m "Azmari Bet v1.0.0: installable PWA (Android, iOS, web)" || true
git branch -M main
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/Nahom1927/Azmari-Bet.git
git tag -f v1.0.0
git push -u origin main --force
git push -f origin v1.0.0
echo ""
echo "Next: enable Pages at https://github.com/Nahom1927/Azmari-Bet/settings/pages"
echo "Live URL: https://nahom1927.github.io/Azmari-Bet/"
