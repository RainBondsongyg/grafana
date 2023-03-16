export interface TemplateDataItem {
  name: string;
  type: 'string' | '[]Alert' | 'KeyValue' | 'time.Time';
  notes: string;
}

interface TemplateFunctionItem {
  name: string;
  args?: '[]string';
  returns: 'KeyValue' | '[]string';
  notes?: string;
}

export const GlobalTemplateData: TemplateDataItem[] = [
  {
    name: 'Receiver',
    type: 'string',
    notes: '通知要发送到的联络点的名称。',
  },
  {
    name: 'Status',
    type: 'string',
    notes: '如果至少有一个警报正在启动则启动，否则已解决',
  },
  {
    name: 'Alerts',
    type: '[]Alert',
    notes: '此通知中包含的警报对象的列表。',
  },
  {
    name: 'Alerts.Firing',
    type: '[]Alert',
    notes: '火警警报列表',
  },
  {
    name: 'Alerts.Resolved',
    type: '[]Alert',
    notes: '已解决的警报列表',
  },
  {
    name: 'GroupLabels',
    type: 'KeyValue',
    notes: '这些警报是根据标签分组的。',
  },
  {
    name: 'CommonLabels',
    type: 'KeyValue',
    notes: '此通知中包含的所有警报的通用标签。',
  },
  {
    name: 'CommonAnnotations',
    type: 'KeyValue',
    notes: '此通知中包含的所有警报的通用注释。',
  },
  {
    name: 'ExternalURL',
    type: 'string',
    notes: '返回到发送通知的Grafana的链接。',
  },
];

export const AlertTemplateData: TemplateDataItem[] = [
  {
    name: 'Status',
    type: 'string',
    notes: '发射或解决。',
  },
  {
    name: 'Labels',
    type: 'KeyValue',
    notes: '附加到警报的标签集。',
  },
  {
    name: 'Annotations',
    type: 'KeyValue',
    notes: '附加到警报的一组注释。',
  },
  {
    name: 'Values',
    type: 'KeyValue',
    notes:
      '所有即时查询的值、reduce和数学表达式以及警报的经典条件。不包含时间序列数据。',
  },
  {
    name: 'StartsAt',
    type: 'time.Time',
    notes: '警报开始发射的时间。',
  },
  {
    name: 'EndsAt',
    type: 'time.Time',
    notes:
      '仅在知道警报结束时间时设置。否则，将设置为自上次接收警报以来的可配置超时时间。',
  },
  {
    name: 'GeneratorURL',
    type: 'string',
    notes: '到 Grafana 或外部 Alertmanager 的反向链接',
  },
  {
    name: 'SilenceURL',
    type: 'string',
    notes: '链接到Grafana silence for，其中预先填充了此警报的标签。只有Grafana管理警报',
  },
  {
    name: 'DashboardURL',
    type: 'string',
    notes: '链接到Grafana仪表板，如果警报规则属于其中一个。只有Grafana管理警报。',
  },
  {
    name: 'PanelURL',
    type: 'string',
    notes: '链接到Grafana仪表板面板，如果警报规则属于其中一个。只有Grafana管理警报。',
  },
  {
    name: 'Fingerprint',
    type: 'string',
    notes: '可用于识别警报的指纹。',
  },
  {
    name: 'ValueString',
    type: 'string',
    notes: '字符串，它包含警报中每个简化表达式的标签和值。',
  },
];

export const KeyValueTemplateFunctions: TemplateFunctionItem[] = [
  {
    name: 'SortedPairs',
    returns: 'KeyValue',
    notes: '返回键值字符串对的排序列表',
  },
  {
    name: 'Remove',
    args: '[]string',
    returns: 'KeyValue',
    notes: '返回不包含给定键的Key/Value映射的副本。',
  },
  {
    name: 'Names',
    returns: '[]string',
    notes: '标签名称列表',
  },
  {
    name: 'Values',
    returns: '[]string',
    notes: '标签值列表',
  },
];

export const KeyValueCodeSnippet = `{
  "summary": "alert summary",
  "description": "警报描述"
}
`;
