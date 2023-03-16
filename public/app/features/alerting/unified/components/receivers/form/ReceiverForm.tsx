import { css } from '@emotion/css';
import React, { useCallback } from 'react';
import { useForm, FormProvider, FieldErrors, Validate } from 'react-hook-form';

import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, Field, Input, LinkButton, useStyles2 } from '@grafana/ui';
import { useAppNotification } from 'app/core/copy/appNotification';
import { useCleanup } from 'app/core/hooks/useCleanup';
import { AlertManagerCortexConfig } from 'app/plugins/datasource/alertmanager/types';
import { NotifierDTO } from 'app/types';

import { useControlledFieldArray } from '../../../hooks/useControlledFieldArray';
import { useUnifiedAlertingSelector } from '../../../hooks/useUnifiedAlertingSelector';
import { ChannelValues, CommonSettingsComponentType, ReceiverFormValues } from '../../../types/receiver-form';
import { makeAMLink } from '../../../utils/misc';
import { initialAsyncRequestState } from '../../../utils/redux';

import { ChannelSubForm } from './ChannelSubForm';
import { DeletedSubForm } from './fields/DeletedSubform';

interface Props<R extends ChannelValues> {
  config: AlertManagerCortexConfig;
  notifiers: NotifierDTO[];
  defaultItem: R;
  alertManagerSourceName: string;
  onTestChannel?: (channel: R) => void;
  onSubmit: (values: ReceiverFormValues<R>) => void;
  takenReceiverNames: string[]; // will validate that user entered receiver name is not one of these
  commonSettingsComponent: CommonSettingsComponentType;
  initialValues?: ReceiverFormValues<R>;
  isEditable: boolean;
  isTestable?: boolean;
}

export function ReceiverForm<R extends ChannelValues>({
  config,
  initialValues,
  defaultItem,
  notifiers,
  alertManagerSourceName,
  onSubmit,
  onTestChannel,
  takenReceiverNames,
  commonSettingsComponent,
  isEditable,
  isTestable,
}: Props<R>): JSX.Element {
  const notifyApp = useAppNotification();
  const styles = useStyles2(getStyles);

  const defaultValues = initialValues || {
    name: '',
    items: [
      {
        ...defaultItem,
        __id: String(Math.random()),
      } as any,
    ],
  };

  const formAPI = useForm<ReceiverFormValues<R>>({
    // making a copy here beacuse react-hook-form will mutate these, and break if the object is frozen. for real.
    defaultValues: JSON.parse(JSON.stringify(defaultValues)),
  });

  useCleanup((state) => (state.unifiedAlerting.saveAMConfig = initialAsyncRequestState));

  const { loading } = useUnifiedAlertingSelector((state) => state.saveAMConfig);

  const {
    handleSubmit,
    register,
    formState: { errors },
    getValues,
  } = formAPI;

  const { fields, append, remove } = useControlledFieldArray<R>({ name: 'items', formAPI, softDelete: true });

  const validateNameIsAvailable: Validate<string> = useCallback(
    (name: string) =>
      takenReceiverNames.map((name) => name.trim().toLowerCase()).includes(name.trim().toLowerCase())
        ? '已经存在另一个此名称的接收者。'
        : true,
    [takenReceiverNames]
  );

  const submitCallback = (values: ReceiverFormValues<R>) => {
    onSubmit({
      ...values,
      items: values.items.filter((item) => !item.__deleted),
    });
  };

  const onInvalid = () => {
    notifyApp.error('表格上有错误。请改正并重试!');
  };

  return (
    <FormProvider {...formAPI}>
      {!config.alertmanager_config.route && (
        <Alert severity="warning" title="注意">
          因为还没有配置默认策略，所以这个接触点将自动设置为默认。
        </Alert>
      )}
      <form onSubmit={handleSubmit(submitCallback, onInvalid)}>
        <h4 className={styles.heading}>
          {!isEditable ? '联络点' : initialValues ? '更新联络点' : '创建联络点'}
        </h4>
        <Field label="名称" invalid={!!errors.name} error={errors.name && errors.name.message} required>
          <Input
            readOnly={!isEditable}
            id="name"
            {...register('name', {
              required: '名称必填',
              validate: { nameIsAvailable: validateNameIsAvailable },
            })}
            width={39}
            placeholder="名称"
          />
        </Field>
        {fields.map((field, index) => {
          const pathPrefix = `items.${index}.`;
          if (field.__deleted) {
            return <DeletedSubForm key={field.__id} pathPrefix={pathPrefix} />;
          }
          const initialItem = initialValues?.items.find(({ __id }) => __id === field.__id);
          return (
            <ChannelSubForm<R>
              defaultValues={field}
              key={field.__id}
              onDuplicate={() => {
                const currentValues: R = getValues().items[index];
                append({ ...currentValues, __id: String(Math.random()) });
              }}
              onTest={
                onTestChannel
                  ? () => {
                      const currentValues: R = getValues().items[index];
                      onTestChannel(currentValues);
                    }
                  : undefined
              }
              onDelete={() => remove(index)}
              pathPrefix={pathPrefix}
              notifiers={notifiers}
              secureFields={initialItem?.secureFields}
              errors={errors?.items?.[index] as FieldErrors<R>}
              commonSettingsComponent={commonSettingsComponent}
              isEditable={isEditable}
              isTestable={isTestable}
            />
          );
        })}
        <>
          {isEditable && (
            <Button
              type="button"
              icon="plus"
              variant="secondary"
              onClick={() => append({ ...defaultItem, __id: String(Math.random()) } as R)}
            >
              新建联络点类型
            </Button>
          )}
          <div className={styles.buttons}>
            {isEditable && (
              <>
                {loading && (
                  <Button disabled={true} icon="fa fa-spinner" variant="primary">
                    拯救……
                  </Button>
                )}
                {!loading && <Button type="submit">保存联络点</Button>}
              </>
            )}
            <LinkButton
              disabled={loading}
              fill="outline"
              variant="secondary"
              data-testid="cancel-button"
              href={makeAMLink('alerting/notifications', alertManagerSourceName)}
            >
              取消
            </LinkButton>
          </div>
        </>
      </form>
    </FormProvider>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  heading: css`
    margin: ${theme.spacing(4, 0)};
  `,
  buttons: css`
    margin-top: ${theme.spacing(4)};

    & > * + * {
      margin-left: ${theme.spacing(1)};
    }
  `,
});
