import asyncio, base64, sys, os, time
from playwright.async_api import async_playwright
import sys
HTML, OUT = sys.argv[3], sys.argv[4]
FPS = 30
async def main(shard, shards, limit=None):
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-vsync'])
        pg = await b.new_page(viewport={'width': 1920, 'height': 1080})
        await pg.goto('file://' + HTML + '?static'); await pg.evaluate('window.ready')
        total = await pg.evaluate('window.TOTAL')
        n = int(round(total * FPS)) if limit is None else limit
        t0 = time.time(); done = 0
        for i in range(shard, n, shards):
            fn = f'{OUT}/f{i:05d}.jpg'
            if os.path.exists(fn): continue
            d = await pg.evaluate("(t)=>{window.render(t);return document.getElementById('c').toDataURL('image/jpeg',0.94)}", i / FPS)
            open(fn, 'wb').write(base64.b64decode(d.split(',', 1)[1])); done += 1
            if done % 200 == 0: print(shard, i, n, f'{(time.time()-t0)/done:.3f}s/frame', flush=True)
        print('shard', shard, 'done', n, f'{time.time()-t0:.0f}s', flush=True)
        await b.close()
lim = None
asyncio.run(main(int(sys.argv[1]), int(sys.argv[2]), lim))
