import { css, cx } from '@emotion/css';
import React, { useState, useEffect } from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { DataSourceApi, DataQuery, GrafanaTheme2 } from '@grafana/data';
import { config, getDataSourceSrv, reportInteraction } from '@grafana/runtime';
import { TextArea, Button, IconButton, useStyles2 } from '@grafana/ui';
import { notifyApp } from 'app/core/actions';
import appEvents from 'app/core/app_events';
import { createSuccessNotification } from 'app/core/copy/appNotification';
import { copyStringToClipboard } from 'app/core/utils/explore';
import { createUrlFromRichHistory, createQueryText } from 'app/core/utils/richHistory';
import { createAndCopyShortLink } from 'app/core/utils/shortLinks';
import { dispatch } from 'app/store/store';
import { StoreState } from 'app/types';
import { RichHistoryQuery, ExploreId } from 'app/types/explore';

import { ShowConfirmModalEvent } from '../../../types/events';
import { changeDatasource } from '../state/datasource';
import { starHistoryItem, commentHistoryItem, deleteHistoryItem } from '../state/history';
import { setQueries } from '../state/query';

function mapStateToProps(state: StoreState, { exploreId }: { exploreId: ExploreId }) {
  const explore = state.explore;
  const { datasourceInstance } = explore[exploreId]!;
  return {
    exploreId,
    datasourceInstance,
  };
}

