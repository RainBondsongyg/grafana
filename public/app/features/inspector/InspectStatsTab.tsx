import React from 'react';

import { PanelData, QueryResultMetaStat, TimeZone } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { t } from 'app/core/internationalization';

import { InspectStatsTable } from './InspectStatsTable';

interface InspectStatsTabProps {
  data: PanelData;
  timeZone: TimeZone;
}

export const InspectStatsTab: React.FC<InspectStatsTabProps> = ({ data, timeZone }) => {
  if (!data.request) {
    return null;
  }

  let stats: QueryResultMetaStat[] = [];

  const requestTime = data.request.endTime ? data.request.endTime - data.request.startTime : -1;
  const processingTime = data.timings?.dataProcessingTime || -1;
  let dataRows = 0;

  for (const frame of data.series) {
    dataRows += frame.length;
  }

  if (requestTime > 0) {
    stats.push({
      displayName: t('dashboard.inspect-stats.request-time', '总请求时间'),
      value: requestTime,
      unit: 'ms',
    });
  }
  if (processingTime > 0) {
    stats.push({
      displayName: t('dashboard.inspect-stats.processing-time', '数据处理时间'),
      value: processingTime,
      unit: 'ms',
    });
  }
  stats.push({
    displayName: t('dashboard.inspect-stats.queries', '查询数量'),
    value: data.request.targets.length,
  });
  stats.push({
    displayName: t('dashboard.inspect-stats.rows', '总行数'),
    value: dataRows,
  });

  let dataStats: QueryResultMetaStat[] = [];

  for (const series of data.series) {
    if (series.meta && series.meta.stats) {
      dataStats = dataStats.concat(series.meta.stats);
    }
  }

  const statsTableName = t('dashboard.inspect-stats.table-title', '统计数据');
  const dataStatsTableName = t('dashboard.inspect-stats.data-title', '数据源统计');

  return (
    <div aria-label={selectors.components.PanelInspector.Stats.content}>
      <InspectStatsTable timeZone={timeZone} name={statsTableName} stats={stats} />
      <InspectStatsTable timeZone={timeZone} name={dataStatsTableName} stats={dataStats} />
    </div>
  );
};
