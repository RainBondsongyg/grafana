import { css } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { useStyles2, Select, Button, Field, InlineField, InlineSwitch, Alert } from '@grafana/ui';
import { notifyApp } from 'app/core/actions';
import appEvents from 'app/core/app_events';
import { createSuccessNotification } from 'app/core/copy/appNotification';
import { MAX_HISTORY_ITEMS } from 'app/core/history/RichHistoryLocalStorage';
import { dispatch } from 'app/store/store';

import { supportedFeatures } from '../../../core/history/richHistoryStorageProvider';
import { ShowConfirmModalEvent } from '../../../types/events';

export interface RichHistorySettingsProps {
  retentionPeriod: number;
  starredTabAsFirstTab: boolean;
  activeDatasourceOnly: boolean;
  onChangeRetentionPeriod: (option: SelectableValue<number>) => void;
  toggleStarredTabAsFirstTab: () => void;
  toggleactiveDatasourceOnly: () => void;
  deleteRichHistory: () => void;
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css`
      font-size: ${theme.typography.bodySmall.fontSize};
    `,
    spaceBetween: css`
      margin-bottom: ${theme.spacing(3)};
    `,
    input: css`
      max-width: 200px;
    `,
    bold: css`
      font-weight: ${theme.typography.fontWeightBold};
    `,
    bottomMargin: css`
      margin-bottom: ${theme.spacing(1)};
    `,
  };
};

const retentionPeriodOptions = [
  { value: 2, label: '2 天' },
  { value: 5, label: '5 天' },
  { value: 7, label: '1 周' },
  { value: 14, label: '2 周' },
];

export function RichHistorySettingsTab(props: RichHistorySettingsProps) {
  const {
    retentionPeriod,
    starredTabAsFirstTab,
    activeDatasourceOnly,
    onChangeRetentionPeriod,
    toggleStarredTabAsFirstTab,
    toggleactiveDatasourceOnly,
    deleteRichHistory,
  } = props;
  const styles = useStyles2(getStyles);
  const selectedOption = retentionPeriodOptions.find((v) => v.value === retentionPeriod);

  const onDelete = () => {
    appEvents.publish(
      new ShowConfirmModalEvent({
        title: '删除',
        text: '确定要永久删除查询历史记录吗?',
        yesText: '删除',
        icon: 'trash-alt',
        onConfirm: () => {
          deleteRichHistory();
          dispatch(notifyApp(createSuccessNotification('删除历史查询')));
        },
      })
    );
  };

  return (
    <div className={styles.container}>
      {supportedFeatures().changeRetention ? (
        <Field
          label="历史时间跨度"
          description={`选择Grafana将保存查询历史记录的时间段。 最多${MAX_HISTORY_ITEMS}项将被存储`}
        >
          <div className={styles.input}>
            <Select value={selectedOption} options={retentionPeriodOptions} onChange={onChangeRetentionPeriod}></Select>
          </div>
        </Field>
      ) : (
        <Alert severity="info" title="历史时间跨度">
          Grafana将保留参赛作品 {selectedOption?.label}.
        </Alert>
      )}
      <InlineField
        label="将默认的活动选项卡从“查询历史”更改为“带星”"
        className={styles.spaceBetween}
      >
        <InlineSwitch
          id="explore-query-history-settings-default-active-tab"
          value={starredTabAsFirstTab}
          onChange={toggleStarredTabAsFirstTab}
        />
      </InlineField>
      {supportedFeatures().onlyActiveDataSource && (
        <InlineField
          label="仅显示当前在Explore中活动的数据源的查询"
          className={styles.spaceBetween}
        >
          <InlineSwitch
            id="explore-query-history-settings-data-source-behavior"
            value={activeDatasourceOnly}
            onChange={toggleactiveDatasourceOnly}
          />
        </InlineField>
      )}
      {supportedFeatures().clearHistory && (
        <div>
          <div className={styles.bold}>清楚查询历史</div>
          <div className={styles.bottomMargin}>永久删除所有查询历史记录。</div>
          <Button variant="destructive" onClick={onDelete}>
            清楚查询历史
          </Button>
        </div>
      )}
    </div>
  );
}
