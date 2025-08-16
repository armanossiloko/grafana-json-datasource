import React, { useState, useEffect } from 'react';
import { Select, Field, CodeEditor, useStyles2, InlineFieldRow, InlineField } from '@grafana/ui';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { css } from '@emotion/css';
import { JsonApiQuery, RequestType } from '../types';
import AutoSizer from 'react-virtualized-auto-sizer';
import { AggregateDataEditor } from './AggregateDataEditor';

interface Props {
  query: JsonApiQuery;
  onChange: (query: JsonApiQuery) => void;
  onRunQuery: () => void;
  requestTypes: RequestType[];
}

export const RequestTypeEditor: React.FC<Props> = ({ query, onChange, onRunQuery, requestTypes }) => {
  const styles = useStyles2(getStyles);
  const [jsonBody, setJsonBody] = useState<string>('{}');
  const [selectedApi, setSelectedApi] = useState<string>('');

  // Group request types by API
  const requestTypesByApi = requestTypes.reduce(
    (acc, rt) => {
      const api = rt.api || 'Other';
      if (!acc[api]) {
        acc[api] = [];
      }
      acc[api].push(rt);
      return acc;
    },
    {} as Record<string, RequestType[]>
  );

  const apiOptions: Array<SelectableValue<string>> = [
    { label: 'Select an API...', value: '' },
    { label: 'DomainService', value: 'DomainService' },
    { label: 'DataService', value: 'DataService' },
  ];

  // Add "Other" option if there are request types without API specified
  if (requestTypesByApi['Other'] && requestTypesByApi['Other'].length > 0) {
    apiOptions.push({ label: 'Other', value: 'Other' });
  }

  // Initialize JSON body from customBody or default
  useEffect(() => {
    if (query.customBody) {
      setJsonBody(JSON.stringify(query.customBody, null, 2));
    } else {
      setJsonBody('{}');
    }
  }, [query.customBody]);

  // Set the selected API based on the current request type (for backward compatibility)
  useEffect(() => {
    if (query.requestType && !selectedApi) {
      const currentRequestType = requestTypes.find((rt) => rt.id === query.requestType);
      if (currentRequestType?.api) {
        setSelectedApi(currentRequestType.api);
      }
    }
  }, [query.requestType, requestTypes, selectedApi]);

  const requestTypeOptions: Array<SelectableValue<string>> = [
    { label: 'Select a request type...', value: '' },
    ...(selectedApi ? requestTypesByApi[selectedApi] || [] : requestTypes).map((rt) => ({
      label: rt.name,
      value: rt.id,
      description: rt.description,
    })),
  ];

  const onApiChange = (selected: SelectableValue<string>) => {
    setSelectedApi(selected.value || '');
    // Clear the request type when API changes
    if (query.requestType) {
      const newQuery = {
        ...query,
        requestType: '',
        method: 'GET',
        urlPath: '',
        customBody: undefined,
        body: '',
      };
      onChange(newQuery);
      setJsonBody('{}');
    }
  };

  const onRequestTypeChange = (selected: SelectableValue<string>) => {
    const selectedRequestType = requestTypes.find((rt) => rt.id === selected.value);

    const newQuery = {
      ...query,
      requestType: selected.value || '',
      method: selectedRequestType?.httpMethod || 'POST', // Set method from request type
      urlPath: selectedRequestType?.basePath || '', // Set the path from request type
    };

    // Clear body for GET requests, initialize with example for others
    if (selectedRequestType?.httpMethod === 'GET') {
      // Clear body for GET requests
      newQuery.customBody = undefined;
      newQuery.body = '';
      setJsonBody('');
    } else {
      // Initialize with example body if it's AggregateData or other POST/PUT/etc requests
      if (selected.value === 'AggregateData') {
        const exampleBody = {
          aggregationType: 'sum',
          startDate: '2025-01-01',
          endDate: '2025-01-02',
        };
        newQuery.customBody = exampleBody;
        setJsonBody(JSON.stringify(exampleBody, null, 2));
      } else if (selected.value === 'GetExperiments') {
        const exampleBody = {
          query:
            'query experimentsBySiteExternalId($siteExternalId: String!) { experimentsBySiteExternalId(siteExternalId: $siteExternalId) { nodes { id name } } }',
          variables: {
            siteExternalId: '$(siteExternalId)',
          },
        };
        newQuery.customBody = exampleBody;
        setJsonBody(JSON.stringify(exampleBody, null, 2));
      } else if (selected.value === 'GetFilterTreeItems') {
        const exampleBody = {
          query:
            'query GetFlatFilterTreeItems($siteExternalId: String!, $uiObjectFullName: String!) { flatFilterTreeItems(siteExternalId: $siteExternalId, uiObjectFullName: $uiObjectFullName) { nodes { id fullPath } } }',
          variables: {
            siteExternalId: '$(siteExternalId)',
            uiObjectFullName: '$(uiObject)',
          },
        };
        newQuery.customBody = exampleBody;
        setJsonBody(JSON.stringify(exampleBody, null, 2));
      } else {
        // Initialize with empty object for other non-GET requests
        newQuery.customBody = {};
        setJsonBody('{}');
      }
    }

    onChange(newQuery);
    onRunQuery();
  };

  const onJsonBodyChange = (value: string) => {
    setJsonBody(value);

    try {
      const parsedBody = JSON.parse(value);
      const newQuery = {
        ...query,
        customBody: parsedBody,
        body: value, // Also update the original body field for backward compatibility
      };
      onChange(newQuery);
    } catch (error) {
      // Invalid JSON - don't update the query yet
      console.warn('Invalid JSON:', error);
    }
  };

  const onJsonBodyBlur = () => {
    try {
      const parsedBody = JSON.parse(jsonBody);
      const newQuery = {
        ...query,
        customBody: parsedBody,
        body: jsonBody,
      };
      onChange(newQuery);
      onRunQuery();
    } catch (error) {
      console.error('Invalid JSON on blur:', error);
    }
  };

  const selectedRequestType = requestTypes.find((rt) => rt.id === query.requestType);

  return (
    <div className={styles.container}>
      <InlineFieldRow>
        <InlineField label="API" grow>
          <Select
            value={selectedApi}
            options={apiOptions}
            onChange={onApiChange}
            placeholder="Select an API..."
            aria-label="API"
            inputId="api"
            menuPortalTarget={document.body}
          />
        </InlineField>
      </InlineFieldRow>

      <InlineFieldRow>
        <InlineField label="Request Type" grow>
          <Select
            value={query.requestType || ''}
            options={requestTypeOptions}
            onChange={onRequestTypeChange}
            placeholder={selectedApi ? `Select a ${selectedApi} request type...` : 'Select a request type...'}
            aria-label="Request Type"
            inputId="requestType"
            menuPortalTarget={document.body}
            isDisabled={!selectedApi}
          />
        </InlineField>
      </InlineFieldRow>

      {selectedRequestType && selectedRequestType.httpMethod !== 'GET' && (
        <>
          {selectedRequestType.id === 'AggregateData' ? (
            <AggregateDataEditor query={query} onChange={onChange} onRunQuery={onRunQuery} />
          ) : (
            <Field label="Request Body" description={`Configure the JSON body for ${selectedRequestType.name} request`}>
              <AutoSizer disableHeight className={styles.editorWrapper}>
                {({ width }) => (
                  <CodeEditor
                    value={jsonBody}
                    language="json"
                    width={width}
                    height="300px"
                    showMiniMap={false}
                    showLineNumbers={true}
                    onChange={onJsonBodyChange}
                    onBlur={onJsonBodyBlur}
                  />
                )}
              </AutoSizer>
            </Field>
          )}
        </>
      )}

      {selectedRequestType && selectedRequestType.httpMethod === 'GET' && (
        <div className={styles.getMethodInfo}>
          <strong>Note:</strong> GET requests do not have a request body.
        </div>
      )}

      {selectedRequestType && (
        <div className={styles.infoSection}>
          <div className={styles.pathInfo}>
            <strong>API:</strong> {selectedRequestType.api || 'Not specified'} | <strong>Endpoint:</strong>{' '}
            <code>
              {selectedRequestType.httpMethod} {selectedRequestType.basePath}
            </code>
          </div>
          {selectedRequestType.description && (
            <div className={styles.description}>
              <strong>Description:</strong> {selectedRequestType.description}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    width: '100%',
  }),
  editorWrapper: css({
    marginBottom: theme.spacing(1),
  }),
  getMethodInfo: css({
    padding: theme.spacing(2),
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.shape.borderRadius(),
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing(2),
    border: `1px solid ${theme.colors.border.medium}`,
  }),
  infoSection: css({
    marginTop: theme.spacing(2),
  }),
  pathInfo: css({
    padding: theme.spacing(1),
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.shape.borderRadius(),
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing(1),
    '& code': {
      fontFamily: theme.typography.fontFamilyMonospace,
      backgroundColor: theme.colors.background.primary,
      padding: theme.spacing(0.5),
      borderRadius: theme.shape.borderRadius(0.5),
    },
  }),
  description: css({
    padding: theme.spacing(1),
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.shape.borderRadius(),
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
  }),
});
