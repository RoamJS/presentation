import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';

// Run with roamjs-load-extension against a graph with Roam Studio/Craft enabled.
// Fixtures are isolated to one temporary page and removed even on failure.
let fixtureUid;
let supportUid;
export default {
  runtimeNames: ['presentation'],
  async run({ page, outDir }) {
    await page.keyboard.press('Escape');
    assert(await page.locator('#roamstudio-css-theme').count(), 'Enable Roam Studio before running this test');
    const fixture = await page.evaluate(async () => {
      const api = window.roamAlphaAPI;
      const uid = api.util.generateUID();
      await api.createPage({ page: { uid, title: `Presentation theme regression ${Date.now()}` } });
      const add = async (parent, order, string, extra = {}) => {
        const uid = api.util.generateUID();
        await api.createBlock({ location: { 'parent-uid': parent, order }, block: { uid, string, ...extra } });
        return uid;
      };
      const supportUid = api.util.generateUID();
      const supportTitle = `Presentation embed source ${Date.now()}`;
      await api.createPage({page:{uid:supportUid,title:supportTitle}});
      const source = await add(supportUid,0,'Embedded body text');
      await add(source,0,'Nested child');
      const roots = [];
      for (const renderer of ['presentation', 'presentation2']) {
        for (const theme of ['black', 'white']) {
          const root = await add(uid, roots.length, `{{${renderer}:{theme:${theme}}}}`);
          const slide = await add(root, 0, 'Theme compatibility');
          await add(slide, 0, 'Readable body text');
          await add(slide, 1, '[[Daily Notes]] and [external link](https://roamresearch.com)');
          await add(slide, 2, '`inline code` and ^^highlighted text^^');
          await add(slide, 3, '{{TODO}} Task text');
          const nested = await add(root, 1, 'Expand {collapsible}');
          const parent = await add(nested, 0, 'Parent');
          await add(parent, 0, 'Revealed child');
          const table = await add(root, 2, 'Table');
          const tableBlock = await add(table, 0, '{{table}}');
          const col = await add(tableBlock, 0, 'Header');
          await add(col, 0, 'Cell text');
          const code = await add(root, 3, 'Code and headings');
          await add(code, 0, 'Heading one', {heading:1});
          await add(code, 1, 'Heading two', {heading:2});
          await add(code, 2, 'Heading three', {heading:3});
          await add(code, 3, '```javascript\nconst answer = 42;\n```');
          if(renderer==='presentation2') {
            const embed = await add(root,4,'Block embed');
            await add(embed,0,'{{embed: (('+source+'))}}');
            const pageEmbed = await add(root,5,'Page embed');
            await add(pageEmbed,0,'{{embed: [['+supportTitle+']]}}');
          }
          roots.push({renderer,theme,root,slide});
        }
      }
      await api.ui.mainWindow.openPage({page:{uid}});
      return {uid,roots,supportUid};
    });
    fixtureUid = fixture.uid;
    supportUid = fixture.supportUid;
    const checks = [];
    for (const {renderer,theme,root} of fixture.roots) {
      await page.evaluate(uid => window.roamAlphaAPI.ui.mainWindow.openBlock({block:{uid}}), root);
      const button = page.locator(renderer==='presentation2'?'[data-roamjs-presentation2]':'[data-roamjs-presentation]').first();
      await button.click();
      await page.locator('#roamjs-reveal-root.ready').waitFor();
      await page.waitForTimeout(500);
      const deck = page.locator('#roamjs-reveal-root');
      const measure = () => page.locator('#roamjs-reveal-root section.present').evaluate(section => {
        const body = [...section.querySelectorAll('.rm-block__input,li')].find(e=>e.textContent.trim()==='Readable body text');
        const link = section.querySelector('.rm-page-ref');
        return {body:body && {color:getComputedStyle(body).color,size:parseFloat(getComputedStyle(body).fontSize)},link:link && getComputedStyle(link).color,slide:getComputedStyle(section).color};
      });
      const themed = await measure();
      assert(themed.body, 'Body text rendered');
      assert.equal(themed.body.color,themed.slide, 'Body inherits the Reveal theme color');
      assert(themed.body.size>=30, 'Body text retains presentation size');
      assert.notEqual(themed.link,'rgb(26, 26, 26)','Link does not use Craft light-theme color');
      const screenshot = path.join(outDir,`${renderer}-${theme}.png`);
      await page.screenshot({path:screenshot});
      // Disable only Studio's styles briefly to compare the computed cascade.
      const disabled = await page.evaluate(() => [...document.querySelectorAll('style[id^="roamstudio-"]')].map(s=>{const old=s.disabled;s.disabled=true;return {id:s.id,disabled:old};}));
      let baseline;
      try { baseline=await measure(); }
      finally { await page.evaluate(states=>states.forEach(({id,disabled})=>{document.getElementById(id).disabled=disabled;}),disabled); }
      assert.deepEqual(themed.body,baseline.body,'Graph theme does not change body typography');
      await deck.locator('.navigate-right').click();
      await page.waitForTimeout(400);
      const toggle = page.locator(renderer==='presentation2'?'.present .roamjs-native-collapsible-toggle':'.present .roamjs-collapsible-caret').first();
      assert(!await deck.locator('section.present').getByText('Revealed child',{exact:true}).isVisible());
      await toggle.click();
      await deck.locator('section.present').getByText('Revealed child',{exact:true}).waitFor();
      await deck.locator('.navigate-right').click();
      await page.waitForTimeout(400);
      const cell = deck.locator('section.present td').filter({hasText:'Cell text'}).first();
      await cell.waitFor();
      const cellStyle = await cell.evaluate(e=>({color:getComputedStyle(e).color,size:parseFloat(getComputedStyle(e).fontSize)}));
      assert.equal(cellStyle.color,themed.slide,'Table text uses presentation color');
      assert(cellStyle.size>=25,'Table text retains presentation size');
      await deck.locator('.navigate-right').click();
      await page.waitForTimeout(500);
      if(renderer==='presentation2') {
        const fonts = await deck.locator('section.present [class*="rm-heading-level"] .rm-block__input').evaluateAll(es=>es.map(e=>parseFloat(getComputedStyle(e).fontSize)));
        assert(fonts[0]>fonts[1] && fonts[1]>fonts[2] && fonts[2]>=30,'Native heading hierarchy remains presentation-sized');
        const line = deck.locator('section.present .cm-line').first();
        assert(await line.evaluate(e=>parseFloat(getComputedStyle(e).fontSize))>=30,'Native code retains presentation size');
        await page.screenshot({path:path.join(outDir,`${renderer}-${theme}-code.png`)});
      }
      if(renderer==='presentation2') {
        for(const type of ['block','page']) {
          await deck.locator('.navigate-right').click();
          await page.waitForTimeout(500);
          const embed = deck.locator('section.present .rm-embed-container').first();
          await embed.waitFor();
          if(type==='page') await embed.locator('button.rm-closed').click();
          assert.equal(await embed.evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)','Embedded card background follows the slide');
          await page.screenshot({path:path.join(outDir,`${renderer}-${theme}-${type}-embed.png`)});
          await fs.writeFile(path.join(outDir,`${renderer}-${theme}-${type}-embed.html`),await embed.innerHTML());
          const text=embed.locator('.rm-block__input').filter({hasText:'Embedded body text'}).first();
          assert.equal(await text.evaluate(e=>getComputedStyle(e).color),themed.slide,'Embedded text retains contrast');
          await page.screenshot({path:path.join(outDir,`${renderer}-${theme}-${type}-embed.png`)});
        }
      }
      await page.keyboard.press('Escape');
      await page.locator('#roamjs-presentation-container').waitFor({state:'detached'});
      checks.push({renderer,theme,themed,baseline,cellStyle,screenshot,collapsible:true});
    }
    assert(await page.locator('#roamstudio-css-theme').evaluate(e=>!e.disabled),'Roam Studio stays enabled');
    return {checks};
  },
  async cleanup({page}) {
    await page.keyboard.press('Escape');
    if(fixtureUid) await page.evaluate(uid=>window.roamAlphaAPI.deletePage({page:{uid}}),fixtureUid);
    if(supportUid) await page.evaluate(uid=>window.roamAlphaAPI.deletePage({page:{uid}}),supportUid);
    await page.goto(page.url().split('/page/')[0]);
  }
};
