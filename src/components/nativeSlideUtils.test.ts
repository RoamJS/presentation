import assert from "node:assert/strict";
import test from "node:test";
import type { TreeNode } from "roamjs-components/types";
import {
  collectHiddenUids,
  findLargestFittingScale,
  getVisibleChildren,
  shouldExpandLayoutSource,
  shouldUseTitleLayout,
} from "./nativeSlideUtils";

const createNode = ({
  uid,
  text,
  children = [],
}: {
  uid: string;
  text: string;
  children?: TreeNode[];
}): TreeNode => ({ uid, text, children }) as TreeNode;

test("hidden-only children produce a title-slide layout", () => {
  const children = [
    createNode({ uid: "hidden-1", text: "First {hide}" }),
    createNode({ uid: "hidden-2", text: "Second [[{hide}]]" }),
  ];
  const visibleChildren = getVisibleChildren(children);

  assert.deepEqual(visibleChildren, []);
  assert.equal(
    shouldUseTitleLayout({ forcedTitle: false, visibleChildren }),
    true,
  );
});

test("collectHiddenUids finds hidden blocks in the original slide tree", () => {
  const children = [
    createNode({ uid: "hidden-top", text: "Top-level {hide}" }),
    createNode({
      uid: "visible-top",
      text: "Visible",
      children: [createNode({ uid: "hidden-nested", text: "Nested {{hide}}" })],
    }),
  ];

  assert.deepEqual(collectHiddenUids(children), [
    "hidden-top",
    "hidden-nested",
  ]);
});

test("only media layout sources render their descendants", () => {
  assert.equal(shouldExpandLayoutSource(false), false);
  assert.equal(shouldExpandLayoutSource(true), true);
});

test("findLargestFittingScale searches below its initial lower bound", () => {
  const scale = findLargestFittingScale({
    fitsAtScale: (candidate) => candidate <= 0.01,
  });

  assert.ok(scale !== undefined);
  assert.ok(scale <= 0.01);
  assert.ok(scale > 0.009);
});

test("findLargestFittingScale returns undefined when the bounded minimum cannot fit", () => {
  assert.equal(
    findLargestFittingScale({ fitsAtScale: () => false }),
    undefined,
  );
});
