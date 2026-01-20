import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clubService, type ExternalRequestResponse } from '../../../../services/clubService';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserPlusIcon,
} from '../../../../components/common/Icons';
import { logError } from '../../../../utils/errorHandler';
import './ExternalRequestsWidget.css';

interface ExternalRequestsWidgetProps {
  clubId: number;
  maxItems?: number;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

const ExternalRequestsWidget: React.FC<ExternalRequestsWidgetProps> = ({
  clubId,
  maxItems = 5,
  defaultExpanded = true,
  expanded,
  onExpandedChange,
}) => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ExternalRequestResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isExpanded = expanded ?? internalExpanded;

  useEffect(() => {
    loadPendingRequests();
  }, [clubId]);

  const loadPendingRequests = async () => {
    try {
      setIsLoading(true);
      const data = await clubService.listExternalRequests(clubId, {
        status: 'PENDING',
      });
      setRequests(data.slice(0, maxItems));
    } catch (error: unknown) {
      logError('외부 요청 조회', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'JOIN':
        return '가입';
      case 'GUEST':
        return '게스트';
      case 'INTERCLUB':
        return '교류전';
      default:
        return type;
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'JOIN':
        return 'external-requests-widget__type-badge--join';
      case 'GUEST':
        return 'external-requests-widget__type-badge--guest';
      case 'INTERCLUB':
        return 'external-requests-widget__type-badge--interclub';
      default:
        return '';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  };

  const handleItemClick = (request: ExternalRequestResponse) => {
    navigate(`/clubs/${clubId}/manage/external-requests?type=${request.type}`);
  };

  const handleViewAll = () => {
    navigate(`/clubs/${clubId}/manage/external-requests`);
  };

  const handleToggleExpand = () => {
    const next = !isExpanded;
    if (onExpandedChange) {
      onExpandedChange(next);
      return;
    }
    setInternalExpanded(next);
  };

  return (
    <div className="external-requests-widget">
      <div className="external-requests-widget__header">
        <button
          className="external-requests-widget__header-left"
          onClick={handleToggleExpand}
        >
          <UserPlusIcon size={16} />
          <span className="external-requests-widget__title">외부 요청</span>
          {requests.length > 0 && (
            <span className="external-requests-widget__count">{requests.length}</span>
          )}
          {isExpanded ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}
        </button>
        <button
          className="external-requests-widget__view-all"
          onClick={handleViewAll}
        >
          전체보기
          <ChevronRightIcon size={14} />
        </button>
      </div>

      {isExpanded && (
        <div className="external-requests-widget__content">
          {isLoading && (
            <div className="external-requests-widget__loading">
              불러오는 중...
            </div>
          )}

          {!isLoading && requests.length === 0 && (
            <div className="external-requests-widget__empty">
              대기 중인 요청이 없습니다
            </div>
          )}

          {!isLoading && requests.length > 0 && (
            <div className="external-requests-widget__list">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="external-requests-widget__item"
                  onClick={() => handleItemClick(request)}
                >
                  <span
                    className={`external-requests-widget__type-badge ${getTypeBadgeClass(
                      request.type
                    )}`}
                  >
                    {getTypeLabel(request.type)}
                  </span>
                  <span className="external-requests-widget__requester">
                    {request.requesterName}
                  </span>
                  <span className="external-requests-widget__date">
                    {formatDate(request.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExternalRequestsWidget;
