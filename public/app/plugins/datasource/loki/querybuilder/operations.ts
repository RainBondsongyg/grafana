import {
  createAggregationOperation,
  createAggregationOperationWithParam,
} from '../../prometheus/querybuilder/shared/operationUtils';
import { QueryBuilderOperationDef } from '../../prometheus/querybuilder/shared/types';

import { binaryScalarOperations } from './binaryScalarOperations';
import { UnwrapParamEditor } from './components/UnwrapParamEditor';
import {
  addLokiOperation,
  addNestedQueryHandler,
  createRangeOperation,
  createRangeOperationWithGrouping,
  getLineFilterRenderer,
  labelFilterRenderer,
  pipelineRenderer,
} from './operationUtils';
import { LokiOperationId, LokiOperationOrder, LokiVisualQueryOperationCategory } from './types';

export function getOperationDefinitions(): QueryBuilderOperationDef[] {
  const aggregations = [
    LokiOperationId.Sum,
    LokiOperationId.Min,
    LokiOperationId.Max,
    LokiOperationId.Avg,
    LokiOperationId.Stddev,
    LokiOperationId.Stdvar,
    LokiOperationId.Count,
  ].flatMap((opId) =>
    createAggregationOperation(opId, {
      addOperationHandler: addLokiOperation,
      orderRank: LokiOperationOrder.Last,
    })
  );

  const aggregationsWithParam = [LokiOperationId.TopK, LokiOperationId.BottomK].flatMap((opId) => {
    return createAggregationOperationWithParam(
      opId,
      {
        params: [{ name: 'K-value', type: 'number' }],
        defaultParams: [5],
      },
      {
        addOperationHandler: addLokiOperation,
        orderRank: LokiOperationOrder.Last,
      }
    );
  });

  const rangeOperations = [
    createRangeOperation(LokiOperationId.Rate),
    createRangeOperation(LokiOperationId.RateCounter),
    createRangeOperation(LokiOperationId.CountOverTime),
    createRangeOperation(LokiOperationId.SumOverTime),
    createRangeOperation(LokiOperationId.BytesRate),
    createRangeOperation(LokiOperationId.BytesOverTime),
    createRangeOperation(LokiOperationId.AbsentOverTime),
  ];

  const rangeOperationsWithGrouping = [
    ...createRangeOperationWithGrouping(LokiOperationId.AvgOverTime),
    ...createRangeOperationWithGrouping(LokiOperationId.MaxOverTime),
    ...createRangeOperationWithGrouping(LokiOperationId.MinOverTime),
    ...createRangeOperationWithGrouping(LokiOperationId.FirstOverTime),
    ...createRangeOperationWithGrouping(LokiOperationId.LastOverTime),
    ...createRangeOperationWithGrouping(LokiOperationId.StdvarOverTime),
    ...createRangeOperationWithGrouping(LokiOperationId.StddevOverTime),
    ...createRangeOperationWithGrouping(LokiOperationId.QuantileOverTime),
  ];

  const list: QueryBuilderOperationDef[] = [
    ...aggregations,
    ...aggregationsWithParam,
    ...rangeOperations,
    ...rangeOperationsWithGrouping,
    {
      id: LokiOperationId.Json,
      name: 'Json',
      params: [
        {
          name: 'Expression',
          type: 'string',
          restParam: true,
          optional: true,
          minWidth: 18,
          placeholder: 'server="servers[0]"',
          description:
            'Using expressions with your json parser will extract only the specified json fields to labels. You can specify one or more expressions in this way. All expressions must be quoted.',
        },
      ],
      defaultParams: [],
      alternativesKey: 'format',
      category: LokiVisualQueryOperationCategory.Formats,
      orderRank: LokiOperationOrder.LineFormats,
      renderer: (model, def, innerExpr) => `${innerExpr} | json ${model.params.join(', ')}`.trim(),
      addOperationHandler: addLokiOperation,
      explainHandler: () =>
        `这将从[json](https://grafana.com/docs/loki/latest/logql/log_queries/#json)格式的日志行中提取键和值作为标签。提取的标签可用于标签筛选器表达式，并通过展开操作用作范围聚合的值。`,
    },
    {
      id: LokiOperationId.Logfmt,
      name: '日志格式',
      params: [],
      defaultParams: [],
      alternativesKey: 'format',
      category: LokiVisualQueryOperationCategory.Formats,
      orderRank: LokiOperationOrder.LineFormats,
      renderer: pipelineRenderer,
      addOperationHandler: addLokiOperation,
      explainHandler: () =>
        `这将从[logfmt](https://grafana.com/docs/loki/latest/logql/log_queries/#logfmt)格式的日志行中提取所有键和值作为标签。提取的标签可用于标签筛选器表达式，并通过展开操作用作范围聚合的值。`,
    },
    {
      id: LokiOperationId.Regexp,
      name: '正则表达式',
      params: [
        {
          name: 'String',
          type: 'string',
          hideName: true,
          placeholder: '<re>',
          description: 'The regexp expression that matches the structure of a log line.',
          minWidth: 20,
        },
      ],
      defaultParams: [''],
      alternativesKey: 'format',
      category: LokiVisualQueryOperationCategory.Formats,
      orderRank: LokiOperationOrder.LineFormats,
      renderer: (model, def, innerExpr) => `${innerExpr} | regexp \`${model.params[0]}\``,
      addOperationHandler: addLokiOperation,
      explainHandler: () =>
        `[regexp解析器](https://grafana.com/docs/loki/latest/logql/log_queries/#regular-expression)接受一个参数| regexp "<re>"，这是使用Golang RE2语法的正则表达式。正则表达式必须包含至少一个命名子匹配(例如(?P<name>re))，每个子匹配将提取一个不同的标签。表达式匹配日志行的结构。提取的标签可用于标签筛选器表达式，并通过展开操作用作范围聚合的值。`,
    },
    {
      id: LokiOperationId.Pattern,
      name: '模式',
      params: [
        {
          name: 'String',
          type: 'string',
          hideName: true,
          placeholder: '<pattern-expression>',
          description: 'The expression that matches the structure of a log line.',
          minWidth: 20,
        },
      ],
      defaultParams: [''],
      alternativesKey: 'format',
      category: LokiVisualQueryOperationCategory.Formats,
      orderRank: LokiOperationOrder.LineFormats,
      renderer: (model, def, innerExpr) => `${innerExpr} | pattern \`${model.params[0]}\``,
      addOperationHandler: addLokiOperation,
      explainHandler: () =>
        `[模式解析器](https://grafana.com/docs/loki/latest/logql/log_queries/#pattern)允许通过定义一个模式表达式(| pattern \ ' <pattern-expression>\ ')显式地从日志行中提取字段。表达式匹配日志行的结构。提取的标签可用于标签筛选器表达式，并通过展开操作用作范围聚合的值。`,
    },
    {
      id: LokiOperationId.Unpack,
      name: '解压缩',
      params: [],
      defaultParams: [],
      alternativesKey: 'format',
      category: LokiVisualQueryOperationCategory.Formats,
      orderRank: LokiOperationOrder.LineFormats,
      renderer: pipelineRenderer,
      addOperationHandler: addLokiOperation,
      explainHandler: () =>
        `这将从JSON日志行中提取所有键和值，[unpacking](https://grafana.com/docs/loki/latest/logql/log_queries/#unpack)打包阶段的所有嵌入标签。提取的标签可用于标签筛选器表达式，并通过展开操作用作范围聚合的值。`,
    },
    {
      id: LokiOperationId.LineFormat,
      name: '行格式',
      params: [
        {
          name: 'String',
          type: 'string',
          hideName: true,
          placeholder: '{{.status_code}}',
          description: 'A line template that can refer to stream labels and extracted labels.',
          minWidth: 20,
        },
      ],
      defaultParams: [''],
      alternativesKey: 'format',
      category: LokiVisualQueryOperationCategory.Formats,
      orderRank: LokiOperationOrder.LineFormats,
      renderer: (model, def, innerExpr) => `${innerExpr} | line_format \`${model.params[0]}\``,
      addOperationHandler: addLokiOperation,
      explainHandler: () =>
        `这将使用指定的模板替换日志行。模板可以引用流标签和提取的标签。

        例如:{{\”。Status_code}} - {{.message}}\ '
        
        [阅读文档](https://grafana.com/docs/loki/latest/logql/log_queries/#line-format-expression)了解更多。
        `,
    },
    {
      id: LokiOperationId.LabelFormat,
      name: '标签格式',
      params: [
        { name: 'Label', type: 'string' },
        { name: 'Rename to', type: 'string' },
      ],
      defaultParams: ['', ''],
      alternativesKey: 'format',
      category: LokiVisualQueryOperationCategory.Formats,
      orderRank: LokiOperationOrder.LineFormats,
      renderer: (model, def, innerExpr) => `${innerExpr} | label_format ${model.params[1]}=${model.params[0]}`,
      addOperationHandler: addLokiOperation,
      explainHandler: () =>
        `这将改变标签的名称为所需的新标签。在下面的例子中，标签"error_level"将被重命名为"level"。

        示例:\ ' \ ' error_level=\ ' level\ ' \ ' \ '
        
        [阅读文档](https://grafana.com/docs/loki/latest/logql/log_queries/#labels-format-expression)了解更多。
        `,
    },

    {
      id: LokiOperationId.LineContains,
      name: '行包含',
      params: [
        {
          name: 'String',
          type: 'string',
          hideName: true,
          placeholder: '要查找的文本',
          description: 'Find log lines that contains this text',
          minWidth: 20,
          runQueryOnEnter: true,
        },
      ],
      defaultParams: [''],
      alternativesKey: 'line filter',
      category: LokiVisualQueryOperationCategory.LineFilters,
      orderRank: LokiOperationOrder.LineFilters,
      renderer: getLineFilterRenderer('|='),
      addOperationHandler: addLokiOperation,
      explainHandler: (op) => `返回包含字符串的日志行 \`${op.params[0]}\`.`,
    },
    {
      id: LokiOperationId.LineContainsNot,
      name: '行不包含',
      params: [
        {
          name: 'String',
          type: 'string',
          hideName: true,
          placeholder: '要排除的文本',
          description: 'Find log lines that does not contain this text',
          minWidth: 26,
          runQueryOnEnter: true,
        },
      ],
      defaultParams: [''],
      alternativesKey: 'line filter',
      category: LokiVisualQueryOperationCategory.LineFilters,
      orderRank: LokiOperationOrder.LineFilters,
      renderer: getLineFilterRenderer('!='),
      addOperationHandler: addLokiOperation,
      explainHandler: (op) => `返回不包含字符串的日志行\`${op.params[0]}\`.`,
    },
    {
      id: LokiOperationId.LineContainsCaseInsensitive,
      name: '行包含不区分大小写',
      params: [
        {
          name: 'String',
          type: 'string',
          hideName: true,
          placeholder: '要查找的文本',
          description: 'Find log lines that contains this text',
          minWidth: 33,
          runQueryOnEnter: true,
        },
      ],
      defaultParams: [''],
      alternativesKey: 'line filter',
      category: LokiVisualQueryOperationCategory.LineFilters,
      orderRank: LokiOperationOrder.LineFilters,
      renderer: getLineFilterRenderer('|~', true),
      addOperationHandler: addLokiOperation,
      explainHandler: (op) => `返回匹配正则表达式的日志行 \`(?i)${op.params[0]}\`.`,
    },
    {
      id: LokiOperationId.LineContainsNotCaseInsensitive,
      name: '行不包含不区分大小写的内容',
      params: [
        {
          name: 'String',
          type: 'string',
          hideName: true,
          placeholder: '要排除的文本',
          description: 'Find log lines that does not contain this text',
          minWidth: 40,
          runQueryOnEnter: true,
        },
      ],
      defaultParams: [''],
      alternativesKey: 'line filter',
      category: LokiVisualQueryOperationCategory.LineFilters,
      orderRank: LokiOperationOrder.LineFilters,
      renderer: getLineFilterRenderer('!~', true),
      addOperationHandler: addLokiOperation,
      explainHandler: (op) => `返回与正则表达式不匹配的日志行 \`(?i)${op.params[0]}\`.`,
    },
    {
      id: LokiOperationId.LineMatchesRegex,
      name: '行包含正则表达式匹配',
      params: [
        {
          name: 'Regex',
          type: 'string',
          hideName: true,
          placeholder: '要匹配的模式',
          description: 'Find log lines that match this regex pattern',
          minWidth: 30,
          runQueryOnEnter: true,
        },
      ],
      defaultParams: [''],
      alternativesKey: 'line filter',
      category: LokiVisualQueryOperationCategory.LineFilters,
      orderRank: LokiOperationOrder.LineFilters,
      renderer: getLineFilterRenderer('|~'),
      addOperationHandler: addLokiOperation,
      explainHandler: (op) => `返回匹配正则表达式的日志行 \`${op.params[0]}\`.`,
    },
    {
      id: LokiOperationId.LineMatchesRegexNot,
      name: '行不匹配正则表达式',
      params: [
        {
          name: 'Regex',
          type: 'string',
          hideName: true,
          placeholder: '要排除的模式',
          description: 'Find log lines that does not match this regex pattern',
          minWidth: 30,
          runQueryOnEnter: true,
        },
      ],
      defaultParams: [''],
      alternativesKey: 'line filter',
      category: LokiVisualQueryOperationCategory.LineFilters,
      orderRank: LokiOperationOrder.LineFilters,
      renderer: getLineFilterRenderer('!~'),
      addOperationHandler: addLokiOperation,
      explainHandler: (op) => `返回与正则表达式不匹配的日志行 \`${op.params[0]}\`.`,
    },
    {
      id: LokiOperationId.LineFilterIpMatches,
      name: 'IP线滤波器表达式',
      params: [
        { name: '操作符', type: 'string', options: ['|=', '!='] },
        {
          name: '模式',
          type: 'string',
          placeholder: '<模式>',
          minWidth: 16,
          runQueryOnEnter: true,
        },
      ],
      defaultParams: ['|=', ''],
      alternativesKey: 'line filter',
      category: LokiVisualQueryOperationCategory.LineFilters,
      orderRank: LokiOperationOrder.LineFilters,
      renderer: (op, def, innerExpr) => `${innerExpr} ${op.params[0]} ip(\`${op.params[1]}\`)`,
      addOperationHandler: addLokiOperation,
      explainHandler: (op) => `IP匹配返回日志行\`${op.params[1]}\``,
    },
    {
      id: LokiOperationId.LabelFilter,
      name: '标签过滤器表达式',
      params: [
        { name: 'Label', type: 'string' },
        { name: 'Operator', type: 'string', options: ['=', '!=', ' =~', '!~', '>', '<', '>=', '<='] },
        { name: 'Value', type: 'string' },
      ],
      defaultParams: ['', '=', ''],
      alternativesKey: 'label filter',
      category: LokiVisualQueryOperationCategory.LabelFilters,
      orderRank: LokiOperationOrder.LabelFilters,
      renderer: labelFilterRenderer,
      addOperationHandler: addLokiOperation,
      explainHandler: () => `标签表达式过滤器允许使用原始标签和提取的标签进行过滤。`,
    },
    {
      id: LokiOperationId.LabelFilterIpMatches,
      name: 'IP标签滤波器表达式',
      params: [
        { name: 'Label', type: 'string' },
        { name: 'Operator', type: 'string', options: ['=', '!='] },
        { name: 'Value', type: 'string' },
      ],
      defaultParams: ['', '=', ''],
      alternativesKey: 'label filter',
      category: LokiVisualQueryOperationCategory.LabelFilters,
      orderRank: LokiOperationOrder.LabelFilters,
      renderer: (model, def, innerExpr) =>
        `${innerExpr} | ${model.params[0]} ${model.params[1]} ip(\`${model.params[2]}\`)`,
      addOperationHandler: addLokiOperation,
      explainHandler: (op) => `IP匹配返回日志行\`${op.params[2]}\` for \`${op.params[0]}\` 标签`,
    },
    {
      id: LokiOperationId.LabelFilterNoErrors,
      name: '无管道错误',
      params: [],
      defaultParams: [],
      alternativesKey: 'label filter',
      category: LokiVisualQueryOperationCategory.LabelFilters,
      orderRank: LokiOperationOrder.NoErrors,
      renderer: (model, def, innerExpr) => `${innerExpr} | __error__=\`\``,
      addOperationHandler: addLokiOperation,
      explainHandler: () => `过滤掉所有格式化和解析错误。`,
    },
    {
      id: LokiOperationId.Unwrap,
      name: '打开',
      params: [
        {
          name: 'Identifier',
          type: 'string',
          hideName: true,
          minWidth: 16,
          placeholder: 'Label key',
          editor: UnwrapParamEditor,
        },
        {
          name: 'Conversion function',
          hideName: true,
          type: 'string',
          options: ['duration', 'duration_seconds', 'bytes'],
          optional: true,
        },
      ],
      defaultParams: ['', ''],
      alternativesKey: 'format',
      category: LokiVisualQueryOperationCategory.Formats,
      orderRank: LokiOperationOrder.Unwrap,
      renderer: (op, def, innerExpr) =>
        `${innerExpr} | unwrap ${op.params[1] ? `${op.params[1]}(${op.params[0]})` : op.params[0]}`,
      addOperationHandler: addLokiOperation,
      explainHandler: (op) => {
        let label = String(op.params[0]).length > 0 ? op.params[0] : '<label>';
        return `使用提取的标签\ ' ${label}\ '作为示例值，而不是后续范围聚合的日志行。${
          op.params[1]
            ? ` 转换函数 \`${op.params[1]}\` 包装 \`${label}\` 将尝试将该标签从特定格式(例如3k, 500ms)转换.`
            : ''
        }`;
      },
    },
    ...binaryScalarOperations,
    {
      id: LokiOperationId.NestedQuery,
      name: 'Binary operation with query',
      params: [],
      defaultParams: [],
      category: LokiVisualQueryOperationCategory.BinaryOps,
      renderer: (model, def, innerExpr) => innerExpr,
      addOperationHandler: addNestedQueryHandler,
    },
  ];

  return list;
}

// Keeping a local copy as an optimization measure.
const definitions = getOperationDefinitions();

/**
 * Given an operator, return the corresponding explain.
 * For usage within the Query Editor.
 */
export function explainOperator(id: LokiOperationId | string): string {
  const definition = definitions.find((operation) => operation.id === id);

  const explain = definition?.explainHandler?.({ id: '', params: ['<value>'] }) || '';

  // Strip markdown links
  return explain.replace(/\[(.*)\]\(.*\)/g, '$1');
}
