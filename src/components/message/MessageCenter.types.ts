import type { MessageDropdownItem, MessageTab } from "@/stores/useMessageNotificationStore";

export type PrivateMessagePayload = {
  urls?: string[];
  imageUrl?: string;
  url?: string;
  [key: string]: unknown;
};

export type PrivateHistoryItem = {
  id: number;
  senderId?: number;
  receiverId?: number;
  content?: string;
  createdAt?: string;
  isRead?: boolean;
  messageKind?: string;
  payload?: PrivateMessagePayload;
  recalledAt?: string;
  recallReason?: string;
  isRecalled?: boolean;
};

export type PrivateRealtimePayload = Pick<
  PrivateHistoryItem,
  | "id"
  | "content"
  | "senderId"
  | "receiverId"
  | "createdAt"
  | "isRead"
  | "messageKind"
  | "payload"
  | "recalledAt"
  | "recallReason"
  | "isRecalled"
>;

export type ComposerImageItem = {
  id: string;
  previewUrl: string;
  uploadedUrl?: string;
  uploading: boolean;
  fileName: string;
};

export type MessageCenterTabItem = {
  value: MessageTab;
  label: string;
};

export type MessageCenterCopy = {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  chatList: string;
  detailPlaceholder: string;
  privatePlaceholder: string;
  noConversation: string;
  noMessages: string;
  noResults: string;
  markAll: string;
  privateHeader: string;
  notificationHeader: string;
  realtime: string;
  emptyThread: string;
  lastSeenRecently: string;
  composerPlaceholder: string;
  unreadSuffix: string;
  uploadImage: string;
  removeImage: string;
  uploadingImage: string;
  imageMessage: string;
  jumpToLatest: string;
  newMessagesSuffix: string;
  online: string;
  recall: string;
  recalledMessage: string;
  recalledMessageByOther: string;
  recalledPreview: string;
  recallReasonDefault: string;
  imageOnlyPreview: string;
};

export type PrivateUserStatus = {
  userId: number;
  isOnline: boolean;
  lastSeenAt?: string | null;
};

export type MessageConversationListProps = {
  copy: MessageCenterCopy;
  filteredMessages: MessageDropdownItem[];
  isLoading: boolean;
  isMobileDetailOpen: boolean;
  locale: string;
  search: string;
  selectedItemId: number | null;
  selectedTab: MessageTab;
  onTabChange: (tab: MessageTab) => void;
  setSearch: (value: string) => void;
  setSelectedItemId: (value: number | null) => void;
  socketConnected: boolean;
  tabs: MessageCenterTabItem[];
  tCommon: (key: string) => string;
  tMsg: (key: string, values?: Record<string, string | number | Date>) => string;
  tTime: (key: string, values?: Record<string, string | number | Date>) => string;
};

export type MessageDetailPaneProps = {
  composerValue: string;
  composerImages: ComposerImageItem[];
  copy: MessageCenterCopy;
  detailLoading: boolean;
  hasMoreHistory: boolean;
  isMobileDetailOpen: boolean;
  groupedPrivateHistory: Array<{
    item: PrivateHistoryItem;
    showDayDivider: boolean;
    dayLabel: string;
  }>;
  handleRecallPrivateMessage: (messageId: number) => Promise<void>;
  handleSendPrivateMessage: () => Promise<void>;
  isLoadingOlderHistory: boolean;
  isSending: boolean;
  isUploadingImages: boolean;
  locale: string;
  markAllAsRead: (tab?: MessageTab) => Promise<void>;
  onBlockSelectedUser: () => Promise<void>;
  onPickComposerImages: (files: FileList | null) => void;
  onLoadOlderHistory: () => Promise<void>;
  onRemoveComposerImage: (id: string) => void;
  onReportSelectedUser: (payload: {
    category: "SPAM" | "ABUSE" | "INAPPROPRIATE" | "COPYRIGHT" | "OTHER";
    reason: string;
  }) => Promise<void>;
  onBackToList: () => void;
  blockSubmitting: boolean;
  reportSubmitting: boolean;
  selectedItem: MessageDropdownItem | null;
  selectedUserStatus: PrivateUserStatus | null;
  selectedTab: MessageTab;
  setComposerValue: (value: string) => void;
  tCommon: (key: string) => string;
  tMsg: (key: string, values?: Record<string, string | number | Date>) => string;
  tTime: (key: string, values?: Record<string, string | number | Date>) => string;
  unreadCount: number;
  userId?: string | number;
};
