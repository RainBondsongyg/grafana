import React, { FC } from 'react';

import { useStyles2 } from '@grafana/ui';

import { FormAmRoute } from '../../types/amroutes';

import { getGridStyles } from './gridStyles';

export interface AmRootRouteReadProps {
  routes: FormAmRoute;
}

export const AmRootRouteRead: FC<AmRootRouteReadProps> = ({ routes }) => {
  const styles = useStyles2(getGridStyles);

  const receiver = routes.receiver || '-';
  const groupBy = routes.groupBy.join(', ') || '-';
  const groupWait = routes.groupWaitValue ? `${routes.groupWaitValue}${routes.groupWaitValueType}` : '-';
  const groupInterval = routes.groupIntervalValue
    ? `${routes.groupIntervalValue}${routes.groupIntervalValueType}`
    : '-';
  const repeatInterval = routes.repeatIntervalValue
    ? `${routes.repeatIntervalValue}${routes.repeatIntervalValueType}`
    : '-';

  return (
    <div className={styles.container}>
      <div className={styles.titleCell}>联络点</div>
      <div className={styles.valueCell} data-testid="am-routes-root-receiver">
        {receiver}
      </div>
      <div className={styles.titleCell}>组</div>
      <div className={styles.valueCell} data-testid="am-routes-root-group-by">
        {groupBy}
      </div>
      <div className={styles.titleCell}>计时</div>
      <div className={styles.valueCell} data-testid="am-routes-root-timings">
        等待时间: {groupWait} | 组间隔: {groupInterval} | 重复间隔: {repeatInterval}
      </div>
    </div>
  );
};
