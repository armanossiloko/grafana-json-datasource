import React, { useState, useEffect } from 'react';
import { Button, CodeEditor, Field, InfoBox, LoadingPlaceholder, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';
import AutoSizer from 'react-virtualized-auto-sizer';
import { JsonDataSource } from '../datasource';
import { JsonApiQuery } from '../types';

interface Props {
  query: JsonApiQuery;
  datasource: JsonDataSource;
}

export const JsonPreview: React.FC<Props> = ({ query, datasource }) => {
  const styles = useStyles2(getStyles);
  const [jsonResponse, setJsonResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasPreview, setHasPreview] = useState(false);

  const fetchPreview = async () => {
    if (!query.urlPath && !query.requestType) {
      setError('Please configure a path or select a request type first');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Create a copy of the query to avoid modifying the original
      const previewQuery = { ...query };

      // Determine the correct HTTP method
      if (!previewQuery.method) {
        // If we have a request type, get the method from the request type configuration
        if (previewQuery.requestType) {
          const requestTypes = datasource.instanceSettings.jsonData.requestTypes || [];
          const selectedRequestType = requestTypes.find((rt) => rt.id === previewQuery.requestType);
          previewQuery.method = selectedRequestType?.httpMethod || 'POST';
        } else {
          // Default to GET for non-request-type queries
          previewQuery.method = 'GET';
        }
      }

      // For preview purposes, we'll call the datasource's query method
      const result = await datasource.requestJson(previewQuery, (text: string) => text);

      // Handle different response formats
      let responseToDisplay = result;

      // If it's a GraphQL response, we might want to show the structure
      if (result && typeof result === 'object') {
        responseToDisplay = result;
      }

      // Format the JSON response
      const formattedJson = JSON.stringify(responseToDisplay, null, 2);
      setJsonResponse(formattedJson);
      setHasPreview(true);
    } catch (err: any) {
      setError(`Failed to fetch preview: ${err.message || 'Unknown error'}`);
      setJsonResponse('');
      setHasPreview(false);
    } finally {
      setIsLoading(false);
    }
  };

  const clearPreview = () => {
    setJsonResponse('');
    setError('');
    setHasPreview(false);
  };

  // Auto-clear preview when query changes significantly
  useEffect(() => {
    setHasPreview(false);
    setJsonResponse('');
    setError('');
  }, [query.urlPath, query.method, query.requestType, query.customBody, query.body, query.params, query.headers]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h3>JSON Response Preview</h3>
          <p className={styles.description}>
            Preview the JSON response to help configure field extraction in the Fields tab.
          </p>
        </div>
        <div className={styles.actions}>
          <Button onClick={fetchPreview} disabled={isLoading} variant="primary">
            {isLoading ? 'Loading...' : 'Fetch Preview'}
          </Button>
          {hasPreview && (
            <Button onClick={clearPreview} variant="secondary">
              Clear
            </Button>
          )}
        </div>
      </div>

      {error && (
        <InfoBox severity="error" style={{ marginBottom: '16px' }}>
          {error}
        </InfoBox>
      )}

      {isLoading && (
        <div className={styles.loadingContainer}>
          <LoadingPlaceholder text="Fetching JSON response..." />
        </div>
      )}

      {hasPreview && jsonResponse && (
        <Field label="JSON Response" description="Use this structure to configure field extraction in the Fields tab">
          <AutoSizer disableHeight className={styles.editorWrapper}>
            {({ width }) => (
              <CodeEditor
                value={jsonResponse}
                language="json"
                width={width}
                height="400px"
                showMiniMap={false}
                showLineNumbers={true}
                readOnly={true}
              />
            )}
          </AutoSizer>
        </Field>
      )}

      {!hasPreview && !isLoading && !error && (
        <div className={styles.emptyState}>
          <p>Click &quot;Fetch Preview&quot; to see the JSON response structure.</p>
          <p className={styles.tip}>
            💡 <strong>Tip:</strong> This preview helps you identify the correct JSONPath or JSONata expressions for
            extracting data in the Fields tab.
          </p>
        </div>
      )}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    width: '100%',
    padding: theme.spacing(2, 0),
  }),
  header: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing(2),
    flexWrap: 'wrap',
    gap: theme.spacing(2),
  }),
  headerContent: css({
    flex: 1,
    minWidth: '300px',
  }),
  description: css({
    margin: theme.spacing(0.5, 0, 0, 0),
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
  }),
  actions: css({
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'center',
  }),
  loadingContainer: css({
    padding: theme.spacing(4),
    textAlign: 'center',
  }),
  editorWrapper: css({
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.borderRadius(),
  }),
  emptyState: css({
    textAlign: 'center',
    padding: theme.spacing(4),
    color: theme.colors.text.secondary,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.shape.borderRadius(),
    border: `1px dashed ${theme.colors.border.medium}`,
  }),
  tip: css({
    fontSize: theme.typography.bodySmall.fontSize,
    marginTop: theme.spacing(2),
    fontStyle: 'italic',
  }),
});
