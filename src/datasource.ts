import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
  TimeRange,
} from '@grafana/data';
import { BackendSrvRequest, getBackendSrv } from '@grafana/runtime';

import { getTsFieldName, overrideTimeWindow } from './parser';
import { IoTCQuery, IoTCDataSourceOptions } from './types';

export class DataSource extends DataSourceApi<IoTCQuery, IoTCDataSourceOptions> {
  appUrl?: string;
  apiToken?: string;

  constructor(instanceSettings: DataSourceInstanceSettings<IoTCDataSourceOptions>) {
    super(instanceSettings);
    this.appUrl = instanceSettings.jsonData.appUrl;
    this.appUrl = this.appUrl?.replace(/https?:\/\//gi, ''); // Remove the protocol prefix
    this.apiToken = instanceSettings.jsonData.apiToken;
  }

  async query(options: DataQueryRequest<IoTCQuery>): Promise<DataQueryResponse> {
    const promises = options.targets.map((query) => this.runQuery(query, options.range));
    return Promise.all(promises).then((data) => ({ data }));
  }

  async runQuery(query: IoTCQuery, range: TimeRange) {
    let text = query.queryText;
    const tsFieldName = getTsFieldName(text!);

    if (tsFieldName) {
      text = overrideTimeWindow(text!, range.from, range.to);
    }

    const response = await fetchWithRetry({
      method: 'POST',
      url: `https://${this.appUrl}/api/query?api-version=1.1-preview`,
      data: {
        query: text,
      },
      headers: {
        Authorization: this.apiToken,
      },
    });

    const fieldMap: { [key: string]: { name: string; type: FieldType; key: string; subKey?: string } } = {};
    const records = response.data.results.map((row: any) => flatten(row));

    // First pass to collect all columns names and types
    for (const row of records) {
      for (const key of Object.keys(row)) {
        if (!(key in fieldMap)) {
          fieldMap[key] = {
            name: key,
            type: tsFieldName && key === tsFieldName ? FieldType.time : getType(row[key]),
          } as any;
        }
      }
    }

    const fields = [];

    for (const key of Object.keys(fieldMap)) {
      fields.push(fieldMap[key]);
    }

    const frame = new MutableDataFrame({
      refId: query.refId,
      fields,
    });

    for (const row of records) {
      const record = [];

      for (const key of Object.keys(fieldMap)) {
        record.push(tsFieldName && key === tsFieldName && row[key] ? new Date(row[key]).getTime() : row[key]);
      }

      frame.appendRow(record);
    }

    return frame;
  }

  async testDatasource() {
    return {
      status: 'success',
      message: 'Success',
    };
  }
}

function getType(value: any) {
  switch (typeof value) {
    case 'boolean':
      return FieldType.boolean;
    case 'number':
      return FieldType.number;
    case 'string':
      return FieldType.string;
    default:
      return FieldType.other;
  }
}

/**
 * Transforms an object of objects into a flat object of primitive types.
 *
 * Example input:
 * {
 *   a: '1',
 *   b: {
 *     b1: 12,
 *     b2: null,
 *     b3: undefined
 *   },
 *   c: 'asd'
 * }
 *
 * Output:
 * {
 *   a: '1',
 *   b.b1: 12,
 *   b.b2: null,
 *   b.b3: undefined
 *   c: 'asd'
 * }
 */
function flatten(obj: any, stack: string[] = []) {
  let result: any = {};

  for (const key in obj) {
    const compositeKey = [...stack, key].join('.');

    if (typeof obj[key] === 'object' && obj[key]) {
      result = {
        ...result,
        ...flatten(obj[key], [...stack, key]),
      };
    } else {
      result[compositeKey] = obj[key];
    }
  }

  return result;
}

/**
 * Executes an HTTP request, retrying on throttling.
 */
async function fetchWithRetry(options: BackendSrvRequest) {
  const attempts = 4;

  for (let i = 0; i < attempts - 1; ++i) {
    try {
      return await getBackendSrv().datasourceRequest(JSON.parse(JSON.stringify(options)));
    } catch (e) {
      if (e.status !== 429) {
        throw e;
      }

      await wait(randomInt(500, 2000)); // Wait a random time between 0.5s and 2s before attempting again
    }
  }

  // Last attempt
  return await getBackendSrv().datasourceRequest(JSON.parse(JSON.stringify(options)));
}

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
