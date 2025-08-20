import { BackendSrvRequest, getBackendSrv } from '@grafana/runtime';
import cache from 'memory-cache';
import { Observable } from 'rxjs';
import { Pair, ApiConfiguration } from 'types';

export class MultiApiManager {
  private cache: any;
  private apis: Map<string, ApiConfiguration>;
  private lastCacheDuration: number | undefined;

  constructor(apis: ApiConfiguration[]) {
    this.cache = new cache.Cache();
    this.apis = new Map();

    // Initialize APIs map
    apis.forEach((api) => {
      this.apis.set(api.id, api);
    });
  }

  /**
   * Update the APIs configuration
   */
  updateApis(apis: ApiConfiguration[]) {
    this.apis.clear();
    apis.forEach((api) => {
      this.apis.set(api.id, api);
    });
  }

  /**
   * Get API configuration by ID
   */
  getApi(apiId: string): ApiConfiguration | undefined {
    return this.apis.get(apiId);
  }

  /**
   * Get all APIs
   */
  getAllApis(): ApiConfiguration[] {
    return Array.from(this.apis.values());
  }

  /**
   * Queries the specified API and returns the response data.
   */
  async get(
    apiId: string,
    method: string,
    path: string,
    params?: Array<Pair<string, string>>,
    headers?: Array<Pair<string, string>>,
    body?: string
  ): Promise<any> {
    const api = this.getApi(apiId);
    if (!api) {
      throw new Error(`API with ID '${apiId}' not found`);
    }

    const paramsData: Record<string, string> = {};

    // Add API-specific query parameters
    if (api.queryParams) {
      const apiParams = new URLSearchParams('?' + api.queryParams);
      apiParams.forEach((value, key) => {
        paramsData[key] = value;
      });
    }

    // In order to allow for duplicate URL params add a suffix to it to
    // uniquify the key. We strip this suffix off as part of
    // constructing the final URL in _request()
    let i = 0;
    (params ?? []).forEach(([key, value]) => {
      if (key) {
        paramsData[key + '__' + i] = value;
        i++;
      }
    });

    // Merge API-specific headers with request headers
    const mergedHeaders = [...(api.headers || []), ...(headers || [])];

    const response = this._request(api, method, path, paramsData, mergedHeaders, body);

    return (await response.toPromise()).data;
  }

  /**
   * Used as a health check for a specific API.
   */
  async test(apiId: string): Promise<any> {
    const api = this.getApi(apiId);
    if (!api) {
      throw new Error(`API with ID '${apiId}' not found`);
    }

    const data: Record<string, string> = {};

    if (api.queryParams) {
      const apiParams = new URLSearchParams('?' + api.queryParams);
      apiParams.forEach((value, key) => {
        data[key] = value;
      });
    }

    return this._request(api, 'GET', '', data, api.headers || []).toPromise();
  }

  /**
   * Returns a cached API response if it exists, otherwise queries the API.
   */
  async cachedGet(
    apiId: string,
    cacheDurationSeconds: number,
    method: string,
    path: string,
    params: Array<Pair<string, string>>,
    headers?: Array<Pair<string, string>>,
    body?: string
  ): Promise<any> {
    if (!cacheDurationSeconds) {
      return await this.get(apiId, method, path, params, headers, body);
    }

    const api = this.getApi(apiId);
    if (!api) {
      throw new Error(`API with ID '${apiId}' not found`);
    }

    let cacheKey = api.url + path;

    if (params && Object.keys(params).length > 0) {
      cacheKey =
        cacheKey +
        (cacheKey.search(/\?/) >= 0 ? '&' : '?') +
        params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    }

    if (this.lastCacheDuration !== cacheDurationSeconds) {
      this.cache.del(cacheKey);
    }
    this.lastCacheDuration = cacheDurationSeconds;

    const cachedItem = this.cache.get(cacheKey);
    if (cachedItem) {
      return Promise.resolve(cachedItem);
    }

    const result = await this.get(apiId, method, path, params, headers, body);

    this.cache.put(cacheKey, result, cacheDurationSeconds * 1000);

    return result;
  }

  /**
   * Make an API request using the specified API configuration.
   * This uses a direct fetch approach with proper CORS handling.
   */
  _request(
    api: ApiConfiguration,
    method: string,
    path: string,
    params?: Record<string, string>,
    headers?: Array<Pair<string, string>>,
    data?: string
  ): Observable<any> {
    const recordHeaders: Record<string, any> = {
      'Content-Type': 'application/json',
    };

    (headers ?? [])
      .filter(([key, _]) => key)
      .forEach(([key, value]) => {
        recordHeaders[key] = value;
      });

    // Build the full URL
    let fullUrl = api.url + path;

    // Deduplicate forward slashes
    fullUrl = fullUrl.replace(/([^:]\/)\/+/g, '$1');

    if (params && Object.keys(params).length > 0) {
      fullUrl =
        fullUrl +
        (fullUrl.search(/\?/) >= 0 ? '&' : '?') +
        Object.entries(params)
          .map(([k, v]) => `${encodeURIComponent(k.replace(/__\d+$/, ''))}=${encodeURIComponent(v)}`)
          .join('&');
    }

    // Validate URL safety
    if (!isSafeURL(fullUrl)) {
      throw new Error('URL path contains unsafe characters');
    }

    // Use direct fetch with the full URL
    const req: BackendSrvRequest = {
      url: fullUrl,
      method,
      headers: recordHeaders,
    };

    if (req.method !== 'GET' && data) {
      req.data = data;
    }

    return getBackendSrv().fetch(req);
  }
}

function isSafeURL(origUrl: string) {
  // browsers interpret backslash as slash
  const url = decodeURIComponent(origUrl.replace(/\\/g, '/'));
  if (url.endsWith('/..')) {
    return false;
  }

  if (url.includes('/../')) {
    return false;
  }

  if (url.includes('/..?')) {
    return false;
  }

  if (url.includes('\t')) {
    return false;
  }

  return true;
}
