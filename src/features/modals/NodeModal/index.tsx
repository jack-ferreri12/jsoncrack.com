import React, { useState } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Flex, CloseButton, Button } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import type { NodeData } from "../../../types/graph";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import { NodeEditDialog } from "./NodeEditDialog";
import useJson from "../../../store/useJson";
import useFile from "../../../store/useFile";

// return object from json removing array and object fields
const normalizeNodeData = (nodeRows: NodeData["text"]) => {
  if (!nodeRows || nodeRows.length === 0) return "{}";
  if (nodeRows.length === 1 && !nodeRows[0].key) return `${nodeRows[0].value}`;

  const obj = {};
  nodeRows?.forEach(row => {
    if (row.type !== "array" && row.type !== "object") {
      if (row.key) obj[row.key] = row.value;
    }
  });
  return JSON.stringify(obj, null, 2);
};

// return json path in the format $["customer"]
const jsonPathToString = (path?: NodeData["path"]) => {
  if (!path || path.length === 0) return "$";
  const segments = path.map(seg => (typeof seg === "number" ? seg : `"${seg}"`));
  return `$[${segments.join("][")}]`;
};

// Helper to update JSON by path
function updateJsonByPath(data: any, path: (string | number)[], newValue: any) {
  if (!path || path.length === 0) return newValue;
  const copy = Array.isArray(data) ? [...data] : { ...data };
  let curr = copy;
  for (let i = 0; i < path.length - 1; i++) {
    const seg = path[i];
    curr[seg] = Array.isArray(curr[seg]) ? [...curr[seg]] : { ...curr[seg] };
    curr = curr[seg];
  }
  curr[path[path.length - 1]] = newValue;
  return copy;
}

// Helper to get the actual value at path from the root JSON
function getValueByPath(data: any, path: (string | number)[]) {
  let curr = data;
  for (let i = 0; i < path.length; i++) {
    curr = curr?.[path[i]];
  }
  return curr;
}

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph(state => state.selectedNode);
  const setSelectedNode = useGraph(state => state.setSelectedNode);
  const [editOpen, setEditOpen] = useState(false);
  const json = useJson(state => state.json);
  const setJson = useJson(state => state.setJson);
  const setContents = useFile(state => state.setContents);

  // Get the actual value at the node's path
  let nodeValue: any = undefined;
  try {
    if (nodeData?.path) {
      nodeValue = getValueByPath(JSON.parse(json), nodeData.path);
    }
  } catch {}

  const handleEdit = () => setEditOpen(true);
  const handleCancel = () => setEditOpen(false);
  const handleSave = (newValue: any) => {
    if (!nodeData?.path) return;
    try {
      const parsed = JSON.parse(json);
      const updated = updateJsonByPath(parsed, nodeData.path, newValue);
      const updatedStr = JSON.stringify(updated, null, 2);
      setJson(updatedStr); // updates visualizer
      setContents({ contents: updatedStr }); // updates left editor
      // Update selectedNode so modal reflects new value immediately
      setTimeout(() => {
        setSelectedNode({ ...nodeData, text: [{ ...nodeData.text[0], value: newValue }] });
      }, 0);
      setEditOpen(false);
    } catch (e) {
      // Optionally show error
    }
  };

  return (
    <>
      <Modal size="auto" opened={opened} onClose={onClose} centered withCloseButton={false}>
        <Stack pb="sm" gap="sm">
          <Stack gap="xs">
            <Flex justify="space-between" align="center">
              <Text fz="xs" fw={500}>Content</Text>
              <CloseButton onClick={onClose} />
            </Flex>
            <ScrollArea.Autosize mah={250} maw={600}>
              <CodeHighlight
                code={normalizeNodeData(nodeData?.text ?? [])}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            </ScrollArea.Autosize>
          </Stack>
          <Text fz="xs" fw={500}>JSON Path</Text>
          <ScrollArea.Autosize maw={600}>
            <CodeHighlight
              code={jsonPathToString(nodeData?.path)}
              miw={350}
              mah={250}
              language="json"
              copyLabel="Copy to clipboard"
              copiedLabel="Copied to clipboard"
              withCopyButton
            />
          </ScrollArea.Autosize>
          {nodeData && (
            <Button mt="sm" onClick={handleEdit} size="xs">Edit</Button>
          )}
        </Stack>
      </Modal>
      {nodeData && (
        <NodeEditDialog
          opened={editOpen}
          value={nodeValue}
          path={jsonPathToString(nodeData.path)}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </>
  );
};
