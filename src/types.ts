import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface IoTCQuery extends DataQuery {
  queryText?: string;
}

export interface IoTCDataSourceOptions extends DataSourceJsonData {
  appUrl?: string;
  apiToken?: string;
}