const mapDispatchToProps = {
  changeDatasource,
  deleteHistoryItem,
  commentHistoryItem,
  starHistoryItem,
  setQueries,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

interface OwnProps<T extends DataQuery = DataQuery> {
  query: RichHistoryQuery<T>;
  dsImg: string;
  isRemoved: boolean;
}

export type Props<T extends DataQuery = DataQuery> = ConnectedProps<typeof connector> & OwnProps<T>;

const getStyles = (theme: GrafanaTheme2) => {
  /* Hard-coded value so all buttons and icons on right side of card are aligned */
  const rightColumnWidth = '240px';
  const rightColumnContentWidth = '170px';

  /* If datasource was removed, card will have inactive color */
  const cardColor = theme.colors.background.secondary;

  return {
    queryCard: css`
      display: flex;
      flex-direction: column;
      border: 1px solid ${theme.colors.border.weak};
      margin: ${theme.spacing(1)} 0;
      background-color: ${cardColor};
      border-radius: ${theme.shape.borderRadius(1)};
      .starred {
        color: ${theme.v1.palette.orange};
      }
    `,
    cardRow: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: ${theme.spacing(1)};
      border-bottom: none;
      :first-of-type {
        border-bottom: 1px solid ${theme.colors.border.weak};
        padding: ${theme.spacing(0.5, 1)};
      }
      img {
        height: ${theme.typography.fontSize}px;
        max-width: ${theme.typography.fontSize}px;
        margin-right: ${theme.spacing(1)};
      }
    `,
    datasourceContainer: css`
      display: flex;
      align-items: center;
      font-size: ${theme.typography.bodySmall.fontSize};
      font-weight: ${theme.typography.fontWeightMedium};
    `,
    queryActionButtons: css`
      max-width: ${rightColumnContentWidth};
      display: flex;
      justify-content: flex-end;
      font-size: ${theme.typography.size.base};
      button {
        margin-left: ${theme.spacing(1)};
      }
    `,
    queryContainer: css`
      font-weight: ${theme.typography.fontWeightMedium};
      width: calc(100% - ${rightColumnWidth});
    `,
    queryRow: css`
      border-top: 1px solid ${theme.colors.border.weak};
      word-break: break-all;
      padding: 4px 2px;
      :first-child {
        border-top: none;
        padding: 0 0 4px 0;
      }
    `,
    updateCommentContainer: css`
      width: calc(100% + ${rightColumnWidth});
      margin-top: ${theme.spacing(1)};
    `,
    comment: css`
      overflow-wrap: break-word;
      font-size: ${theme.typography.bodySmall.fontSize};
      font-weight: ${theme.typography.fontWeightRegular};
      margin-top: ${theme.spacing(0.5)};
    `,
    commentButtonRow: css`
      > * {
        margin-right: ${theme.spacing(1)};
      }
    `,
    textArea: css`
      width: 100%;
    `,
    runButton: css`
      max-width: ${rightColumnContentWidth};
      display: flex;
      justify-content: flex-end;
      button {
        height: auto;
        padding: ${theme.spacing(0.5, 2)};
        line-height: 1.4;
        span {
          white-space: normal !important;
        }
      }
    `,
  };
};

export function RichHistoryCard(props: Props) {
  const {
    query,
    dsImg,
    isRemoved,
    commentHistoryItem,
    starHistoryItem,
    deleteHistoryItem,
    changeDatasource,
    exploreId,
    datasourceInstance,
    setQueries,
  } = props;
  const [activeUpdateComment, setActiveUpdateComment] = useState(false);
  const [comment, setComment] = useState<string | undefined>(query.comment);
  const [queryDsInstance, setQueryDsInstance] = useState<DataSourceApi | undefined>(undefined);

  useEffect(() => {
    const getQueryDsInstance = async () => {
      const ds = await getDataSourceSrv().get(query.datasourceUid);
      setQueryDsInstance(ds);
    };

    getQueryDsInstance();
  }, [query.datasourceUid]);

  const styles = useStyles2(getStyles);

  const onRunQuery = async () => {
    const queriesToRun = query.queries;
    const differentDataSource = query.datasourceUid !== datasourceInstance?.uid;
    if (differentDataSource) {
      await changeDatasource(exploreId, query.datasourceUid, { importQueries: true });
      setQueries(exploreId, queriesToRun);
    } else {
      setQueries(exploreId, queriesToRun);
    }
    reportInteraction('grafana_explore_query_history_run', {
      queryHistoryEnabled: config.queryHistoryEnabled,
      differentDataSource,
    });
  };

  const onCopyQuery = () => {
    const queriesToCopy = query.queries.map((q) => createQueryText(q, queryDsInstance)).join('\n');
    copyStringToClipboard(queriesToCopy);
    dispatch(notifyApp(createSuccessNotification('查询已复制到剪贴板')));
  };

  const onCreateShortLink = async () => {
    const link = createUrlFromRichHistory(query);
    await createAndCopyShortLink(link);
  };

  const onDeleteQuery = () => {
    const performDelete = (queryId: string) => {
      deleteHistoryItem(queryId);
      dispatch(notifyApp(createSuccessNotification('查询删除')));
      reportInteraction('grafana_explore_query_history_deleted', {
        queryHistoryEnabled: config.queryHistoryEnabled,
      });
    };

    // For starred queries, we want confirmation. For non-starred, we don't.
    if (query.starred) {
      appEvents.publish(
        new ShowConfirmModalEvent({
          title: '删除',
          text: '确定要永久删除带星号的查询吗?',
          yesText: '删除',
          icon: 'trash-alt',
          onConfirm: () => performDelete(query.id),
        })
      );
    } else {
      performDelete(query.id);
    }
  };

  const onStarrQuery = () => {
    starHistoryItem(query.id, !query.starred);
    reportInteraction('grafana_explore_query_history_starred', {
      queryHistoryEnabled: config.queryHistoryEnabled,
      newValue: !query.starred,
    });
  };

  const toggleActiveUpdateComment = () => setActiveUpdateComment(!activeUpdateComment);

  const onUpdateComment = () => {
    commentHistoryItem(query.id, comment);
    setActiveUpdateComment(false);
    reportInteraction('grafana_explore_query_history_commented', {
      queryHistoryEnabled: config.queryHistoryEnabled,
    });
  };

  const onCancelUpdateComment = () => {
    setActiveUpdateComment(false);
    setComment(query.comment);
  };

  const onKeyDown = (keyEvent: React.KeyboardEvent) => {
    if (keyEvent.key === 'Enter' && (keyEvent.shiftKey || keyEvent.ctrlKey)) {
      onUpdateComment();
    }

    if (keyEvent.key === 'Escape') {
      onCancelUpdateComment();
    }
  };

  const updateComment = (
    <div className={styles.updateCommentContainer} aria-label={comment ? '更新评论表格' : '添加评论表格'}>
      <TextArea
        value={comment}
        placeholder={comment ? undefined : '查询功能的可选描述。'}
        onChange={(e) => setComment(e.currentTarget.value)}
        className={styles.textArea}
      />
      <div className={styles.commentButtonRow}>
        <Button onClick={onUpdateComment} aria-label="提交按钮">
        保存评论
        </Button>
        <Button variant="secondary" onClick={onCancelUpdateComment}>
          取消
        </Button>
      </div>
    </div>
  );

  const queryActionButtons = (
    <div className={styles.queryActionButtons}>
      <IconButton
        name="comment-alt"
        onClick={toggleActiveUpdateComment}
        title={query.comment?.length > 0 ? '编辑评论' : '添加评论'}
      />
      <IconButton name="copy" onClick={onCopyQuery} title="将查询复制到剪贴板" />
      {!isRemoved && (
        <IconButton name="share-alt" onClick={onCreateShortLink} title="复制缩短链接到剪贴板" />
      )}
      <IconButton name="trash-alt" title={'删除查询'} onClick={onDeleteQuery} />
      <IconButton
        name={query.starred ? 'favorite' : 'star'}
        iconType={query.starred ? 'mono' : 'default'}
        onClick={onStarrQuery}
        title={query.starred ? 'Unstar 查询' : '星查询'}
      />
    </div>
  );

  return (
    <div className={styles.queryCard} onKeyDown={onKeyDown}>
      <div className={styles.cardRow}>
        <div className={styles.datasourceContainer}>
          <img src={dsImg} aria-label="数据源图标" />
          <div aria-label="数据源名称">
            {isRemoved ? '数据源不再存在' : query.datasourceName}
          </div>
        </div>
        {queryActionButtons}
      </div>
      <div className={cx(styles.cardRow)}>
        <div className={styles.queryContainer}>
          {query.queries.map((q, i) => {
            const queryText = createQueryText(q, queryDsInstance);
            return (
              <div aria-label="查询文本" key={`${q}-${i}`} className={styles.queryRow}>
                {queryText}
              </div>
            );
          })}
          {!activeUpdateComment && query.comment && (
            <div aria-label="查询评论" className={styles.comment}>
              {query.comment}
            </div>
          )}
          {activeUpdateComment && updateComment}
        </div>
        {!activeUpdateComment && (
          <div className={styles.runButton}>
            <Button variant="secondary" onClick={onRunQuery} disabled={isRemoved}>
              {datasourceInstance?.uid === query.datasourceUid ? '运行查询' : '切换数据源并运行查询'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default connector(RichHistoryCard);
