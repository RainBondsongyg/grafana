import { css } from '@emotion/css';
import React, { useCallback, useEffect, useState } from 'react';

import { SelectableValue, toOption } from '@grafana/data';
import { getTemplateSrv } from '@grafana/runtime';
import { fuzzyMatch, InlineField, InlineFieldRow, Input, Select } from '@grafana/ui';
import { notifyApp } from 'app/core/actions';
import { createErrorNotification } from 'app/core/copy/appNotification';
import { dispatch } from 'app/store/store';

import { JaegerDatasource } from '../datasource';
import { JaegerQuery } from '../types';
import { transformToLogfmt } from '../util';

const durationPlaceholder = '例如: e.g. 1.2s, 100ms, 500us';

type Props = {
  datasource: JaegerDatasource;
  query: JaegerQuery;
  onChange: (value: JaegerQuery) => void;
};

export const ALL_OPERATIONS_KEY = 'All';
const allOperationsOption: SelectableValue<string> = {
  label: ALL_OPERATIONS_KEY,
  value: undefined,
};

export function SearchForm({ datasource, query, onChange }: Props) {
  const [serviceOptions, setServiceOptions] = useState<Array<SelectableValue<string>>>();
  const [operationOptions, setOperationOptions] = useState<Array<SelectableValue<string>>>();
  const [isLoading, setIsLoading] = useState<{
    services: boolean;
    operations: boolean;
  }>({
    services: false,
    operations: false,
  });

  const loadOptions = useCallback(
    async (url: string, loaderOfType: string, query = ''): Promise<Array<SelectableValue<string>>> => {
      setIsLoading((prevValue) => ({ ...prevValue, [loaderOfType]: true }));

      try {
        const values: string[] | null = await datasource.metadataRequest(url);
        if (!values) {
          return [{ label: `No ${loaderOfType} found`, value: `No ${loaderOfType} found` }];
        }

        const options: SelectableValue[] = values.sort().map((option) => ({
          label: option,
          value: option,
        }));

        const filteredOptions = options.filter((item) => (item.value ? fuzzyMatch(item.value, query).found : false));
        return filteredOptions;
      } catch (error) {
        if (error instanceof Error) {
          dispatch(notifyApp(createErrorNotification('Error', error)));
        }
        return [];
      } finally {
        setIsLoading((prevValue) => ({ ...prevValue, [loaderOfType]: false }));
      }
    },
    [datasource]
  );

  useEffect(() => {
    const getServices = async () => {
      const services = await loadOptions('/api/services', 'services');
      if (query.service && getTemplateSrv().containsTemplate(query.service)) {
        services.push(toOption(query.service));
      }
      setServiceOptions(services);
    };
    getServices();
  }, [datasource, loadOptions, query.service]);

  useEffect(() => {
    const getOperations = async () => {
      const operations = await loadOptions(
        `/api/services/${encodeURIComponent(getTemplateSrv().replace(query.service!))}/operations`,
        'operations'
      );
      if (query.operation && getTemplateSrv().containsTemplate(query.operation)) {
        operations.push(toOption(query.operation));
      }
      setOperationOptions([allOperationsOption, ...operations]);
    };
    if (query.service) {
      getOperations();
    }
  }, [datasource, query.service, loadOptions, query.operation]);

  return (
    <div className={css({ maxWidth: '500px' })}>
      <InlineFieldRow>
        <InlineField label="Service 名称" labelWidth={14} grow>
          <Select
            inputId="service"
            options={serviceOptions}
            onOpenMenu={() => loadOptions('/api/services', 'services')}
            isLoading={isLoading.services}
            value={serviceOptions?.find((v) => v?.value === query.service) || undefined}
            placeholder="选择 Service"
            onChange={(v) =>
              onChange({
                ...query,
                service: v?.value!,
                operation: query.service !== v?.value ? undefined : query.operation,
              })
            }
            menuPlacement="bottom"
            isClearable
            aria-label={'select-service-name'}
            allowCustomValue={true}
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField label="Operation 名称" labelWidth={14} grow disabled={!query.service}>
          <Select
            inputId="operation"
            options={operationOptions}
            onOpenMenu={() =>
              loadOptions(
                `/api/services/${encodeURIComponent(getTemplateSrv().replace(query.service!))}/operations`,
                'operations'
              )
            }
            isLoading={isLoading.operations}
            value={operationOptions?.find((v) => v.value === query.operation) || null}
            placeholder="选择 Operation"
            onChange={(v) =>
              onChange({
                ...query,
                operation: v?.value! || undefined,
              })
            }
            menuPlacement="bottom"
            isClearable
            aria-label={'select-operation-name'}
            allowCustomValue={true}
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField label="标签" labelWidth={14} grow tooltip="值应该在logfmt中。">
          <Input
            id="tags"
            value={transformToLogfmt(query.tags)}
            placeholder="http.status_code=200 error=true"
            onChange={(v) =>
              onChange({
                ...query,
                tags: v.currentTarget.value,
              })
            }
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField label="最小间隔" labelWidth={14} grow>
          <Input
            id="minDuration"
            name="minDuration"
            value={query.minDuration || ''}
            placeholder={durationPlaceholder}
            onChange={(v) =>
              onChange({
                ...query,
                minDuration: v.currentTarget.value,
              })
            }
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField label="最大间隔" labelWidth={14} grow>
          <Input
            id="maxDuration"
            name="maxDuration"
            value={query.maxDuration || ''}
            placeholder={durationPlaceholder}
            onChange={(v) =>
              onChange({
                ...query,
                maxDuration: v.currentTarget.value,
              })
            }
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField label="限制" labelWidth={14} grow tooltip="返回结果的最大数目">
          <Input
            id="limit"
            name="limit"
            value={query.limit || ''}
            type="number"
            onChange={(v) =>
              onChange({
                ...query,
                limit: v.currentTarget.value ? parseInt(v.currentTarget.value, 10) : undefined,
              })
            }
          />
        </InlineField>
      </InlineFieldRow>
    </div>
  );
}

export default SearchForm;
