/*
 *  Copyright 2021 Collate
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

import { Button, Col, Row, Space, Table, Tooltip } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { AxiosError } from 'axios';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getBots } from '../../axiosAPIs/botsAPI';
import { INITIAL_PAGING_VALUE, PAGE_SIZE } from '../../constants/constants';
import { EntityType } from '../../enums/entity.enum';
import { Bot } from '../../generated/entity/bot';
import { Paging } from '../../generated/type/paging';
import SVGIcons, { Icons } from '../../utils/SvgUtils';
import { showErrorToast } from '../../utils/ToastUtils';
import DeleteWidgetModal from '../common/DeleteWidget/DeleteWidgetModal';
import NextPrevious from '../common/next-previous/NextPrevious';
import Loader from '../Loader/Loader';
import { BotListV1Props } from './BotListV1.interfaces';

const BotListV1 = ({ showDeleted }: BotListV1Props) => {
  const [botUsers, setBotUsers] = useState<Bot[]>([]);
  const [paging, setPaging] = useState<Paging>({} as Paging);
  const [selectedUser, setSelectedUser] = useState<Bot>();
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<number>(INITIAL_PAGING_VALUE);

  /**
   *
   * @param after - Pagination value if passed data will be fetched post cursor value
   */
  const fetchBots = async (showDeleted?: boolean, after?: string) => {
    try {
      setLoading(true);
      const { data, paging } = await getBots({
        after,
        limit: PAGE_SIZE,
        include: showDeleted ? 'deleted' : 'non-deleted',
      });
      setPaging(paging);
      setBotUsers(data);
    } catch (error) {
      showErrorToast((error as AxiosError).message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * List of columns to be shown in the table
   */
  const columns: ColumnsType<Bot> = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'displayName',
        key: 'displayName',
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
      },
      {
        title: 'Actions',
        dataIndex: 'id',
        key: 'id',
        width: 90,
        render: (_, record) => (
          <Space align="center" size={8}>
            <Tooltip placement="bottom" title="Delete">
              <Button
                icon={
                  <SVGIcons
                    alt="Delete"
                    className="tw-w-4"
                    icon={Icons.DELETE}
                  />
                }
                type="text"
                onClick={() => setSelectedUser(record)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    []
  );

  /**
   *
   * @param cursorValue - represents pagination value
   */
  const handlePageChange = (cursorValue: string | number) => {
    setCurrentPage(cursorValue as number);
  };

  /**
   * handle after delete bot action
   */
  const handleDeleteAction = useCallback(async () => {
    fetchBots();
  }, [selectedUser]);

  // Fetch initial bot
  useEffect(() => {
    setBotUsers([]);
    fetchBots(showDeleted);
  }, [showDeleted]);

  return (
    <>
      <Row>
        <Col span={24}>
          <Table
            columns={columns}
            dataSource={botUsers}
            loading={{
              spinning: loading,
              indicator: <Loader size="small" />,
            }}
            pagination={false}
            size="small"
          />
        </Col>
        <Col span={24}>
          {paging.total > PAGE_SIZE && (
            <NextPrevious
              currentPage={currentPage}
              pageSize={PAGE_SIZE}
              paging={paging}
              pagingHandler={handlePageChange}
              totalCount={paging.total}
            />
          )}
        </Col>
      </Row>

      <DeleteWidgetModal
        afterDeleteAction={handleDeleteAction}
        entityId={selectedUser?.id || ''}
        entityName={selectedUser?.displayName || ''}
        entityType={EntityType.BOT}
        visible={Boolean(selectedUser)}
        onCancel={() => {
          setSelectedUser(undefined);
        }}
      />
    </>
  );
};

export default BotListV1;
