import { css } from '@emotion/css';
import React, { useEffect, useState, useMemo } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, ConfirmModal, TextArea, HorizontalGroup, Field, Form, useStyles2 } from '@grafana/ui';
import { useDispatch } from 'app/types';

import { useAlertManagerSourceName } from '../../hooks/useAlertManagerSourceName';
import { useAlertManagersByPermission } from '../../hooks/useAlertManagerSources';
import { useUnifiedAlertingSelector } from '../../hooks/useUnifiedAlertingSelector';
import {
  deleteAlertManagerConfigAction,
  fetchAlertManagerConfigAction,
  updateAlertManagerConfigAction,
} from '../../state/actions';
import { GRAFANA_RULES_SOURCE_NAME, isVanillaPrometheusAlertManagerDataSource } from '../../utils/datasource';
import { initialAsyncRequestState } from '../../utils/redux';
import { AlertManagerPicker } from '../AlertManagerPicker';

interface FormValues {
  configJSON: string;
}

export default function AlertmanagerConfig(): JSX.Element {
  const dispatch = useDispatch();
  const alertManagers = useAlertManagersByPermission('notification');
  const [alertManagerSourceName, setAlertManagerSourceName] = useAlertManagerSourceName(alertManagers);

  const [showConfirmDeleteAMConfig, setShowConfirmDeleteAMConfig] = useState(false);
  const { loading: isDeleting } = useUnifiedAlertingSelector((state) => state.deleteAMConfig);
  const { loading: isSaving } = useUnifiedAlertingSelector((state) => state.saveAMConfig);
  const readOnly = alertManagerSourceName ? isVanillaPrometheusAlertManagerDataSource(alertManagerSourceName) : false;
  const styles = useStyles2(getStyles);

  const configRequests = useUnifiedAlertingSelector((state) => state.amConfigs);

  const {
    result: config,
    loading: isLoadingConfig,
    error: loadingError,
  } = (alertManagerSourceName && configRequests[alertManagerSourceName]) || initialAsyncRequestState;

  useEffect(() => {
    if (alertManagerSourceName) {
      dispatch(fetchAlertManagerConfigAction(alertManagerSourceName));
    }
  }, [alertManagerSourceName, dispatch]);

  const resetConfig = () => {
    if (alertManagerSourceName) {
      dispatch(deleteAlertManagerConfigAction(alertManagerSourceName));
    }
    setShowConfirmDeleteAMConfig(false);
  };

  const defaultValues = useMemo(
    (): FormValues => ({
      configJSON: config ? JSON.stringify(config, null, 2) : '',
    }),
    [config]
  );

  const loading = isDeleting || isLoadingConfig || isSaving;

  const onSubmit = (values: FormValues) => {
    if (alertManagerSourceName && config) {
      dispatch(
        updateAlertManagerConfigAction({
          newConfig: JSON.parse(values.configJSON),
          oldConfig: config,
          alertManagerSourceName,
          successMessage: '更新 Alertmanager 配置。',
          refetch: true,
        })
      );
    }
  };

  return (
    <div className={styles.container}>
      <AlertManagerPicker
        current={alertManagerSourceName}
        onChange={setAlertManagerSourceName}
        dataSources={alertManagers}
      />
      {loadingError && !loading && (
        <Alert severity="error" title="加载 Alertmanager 配置错误">
          {loadingError.message || '未知的错误。'}
        </Alert>
      )}
      {isDeleting && alertManagerSourceName !== GRAFANA_RULES_SOURCE_NAME && (
        <Alert severity="info" title="重置 Alertmanager 配置">
          这可能需要一段时间……
        </Alert>
      )}
      {alertManagerSourceName && config && (
        <Form defaultValues={defaultValues} onSubmit={onSubmit} key={defaultValues.configJSON}>
          {({ register, errors }) => (
            <>
              {!readOnly && (
                <Field
                  disabled={loading}
                  label="配置"
                  invalid={!!errors.configJSON}
                  error={errors.configJSON?.message}
                >
                  <TextArea
                    {...register('configJSON', {
                      required: { value: true, message: 'Required.' },
                      validate: (v) => {
                        try {
                          JSON.parse(v);
                          return true;
                        } catch (e) {
                          return e instanceof Error ? e.message : 'Invalid JSON.';
                        }
                      },
                    })}
                    id="configuration"
                    rows={25}
                  />
                </Field>
              )}
              {readOnly && (
                <Field label="配置">
                  <pre data-testid="readonly-config">{defaultValues.configJSON}</pre>
                </Field>
              )}
              {!readOnly && (
                <HorizontalGroup>
                  <Button type="submit" variant="primary" disabled={loading}>
                    保存
                  </Button>
                  <Button
                    type="button"
                    disabled={loading}
                    variant="destructive"
                    onClick={() => setShowConfirmDeleteAMConfig(true)}
                  >
                    重置配置
                  </Button>
                </HorizontalGroup>
              )}
              {!!showConfirmDeleteAMConfig && (
                <ConfirmModal
                  isOpen={true}
                  title="重置 Alertmanager 配置"
                  body={`你确定要重制配置 ${
                    alertManagerSourceName === GRAFANA_RULES_SOURCE_NAME
                      ? '用于Grafana Alertmanager'
                      : `为 "${alertManagerSourceName}"`
                  }吗? 联络点和通知策略将被重置为默认值。`}
                  confirmText="是的，重置配置"
                  onConfirm={resetConfig}
                  onDismiss={() => setShowConfirmDeleteAMConfig(false)}
                />
              )}
            </>
          )}
        </Form>
      )}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    margin-bottom: ${theme.spacing(4)};
  `,
});
