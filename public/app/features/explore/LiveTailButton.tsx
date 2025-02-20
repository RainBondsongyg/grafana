import { css } from '@emotion/css';
import React from 'react';
import { CSSTransition } from 'react-transition-group';

import { Tooltip, ButtonGroup, ToolbarButton } from '@grafana/ui';

type LiveTailButtonProps = {
  splitted: boolean;
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isLive: boolean;
  isPaused: boolean;
};

export function LiveTailButton(props: LiveTailButtonProps) {
  const { start, pause, resume, isLive, isPaused, stop, splitted } = props;
  const buttonVariant = isLive && !isPaused ? 'active' : 'default';
  const onClickMain = isLive ? (isPaused ? resume : pause) : start;

  return (
    <ButtonGroup>
      <Tooltip
        content={isLive && !isPaused ? <>暂停直播</> : <>开始直播你的日志</>}
        placement="bottom"
      >
        <ToolbarButton
          iconOnly={splitted}
          variant={buttonVariant}
          icon={!isLive || isPaused ? 'play' : 'pause'}
          onClick={onClickMain}
        >
          {isLive && isPaused ? '停止' : '直播'}
        </ToolbarButton>
      </Tooltip>

      <CSSTransition
        mountOnEnter={true}
        unmountOnExit={true}
        timeout={100}
        in={isLive}
        classNames={{
          enter: styles.stopButtonEnter,
          enterActive: styles.stopButtonEnterActive,
          exit: styles.stopButtonExit,
          exitActive: styles.stopButtonExitActive,
        }}
      >
        <Tooltip content={<>Stop and exit the live stream</>} placement="bottom">
          <ToolbarButton variant={buttonVariant} onClick={stop} icon="square-shape" />
        </Tooltip>
      </CSSTransition>
    </ButtonGroup>
  );
}

const styles = {
  stopButtonEnter: css`
    label: stopButtonEnter;
    width: 0;
    opacity: 0;
    overflow: hidden;
  `,
  stopButtonEnterActive: css`
    label: stopButtonEnterActive;
    opacity: 1;
    width: 32px;
  `,
  stopButtonExit: css`
    label: stopButtonExit;
    width: 32px;
    opacity: 1;
    overflow: hidden;
  `,
  stopButtonExitActive: css`
    label: stopButtonExitActive;
    opacity: 0;
    width: 0;
  `,
};
