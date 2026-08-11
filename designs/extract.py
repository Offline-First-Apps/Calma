#!/usr/bin/env python3
"""Decode the self-extracting design bundles in designs/html/ into designs/extracted/.

The bundles store their markup as a JSON string inside
<script type="__bundler/template">. Everything else in the file is the runtime
that reassembles it in a browser, plus a base64 asset manifest (fonts, images).
"""
import re, json, os, glob

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'extracted')
os.makedirs(OUT, exist_ok=True)

index = []
for path in sorted(glob.glob(os.path.join(HERE, 'html', '*.html'))):
    src = open(path, encoding='utf-8').read()
    m = re.search(r'<script type="__bundler/template">(.*?)</script>', src, re.S)
    if not m:
        continue
    doc = json.loads(m.group(1))
    starts = [x.start() for x in re.finditer(r'<div id="[0-9a-z]+"', doc)] + [len(doc)]
    names = re.findall(r'<div id="([0-9a-z]+)"', doc)
    for name, (a, b) in zip(names, zip(starts, starts[1:])):
        sec = doc[a:b]
        group = re.search(r'>(Calma · [^<]+)<', sec)
        group = group.group(1) if group else ''
        phones = [x.start() for x in re.finditer(r'width: 412px; height: 866px', sec)] + [len(sec)]
        for i, (pa, pb) in enumerate(zip(phones, phones[1:])):
            frag = sec[pa:pb]
            cap = re.search(r'font-size: 12px[^>]*>([A-Z][0-9]+[^<]{0,60})<', frag)
            cap = cap.group(1).strip() if cap else f'{name}-{i}'
            slug = re.sub(r'[^A-Za-z0-9]+', '-', cap).strip('-').lower()
            open(os.path.join(OUT, slug + '.html'), 'w', encoding='utf-8').write(
                f'<!-- {cap} | section {name} | {group} -->\n'
                f'<div style="width:412px;height:866px;{frag}')
            index.append({'screen': cap, 'section': name, 'file': slug + '.html', 'group': group})

json.dump(index, open(os.path.join(OUT, 'index.json'), 'w'), indent=1)
print(f'{len(index)} screens extracted to {OUT}')
