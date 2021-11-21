import React, { ChangeEvent, PureComponent } from 'react';
import { Input, InlineFieldRow, InlineField } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from './datasource';
import { IoTCDataSourceOptions, IoTCQuery } from './types';

type Props = QueryEditorProps<DataSource, IoTCQuery, IoTCDataSourceOptions>;

export class QueryEditor extends PureComponent<Props> {
  onQueryTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, queryText: event.target.value });
  };

  render() {
    const query = this.props.query || {};
    const { queryText } = query;

    return (
      <div className="gf-form--alt">
        <InlineFieldRow>
          <InlineField label="Query" grow tooltip="IoT Central query">
            <Input type="text" value={queryText || ''} onChange={this.onQueryTextChange} width={120} />
          </InlineField>
        </InlineFieldRow>
      </div>
    );
  }
}
