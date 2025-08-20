import { DataQuery, DataSourceJsonData, FieldType } from '@grafana/data';

export type QueryLanguage = 'jsonpath' | 'jsonata';

export interface JsonField {
  name?: string;
  jsonPath: string;
  type?: FieldType;
  language?: QueryLanguage;
}

export type Pair<T, K> = [T, K];

export interface JsonApiQuery extends DataQuery {
  refId: string;
  fields: JsonField[];
  method: string;
  urlPath: string;
  queryParams: string;
  params: Array<Pair<string, string>>;
  headers: Array<Pair<string, string>>;
  body: string;
  cacheDurationSeconds: number;

  // Request type functionality
  requestType?: string;
  customBody?: Record<string, any>;

  // API selection for multi-API support
  apiId?: string;

  // Keep for backwards compatibility with older version of variables query editor.
  jsonPath?: string;

  // Experimental
  experimentalGroupByField?: string;
  experimentalMetricField?: string;
  experimentalVariableTextField?: string;
  experimentalVariableValueField?: string;
}

export const defaultQuery: Partial<JsonApiQuery> = {
  cacheDurationSeconds: 300,
  method: 'GET',
  queryParams: '',
  urlPath: '',
  fields: [{ jsonPath: '' }],
};

export interface ApiConfiguration {
  id: string;
  name: string;
  url: string; // Full URL for this API
  queryParams?: string;
  // Headers can be configured per API
  headers?: Array<Pair<string, string>>;
  // Request types specific to this API
  requestTypes?: RequestType[];
}

export interface RequestType {
  id: string;
  name: string;
  description?: string;
  basePath: string;
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  defaultFields?: JsonField[];
  isHardcoded?: boolean;
  apiId?: string; // Changed from api to apiId to reference the API configuration
  defaultBody?: Record<string, any>;
}

export interface SeriesConfiguration {
  $type:
    | 'DataServiceSeriesConfiguration'
    | 'MultiDataServiceSeriesConfiguration'
    | 'NativeDataServiceSeriesConfiguration';
  name: string;
  color: string;
}

export interface DataServiceSeriesConfiguration extends SeriesConfiguration {
  $type: 'DataServiceSeriesConfiguration';
  dataformat: string;
  selector: string;
  interpolation: string;
  aggregation: string;
}

export interface MultiDataServiceSeriesConfiguration extends SeriesConfiguration {
  $type: 'MultiDataServiceSeriesConfiguration';
  dataformat: string;
  selector: string;
  interpolation: string;
  isParentAggregation: boolean;
  streamAggregation: string;
  seriesAggregation: string;
}

export interface NativeDataServiceSeriesConfiguration extends SeriesConfiguration {
  $type: 'NativeDataServiceSeriesConfiguration';
  query: string;
}

export type AnySeriesConfiguration =
  | DataServiceSeriesConfiguration
  | MultiDataServiceSeriesConfiguration
  | NativeDataServiceSeriesConfiguration;

export interface JsonApiDataSourceOptions extends DataSourceJsonData {
  queryParams?: string;
  requestTypes?: RequestType[];
  // New multi-API configuration
  apis?: ApiConfiguration[];
  // Keep legacy fields for backward compatibility
  legacyMode?: boolean;
}
