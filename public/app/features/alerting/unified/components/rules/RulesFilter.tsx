import { css, cx } from '@emotion/css';
import { debounce } from 'lodash';
import React, { FormEvent, useState } from 'react';

import { DataSourceInstanceSettings, GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Stack } from '@grafana/experimental';
import { DataSourcePicker, logInfo } from '@grafana/runtime';
import { Button, Field, Icon, Input, Label, RadioButtonGroup, Tooltip, useStyles2 } from '@grafana/ui';
import { useQueryParams } from 'app/core/hooks/useQueryParams';
import { PromAlertingRuleState, PromRuleType } from 'app/types/unified-alerting-dto';

import { LogMessages } from '../../Analytics';
import { getFiltersFromUrlParams } from '../../utils/misc';
import { alertStateToReadable } from '../../utils/rules';

const ViewOptions: SelectableValue[] = [
  {
    icon: 'folder',
    label: '分组',
    value: 'grouped',
  },
  {
    icon: 'list-ul',
    label: '列表',
    value: 'list',
  },
  {
    icon: 'heart-rate',
    label: '状态',
    value: 'state',
  },
];

const RuleTypeOptions: SelectableValue[] = [
  {
    label: '警报',
    value: PromRuleType.Alerting,
  },
  {
    label: '记录',
    value: PromRuleType.Recording,
  },
];

const RulesFilter = () => {
  const [queryParams, setQueryParams] = useQueryParams();
  // This key is used to force a rerender on the inputs when the filters are cleared
  const [filterKey, setFilterKey] = useState<number>(Math.floor(Math.random() * 100));
  const dataSourceKey = `dataSource-${filterKey}`;
  const queryStringKey = `queryString-${filterKey}`;

  const { dataSource, alertState, queryString, ruleType } = getFiltersFromUrlParams(queryParams);

  const styles = useStyles2(getStyles);
  const stateOptions = Object.entries(PromAlertingRuleState).map(([key, value]) => ({
    label: alertStateToReadable(value),
    value,
  }));

  const handleDataSourceChange = (dataSourceValue: DataSourceInstanceSettings) => {
    setQueryParams({ dataSource: dataSourceValue.name });
  };

  const clearDataSource = () => {
    setQueryParams({ dataSource: null });
  };

  const handleQueryStringChange = debounce((e: FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    setQueryParams({ queryString: target.value || null });
  }, 600);

  const handleAlertStateChange = (value: string) => {
    logInfo(LogMessages.clickingAlertStateFilters);
    setQueryParams({ alertState: value });
  };

  const handleViewChange = (view: string) => {
    setQueryParams({ view });
  };

  const handleRuleTypeChange = (ruleType: PromRuleType) => {
    setQueryParams({ ruleType });
  };

  const handleClearFiltersClick = () => {
    setQueryParams({
      alertState: null,
      queryString: null,
      dataSource: null,
      ruleType: null,
    });
    setTimeout(() => setFilterKey(filterKey + 1), 100);
  };

  const searchIcon = <Icon name={'search'} />;
  return (
    <div className={styles.container}>
      <Field className={styles.inputWidth} label="按数据源搜索">
        <DataSourcePicker
          key={dataSourceKey}
          alerting
          noDefault
          placeholder="所有数据源"
          current={dataSource}
          onChange={handleDataSourceChange}
          onClear={clearDataSource}
        />
      </Field>
      <div className={cx(styles.flexRow, styles.spaceBetween)}>
        <div className={styles.flexRow}>
          <Field
            className={styles.rowChild}
            label={
              <Label>
                <Stack gap={0.5}>
                  <span>按标签搜索</span>
                  <Tooltip
                    content={
                      <div>
                        使用标签查询过滤规则和警报，例如:
                        <code>{`{severity="critical", instance=~"cluster-us-.+"}`}</code>
                      </div>
                    }
                  >
                    <Icon name="info-circle" size="sm" />
                  </Tooltip>
                </Stack>
              </Label>
            }
          >
            <Input
              key={queryStringKey}
              className={styles.inputWidth}
              prefix={searchIcon}
              onChange={handleQueryStringChange}
              defaultValue={queryString}
              placeholder="搜索"
              data-testid="search-query-input"
            />
          </Field>
          <div className={styles.rowChild}>
            <Label>状态</Label>
            <RadioButtonGroup options={stateOptions} value={alertState} onChange={handleAlertStateChange} />
          </div>
          <div className={styles.rowChild}>
            <Label>规则类型</Label>
            <RadioButtonGroup
              options={RuleTypeOptions}
              value={ruleType as PromRuleType}
              onChange={handleRuleTypeChange}
            />
          </div>
          <div className={styles.rowChild}>
            <Label>视图</Label>
            <RadioButtonGroup
              options={ViewOptions}
              value={String(queryParams['view'] ?? ViewOptions[0].value)}
              onChange={handleViewChange}
            />
          </div>
        </div>
        {(dataSource || alertState || queryString || ruleType) && (
          <div className={styles.flexRow}>
            <Button
              className={styles.clearButton}
              fullWidth={false}
              icon="times"
              variant="secondary"
              onClick={handleClearFiltersClick}
            >
              
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css`
      display: flex;
      flex-direction: column;
      padding-bottom: ${theme.spacing(1)};
      margin-bottom: ${theme.spacing(1)};
    `,
    inputWidth: css`
      width: 340px;
      flex-grow: 0;
    `,
    flexRow: css`
      display: flex;
      flex-direction: row;
      align-items: flex-end;
      width: 100%;
      flex-wrap: wrap;
    `,
    spaceBetween: css`
      justify-content: space-between;
    `,
    rowChild: css`
      margin: ${theme.spacing(0, 1, 0, 0)};
    `,
    clearButton: css`
      margin-top: ${theme.spacing(1)};
    `,
  };
};

export default RulesFilter;
