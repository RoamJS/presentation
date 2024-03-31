import getRoamUrl from "roamjs-components/dom/getRoamUrl";
import { syncParseRoamBlocksToHtml } from "roamjs-components/dom/parseRoamBlocksToHtml";
import { getParseInline } from "roamjs-components/marked";
import getPageTitleByBlockUid from "roamjs-components/queries/getPageTitleByBlockUid";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import getTextByBlockUid from "roamjs-components/queries/getTextByBlockUid";
import { TreeNode, ViewType } from "roamjs-components/types";

const context = {
  pagesToHrefs: (page: string, ref?: string) =>
    ref ? getRoamUrl(ref) : getRoamUrl(getPageUidByPageTitle(page)),
  blockReferences: (ref: string) => ({
    text: getTextByBlockUid(ref),
    page: getPageTitleByBlockUid(ref),
  }),
  components: (): false => {
    return false;
  },
};

export const getParseRoamBlocks = (): Promise<
  (a: { content: TreeNode[]; viewType: ViewType }) => string
> =>
  getParseInline().then(
    (parseInline) => (args: { content: TreeNode[]; viewType: ViewType }) =>
      syncParseRoamBlocksToHtml({
        ...args,
        level: 0,
        // @ts-ignore
        context,
        parseInline,
      })
  );

export let parseRoamBlocks: Awaited<ReturnType<typeof getParseRoamBlocks>>;
getParseRoamBlocks().then((f) => (parseRoamBlocks = f));
