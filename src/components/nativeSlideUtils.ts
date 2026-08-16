import type { TreeNode } from "roamjs-components/types";

export const HIDE_REGEX = /(?:\[\[{|{\[\[|{)hide(?:\]\]}|}\]\]|})/i;

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
