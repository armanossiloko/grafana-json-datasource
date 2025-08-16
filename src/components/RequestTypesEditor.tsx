import React, { useState } from 'react';
import { Button, Field, Input, TextArea, Modal, useStyles2, IconButton, Select } from '@grafana/ui';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { css } from '@emotion/css';
import { RequestType } from '../types';

interface Props {
  requestTypes: RequestType[];
  onChange: (requestTypes: RequestType[]) => void;
}

export const RequestTypesEditor: React.FC<Props> = ({ requestTypes, onChange }) => {
  const styles = useStyles2(getStyles);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const httpMethodOptions: Array<SelectableValue<string>> = [
    { label: 'GET', value: 'GET' },
    { label: 'POST', value: 'POST' },
    { label: 'PUT', value: 'PUT' },
    { label: 'DELETE', value: 'DELETE' },
    { label: 'PATCH', value: 'PATCH' },
  ];
  const [formData, setFormData] = useState<RequestType>({
    id: '',
    name: '',
    description: '',
    basePath: '',
    httpMethod: 'POST',
  });

  const openAddModal = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      basePath: '',
      httpMethod: 'POST',
    });
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const openEditModal = (index: number) => {
    if (requestTypes[index].isHardcoded) {
      return; // Don't allow editing hardcoded types
    }
    setFormData({ ...requestTypes[index] });
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingIndex(null);
  };

  const saveRequestType = () => {
    if (!formData.id || !formData.name || !formData.basePath) {
      return;
    }

    const newRequestTypes = [...requestTypes];

    if (editingIndex !== null) {
      newRequestTypes[editingIndex] = formData;
    } else {
      newRequestTypes.push(formData);
    }

    onChange(newRequestTypes);
    closeModal();
  };

  const deleteRequestType = (index: number) => {
    if (requestTypes[index].isHardcoded) {
      return; // Don't allow deleting hardcoded types
    }
    const newRequestTypes = requestTypes.filter((_, i) => i !== index);
    onChange(newRequestTypes);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button onClick={openAddModal} variant="secondary" size="sm">
          Add Request Type
        </Button>
      </div>

      {requestTypes.length > 0 && (
        <div className={styles.list}>
          {requestTypes.map((requestType, index) => (
            <div key={requestType.id} className={styles.item}>
              <div className={styles.itemContent}>
                <div className={styles.itemHeader}>
                  <strong>{requestType.name}</strong>
                  <small className={styles.itemId}>
                    ID: {requestType.id}
                    {requestType.isHardcoded && <span className={styles.hardcodedBadge}>Built-in</span>}
                  </small>
                </div>
                <div className={styles.itemPath}>
                  {requestType.httpMethod} {requestType.basePath}
                </div>
                {requestType.description && <div className={styles.itemDescription}>{requestType.description}</div>}
              </div>
              <div className={styles.itemActions}>
                {!requestType.isHardcoded && (
                  <>
                    <IconButton
                      name="edit"
                      size="sm"
                      onClick={() => openEditModal(index)}
                      tooltip="Edit request type"
                    />
                    <IconButton
                      name="trash-alt"
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteRequestType(index)}
                      tooltip="Delete request type"
                    />
                  </>
                )}
                {requestType.isHardcoded && <span className={styles.hardcodedText}>Built-in request type</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        title={editingIndex !== null ? 'Edit Request Type' : 'Add Request Type'}
        isOpen={isModalOpen}
        onDismiss={closeModal}
      >
        <div className={styles.modalContent}>
          <Field label="ID" description="Unique identifier for this request type">
            <Input
              id="requestTypeId"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.currentTarget.value })}
              placeholder="e.g., AggregateData"
            />
          </Field>

          <Field label="Name" description="Display name for this request type">
            <Input
              id="requestTypeName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.currentTarget.value })}
              placeholder="e.g., Aggregate Data"
            />
          </Field>

          <Field label="Base Path" description="API endpoint path for this request type">
            <Input
              id="requestTypeBasePath"
              value={formData.basePath}
              onChange={(e) => setFormData({ ...formData, basePath: e.currentTarget.value })}
              placeholder="e.g., /aggregate"
            />
          </Field>

          <Field label="HTTP Method" description="HTTP method for this request type">
            <Select
              value={formData.httpMethod}
              options={httpMethodOptions}
              onChange={(selected) => setFormData({ ...formData, httpMethod: (selected?.value as any) || 'POST' })}
              aria-label="HTTP Method"
              inputId="httpMethod"
              menuPortalTarget={document.body}
            />
          </Field>

          <Field label="Description" description="Optional description for this request type">
            <TextArea
              id="requestTypeDescription"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.currentTarget.value })}
              placeholder="Description of what this request type does..."
              rows={3}
            />
          </Field>

          <div className={styles.modalActions}>
            <Button onClick={closeModal} variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={saveRequestType}
              variant="primary"
              disabled={!formData.id || !formData.name || !formData.basePath}
            >
              {editingIndex !== null ? 'Update' : 'Add'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    width: '100%',
  }),
  header: css({
    marginBottom: theme.spacing(2),
  }),
  list: css({
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.borderRadius(),
  }),
  item: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.colors.border.weak}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  }),
  itemContent: css({
    flex: 1,
  }),
  itemHeader: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(0.5),
  }),
  itemId: css({
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamilyMonospace,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  }),
  hardcodedBadge: css({
    backgroundColor: theme.colors.primary.main,
    color: theme.colors.primary.contrastText,
    padding: theme.spacing(0.25, 0.5),
    borderRadius: theme.shape.borderRadius(0.5),
    fontSize: theme.typography.bodySmall.fontSize,
    fontFamily: theme.typography.fontFamily,
  }),
  hardcodedText: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    fontStyle: 'italic',
  }),
  itemPath: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    fontFamily: theme.typography.fontFamilyMonospace,
    marginTop: theme.spacing(0.5),
  }),
  itemDescription: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  itemActions: css({
    display: 'flex',
    gap: theme.spacing(1),
  }),
  modalContent: css({
    width: '500px',
  }),
  modalActions: css({
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(1),
    marginTop: theme.spacing(3),
  }),
});
