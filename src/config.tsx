import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { IoTCDataSourceOptions } from './types';

const { SecretFormField, FormField } = LegacyForms;

interface Props extends DataSourcePluginOptionsEditorProps<IoTCDataSourceOptions> {}

interface State {}

export class ConfigEditor extends PureComponent<Props, State> {
  onUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      appUrl: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  onTokenChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      apiToken: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  onResetToken = () => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      apiToken: undefined,
    };
    onOptionsChange({ ...options, jsonData });
  };

  render() {
    const { options } = this.props;
    const { jsonData } = options;

    return (
      <div className="gf-form-group">
        <div className="gf-form">
          <FormField
            label="Application URL"
            labelWidth={12}
            inputWidth={20}
            onChange={this.onUrlChange}
            value={jsonData.appUrl || ''}
            placeholder="IoT Central application URL"
          />
        </div>

        <div className="gf-form-inline">
          <div className="gf-form">
            <SecretFormField
              isConfigured={false}
              value={jsonData.apiToken || ''}
              label="API token"
              placeholder="IoT Central API token"
              labelWidth={12}
              inputWidth={20}
              onReset={this.onResetToken}
              onChange={this.onTokenChange}
            />
          </div>
        </div>
      </div>
    );
  }
}
