import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import React, { useEffect } from 'react';
import { JsonApiDataSourceOptions, ApiConfiguration } from '../types';
import { ConfigSection, DataSourceDescription } from '@grafana/experimental';
import { ApiConfigurationEditor } from './ApiConfigurationEditor';

type Props = DataSourcePluginOptionsEditorProps<JsonApiDataSourceOptions>;

/**
 * ConfigEditor lets the user configure connection details like the URL or
 * authentication.
 */
export const ConfigEditor: React.FC<Props> = ({ options, onOptionsChange }) => {
  // Initialize with predefined APIs if not already set
  useEffect(() => {
    if (!options.jsonData.apis || options.jsonData.apis.length === 0) {
      onOptionsChange({
        ...options,
        jsonData: {
          ...options.jsonData,
          apis: [],
        },
      });
    }
  }, [options, onOptionsChange]);

  const onApisChange = (apis: ApiConfiguration[]) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...options.jsonData,
        apis,
      },
    });
  };

  return (
    <>
      <DataSourceDescription dataSourceName="DataHub JSON API" docsLink="" hasRequiredFields={false} />

      <ConfigSection
        title="API Configurations"
        description="Configure multiple APIs with their own URL, authentication, headers, and request types"
        isCollapsible
      >
        <ApiConfigurationEditor apis={options.jsonData.apis || []} onChange={onApisChange} />
      </ConfigSection>
    </>
  );
};

