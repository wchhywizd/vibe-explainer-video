import asyncio, sys, json
from playwright.async_api import async_playwright
HTML = sys.argv[4]
async def main(times, out, cols=4):
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1920, 'height': 1080})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') else None)
        await pg.goto('file://' + HTML + '?static')
        await pg.evaluate('window.ready')
        rows = (len(times) + cols - 1) // cols
        await pg.evaluate(f'''(args)=>{{const [times,cols,rows]=args;const cv=document.getElementById('c');
          const out=document.createElement('canvas');out.width=cols*480;out.height=rows*270;const o=out.getContext('2d');
          o.font='bold 22px sans-serif';
          times.forEach((t,i)=>{{window.render(t);o.drawImage(cv,(i%cols)*480,Math.floor(i/cols)*270,480,270);
            o.fillStyle='rgba(0,0,0,.6)';o.fillRect((i%cols)*480,Math.floor(i/cols)*270,80,28);o.fillStyle='#ff0';o.fillText(t.toFixed(1),(i%cols)*480+6,Math.floor(i/cols)*270+21);}});
          document.body.innerHTML='';document.body.style.margin=0;out.style.width=out.width+'px';out.style.display='block';document.body.appendChild(out);}}''', [times, cols, rows])
        await pg.set_viewport_size({'width': cols * 480, 'height': rows * 270})
        await pg.screenshot(path=out)
        print('errors:', errs[:5])
        await b.close()
times = json.loads(sys.argv[1]); out = sys.argv[2]
asyncio.run(main(times, out, int(sys.argv[3])))
