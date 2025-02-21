/*
 *  Copyright 2022 Collate.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
import { Button, Col, Row, Table, Tooltip } from 'antd';
import { ReactComponent as EditIcon } from 'assets/svg/edit-new.svg';
import { AxiosError } from 'axios';
import ErrorPlaceHolder from 'components/common/error-with-placeholder/ErrorPlaceHolder';
import NextPrevious from 'components/common/next-previous/NextPrevious';
import PageHeader from 'components/header/PageHeader.component';
import Loader from 'components/Loader/Loader';
import ConfirmationModal from 'components/Modals/ConfirmationModal/ConfirmationModal';
import { ALERTS_DOCS } from 'constants/docs.constants';
import { ERROR_PLACEHOLDER_TYPE } from 'enums/common.enum';
import {
  EventSubscription,
  ProviderType,
} from 'generated/events/eventSubscription';
import { isEmpty, isNil } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useHistory } from 'react-router-dom';
import { deleteAlert, getAllAlerts } from 'rest/alertsAPI';
import { PAGE_SIZE_MEDIUM } from '../../constants/constants';
import {
  GlobalSettingOptions,
  GlobalSettingsMenuCategory,
} from '../../constants/GlobalSettings.constants';
import { Paging } from '../../generated/type/paging';
import { getSettingPath } from '../../utils/RouterUtils';
import SVGIcons, { Icons } from '../../utils/SvgUtils';
import { showErrorToast, showSuccessToast } from '../../utils/ToastUtils';

const AlertsPage = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [isButtonLoading, setIsButtonLoading] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<EventSubscription[]>([]);
  const [alertsPaging, setAlertsPaging] = useState<Paging>({
    total: 0,
  } as Paging);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedAlert, setSelectedAlert] = useState<EventSubscription>();

  const fetchAlerts = useCallback(async (after?: string) => {
    setLoading(true);
    try {
      const { data, paging } = await getAllAlerts({ after });

      setAlerts(data.filter((d) => d.provider !== ProviderType.System));
      setAlertsPaging(paging);
    } catch (error) {
      showErrorToast(
        t('server.entity-fetch-error', { entity: t('label.alert-plural') })
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleAlertDelete = useCallback(async () => {
    setIsButtonLoading(true);
    try {
      await deleteAlert(selectedAlert?.id || '');
      setSelectedAlert(undefined);
      showSuccessToast(
        t('server.entity-deleted-successfully', { entity: t('label.alert') })
      );
      fetchAlerts();
    } catch (error) {
      showErrorToast(error as AxiosError);
    }
    setIsButtonLoading(false);
  }, [selectedAlert]);

  const onPageChange = useCallback((after: string | number, page?: number) => {
    if (after) {
      fetchAlerts(after + '');
      page && setCurrentPage(page);
    }
  }, []);

  const columns = useMemo(
    () => [
      {
        title: t('label.name'),
        dataIndex: 'name',
        width: '200px',
        key: 'name',
        render: (name: string, record: EventSubscription) => {
          return <Link to={`alert/${record.id}`}>{name}</Link>;
        },
      },
      {
        title: t('label.trigger'),
        dataIndex: ['filteringRules', 'resources'],
        width: '200px',
        key: 'FilteringRules.resources',
        render: (resources: string[]) => {
          return resources?.join(', ') || '--';
        },
      },
      {
        title: t('label.description'),
        dataIndex: 'description',
        flex: true,
        key: 'description',
      },
      {
        title: t('label.action-plural'),
        dataIndex: 'id',
        width: 120,
        key: 'id',
        render: (id: string, record: EventSubscription) => {
          return (
            <div className="d-flex items-center">
              <Tooltip placement="bottom" title={t('label.edit')}>
                <Link to={`edit-alert/${id}`}>
                  <Button
                    className="d-inline-flex items-center justify-center"
                    data-testid={`alert-edit-${record.name}`}
                    icon={<EditIcon width={16} />}
                    type="text"
                  />
                </Link>
              </Tooltip>
              <Tooltip placement="bottom" title={t('label.delete')}>
                <Button
                  data-testid={`alert-delete-${record.name}`}
                  disabled={record.provider === ProviderType.System}
                  icon={<SVGIcons className="w-4" icon={Icons.DELETE} />}
                  type="text"
                  onClick={() => setSelectedAlert(record)}
                />
              </Tooltip>
            </div>
          );
        },
      },
    ],
    [handleAlertDelete]
  );

  const pageHeaderData = useMemo(
    () => ({
      header: t('label.alert-plural'),
      subHeader: t('message.alerts-description'),
    }),
    []
  );

  if (loading) {
    return <Loader />;
  }

  if (isEmpty(alerts)) {
    return (
      <ErrorPlaceHolder
        permission
        doc={ALERTS_DOCS}
        heading={t('label.alert')}
        type={ERROR_PLACEHOLDER_TYPE.CREATE}
        onClick={() =>
          history.push(
            getSettingPath(
              GlobalSettingsMenuCategory.NOTIFICATIONS,
              GlobalSettingOptions.ADD_ALERTS
            )
          )
        }
      />
    );
  }

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <div className="d-flex justify-between">
            <PageHeader data={pageHeaderData} />
            <Link
              to={getSettingPath(
                GlobalSettingsMenuCategory.NOTIFICATIONS,
                GlobalSettingOptions.ADD_ALERTS
              )}>
              <Button data-testid="create-alert" type="primary">
                {t('label.create-entity', { entity: 'alert' })}
              </Button>
            </Link>
          </div>
        </Col>
        <Col span={24}>
          <Table
            bordered
            columns={columns}
            dataSource={alerts}
            loading={{ spinning: loading, indicator: <Loader size="small" /> }}
            pagination={false}
            rowKey="id"
            size="middle"
          />
        </Col>
        <Col span={24}>
          {Boolean(
            !isNil(alertsPaging.after) || !isNil(alertsPaging.before)
          ) && (
            <NextPrevious
              currentPage={currentPage}
              pageSize={PAGE_SIZE_MEDIUM}
              paging={alertsPaging}
              pagingHandler={onPageChange}
              totalCount={alertsPaging.total}
            />
          )}

          <ConfirmationModal
            bodyText={t('message.delete-entity-permanently', {
              entityType: selectedAlert?.name || '',
            })}
            cancelText={t('label.cancel')}
            confirmText={t('label.delete')}
            header={t('label.delete-entity', {
              entity: selectedAlert?.name || '',
            })}
            isLoading={isButtonLoading}
            visible={Boolean(selectedAlert)}
            onCancel={() => {
              setSelectedAlert(undefined);
            }}
            onConfirm={handleAlertDelete}
          />
        </Col>
      </Row>
    </>
  );
};

export default AlertsPage;
