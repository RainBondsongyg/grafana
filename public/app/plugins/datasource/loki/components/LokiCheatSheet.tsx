import { shuffle } from 'lodash';
import React, { PureComponent } from 'react';

import { QueryEditorHelpProps } from '@grafana/data';
import { reportInteraction } from '@grafana/runtime';

import LokiLanguageProvider from '../LanguageProvider';
import { LokiQuery } from '../types';

const DEFAULT_EXAMPLES = ['{job="default/prometheus"}'];
const PREFERRED_LABELS = ['job', 'app', 'k8s_app'];
const EXAMPLES_LIMIT = 5;

const LOGQL_EXAMPLES = [
  {
    title: '日志流水线',
    expression: '{job="mysql"} |= "metrics" | logfmt | duration > 10s',
    label:
      '这个查询以MySQL作业为目标，保存包含子字符串“metrics”的日志，然后进一步解析和过滤日志。',
  },
  {
    title: '随着时间计数',
    expression: 'count_over_time({job="mysql"}[5m])',
    label: '该查询将统计MySQL作业在最近5分钟内的所有日志行。',
  },
  {
    title: '率',
    expression: 'rate(({job="mysql"} |= "error" != "timeout")[10s])',
    label:
      '此查询获取MySQL作业在最近10秒内所有非超时错误的每秒发生率。',
  },
  {
    title: '聚合、计数和分组',
    expression: 'sum(count_over_time({job="mysql"}[5m])) by (level)',
    label: '获取最近五分钟内的日志计数，按级别分组。',
  },
];

export default class LokiCheatSheet extends PureComponent<QueryEditorHelpProps<LokiQuery>, { userExamples: string[] }> {
  declare userLabelTimer: ReturnType<typeof setTimeout>;
  state = {
    userExamples: [],
  };

  componentDidMount() {
    this.scheduleUserLabelChecking();
    reportInteraction('grafana_loki_cheatsheet_opened', {});
  }

  componentWillUnmount() {
    clearTimeout(this.userLabelTimer);
  }

  scheduleUserLabelChecking() {
    this.userLabelTimer = setTimeout(this.checkUserLabels, 1000);
  }

  checkUserLabels = async () => {
    // Set example from user labels
    const provider: LokiLanguageProvider = this.props.datasource?.languageProvider;
    if (provider.started) {
      const labels = provider.getLabelKeys() || [];
      const preferredLabel = PREFERRED_LABELS.find((l) => labels.includes(l));
      if (preferredLabel) {
        const values = await provider.getLabelValues(preferredLabel);
        const userExamples = shuffle(values)
          .slice(0, EXAMPLES_LIMIT)
          .map((value) => `{${preferredLabel}="${value}"}`);
        this.setState({ userExamples });
      }
    } else {
      this.scheduleUserLabelChecking();
    }
  };

  renderExpression(expr: string) {
    const { onClickExample } = this.props;
    const onClick = (query: LokiQuery) => {
      onClickExample(query);
      reportInteraction('grafana_loki_cheatsheet_example_clicked', {});
    };

    return (
      <div className="cheat-sheet-item__example" key={expr} onClick={(e) => onClick({ refId: 'A', expr })}>
        <code>{expr}</code>
      </div>
    );
  }

  render() {
    const { userExamples } = this.state;
    const hasUserExamples = userExamples.length > 0;

    return (
      <div>
        <h2>Loki 备忘单</h2>
        <div className="cheat-sheet-item">
          <div className="cheat-sheet-item__title">查看日志</div>
          <div className="cheat-sheet-item__label">
          首先从Label浏览器中选择一个日志流，或者您也可以编写一个流选择器
          进入查询字段。
          </div>
          {hasUserExamples ? (
            <div>
              <div className="cheat-sheet-item__label">Here are some example streams from your logs:</div>
              {userExamples.map((example) => this.renderExpression(example))}
            </div>
          ) : (
            <div>
              <div className="cheat-sheet-item__label">Here is an example of a log stream:</div>
              {this.renderExpression(DEFAULT_EXAMPLES[0])}
            </div>
          )}
        </div>
        <div className="cheat-sheet-item">
          <div className="cheat-sheet-item__title">组合流选择器</div>
          {this.renderExpression('{app="cassandra",namespace="prod"}')}
          <div className="cheat-sheet-item__label">从具有两个标签的流中返回所有日志行。</div>
        </div>

        <div className="cheat-sheet-item">
          <div className="cheat-sheet-item__title">过滤搜索词</div>
          {this.renderExpression('{app="cassandra"} |~ "(duration|latency)s*(=|is|of)s*[d.]+"')}
          {this.renderExpression('{app="cassandra"} |= "exact match"')}
          {this.renderExpression('{app="cassandra"} != "do not match"')}
          <div className="cheat-sheet-item__label">
            <a href="https://grafana.com/docs/loki/latest/logql/#log-pipeline" target="logql">
              LogQL
            </a>{' '}
            支持精确和正则表达式筛选器。
          </div>
        </div>
        {LOGQL_EXAMPLES.map((item) => (
          <div className="cheat-sheet-item" key={item.expression}>
            <div className="cheat-sheet-item__title">{item.title}</div>
            {this.renderExpression(item.expression)}
            <div className="cheat-sheet-item__label">{item.label}</div>
          </div>
        ))}
      </div>
    );
  }
}
