import { css } from '@emotion/css';
import React, { useEffect, useState } from 'react';
import useAsync from 'react-use/lib/useAsync';

import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { Alert, InlineField, InlineFieldRow, useStyles2 } from '@grafana/ui';

import { AdHocFilter } from '../../../../features/variables/adhoc/picker/AdHocFilter';
import { AdHocVariableFilter } from '../../../../features/variables/types';
import { PrometheusDatasource } from '../../prometheus/datasource';
import { TempoQuery } from '../types';

import { getDS } from './utils';

export function ServiceGraphSection({
  graphDatasourceUid,
  query,
  onChange,
}: {
  graphDatasourceUid?: string;
  query: TempoQuery;
  onChange: (value: TempoQuery) => void;
}) {
  const styles = useStyles2(getStyles);

  const dsState = useAsync(() => getDS(graphDatasourceUid), [graphDatasourceUid]);

  // Check if service graph metrics are being collected. If not, displays a warning
  const [hasKeys, setHasKeys] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    async function fn(ds: PrometheusDatasource) {
      const keys = await ds.getTagKeys({
        series: [
          'traces_service_graph_request_server_seconds_sum',
          'traces_service_graph_request_total',
          'traces_service_graph_request_failed_total',
        ],
      });
      setHasKeys(Boolean(keys.length));
    }
    if (!dsState.loading && dsState.value) {
      fn(dsState.value as PrometheusDatasource);
    }
  }, [dsState]);

  if (dsState.loading) {
    return null;
  }

  const ds = dsState.value as PrometheusDatasource;

  if (!graphDatasourceUid) {
    return <div className="text-warning">请在数据源设置中设置服务图数据源。</div>;
  }

  if (graphDatasourceUid && !ds) {
    return (
      <div className="text-warning">
        已配置业务图数据源，但数据源已不存在。请配置现有数据源来使用服务图功能。
      </div>
    );
  }
  const filters = queryToFilter(query.serviceMapQuery || '');

  return (
    <div>
      <InlineFieldRow>
        <InlineField label="过滤器" labelWidth={14} grow>
          <AdHocFilter
            datasource={{ uid: graphDatasourceUid }}
            filters={filters}
            getTagKeysOptions={{
              series: config.featureToggles.tempoApmTable
                ? ['traces_service_graph_request_total', 'traces_spanmetrics_calls_total']
                : ['traces_service_graph_request_total'],
            }}
            addFilter={(filter: AdHocVariableFilter) => {
              onChange({
                ...query,
                serviceMapQuery: filtersToQuery([...filters, filter]),
              });
            }}
            removeFilter={(index: number) => {
              const newFilters = [...filters];
              newFilters.splice(index, 1);
              onChange({ ...query, serviceMapQuery: filtersToQuery(newFilters) });
            }}
            changeFilter={(index: number, filter: AdHocVariableFilter) => {
              const newFilters = [...filters];
              newFilters.splice(index, 1, filter);
              onChange({ ...query, serviceMapQuery: filtersToQuery(newFilters) });
            }}
          />
        </InlineField>
      </InlineFieldRow>
      {hasKeys === false ? (
        <Alert title="没有发现服务图数据" severity="info" className={styles.alert}>
          请确保服务图指标根据{' '}
          <a
            target="_blank"
            rel="noreferrer noopener"
            href="https://grafana.com/docs/tempo/next/grafana-agent/service-graphs/"
          >
            Tempo 文档
          </a>
          .
        </Alert>
      ) : null}
    </div>
  );
}

function queryToFilter(query: string): AdHocVariableFilter[] {
  let match;
  let filters: AdHocVariableFilter[] = [];
  const re = /([\w_]+)(=|!=|<|>|=~|!~)"(.*?)"/g;
  while ((match = re.exec(query)) !== null) {
    filters.push({
      key: match[1],
      operator: match[2],
      value: match[3],
      condition: '',
    });
  }
  return filters;
}

function filtersToQuery(filters: AdHocVariableFilter[]): string {
  return `{${filters.map((f) => `${f.key}${f.operator}"${f.value}"`).join(',')}}`;
}

const getStyles = (theme: GrafanaTheme2) => ({
  alert: css`
    max-width: 75ch;
    margin-top: ${theme.spacing(2)};
  `,
});
