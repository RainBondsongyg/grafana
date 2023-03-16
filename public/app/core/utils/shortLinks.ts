import memoizeOne from 'memoize-one';

import { getBackendSrv, config } from '@grafana/runtime';
import { notifyApp } from 'app/core/actions';
import { createErrorNotification, createSuccessNotification } from 'app/core/copy/appNotification';
import { dispatch } from 'app/store/store';

import { copyStringToClipboard } from './explore';

function buildHostUrl() {
  return `${window.location.protocol}//${window.location.host}${config.appSubUrl}`;
}

function getRelativeURLPath(url: string) {
  let path = url.replace(buildHostUrl(), '');
  return path.startsWith('/') ? path.substring(1, path.length) : path;
}

export const createShortLink = memoizeOne(async function (path: string) {
  try {
    const shortLink = await getBackendSrv().post(`/api/short-urls`, {
      path: getRelativeURLPath(path),
    });
    return shortLink.url;
  } catch (err) {
    console.error('创建缩短链接时出错: ', err);
    dispatch(notifyApp(createErrorNotification('产生缩短链接的错误')));
  }
});

export const createAndCopyShortLink = async (path: string) => {
  const shortLink = await createShortLink(path);
  if (shortLink) {
    copyStringToClipboard(shortLink);
    dispatch(notifyApp(createSuccessNotification('缩短链接复制到剪贴板')));
  } else {
    dispatch(notifyApp(createErrorNotification('产生缩短链接的错误')));
  }
};
