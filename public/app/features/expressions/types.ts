import { DataQuery, ReducerID, SelectableValue } from '@grafana/data';

import { EvalFunction } from '../alerting/state/alertDef';

export enum ExpressionQueryType {
  math = 'math',
  reduce = 'reduce',
  resample = 'resample',
  classic = 'classic_conditions',
  threshold = 'threshold',
}

export const gelTypes: Array<SelectableValue<ExpressionQueryType>> = [
  {
    value: ExpressionQueryType.math,
    label: 'Math',
    description: '时间序列或数字数据的自由形式数学公式。',
  },
  {
    value: ExpressionQueryType.reduce,
    label: 'Reduce',
    description:
      '获取从查询或表达式返回的一个或多个时间序列，并将每个序列转换为单个数字。',
  },
  {
    value: ExpressionQueryType.resample,
    label: 'Resample',
    description: '将每个时间序列中的时间戳更改为具有一致的时间间隔。',
  },
  {
    value: ExpressionQueryType.classic,
    label: 'Classic condition',
    description:
      '获取从查询或表达式返回的一个或多个时间序列，并检查是否有任何序列匹配条件。',
  },
  {
    value: ExpressionQueryType.threshold,
    label: 'Threshold',
    description:
      '获取从查询或表达式返回的一个或多个时间序列，并检查是否有任何序列匹配阈值条件。',
  },
];

export const reducerTypes: Array<SelectableValue<string>> = [
  { value: ReducerID.min, label: 'Min', description: '获取最小值' },
  { value: ReducerID.max, label: 'Max', description: '获取最大值' },
  { value: ReducerID.mean, label: 'Mean', description: '获取平均值' },
  { value: ReducerID.sum, label: 'Sum', description: '获取所有值的和' },
  { value: ReducerID.count, label: 'Count', description: '获取值的个数' },
  { value: ReducerID.last, label: 'Last', description: '获取最后一个值' },
];

export enum ReducerMode {
  Strict = '', // backend API wants an empty string to support "strict" mode
  ReplaceNonNumbers = 'replaceNN',
  DropNonNumbers = 'dropNN',
}

export const reducerMode: Array<SelectableValue<ReducerMode>> = [
  {
    value: ReducerMode.Strict,
    label: '严格',
    description: '如果序列包含非数值数据，则结果可以为NaN',
  },
  {
    value: ReducerMode.DropNonNumbers,
    label: '删除非数字值',
    description: '在还原之前，从输入序列中删除NaN， +/-Inf和null',
  },
  {
    value: ReducerMode.ReplaceNonNumbers,
    label: '替换非数字值',
    description: '将NaN， +/-Inf和null替换为恒定值',
  },
];

export const downsamplingTypes: Array<SelectableValue<string>> = [
  { value: ReducerID.last, label: 'Last', description: '用最后一个值填充' },
  { value: ReducerID.min, label: 'Min', description: '用最小值填充' },
  { value: ReducerID.max, label: 'Max', description: '用最大值填充' },
  { value: ReducerID.mean, label: 'Mean', description: '填入平均值' },
  { value: ReducerID.sum, label: 'Sum', description: '填入所有值的和' },
];

export const upsamplingTypes: Array<SelectableValue<string>> = [
  { value: 'pad', label: 'pad', description: '用最后一个已知值填充' },
  { value: 'backfilling', label: 'backfilling', description: '用下一个已知值填充' },
  { value: 'fillna', label: 'fillna', description: '填充nan' },
];

export const thresholdFunctions: Array<SelectableValue<EvalFunction>> = [
  { value: EvalFunction.IsAbove, label: '以上' },
  { value: EvalFunction.IsBelow, label: '低于' },
  { value: EvalFunction.IsWithinRange, label: '在范围内' },
  { value: EvalFunction.IsOutsideRange, label: '在范围之外' },
];

/**
 * For now this is a single object to cover all the types.... would likely
 * want to split this up by type as the complexity increases
 */
export interface ExpressionQuery extends DataQuery {
  type: ExpressionQueryType;
  reducer?: string;
  expression?: string;
  window?: string;
  downsampler?: string;
  upsampler?: string;
  conditions?: ClassicCondition[];
  settings?: ExpressionQuerySettings;
}

export interface ExpressionQuerySettings {
  mode?: ReducerMode;
  replaceWithValue?: number;
}

export interface ClassicCondition {
  evaluator: {
    params: number[];
    type: EvalFunction;
  };
  operator?: {
    type: string;
  };
  query: {
    params: string[];
  };
  reducer: {
    params: [];
    type: ReducerType;
  };
  type: 'query';
}

export type ReducerType =
  | 'avg'
  | 'min'
  | 'max'
  | 'sum'
  | 'count'
  | 'last'
  | 'median'
  | 'diff'
  | 'diff_abs'
  | 'percent_diff'
  | 'percent_diff_abs'
  | 'count_non_null';
