import { DataSourcePlugin } from '@grafana/data';
import { DataSource } from './datasource';
import { ConfigEditor } from './config';
import { QueryEditor } from './query';
import { IoTCQuery, IoTCDataSourceOptions } from './types';

export const plugin = new DataSourcePlugin<DataSource, IoTCQuery, IoTCDataSourceOptions>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
