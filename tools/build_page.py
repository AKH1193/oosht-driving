"""Wrap the game page (web/game.html) in a full HTML document for the Android app.

Usage: python3 tools/build_page.py web/game.html app/src/main/assets/www/index.html
"""
import os
import sys

src, out = sys.argv[1], sys.argv[2]
frag = open(src, encoding="utf-8").read()
html = """<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="#0D1116">
<style>*,*::before,*::after{box-sizing:border-box}:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
</head><body>
""" + frag + """
</body></html>
"""
os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, "w", encoding="utf-8").write(html)
print("wrote", out, len(html), "bytes")
