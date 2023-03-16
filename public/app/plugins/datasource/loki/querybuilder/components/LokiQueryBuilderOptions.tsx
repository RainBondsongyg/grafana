import React from 'react';

import { CoreApp, SelectableValue } from '@grafana/data';
import { EditorField, EditorRow } from '@grafana/experimental';
import { reportInteraction } from '@grafana/runtime';
import { RadioButtonGroup, Select, AutoSizeInput } from '@grafana/ui';
import { QueryOptionGroup } from 'app/plugins/datasource/prometheus/querybuilder/shared/QueryOptionGroup';

import { preprocessMaxLines, queryTypeOptions, RESOLUTION_OPTIONS } from '../../components/LokiOptionFields';
import { isLogsQuery } from '../../queryUtils';
import { LokiQuery, LokiQueryType } from '../../types';

export interface Props {
  query: LokiQuery;
  onChange: (update: LokiQuery) => void;
  onRunQuery: () => void;
  app?: CoreApp;
}

export const LokiQueryBuilderOptions = React.memo<Props>(({ app, query, onChange, onRunQuery }) => {
  const onQueryTypeChange = (value: LokiQueryType) => {
    onChange({ ...query, queryType: value });
    onRunQuery();
  };

  const onResolutionChange = (option: SelectableValue<number>) => {
    reportInteraction('grafana_loki_resolution_clicked', {
      app,
      resolution: option.value,
    });
    onChange({ ...query, resolution: option.value });
    onRunQuery();
  };

  const onLegendFormatChanged = (evt: React.FormEvent<HTMLInputElement>) => {
    onChange({ ...query, legendFormat: evt.currentTarget.value });
    onRunQuery();
  };

  function onMaxLinesChange(e: React.SyntheticEvent<HTMLInputElement>) {
    const newMaxLines = preprocessMaxLines(e.currentTarget.value);
    if (query.maxLines !== newMaxLines) {
      onChange({ ...query, maxLines: newMaxLines });
      onRunQuery();
    }
  }

  let queryType = query.queryType ?? (query.instant ? LokiQueryType.Instant : LokiQueryType.Range);
  let showMaxLines = isLogsQuery(query.expr);

  return (
    <EditorRow>
      <QueryOptionGroup title="选项" collapsedInfo={getCollapsedInfo(query, queryType, showMaxLines)}>
        <EditorField
          label="Legend"
          tooltip="系列名称重写或模板。{{hostname}}将被hostname的标签值替换。"
        >
          <AutoSizeInput
            placeholder="{{label}}"
            id="loki-query-editor-legend-format"
            type="string"
            minWidth={14}
            defaultValue={query.legendFormat}
            onCommitChange={onLegendFormatChanged}
          />
        </EditorField>
        <EditorField label="类型">
          <RadioButtonGroup options={queryTypeOptions} value={queryType} onChange={onQueryTypeChange} />
        </EditorField>
        {showMaxLines && (
          <EditorField label="行限制" tooltip="查询返回的日志行数的上限。">
            <AutoSizeInput
              className="width-4"
              placeholder="auto"
              type="number"
              min={0}
              defaultValue={query.maxLines?.toString() ?? ''}
              onCommitChange={onMaxLinesChange}
            />
          </EditorField>
        )}
        <EditorField label="决议">
          <Select
            isSearchable={false}
            onChange={onResolutionChange}
            options={RESOLUTION_OPTIONS}
            value={query.resolution || 1}
            aria-label="Select resolution"
          />
        </EditorField>
      </QueryOptionGroup>
    </EditorRow>
  );
});

function getCollapsedInfo(query: LokiQuery, queryType: LokiQueryType, showMaxLines: boolean): string[] {
  const queryTypeLabel = queryTypeOptions.find((x) => x.value === queryType);
  const resolutionLabel = RESOLUTION_OPTIONS.find((x) => x.value === (query.resolution ?? 1));

  const items: string[] = [];

  if (query.legendFormat) {
    items.push(`Legend: ${query.legendFormat}`);
  }

  if (query.resolution) {
    items.push(`决议: ${resolutionLabel?.label}`);
  }

  items.push(`类型: ${queryTypeLabel?.label}`);

  if (showMaxLines && query.maxLines) {
    items.push(`行限制: ${query.maxLines}`);
  }

  return items;
}

LokiQueryBuilderOptions.displayName = 'LokiQueryBuilderOptions';
