import assert from "node:assert/strict";

export default {
  runtimeNames: ["presentation"],
  async run({ page, outDir }) {
    const fixture = await page.evaluate(async () => {
      const api = window.roamAlphaAPI;
      const uid = api.util.generateUID();
      await api.createPage({
        page: { uid, title: `Presentation layout regression ${Date.now()}` },
      });
      window.__presentationLayoutFixture = uid;
      const create = async (parent, string, order, extra = {}) => {
        const uid = api.util.generateUID();
        await api.createBlock({
          location: { "parent-uid": parent, order },
          block: { uid, string, ...extra },
        });
        return uid;
      };
      const collapsible = await create(
        uid,
        "{{presentation2: {collapsible}}}",
        0,
      );
      const slide = await create(collapsible, "Collapsible bullets", 0);
      for (let i = 0; i < 2; i++) {
        const parent = await create(slide, `Parent ${i + 1}`, i);
        await create(parent, `Detail ${i + 1}`, 0);
      }
      const horizontal = await create(uid, "{{presentation2}}", 1);
      const content = await create(horizontal, "Horizontal block view", 0);
      const columns = await create(content, "Three columns", 0, {
        "block-view-type": "horizontal-outline",
      });
      for (let i = 0; i < 3; i++) {
        const column = await create(
          columns,
          ["Discover", "Build", "Review"][i],
          i,
        );
        await create(
          column,
          [
            "Understand the problem",
            "Make the smallest change",
            "Verify the result",
          ][i],
          0,
        );
      }
      const rootHorizontal = await create(
        horizontal,
        "Horizontal slide root",
        1,
        { "block-view-type": "horizontal-outline" },
      );
      for (let i = 0; i < 3; i++)
        await create(rootHorizontal, `Column ${i + 1}`, i);
      await api.ui.mainWindow.openPage({ page: { uid } });
      return { uid };
    });
    const close = async () => {
      await page.locator("#roamjs-presentation-container > button").click();
      await page
        .locator("#roamjs-presentation-container")
        .waitFor({ state: "detached" });
    };
    const checks = [];
    const originalViewport = page.viewportSize();
    try {
      for (const viewport of [
        { width: 1440, height: 1000 },
        { width: 1024, height: 768 },
      ]) {
        await page.setViewportSize(viewport);
        await page.locator("[data-roamjs-presentation2]").first().click();
        const toggle = page
          .getByRole("button", { name: "Expand bullet" })
          .first();
        await toggle.waitFor();
        const alignment = await toggle.evaluate((button) => {
          const svg = button.querySelector("svg").getBoundingClientRect();
          const text = button.parentElement.querySelector(".rm-block__input");
          const lineHeight = parseFloat(getComputedStyle(text).lineHeight);
          const top = text.getBoundingClientRect().top;
          return {
            iconHeight: svg.height,
            lineHeight,
            centerDelta: Math.abs(
              svg.y + svg.height / 2 - top - lineHeight / 2,
            ),
          };
        });
        assert(
          alignment.iconHeight >= 16,
          "Chevron must be legible at slide scale",
        );
        assert(
          alignment.centerDelta < 8,
          "Chevron must align with the first text line",
        );
        await page.screenshot({
          path: `${outDir}/chevrons-${viewport.width}.png`,
        });
        await toggle.click();
        await page
          .locator("#roamjs-reveal-root")
          .getByText("Detail 1", { exact: true })
          .waitFor();
        await page
          .getByRole("button", { name: "Collapse bullet" })
          .first()
          .click();
        assert.equal(
          await page
            .locator("#roamjs-reveal-root")
            .getByText("Detail 1", { exact: true })
            .count(),
          0,
        );
        await close();
        await page.locator("[data-roamjs-presentation2]").nth(1).focus();
        await page.locator("[data-roamjs-presentation2]").nth(1).click();
        for (let slide = 0; slide < 2; slide++) {
          if (slide)
            await page.locator("#roamjs-reveal-root .navigate-right").click();
          const columns = page.locator(
            "section.present .rm-level-horizontal-outline__child",
          );
          await columns.first().waitFor();
          await page.waitForTimeout(1200);
          const layout = await columns.evaluateAll((elements) =>
            elements.map((element) => {
              const rect = element.getBoundingClientRect();
              return {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                right: rect.right,
                textSize: parseFloat(
                  getComputedStyle(element.querySelector(".rm-block__input"))
                    .fontSize,
                ),
              };
            }),
          );
          assert.equal(layout.length, 3);
          assert(
            layout.every(
              (column) => column.width > 100 && column.textSize >= 20,
            ),
          );
          assert(
            Math.max(...layout.map((column) => column.y)) -
              Math.min(...layout.map((column) => column.y)) <
              2,
          );
          assert(layout[0].x < layout[1].x && layout[1].x < layout[2].x);
          assert(
            layout[2].right <= viewport.width + 2,
            JSON.stringify({ viewport, slide, layout }),
          );
          await page.screenshot({
            path: `${outDir}/horizontal-${slide}-${viewport.width}.png`,
          });
          checks.push({ viewport, slide, alignment, layout });
        }
        await close();
      }
      return { fixture, checks };
    } finally {
      if (await page.locator("#roamjs-presentation-container").count())
        await close();
      if (originalViewport) await page.setViewportSize(originalViewport);
    }
  },
  async cleanup({ page }) {
    await page.evaluate(async () => {
      const uid = window.__presentationLayoutFixture;
      if (uid) await window.roamAlphaAPI.deletePage({ page: { uid } });
      delete window.__presentationLayoutFixture;
    });
    return { fixtureDeleted: true };
  },
};
