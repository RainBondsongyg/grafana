import { cx } from '@emotion/css';
import React, { FC, useState } from 'react';

import { Button, Collapse, Field, Form, Input, InputControl, Link, MultiSelect, Select, useStyles2 } from '@grafana/ui';

import { AmRouteReceiver, FormAmRoute } from '../../types/amroutes';
import {
  mapMultiSelectValueToStrings,
  mapSelectValueToString,
  optionalPositiveInteger,
  stringToSelectableValue,
  stringsToSelectableValues,
  commonGroupByOptions,
} from '../../utils/amroutes';
import { makeAMLink } from '../../utils/misc';
import { timeOptions } from '../../utils/time';

import { getFormStyles } from './formStyles';

export interface AmRootRouteFormProps {
  alertManagerSourceName: string;
  onCancel: () => void;
  onSave: (data: FormAmRoute) => void;
  receivers: AmRouteReceiver[];
  routes: FormAmRoute;
}

export const AmRootRouteForm: FC<AmRootRouteFormProps> = ({
  alertManagerSourceName,
  onCancel,
  onSave,
  receivers,
  routes,
}) => {
  const styles = useStyles2(getFormStyles);
  const [isTimingOptionsExpanded, setIsTimingOptionsExpanded] = useState(false);
  const [groupByOptions, setGroupByOptions] = useState(stringsToSelectableValues(routes.groupBy));

  return (
    <Form defaultValues={{ ...routes, overrideTimings: true, overrideGrouping: true }} onSubmit={onSave}>
      {({ control, errors, setValue }) => (
        <>
          <Field label="默认联络点" invalid={!!errors.receiver} error={errors.receiver?.message}>
            <>
              <div className={styles.container} data-testid="am-receiver-select">
                <InputControl
                  render={({ field: { onChange, ref, ...field } }) => (
                    <Select
                      aria-label="默认联络点"
                      {...field}
                      className={styles.input}
                      onChange={(value) => onChange(mapSelectValueToString(value))}
                      options={receivers}
                    />
                  )}
                  control={control}
                  name="receiver"
                  rules={{ required: { value: true, message: 'Required.' } }}
                />
                <span>or</span>
                <Link
                  className={styles.linkText}
                  href={makeAMLink('/alerting/notifications/receivers/new', alertManagerSourceName)}
                >
                  创建联络点
                </Link>
              </div>
            </>
          </Field>
          <Field
            label="zu"
            description="当您收到基于标签的通知时，对警报进行分组。"
            data-testid="am-group-select"
          >
            {/* @ts-ignore-check: react-hook-form made me do this */}
            <InputControl
              render={({ field: { onChange, ref, ...field } }) => (
                <MultiSelect
                  aria-label="组"
                  {...field}
                  allowCustomValue
                  className={styles.input}
                  onCreateOption={(opt: string) => {
                    setGroupByOptions((opts) => [...opts, stringToSelectableValue(opt)]);

                    // @ts-ignore-check: react-hook-form made me do this
                    setValue('groupBy', [...field.value, opt]);
                  }}
                  onChange={(value) => onChange(mapMultiSelectValueToStrings(value))}
                  options={[...commonGroupByOptions, ...groupByOptions]}
                />
              )}
              control={control}
              name="groupBy"
            />
          </Field>
          <Collapse
            collapsible
            className={styles.collapse}
            isOpen={isTimingOptionsExpanded}
            label="选择时间"
            onToggle={setIsTimingOptionsExpanded}
          >
            <Field
              label="等待时间"
              description="传入警报创建的新组发送初始通知之前的等待时间。默认为30秒。"
              invalid={!!errors.groupWaitValue}
              error={errors.groupWaitValue?.message}
              data-testid="am-group-wait"
            >
              <>
                <div className={cx(styles.container, styles.timingContainer)}>
                  <InputControl
                    render={({ field, fieldState: { invalid } }) => (
                      <Input {...field} className={styles.smallInput} invalid={invalid} placeholder={'30'} />
                    )}
                    control={control}
                    name="groupWaitValue"
                    rules={{
                      validate: optionalPositiveInteger,
                    }}
                  />
                  <InputControl
                    render={({ field: { onChange, ref, ...field } }) => (
                      <Select
                        {...field}
                        className={styles.input}
                        onChange={(value) => onChange(mapSelectValueToString(value))}
                        options={timeOptions}
                        aria-label="组等待类型"
                      />
                    )}
                    control={control}
                    name="groupWaitValueType"
                  />
                </div>
              </>
            </Field>
            <Field
              label="组间隔"
              description="在发送第一个通知之后，为该组发送一批新警报的等待时间。默认5分钟。"
              invalid={!!errors.groupIntervalValue}
              error={errors.groupIntervalValue?.message}
              data-testid="am-group-interval"
            >
              <>
                <div className={cx(styles.container, styles.timingContainer)}>
                  <InputControl
                    render={({ field, fieldState: { invalid } }) => (
                      <Input {...field} className={styles.smallInput} invalid={invalid} placeholder={'5'} />
                    )}
                    control={control}
                    name="groupIntervalValue"
                    rules={{
                      validate: optionalPositiveInteger,
                    }}
                  />
                  <InputControl
                    render={({ field: { onChange, ref, ...field } }) => (
                      <Select
                        {...field}
                        className={styles.input}
                        onChange={(value) => onChange(mapSelectValueToString(value))}
                        options={timeOptions}
                        aria-label="分组间隔类型"
                      />
                    )}
                    control={control}
                    name="groupIntervalValueType"
                  />
                </div>
              </>
            </Field>
            <Field
              label="重复间隔"
              description="成功发送警报后重新发送警报的等待时间。默认为4小时。"
              invalid={!!errors.repeatIntervalValue}
              error={errors.repeatIntervalValue?.message}
              data-testid="am-repeat-interval"
            >
              <>
                <div className={cx(styles.container, styles.timingContainer)}>
                  <InputControl
                    render={({ field, fieldState: { invalid } }) => (
                      <Input {...field} className={styles.smallInput} invalid={invalid} placeholder="4" />
                    )}
                    control={control}
                    name="repeatIntervalValue"
                    rules={{
                      validate: optionalPositiveInteger,
                    }}
                  />
                  <InputControl
                    render={({ field: { onChange, ref, ...field } }) => (
                      <Select
                        {...field}
                        className={styles.input}
                        menuPlacement="top"
                        onChange={(value) => onChange(mapSelectValueToString(value))}
                        options={timeOptions}
                        aria-label="重复间隔类型"
                      />
                    )}
                    control={control}
                    name="repeatIntervalValueType"
                  />
                </div>
              </>
            </Field>
          </Collapse>
          <div className={styles.container}>
            <Button type="submit">保存</Button>
            <Button onClick={onCancel} type="reset" variant="secondary" fill="outline">
              取消
            </Button>
          </div>
        </>
      )}
    </Form>
  );
};
