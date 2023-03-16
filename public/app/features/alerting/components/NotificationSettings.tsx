import React, { FC } from 'react';

import { Checkbox, CollapsableSection, Field, InfoBox, Input } from '@grafana/ui';

import { NotificationSettingsProps } from './NotificationChannelForm';

interface Props extends NotificationSettingsProps {
  imageRendererAvailable: boolean;
}

export const NotificationSettings: FC<Props> = ({ currentFormValues, imageRendererAvailable, register }) => {
  return (
    <CollapsableSection label="通知设置" isOpen={false}>
      <Field>
        <Checkbox {...register('isDefault')} label="Default" description="将此通知用于所有警报" />
      </Field>
      <Field>
        <Checkbox
          {...register('settings.uploadImage')}
          label="包括图像"
          description="捕获图像并将其包含在通知中"
        />
      </Field>
      {currentFormValues.uploadImage && !imageRendererAvailable && (
        <InfoBox title="没有图像渲染器可用/安装">
          Grafana找不到图像渲染器来为通知捕获图像。请确保Grafana 安装图像渲染插件。请联系您的Grafana管理员安装插件。
        </InfoBox>
      )}
      <Field>
        <Checkbox
          {...register('disableResolveMessage')}
          label="禁用解析消息"
          description="禁用警报状态返回false时发送的解析消息[OK]"
        />
      </Field>
      <Field>
        <Checkbox
          {...register('sendReminder')}
          label="发送提醒"
          description="为触发的警报发送额外通知"
        />
      </Field>
      {currentFormValues.sendReminder && (
        <>
          <Field
            label="每天发送提醒"
            description="指定提醒应该发送的频率，例如每30分钟、1分钟、10分钟、30分钟或1小时等。
            在评估规则后发送警报提醒。提醒再频繁不过了
            小于配置的警报规则评估间隔。"
          >
            <Input {...register('frequency')} width={8} />
          </Field>
        </>
      )}
    </CollapsableSection>
  );
};
