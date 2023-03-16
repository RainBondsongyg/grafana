import React, { FC } from 'react';
import { useFormContext } from 'react-hook-form';

import { Checkbox, Field } from '@grafana/ui';

import { CommonSettingsComponentProps } from '../../../types/receiver-form';

export const GrafanaCommonChannelSettings: FC<CommonSettingsComponentProps> = ({
  pathPrefix,
  className,
  readOnly = false,
}) => {
  const { register } = useFormContext();
  return (
    <div className={className}>
      <Field>
        <Checkbox
          {...register(`${pathPrefix}disableResolveMessage`)}
          label="禁用解析消息"
          description="禁用警报状态返回false时发送的解析消息[OK]"
          disabled={readOnly}
        />
      </Field>
    </div>
  );
};
