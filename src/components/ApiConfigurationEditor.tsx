import React, { useState } from 'react';
import { Button, Field, Input, Modal, useStyles2, IconButton } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import { ApiConfiguration, Pair } from '../types';
import { KeyValueEditor } from './KeyValueEditor';
import { RequestTypesEditor } from './RequestTypesEditor';

interface Props {
  apis: ApiConfiguration[];
  onChange: (apis: ApiConfiguration[]) => void;
}

export const ApiConfigurationEditor: React.FC<Props> = ({ apis, onChange }) => {
  const styles = useStyles2(getStyles);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState<ApiConfiguration>({
    id: '',
    name: '',
    url: '',
    queryParams: '',
    headers: [],
    requestTypes: [],
  });

  const openAddModal = () => {
    setFormData({
      id: '',
      name: '',
      url: '',
      queryParams: '',
      headers: [],
      requestTypes: [],
    });
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const openEditModal = (index: number) => {
    setFormData({ ...apis[index] });
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingIndex(null);
  };

  const saveApiConfiguration = () => {
    if (!formData.id || !formData.name || !formData.url) {
      return;
    }

    const newApis = [...apis];

    if (editingIndex !== null) {
      newApis[editingIndex] = formData;
    } else {
      newApis.push(formData);
    }

    onChange(newApis);
    closeModal();
  };

  const deleteApiConfiguration = (index: number) => {
    const newApis = apis.filter((_, i) => i !== index);
    onChange(newApis);
  };

  const onHeadersChange = (headers: Array<Pair<string, string>>) => {
    setFormData({ ...formData, headers });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button onClick={openAddModal} variant="secondary" size="sm">
          Add API Configuration
        </Button>
      </div>

      {apis.length > 0 && (
        <div className={styles.list}>
          {apis.map((api, index) => (
            <div key={api.id} className={styles.item}>
              <div className={styles.itemContent}>
                <div className={styles.itemHeader}>
                  <strong>{api.name}</strong>
                  <small className={styles.itemId}>ID: {api.id}</small>
                </div>
                <div className={styles.itemUrl}>{api.url}</div>
                {api.queryParams && <div className={styles.itemParams}>Query Params: {api.queryParams}</div>}
                {api.headers && api.headers.length > 0 && (
                  <div className={styles.itemHeaders}>
                    Headers: {api.headers.map(([key, value]) => `${key}: ${value}`).join(', ')}
                  </div>
                )}
              </div>
              <div className={styles.itemActions}>
                <IconButton
                  name="edit"
                  size="sm"
                  onClick={() => openEditModal(index)}
                  tooltip="Edit API configuration"
                />
                <IconButton
                  name="trash-alt"
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteApiConfiguration(index)}
                  tooltip="Delete API configuration"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        title={editingIndex !== null ? 'Edit API Configuration' : 'Add API Configuration'}
        isOpen={isModalOpen}
        onDismiss={closeModal}
      >
        <div className={styles.modalContent}>
          <Field label="ID" description="Unique identifier for this API configuration">
            <Input
              id="apiId"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.currentTarget.value })}
              placeholder="e.g., DomainService"
            />
          </Field>

          <Field label="Name" description="Display name for this API configuration">
            <Input
              id="apiName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.currentTarget.value })}
              placeholder="e.g., Domain Service API"
            />
          </Field>

          <Field label="URL" description="Base URL for this API">
            <Input
              id="apiUrl"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.currentTarget.value })}
              placeholder="e.g., http://domain-service:8080"
            />
          </Field>

          <Field label="Query Parameters" description="Default query parameters for this API">
            <Input
              id="apiQueryParams"
              value={formData.queryParams || ''}
              onChange={(e) => setFormData({ ...formData, queryParams: e.currentTarget.value })}
              placeholder="e.g., limit=100&format=json"
            />
          </Field>

          <Field label="Headers" description="Default headers for this API">
            <KeyValueEditor
              columns={['Key', 'Value']}
              values={formData.headers || []}
              onChange={onHeadersChange}
              onBlur={() => {}}
              addRowLabel="Add Header"
            />
          </Field>

          <Field label="Request Types" description="Predefined request types for this API">
            <RequestTypesEditor
              requestTypes={(formData.requestTypes || []).map((rt) => ({
                ...rt,
                apiId: formData.id, // Ensure all request types have the correct apiId
              }))}
              onChange={(requestTypes) =>
                setFormData({
                  ...formData,
                  requestTypes: requestTypes.map((rt) => ({
                    ...rt,
                    apiId: formData.id, // Ensure apiId is set for all request types
                  })),
                })
              }
            />
          </Field>

          <div className={styles.modalActions}>
            <Button onClick={closeModal} variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={saveApiConfiguration}
              variant="primary"
              disabled={!formData.id || !formData.name || !formData.url}
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
  }),
  itemUrl: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    fontFamily: theme.typography.fontFamilyMonospace,
    marginTop: theme.spacing(0.5),
  }),
  itemParams: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    marginTop: theme.spacing(0.25),
  }),
  itemHeaders: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    marginTop: theme.spacing(0.25),
  }),
  itemActions: css({
    display: 'flex',
    gap: theme.spacing(1),
  }),
  modalContent: css({
    width: '600px',
  }),
  modalActions: css({
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(1),
    marginTop: theme.spacing(3),
  }),
});
