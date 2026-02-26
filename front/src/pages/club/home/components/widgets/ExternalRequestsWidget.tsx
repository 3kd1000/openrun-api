import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clubService, type ExternalRequestResponse } from '../../../../../services/clubService';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserPlusIcon,
} from '../../../../../components/common/Icons';
import { logError } from '../../../../../utils/errorHandler';

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

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'JOIN': return 'bg-blue-100 text-blue-700';
      case 'GUEST': return 'bg-green-100 text-green-700';
      case 'INTERCLUB': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
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
    <div className="border border-border rounded-xl bg-white p-4">
      <div className="flex items-center justify-between">
        <button
          className="flex items-center gap-2 bg-transparent border-none py-2 cursor-pointer text-foreground hover:text-primary transition-colors"
          onClick={handleToggleExpand}
        >
          <UserPlusIcon size={16} />
          <span className="text-sm font-semibold">외부 요청</span>
          {requests.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white rounded-full text-xs font-semibold">
              {requests.length}
            </span>
          )}
          {isExpanded ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}
        </button>
        <button
          className="flex items-center gap-2 bg-transparent border-none py-2 px-3 text-muted-foreground text-sm cursor-pointer hover:text-primary transition-colors"
          onClick={handleViewAll}
        >
          전체보기
          <ChevronRightIcon size={14} />
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3">
          {isLoading && (
            <div className="py-3 text-center text-muted-foreground text-sm">
              불러오는 중...
            </div>
          )}

          {!isLoading && requests.length === 0 && (
            <div className="py-3 text-center text-muted-foreground text-sm">
              대기 중인 요청이 없습니다
            </div>
          )}

          {!isLoading && requests.length > 0 && (
            <div className="flex flex-col gap-2">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center gap-3 py-3 px-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors text-sm min-h-[44px]"
                  onClick={() => handleItemClick(request)}
                >
                  <span
                    className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${getTypeBadgeColor(request.type)}`}
                  >
                    {getTypeLabel(request.type)}
                  </span>
                  <span className="flex-1 text-foreground font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                    {request.requesterName}
                  </span>
                  <span className="text-muted-foreground text-xs whitespace-nowrap">
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
