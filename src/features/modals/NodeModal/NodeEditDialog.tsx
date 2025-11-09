import React, { useState } from "react";
import { Modal, Stack, Text, Textarea, Button, Flex, Code } from "@mantine/core";

interface NodeEditDialogProps {
  opened: boolean;
  value: any;
  path: string;
  onSave: (newValue: any) => void;
  onCancel: () => void;
}

function isStructured(val: any) {
  return typeof val === "object" && val !== null;
}

export const NodeEditDialog: React.FC<NodeEditDialogProps> = ({ opened, value, path, onSave, onCancel }) => {
  const [editValue, setEditValue] = useState(() =>
    isStructured(value) ? JSON.stringify(value, null, 2) : String(value)
  );
  const [error, setError] = useState<string | null>(null);

  // Reset editValue when opened or value changes
  React.useEffect(() => {
    setEditValue(isStructured(value) ? JSON.stringify(value, null, 2) : String(value));
    setError(null);
  }, [opened, value]);

  const handleSave = () => {
    try {
      let parsed: any = editValue;
      if (isStructured(value)) {
        parsed = JSON.parse(editValue);
      } else if (typeof value === "number") {
        parsed = Number(editValue);
      } else if (typeof value === "boolean") {
        parsed = editValue === "true";
      }
      setError(null);
      onSave(parsed);
    } catch (e) {
      setError("Invalid value");
    }
  };

  return (
    <Modal opened={opened} onClose={onCancel} centered title="Edit Node Value">
      <Stack gap="sm">
        <Text size="sm" fw={500}>JSON Path</Text>
        <Code>{path}</Code>
        <Text size="sm" fw={500}>Value</Text>
        <Textarea
          value={editValue}
          onChange={e => setEditValue(e.currentTarget.value)}
          autosize
          minRows={3}
          maxRows={10}
        />
        {error && <Text color="red" size="xs">{error}</Text>}
        <Flex justify="end" gap="sm">
          <Button variant="default" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </Flex>
      </Stack>
    </Modal>
  );
};
