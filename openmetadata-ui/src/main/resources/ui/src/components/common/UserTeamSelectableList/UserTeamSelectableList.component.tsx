/*
 *  Copyright 2023 Collate.
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
import { Button, Popover, Space, Tabs, Tooltip, Typography } from 'antd';
import { ReactComponent as EditIcon } from 'assets/svg/edit-new.svg';
import { WILD_CARD_CHAR } from 'constants/char.constants';
import { PAGE_SIZE_MEDIUM, pagingObject } from 'constants/constants';
import { NO_PERMISSION_FOR_ACTION } from 'constants/HelperTextUtil';
import { EntityType } from 'enums/entity.enum';
import { SearchIndex } from 'enums/search.enum';
import { EntityReference } from 'generated/entity/data/table';
import { Paging } from 'generated/type/paging';
import { isEmpty, isEqual, noop, toString } from 'lodash';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { searchData } from 'rest/miscAPI';
import { getUsers } from 'rest/userAPI';
import { formatTeamsResponse, formatUsersResponse } from 'utils/APIUtils';
import { getCountBadge } from 'utils/CommonUtils';
import {
  getEntityName,
  getEntityReferenceListFromEntities,
} from 'utils/EntityUtils';
import SVGIcons, { Icons } from 'utils/SvgUtils';
import { SelectableList } from '../SelectableList/SelectableList.component';
import './user-team-selectable-list.less';
import { UserSelectDropdownProps } from './UserTeamSelectableList.interface';

export const UserTeamSelectableList = ({
  hasPermission,
  owner,
  onUpdate = noop,
  children,
}: UserSelectDropdownProps) => {
  const { t } = useTranslation();
  const [popupVisible, setPopupVisible] = useState(false);
  const [userPaging, setUserPaging] = useState<Paging>(pagingObject);
  const [teamPaging, setTeamPaging] = useState<Paging>(pagingObject);
  const [activeTab, setActiveTab] = useState<'teams' | 'users'>('teams');

  const fetchUserOptions = async (searchText: string, after?: string) => {
    if (searchText) {
      try {
        const res = await searchData(
          searchText,
          1,
          PAGE_SIZE_MEDIUM,
          'isBot:false',
          '',
          '',
          SearchIndex.USER
        );

        const data = getEntityReferenceListFromEntities(
          formatUsersResponse(res.data.hits.hits),
          EntityType.USER
        );
        setUserPaging({ total: res.data.hits.total.value });

        return { data, paging: { total: res.data.hits.total.value } };
      } catch (error) {
        return { data: [], paging: { total: 0 } };
      }
    } else {
      try {
        const { data, paging } = await getUsers(
          '',
          PAGE_SIZE_MEDIUM,
          after
            ? {
                after,
              }
            : undefined,
          undefined,
          false
        );
        const filterData = getEntityReferenceListFromEntities(
          data,
          EntityType.USER
        );
        setUserPaging(paging);

        return { data: filterData, paging };
      } catch (error) {
        return { data: [], paging: { total: 0 } };
      }
    }
  };

  const fetchTeamOptions = async (searchText: string, after?: string) => {
    const afterPage = isNaN(Number(after)) ? 1 : Number(after);

    if (searchText) {
      try {
        const res = await searchData(
          searchText,
          afterPage,
          PAGE_SIZE_MEDIUM,
          'teamType:Group',
          '',
          '',
          SearchIndex.TEAM
        );

        const data = getEntityReferenceListFromEntities(
          formatTeamsResponse(res.data.hits.hits),
          EntityType.TEAM
        );

        setTeamPaging({ total: res.data.hits.total.value });

        return {
          data,
          paging: {
            total: res.data.hits.total.value,
            after: toString(afterPage + 1),
          },
        };
      } catch (error) {
        return { data: [], paging: { total: 0 } };
      }
    } else {
      try {
        const { data } = await searchData(
          WILD_CARD_CHAR,
          afterPage,
          PAGE_SIZE_MEDIUM,
          'teamType:Group',
          '',
          '',
          SearchIndex.TEAM
        );

        const filterData = getEntityReferenceListFromEntities(
          formatTeamsResponse(data.hits.hits),
          EntityType.TEAM
        );

        setTeamPaging({
          total: data.hits.total.value,
          after: toString(afterPage + 1),
        });

        return {
          data: filterData,
          paging: {
            total: data.hits.total.value,
            after: toString(afterPage + 1),
          },
        };
      } catch (error) {
        return { data: [], paging: { total: 0 } };
      }
    }
  };

  const handleUpdate = (updateItems: EntityReference[]) => {
    onUpdate(
      isEmpty(updateItems)
        ? undefined
        : {
            id: updateItems[0].id,
            type: activeTab === 'teams' ? EntityType.TEAM : EntityType.USER,
            name: updateItems[0].name,
            displayName: updateItems[0].displayName,
          }
    );
    setPopupVisible(false);
  };

  // Fetch and store count for Users tab
  const getUserCount = async () => {
    const res = await searchData(
      '',
      1,
      0,
      'isBot:false',
      '',
      '',
      SearchIndex.USER
    );

    setUserPaging({ total: res.data.hits.total.value });
  };

  // To pre-cache user total count
  useEffect(() => {
    if (popupVisible && isEqual(userPaging, pagingObject)) {
      getUserCount();
    }
  }, [popupVisible]);

  useEffect(() => {
    if (owner?.type === EntityType.USER) {
      setActiveTab('users');
    } else {
      setActiveTab('teams');
    }
  }, [owner]);

  return (
    <Popover
      destroyTooltipOnHide
      content={
        <Tabs
          centered
          activeKey={activeTab}
          className="select-owner-tabs"
          destroyInactiveTabPane={false}
          items={[
            {
              label: (
                <>
                  {t('label.team-plural')}{' '}
                  {getCountBadge(teamPaging.total, '', activeTab === 'teams')}
                </>
              ),
              key: 'teams',
              children: (
                <SelectableList
                  customTagRenderer={TeamListItemRenderer}
                  fetchOptions={fetchTeamOptions}
                  searchPlaceholder={t('label.search-for-type', {
                    type: t('label.team'),
                  })}
                  selectedItems={owner?.type === EntityType.TEAM ? [owner] : []}
                  onCancel={() => setPopupVisible(false)}
                  onUpdate={handleUpdate}
                />
              ),
            },
            {
              label: (
                <>
                  {t('label.user-plural')}
                  {getCountBadge(userPaging.total, '', activeTab === 'users')}
                </>
              ),
              key: 'users',
              children: (
                <SelectableList
                  fetchOptions={fetchUserOptions}
                  searchPlaceholder={t('label.search-for-type', {
                    type: t('label.user'),
                  })}
                  selectedItems={owner?.type === EntityType.USER ? [owner] : []}
                  onCancel={() => setPopupVisible(false)}
                  onUpdate={handleUpdate}
                />
              ),
            },
          ]}
          size="small"
          onChange={(key: string) => setActiveTab(key as 'teams' | 'users')}
        />
      }
      open={popupVisible}
      overlayClassName="user-team-select-popover card-shadow"
      placement="bottomRight"
      showArrow={false}
      trigger="click"
      onOpenChange={setPopupVisible}>
      {children ? (
        children
      ) : (
        <Tooltip
          placement="topRight"
          title={hasPermission ? 'Update Owner' : NO_PERMISSION_FOR_ACTION}>
          <Button
            className="flex-center p-0"
            data-testid="edit-owner"
            disabled={!hasPermission}
            icon={<EditIcon width="14px" />}
            size="small"
            type="text"
            onClick={() => setPopupVisible(true)}
          />
        </Tooltip>
      )}
    </Popover>
  );
};

export const TeamListItemRenderer = (props: EntityReference) => {
  return (
    <Space>
      <SVGIcons icon={Icons.TEAMS_GREY} />
      <Typography.Text>{getEntityName(props)}</Typography.Text>
    </Space>
  );
};
