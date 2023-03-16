import { css } from '@emotion/css';
import React from 'react';

import {
  DataSourceJsonData,
  DataSourcePluginOptionsEditorProps,
  GrafanaTheme2,
  KeyValue,
  updateDatasourcePluginJsonDataOption,
} from '@grafana/data';
import { DataSourcePicker } from '@grafana/runtime';
import { Button, InlineField, InlineFieldRow, Input, useStyles2 } from '@grafana/ui';

import KeyValueInput from '../TraceToLogs/KeyValueInput';

export interface TraceToMetricsOptions {
  datasourceUid?: string;
  tags?: Array<KeyValue<string>>;
  queries: TraceToMetricQuery[];
  spanStartTimeShift?: string;
  spanEndTimeShift?: string;
}

export interface TraceToMetricQuery {
  name?: string;
  query?: string;
}

export interface TraceToMetricsData extends DataSourceJsonData {
  tracesToMetrics?: TraceToMetricsOptions;
}

interface Props extends DataSourcePluginOptionsEditorProps<TraceToMetricsData> {}

export function TraceToMetricsSettings({ options, onOptionsChange }: Props) {
  const styles = useStyles2(getStyles);

  return (
    <div className={css({ width: '100%' })}>
      <h3 className="page-heading">追踪到度量</h3>

      <div className={styles.infoText}>
      追踪到指标允许您从跟踪范围导航到选定的数据源。
      </div>

      <InlineFieldRow className={styles.row}>
        <InlineField tooltip="追踪要导航到的数据源" label="数据源" labelWidth={26}>
          <DataSourcePicker
            inputId="trace-to-metrics-data-source-picker"
            pluginId="prometheus"
            current={options.jsonData.tracesToMetrics?.datasourceUid}
            noDefault={true}
            width={40}
            onChange={(ds) =>
              updateDatasourcePluginJsonDataOption({ onOptionsChange, options }, 'tracesToMetrics', {
                ...options.jsonData.tracesToMetrics,
                datasourceUid: ds.uid,
              })
            }
          />
        </InlineField>
        {options.jsonData.tracesToMetrics?.datasourceUid ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            fill="text"
            onClick={() => {
              updateDatasourcePluginJsonDataOption({ onOptionsChange, options }, 'tracesToMetrics', {
                ...options.jsonData.tracesToMetrics,
                datasourceUid: undefined,
              });
            }}
          >
            Clear
          </Button>
        ) : null}
      </InlineFieldRow>

      <InlineFieldRow>
        <InlineField tooltip="将在指标查询中使用的标记。" label="标签" labelWidth={26}>
          <KeyValueInput
            keyPlaceholder="Tag"
            values={options.jsonData.tracesToMetrics?.tags ?? []}
            onChange={(v) =>
              updateDatasourcePluginJsonDataOption({ onOptionsChange, options }, 'tracesToMetrics', {
                ...options.jsonData.tracesToMetrics,
                tags: v,
              })
            }
          />
        </InlineField>
      </InlineFieldRow>

      <InlineFieldRow>
        <InlineField
          label="Span 开始时移位"
          labelWidth={26}
          grow
          tooltip="转换跨度的开始时间。默认0(这里可以使用时间单位，例如:5s, 1m, 3h)"
        >
          <Input
            type="text"
            placeholder="-1h"
            width={40}
            onChange={(v) =>
              updateDatasourcePluginJsonDataOption({ onOptionsChange, options }, 'tracesToMetrics', {
                ...options.jsonData.tracesToMetrics,
                spanStartTimeShift: v.currentTarget.value,
              })
            }
            value={options.jsonData.tracesToMetrics?.spanStartTimeShift || ''}
          />
        </InlineField>
      </InlineFieldRow>

      <InlineFieldRow>
        <InlineField
          label="Span 结束时移位"
          labelWidth={26}
          grow
          tooltip="移位跨度的结束时间。默认0时间单位可以在这里使用，例如:5s, 1m, 3h"
        >
          <Input
            type="text"
            placeholder="1h"
            width={40}
            onChange={(v) =>
              updateDatasourcePluginJsonDataOption({ onOptionsChange, options }, 'tracesToMetrics', {
                ...options.jsonData.tracesToMetrics,
                spanEndTimeShift: v.currentTarget.value,
              })
            }
            value={options.jsonData.tracesToMetrics?.spanEndTimeShift || ''}
          />
        </InlineField>
      </InlineFieldRow>

      {options.jsonData.tracesToMetrics?.queries?.map((query, i) => (
        <div key={i} className={styles.queryRow}>
          <InlineField label="链接标签" labelWidth={10}>
            <Input
              label="链接标签"
              type="text"
              allowFullScreen
              value={query.name}
              onChange={(e) => {
                let newQueries = options.jsonData.tracesToMetrics?.queries.slice() ?? [];
                newQueries[i].name = e.currentTarget.value;
                updateDatasourcePluginJsonDataOption({ onOptionsChange, options }, 'tracesToMetrics', {
                  ...options.jsonData.tracesToMetrics,
                  queries: newQueries,
                });
              }}
            />
          </InlineField>
          <InlineField
            label="查询"
            labelWidth={10}
            tooltip="Prometheus查询将在从跟踪导航到度量时运行。使用' $__tags '关键字插入标签。"
            grow
          >
            <Input
              label="查询"
              type="text"
              allowFullScreen
              value={query.query}
              onChange={(e) => {
                let newQueries = options.jsonData.tracesToMetrics?.queries.slice() ?? [];
                newQueries[i].query = e.currentTarget.value;
                updateDatasourcePluginJsonDataOption({ onOptionsChange, options }, 'tracesToMetrics', {
                  ...options.jsonData.tracesToMetrics,
                  queries: newQueries,
                });
              }}
            />
          </InlineField>

          <Button
            variant="destructive"
            title="删除查询"
            icon="times"
            type="button"
            onClick={() => {
              let newQueries = options.jsonData.tracesToMetrics?.queries.slice();
              newQueries?.splice(i, 1);
              updateDatasourcePluginJsonDataOption({ onOptionsChange, options }, 'tracesToMetrics', {
                ...options.jsonData.tracesToMetrics,
                queries: newQueries,
              });
            }}
          />
        </div>
      ))}

      <Button
        variant="secondary"
        title="添加查询"
        icon="plus"
        type="button"
        onClick={() => {
          updateDatasourcePluginJsonDataOption({ onOptionsChange, options }, 'tracesToMetrics', {
            ...options.jsonData.tracesToMetrics,
            queries: [...(options.jsonData.tracesToMetrics?.queries ?? []), { query: '' }],
          });
        }}
      >
        添加查询
      </Button>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  infoText: css`
    padding-bottom: ${theme.spacing(2)};
    color: ${theme.colors.text.secondary};
  `,
  row: css`
    label: row;
    align-items: baseline;
  `,
  queryRow: css`
    display: flex;
  `,
});
