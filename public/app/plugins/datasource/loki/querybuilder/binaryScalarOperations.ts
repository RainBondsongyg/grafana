import { defaultAddOperationHandler } from '../../prometheus/querybuilder/shared/operationUtils';
import {
  QueryBuilderOperation,
  QueryBuilderOperationDef,
  QueryBuilderOperationParamDef,
} from '../../prometheus/querybuilder/shared/types';

import { LokiOperationId, LokiVisualQueryOperationCategory } from './types';

export const binaryScalarDefs = [
  {
    id: LokiOperationId.Addition,
    name: '加',
    sign: '+',
  },
  {
    id: LokiOperationId.Subtraction,
    name: '减',
    sign: '-',
  },
  {
    id: LokiOperationId.MultiplyBy,
    name: '乘',
    sign: '*',
  },
  {
    id: LokiOperationId.DivideBy,
    name: '除',
    sign: '/',
  },
  {
    id: LokiOperationId.Modulo,
    name: '模',
    sign: '%',
  },
  {
    id: LokiOperationId.Exponent,
    name: '指数',
    sign: '^',
  },
  {
    id: LokiOperationId.EqualTo,
    name: '等于',
    sign: '==',
    comparison: true,
  },
  {
    id: LokiOperationId.NotEqualTo,
    name: '不等于',
    sign: '!=',
    comparison: true,
  },
  {
    id: LokiOperationId.GreaterThan,
    name: '大于',
    sign: '>',
    comparison: true,
  },
  {
    id: LokiOperationId.LessThan,
    name: '小于',
    sign: '<',
    comparison: true,
  },
  {
    id: LokiOperationId.GreaterOrEqual,
    name: '大于等于',
    sign: '>=',
    comparison: true,
  },
  {
    id: LokiOperationId.LessOrEqual,
    name: '小于等于',
    sign: '<=',
    comparison: true,
  },
];

// Not sure about this one. It could also be a more generic 'Simple math operation' where user specifies
// both the operator and the operand in a single input
export const binaryScalarOperations: QueryBuilderOperationDef[] = binaryScalarDefs.map((opDef) => {
  const params: QueryBuilderOperationParamDef[] = [{ name: 'Value', type: 'number' }];
  const defaultParams: any[] = [2];
  if (opDef.comparison) {
    params.unshift({
      name: 'Bool',
      type: 'boolean',
      description: 'If checked comparison will return 0 or 1 for the value rather than filtering.',
    });
    defaultParams.unshift(false);
  }

  return {
    id: opDef.id,
    name: opDef.name,
    params,
    defaultParams,
    alternativesKey: 'binary scalar operations',
    category: LokiVisualQueryOperationCategory.BinaryOps,
    renderer: getSimpleBinaryRenderer(opDef.sign),
    addOperationHandler: defaultAddOperationHandler,
  };
});

function getSimpleBinaryRenderer(operator: string) {
  return function binaryRenderer(model: QueryBuilderOperation, def: QueryBuilderOperationDef, innerExpr: string) {
    let param = model.params[0];
    let bool = '';
    if (model.params.length === 2) {
      param = model.params[1];
      bool = model.params[0] ? ' bool' : '';
    }

    return `${innerExpr} ${operator}${bool} ${param}`;
  };
}
