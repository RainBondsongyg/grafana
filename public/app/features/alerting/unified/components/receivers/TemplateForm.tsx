import { css } from '@emotion/css';
import React, { FC } from 'react';
import { useForm, Validate } from 'react-hook-form';
import AutoSizer from 'react-virtualized-auto-sizer';

import { GrafanaTheme2 } from '@grafana/data';
import { Stack } from '@grafana/experimental';
import { Alert, Button, Field, FieldSet, Input, LinkButton, useStyles2 } from '@grafana/ui';
import { useCleanup } from 'app/core/hooks/useCleanup';
import { AlertManagerCortexConfig } from 'app/plugins/datasource/alertmanager/types';
import { useDispatch } from 'app/types';

import { useUnifiedAlertingSelector } from '../../hooks/useUnifiedAlertingSelector';
import { updateAlertManagerConfigAction } from '../../state/actions';
import { makeAMLink } from '../../utils/misc';
import { initialAsyncRequestState } from '../../utils/redux';
import { ensureDefine } from '../../utils/templates';
import { ProvisionedResource, ProvisioningAlert } from '../Provisioning';

import { TemplateDataDocs } from './TemplateDataDocs';
import { TemplateEditor } from './TemplateEditor';
import { snippets } from './editor/templateDataSuggestions';

interface Values {
  name: string;
  content: string;
}

const defaults: Values = Object.freeze({
  name: '',
  content: '',
});

interface Props {
  existing?: Values;
  config: AlertManagerCortexConfig;
  alertManagerSourceName: string;
  provenance?: string;
}

export const TemplateForm: FC<Props> = ({ existing, alertManagerSourceName, config, provenance }) => {
  const styles = useStyles2(getStyles);
  const dispatch = useDispatch();

  useCleanup((state) => (state.unifiedAlerting.saveAMConfig = initialAsyncRequestState));

  const { loading, error } = useUnifiedAlertingSelector((state) => state.saveAMConfig);

  const submit = (values: Values) => {
    // wrap content in "define" if it's not already wrapped, in case user did not do it/
    // it's not obvious that this is needed for template to work
    const content = ensureDefine(values.name, values.content);

    // add new template to template map
    const template_files = {
      ...config.template_files,
      [values.name]: content,
    };

    // delete existing one (if name changed, otherwise it was overwritten in previous step)
    if (existing && existing.name !== values.name) {
      delete template_files[existing.name];
    }

    // make sure name for the template is configured on the alertmanager config object
    const templates = [
      ...(config.alertmanager_config.templates ?? []).filter((name) => name !== existing?.name),
      values.name,
    ];

    const newConfig: AlertManagerCortexConfig = {
      template_files,
      alertmanager_config: {
        ...config.alertmanager_config,
        templates,
      },
    };
    dispatch(
      updateAlertManagerConfigAction({
        alertManagerSourceName,
        newConfig,
        oldConfig: config,
        successMessage: '模板保存。',
        redirectPath: '/alerting/notifications',
      })
    );
  };

  const {
    handleSubmit,
    register,
    formState: { errors },
    getValues,
    setValue,
  } = useForm<Values>({
    mode: 'onSubmit',
    defaultValues: existing ?? defaults,
  });

  const validateNameIsUnique: Validate<string> = (name: string) => {
    return !config.template_files[name] || existing?.name === name
      ? true
      : '已经存在另一个具有此名称的模板。';
  };

  return (
    <form onSubmit={handleSubmit(submit)}>
      <h4>{existing ? '编辑消息模板' : '创建消息模板'}</h4>
      {error && (
        <Alert severity="error" title="错误保存模板">
          {error.message || (error as any)?.data?.message || String(error)}
        </Alert>
      )}
      {provenance && <ProvisioningAlert resource={ProvisionedResource.Template} />}
      <FieldSet disabled={Boolean(provenance)}>
        <Field label="模版名称" error={errors?.name?.message} invalid={!!errors.name?.message} required>
          <Input
            {...register('name', {
              required: { value: true, message: '必填.' },
              validate: { nameIsUnique: validateNameIsUnique },
            })}
            placeholder="给模板起一个名字"
            width={42}
            autoFocus={true}
          />
        </Field>
        <TemplatingGuideline />
        <div className={styles.contentContainer}>
          <div>
            <Field label="内容" error={errors?.content?.message} invalid={!!errors.content?.message} required>
              <div className={styles.editWrapper}>
                <AutoSizer>
                  {({ width, height }) => (
                    <TemplateEditor
                      value={getValues('content')}
                      width={width}
                      height={height}
                      onBlur={(value) => setValue('content', value)}
                    />
                  )}
                </AutoSizer>
              </div>
            </Field>
            <div className={styles.buttons}>
              {loading && (
                <Button disabled={true} icon="fa fa-spinner" variant="primary">
                 拯救……
                </Button>
              )}
              {!loading && (
                <Button type="submit" variant="primary">
                  保存模版
                </Button>
              )}
              <LinkButton
                disabled={loading}
                href={makeAMLink('alerting/notifications', alertManagerSourceName)}
                variant="secondary"
                type="button"
                fill="outline"
              >
                取消
              </LinkButton>
            </div>
          </div>
          <TemplateDataDocs />
        </div>
      </FieldSet>
    </form>
  );
};

function TemplatingGuideline() {
  const styles = useStyles2(getStyles);

  return (
    <Alert title="模板指导" severity="info">
      <Stack direction="row">
        <div>
          Grafana使用Go模板语言创建通知消息。
          <br />
          要了解更多关于模板的信息，请访问我们的文档。
        </div>
        <div>
          <LinkButton
            href="https://grafana.com/docs/grafana/latest/alerting/contact-points/message-templating"
            target="_blank"
            icon="external-link-alt"
          >
            模板文档
          </LinkButton>
        </div>
      </Stack>

      <div className={styles.snippets}>
      为了使模板制作更容易，我们在内容编辑器中提供了一些代码片段来帮助您加快工作流程。
        <div className={styles.code}>
          {Object.values(snippets)
            .map((s) => s.label)
            .join(', ')}
        </div>
      </div>
    </Alert>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  contentContainer: css`
    display: flex;
    gap: ${theme.spacing(2)};
    flex-direction: row;
    align-items: flex-start;
    flex-wrap: wrap;
    ${theme.breakpoints.up('xxl')} {
      flex-wrap: nowrap;
    }
  `,
  snippets: css`
    margin-top: ${theme.spacing(2)};
    font-size: ${theme.typography.bodySmall.fontSize};
  `,
  code: css`
    color: ${theme.colors.text.secondary};
    font-weight: ${theme.typography.fontWeightBold};
  `,
  buttons: css`
    & > * + * {
      margin-left: ${theme.spacing(1)};
    }
  `,
  textarea: css`
    max-width: 758px;
  `,
  editWrapper: css`
    display: block;
    position: relative;
    width: 640px;
    height: 320px;
  `,
});
