import React from "react";

type BlockContent = {
  kind: "block";
  uid: string;
  open?: boolean;
  zoomPath?: boolean;
  zoomStartAfterUid?: string;
};

type PageContent = {
  kind: "page";
  hideMentions?: boolean;
} & ({ uid: string; title?: never } | { uid?: never; title: string });

type StringContent = {
  kind: "string";
  string: string;
};

type SearchContent = {
  kind: "search";
  searchQueryStr: string;
  closed?: boolean;
  groupByPage?: boolean;
  hidePaths?: boolean;
  onConfigChange?: (config: {
    closed?: boolean;
    groupByPage?: boolean;
    hidePaths?: boolean;
  }) => void;
};

export type NativeRoamContentProps =
  BlockContent | PageContent | StringContent | SearchContent;

type NativeReactComponents = {
  Block: React.ComponentType<Omit<BlockContent, "kind">>;
  Page: React.ComponentType<
    | { uid: string; title?: never; hideMentions?: boolean }
    | { uid?: never; title: string; hideMentions?: boolean }
  >;
  Search: React.ComponentType<Omit<SearchContent, "kind">>;
  BlockString: React.ComponentType<Omit<StringContent, "kind">>;
};

const getNativeComponents = () => {
  const components = (
    window.roamAlphaAPI?.ui as typeof window.roamAlphaAPI.ui & {
      react?: NativeReactComponents;
    }
  )?.react;
  if (!components) {
    throw new Error(
      "This version of Roam does not expose roamAlphaAPI.ui.react.",
    );
  }
  return components;
};

/**
 * One typed entry point for Roam's native React renderers.
 *
 * Presentation2 currently uses `block` for slide trees and notes, and
 * `string` for titles whose presentation directives have been removed.
 * `page` and `search` are included here for page-oriented and search-result
 * slides without introducing another rendering abstraction later.
 */
const NativeRoamContent = (props: NativeRoamContentProps) => {
  const { Block, Page, Search, BlockString } = getNativeComponents();

  switch (props.kind) {
    case "block":
      return (
        <Block
          uid={props.uid}
          open={props.open}
          zoomPath={props.zoomPath}
          zoomStartAfterUid={props.zoomStartAfterUid}
        />
      );
    case "page":
      return props.uid ? (
        <Page uid={props.uid} hideMentions={props.hideMentions} />
      ) : (
        <Page title={props.title as string} hideMentions={props.hideMentions} />
      );
    case "search":
      return (
        <Search
          searchQueryStr={props.searchQueryStr}
          closed={props.closed}
          groupByPage={props.groupByPage}
          hidePaths={props.hidePaths}
          onConfigChange={props.onConfigChange}
        />
      );
    case "string":
      return <BlockString string={props.string} />;
  }
};

export default NativeRoamContent;
