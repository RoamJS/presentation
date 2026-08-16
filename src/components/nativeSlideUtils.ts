import type { TreeNode } from "roamjs-components/types";

export const HIDE_REGEX = /(?:\[\[{|{\[\[|{)hide(?:\]\]}|}\]\]|})/i;

export const getVisibleChildren = (children: TreeNode[]): TreeNode[] =>
  children.filter((child) => !HIDE_REGEX.test(child.text));

export const shouldUseTitleLayout = ({
  forcedTitle,
  visibleChildren,
}: {
  forcedTitle: boolean;
  visibleChildren: TreeNode[];
}): boolean => forcedTitle || !visibleChildren.length;

export const shouldExpandLayoutSource = (isMediaLayout: boolean): boolean =>
  isMediaLayout;

export const collectHiddenUids = (nodes: TreeNode[]): string[] =>
  nodes.flatMap((node) =>
    HIDE_REGEX.test(node.text)
      ? [node.uid]
      : collectHiddenUids(node.children || []),
  );

export const findLargestFittingScale = ({
  fitsAtScale,
  initialLowerScale = 0.05,
  minimumScale = 0.0001,
  iterations = 10,
}: {
  fitsAtScale: (scale: number) => boolean;
  initialLowerScale?: number;
  minimumScale?: number;
  iterations?: number;
}): number | undefined => {
  if (fitsAtScale(1)) return 1;

  let lowerScale = initialLowerScale;
  while (!fitsAtScale(lowerScale) && lowerScale > minimumScale) {
    lowerScale = Math.max(lowerScale / 2, minimumScale);
  }
  if (!fitsAtScale(lowerScale)) return undefined;

  let upperScale = 1;
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const candidateScale = (lowerScale + upperScale) / 2;
    if (fitsAtScale(candidateScale)) {
      lowerScale = candidateScale;
    } else {
      upperScale = candidateScale;
    }
  }

  return lowerScale;
};

export const getVisibleLayoutSource = ({
  contentChildren,
  isSourceLayout,
}: {
  contentChildren: TreeNode[];
  isSourceLayout: boolean;
}): TreeNode | undefined =>
  isSourceLayout
    ? contentChildren.find((child) => !HIDE_REGEX.test(child.text))
    : undefined;
