import { css } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Stack } from '@grafana/experimental';
import { useStyles2 } from '@grafana/ui';

import { HoverCard } from '../HoverCard';

import {
  AlertTemplateData,
  GlobalTemplateData,
  KeyValueCodeSnippet,
  KeyValueTemplateFunctions,
  TemplateDataItem,
} from './TemplateData';

export function TemplateDataDocs() {
  const styles = useStyles2(getTemplateDataDocsStyles);

  const AlertTemplateDataTable = (
    <TemplateDataTable
      caption={
        <h4 className={styles.header}>
          Alert模板数据<span>仅在Alert上下文中可用(例如在.Alerts循环中) </span>
        </h4>
      }
      dataItems={AlertTemplateData}
    />
  );

  return (
    <Stack gap={2} flexGrow={1}>
      <TemplateDataTable
        caption={<h4 className={styles.header}>模板数据</h4>}
        dataItems={GlobalTemplateData}
        typeRenderer={(type) =>
          type === '[]Alert' ? (
            <HoverCard content={AlertTemplateDataTable}>
              <div className={styles.interactiveType}>{type}</div>
            </HoverCard>
          ) : type === 'KeyValue' ? (
            <HoverCard content={<KeyValueTemplateDataTable />}>
              <div className={styles.interactiveType}>{type}</div>
            </HoverCard>
          ) : (
            type
          )
        }
      />
    </Stack>
  );
}

const getTemplateDataDocsStyles = (theme: GrafanaTheme2) => ({
  header: css`
    color: ${theme.colors.text.primary};

    span {
      color: ${theme.colors.text.secondary};
      font-size: ${theme.typography.bodySmall.fontSize};
    }
  `,
  interactiveType: css`
    color: ${theme.colors.text.link};
  `,
});

interface TemplateDataTableProps {
  dataItems: TemplateDataItem[];
  caption: JSX.Element | string;
  typeRenderer?: (type: TemplateDataItem['type']) => React.ReactNode;
}

function TemplateDataTable({ dataItems, caption, typeRenderer }: TemplateDataTableProps) {
  const styles = useStyles2(getTemplateDataTableStyles);

  return (
    <table className={styles.table}>
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th>名称</th>
          <th>类型</th>
          <th>笔记</th>
        </tr>
      </thead>
      <tbody>
        {dataItems.map(({ name, type, notes }, index) => (
          <tr key={index}>
            <td>{name}</td>
            <td>{typeRenderer ? typeRenderer(type) : type}</td>
            <td>{notes}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function KeyValueTemplateDataTable() {
  const tableStyles = useStyles2(getTemplateDataTableStyles);

  return (
    <div>
      KeyValue是一组表示标签和注释的键/值字符串对。
      <pre>
        <code>{KeyValueCodeSnippet}</code>
      </pre>
      <table className={tableStyles.table}>
        <caption>键-值的方法</caption>
        <thead>
          <tr>
            <th>名称</th>
            <th>参数</th>
            <th>返回</th>
            <th>笔记</th>
          </tr>
        </thead>
        <tbody>
          {KeyValueTemplateFunctions.map(({ name, args, returns, notes }) => (
            <tr key={name}>
              <td>{name}</td>
              <td>{args}</td>
              <td>{returns}</td>
              <td>{notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const getTemplateDataTableStyles = (theme: GrafanaTheme2) => ({
  table: css`
    border-collapse: collapse;
    width: 100%;

    caption {
      caption-side: top;
    }

    td,
    th {
      padding: ${theme.spacing(1, 1)};
    }

    thead {
      font-weight: ${theme.typography.fontWeightBold};
    }

    tbody tr:nth-child(2n + 1) {
      background-color: ${theme.colors.background.secondary};
    }

    tbody td:nth-child(1) {
      font-weight: ${theme.typography.fontWeightBold};
    }

    tbody td:nth-child(2) {
      font-style: italic;
    }
  `,
});
