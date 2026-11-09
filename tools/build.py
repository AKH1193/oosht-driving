"""Assemble Oosht Driving from src/ into web/game.html (page body) and the Android app's index.html.

Usage: python3 tools/build.py [repo_root]
"""
import glob, os, sys

args = [a for a in sys.argv[1:] if not a.startswith('--')]
root = args[0] if args else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = os.path.join(root, 'src')
head = open(os.path.join(src, 'head.html'), encoding='utf-8').read()
parts = sorted(glob.glob(os.path.join(src, '[0-9][0-9]_*.js')))
js = '\n'.join(open(p, encoding='utf-8').read() for p in parts)
body = head + '\n<script>\n(()=>{\n' + js + '\n})();\n</script>\n'
os.makedirs(os.path.join(root, 'web'), exist_ok=True)
open(os.path.join(root, 'web', 'game.html'), 'w', encoding='utf-8').write(body)
page = ('<!doctype html>\n<html lang="en"><head><meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">\n'
        '<meta name="theme-color" content="#0D1116">\n'
        '<style>*,*::before,*::after{box-sizing:border-box}:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
        'body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>\n'
        '</head><body>\n' + body + '\n</body></html>\n')
out = os.path.join(root, 'app', 'src', 'main', 'assets', 'www', 'index.html')
os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, 'w', encoding='utf-8').write(page)
if '--test' in sys.argv:
    os.makedirs(os.path.join(root, 'test'), exist_ok=True)
    open(os.path.join(root, 'test', 'index.html'), 'w', encoding='utf-8').write(page)
print('built', len(parts), 'parts,', len(body), 'bytes')
