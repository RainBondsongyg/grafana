import React, { FC, Fragment, useMemo, useState } from 'react';

import { ConfirmModal, useStyles2 } from '@grafana/ui';
import { contextSrv } from 'app/core/services/context_srv';
import { AlertManagerCortexConfig } from 'app/plugins/datasource/alertmanager/types';
import { useDispatch } from 'app/types';

import { Authorize } from '../../components/Authorize';
import { deleteTemplateAction } from '../../state/actions';
import { getAlertTableStyles } from '../../styles/table';
import { getNotificationsPermissions } from '../../utils/access-control';
import { makeAMLink } from '../../utils/misc';
import { CollapseToggle } from '../CollapseToggle';
import { DetailsField } from '../DetailsField';
import { ProvisioningBadge } from '../Provisioning';
import { ActionIcon } from '../rules/ActionIcon';

import { ReceiversSection } from './ReceiversSection';
import { TemplateEditor } from './TemplateEditor';

interface Props {
  config: AlertManagerCortexConfig;
  alertManagerName: string;
}

export const TemplatesTable: FC<Props> = ({ config, alertManagerName }) => {
  const dispatch = useDispatch();
  const [expandedTemplates, setExpandedTemplates] = useState<Record<string, boolean>>({});
  const tableStyles = useStyles2(getAlertTableStyles);
  const permissions = getNotificationsPermissions(alertManagerName);

  const templateRows = useMemo(() => {
    const templates = Object.entries(config.template_files);

    return templates.map(([name, template]) => ({
      name,
      template,
      provenance: (config.template_file_provenances ?? {})[name],
    }));
  }, [config]);
  const [templateToDelete, setTemplateToDelete] = useState<string>();

  const deleteTemplate = () => {
    if (templateToDelete) {
      dispatch(deleteTemplateAction(templateToDelete, alertManagerName));
    }
    setTemplateToDelete(undefined);
  };

  return (
    <ReceiversSection
      title="消息模板"
      description="模板构造发送到联系点的消息。"
      addButtonLabel="新模板"
      addButtonTo={makeAMLink('/alerting/notifications/templates/new', alertManagerName)}
      showButton={contextSrv.hasPermission(permissions.create)}
    >
      <table className={tableStyles.table} data-testid="templates-table">
        <colgroup>
          <col className={tableStyles.colExpand} />
          <col />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th></th>
            <th>模板</th>
            <Authorize actions={[permissions.update, permissions.delete]}>
              <th>操作</th>
            </Authorize>
          </tr>
        </thead>
        <tbody>
          {!templateRows.length && (
            <tr className={tableStyles.evenRow}>
              <td colSpan={3}>没有定义模板。</td>
            </tr>
          )}
          {templateRows.map(({ name, template, provenance }, idx) => {
            const isExpanded = !!expandedTemplates[name];
            return (
              <Fragment key={name}>
                <tr key={name} className={idx % 2 === 0 ? tableStyles.evenRow : undefined}>
                  <td>
                    <CollapseToggle
                      isCollapsed={!expandedTemplates[name]}
                      onToggle={() => setExpandedTemplates({ ...expandedTemplates, [name]: !isExpanded })}
                    />
                  </td>
                  <td>
                    {name} {provenance && <ProvisioningBadge />}
                  </td>
                  <td className={tableStyles.actionsCell}>
                    {provenance && (
                      <ActionIcon
                        to={makeAMLink(
                          `/alerting/notifications/templates/${encodeURIComponent(name)}/edit`,
                          alertManagerName
                        )}
                        tooltip="查看模板"
                        icon="file-alt"
                      />
                    )}
                    {!provenance && (
                      <Authorize actions={[permissions.update, permissions.delete]}>
                        <Authorize actions={[permissions.update]}>
                          <ActionIcon
                            to={makeAMLink(
                              `/alerting/notifications/templates/${encodeURIComponent(name)}/edit`,
                              alertManagerName
                            )}
                            tooltip="编辑模板"
                            icon="pen"
                          />
                        </Authorize>
                        <Authorize actions={[permissions.delete]}>
                          <ActionIcon
                            onClick={() => setTemplateToDelete(name)}
                            tooltip="删除模板"
                            icon="trash-alt"
                          />
                        </Authorize>
                      </Authorize>
                    )}
                  </td>
                </tr>
                {isExpanded && (
                  <tr className={idx % 2 === 0 ? tableStyles.evenRow : undefined}>
                    <td></td>
                    <td colSpan={2}>
                      <DetailsField label="Description" horizontal={true}>
                        <TemplateEditor
                          width={'auto'}
                          height={'auto'}
                          autoHeight={true}
                          value={template}
                          showLineNumbers={false}
                          monacoOptions={{
                            readOnly: true,
                            scrollBeyondLastLine: false,
                          }}
                        />
                      </DetailsField>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>

      {!!templateToDelete && (
        <ConfirmModal
          isOpen={true}
          title="删除模板"
          body={`您确定要删除模板"${templateToDelete}"吗?`}
          confirmText="确定删除"
          onConfirm={deleteTemplate}
          onDismiss={() => setTemplateToDelete(undefined)}
        />
      )}
    </ReceiversSection>
  );
};
