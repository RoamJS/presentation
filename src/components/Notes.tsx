import React from "react";
import { TreeNode } from "roamjs-components/types";
import { parseRoamBlocks } from "../utils/getParseRoamBlocks";

const Notes = ({ note }: { note?: TreeNode }) => (
  <>
    {note && (
      <aside
        className="notes"
        dangerouslySetInnerHTML={{
          __html: parseRoamBlocks({ content: [note], viewType: "bullet" }),
        }}
      />
    )}
  </>
);

export default Notes;
