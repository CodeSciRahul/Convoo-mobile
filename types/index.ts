// =============================================================================
// USER & AUTHENTICATION TYPES
// =============================================================================

export interface User {
    _id: string;
    profilePic?: string;
    name: string;
    email: string;
    mobile?: string;
    isVerified: boolean;
    googleId: string | null;
    facebookId: string | null;
    linkedinId: string | null;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface AuthUser {
    _id: string | null;
    name: string | null;
    profilePic?: string;
    email: string | null;
    mobile?: string | null;
    isVerified: boolean;
    googleId: string | null;
    facebookId: string | null;
    linkedinId: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  }
  
  export interface LoginSignupResponse {
    user: AuthUser;
    token: string | null;
  }
  
  export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface SignupRequest {
    email: string;
    password: string;
    mobile?: string | null;
    name: string;
  }
  
  export interface LoginResponse {
    message: string;
    user: User;
    token: string;
  }
  
  export interface SignupResponse {
    message: string;
    id: string;
  }
  
  export interface LoginFormInputs {
    email: string;
    password: string;
  }
  
  export interface SignupFormInputs {
    name: string;
    email: string;
    mobile?: string | null;
    password: string;
  } 
  
  // =============================================================================
  // RECEIVER & CONTACT TYPES
  // =============================================================================
  
  export interface Receiver {
    _id: string;
    name: string;
    email: string;
    mobile?: string | null;
    profilePic: string;
    conversationId: string;
    lastMessage: {
      _id: string;
    content?: string;
    fileUrl?: string | null;
    fileType?: string | null;
    createdAt?: string;
    messageType?: "private" | "group" | null;
    };
    lastMessageTimestamp: string;
    unreadCount: number;
  }
  
  export type Receivers = Receiver[];
  
  export interface ReceiverState {
    _id: string | null;
    name: string | null;
    email: string | null;
    mobile?: string | null;
    selectionType?: "user" | "group" | null;
  }
  
  // =============================================================================
  // MESSAGE TYPES
  // =============================================================================
  
  export interface Reaction {
    _id: string
    user: {
      _id: string;
      name: string;
      email: string;
    };
    emoji: string;
    timestamp: Date;
  }
  
  export interface ServerMessage {
    _id: string;
    sender: {
      _id: string;
      name: string;
      email: string;
    };
    receiver: {
      _id: string;
      name: string;
      email: string;
    };
    content?: string;
    fileUrl?: string;
    fileType?: string;
    timestamp: string;
    createdAt: string;
    updatedAt: string;
    groupId?: string
    messageType?: "private" | "group" | null
    replyTo?: ServerMessage | null
    reactions?: Reaction[] | null;
    deleted?: boolean | null;
    __v: number;
  }
  
  // =============================================================================
  // GROUP TYPES
  // =============================================================================
  
  export interface Group {
    _id: string;
    name: string;
    createdBy: {
      _id: string,
      name: string,
      email: string
    }
    description?: string | null;
    profilePic?: string | null;
    settings?: GroupSettings;
    createdAt?: string;
    updatedAt?: string;
    lastMessage?: string | null;
    lastMessageTimestamp?: string;
    unreadCount?: number;
    members?: GroupMember[];
  }
  
  export interface GroupSettings {
    isPrivate?: boolean;
    allowMemberInvite?: boolean;
    adminOnlyMessages?: boolean;
  }
  
  export interface GroupMember {
    _id: string;
    user: User;
    role: "admin" | "participant";
    joinedAt: string;
  }
  
  export interface GroupDetails {
    _id: string;
    name: string;
    description?: string;
    profilePic?: string;
    createdBy: {
      _id: string,
      name: string,
      email: string
    }
    settings: GroupSettings;
    members: GroupMember[];
    createdAt: string;
    updatedAt: string;
  }
  
  export interface Groups {
    groups: Group[];
  }
  
  export interface CreateGroupData {
    name: string;
    description?: string;
    profilePic?: string | null;
    isPrivate?: boolean;
    allowMemberInvite?: boolean;
    adminOnlyMessages?: boolean;
    memberEmails?: string[];
  }
  
  export interface UpdateGroupData {
    name?: string;
    description?: string;
    profilePic?: string;
    settings?: GroupSettings;
  }
  
  export interface AddUserPayload {
    email?: string;
    mobile?: string;
    role?: "admin" | "participant";
  }
  
  // =============================================================================
  // MUTATION TYPES
  // =============================================================================
  
  export interface AddGroupMemberParams {
    groupId: string;
    payload: AddUserPayload;
  }
  
  export interface RemoveGroupMemberParams {
    groupId: string;
    memberId: string;
  }
  
  export interface UpdateGroupMemberRoleParams {
    groupId: string;
    memberId: string;
    role: "admin" | "participant";
  }
  
  export interface UpdateGroupParams {
    groupId: string;
    data: UpdateGroupData;
  }
  
  // =============================================================================
  // COMPONENT PROPS TYPES
  // =============================================================================
  
  export interface ProtectedRouteProps {
    isAuthenticated: boolean;
    redirectPath?: string;
    children?: React.ReactNode;
  }
  
  export interface AddMemberInlineProps {
    onAdd: (payload: AddUserPayload) => void;
  }
  
  // =============================================================================
  // REDUX STATE TYPES
  // =============================================================================
  
  export interface AuthState {
    user: AuthUser;
    token: string | null;
  }
  
  export interface CartState {
    _id: string | null;
    name: string | null;
    email: string | null;
    mobile?: string | null;
    selectionType?: "user" | "group" | null;
  }
  
  // =============================================================================
  // API RESPONSE TYPES
  // =============================================================================
  
  export interface ApiResponse<T = any> {
    data: T;
    message?: string;
    success?: boolean;
  }
  
  export interface ReceiversResponse {
    receivers: Receivers;
  }
  
  export interface GroupMembersResponse {
    members: GroupMember[];
  }
  
  export interface GroupDetailsResponse {
    group: GroupDetails;
  }
  
  // =============================================================================
  // FORM STATE TYPES
  // =============================================================================
  
  export interface GroupFormData {
    name: string;
    description: string;
    settings: {
      isPrivate: boolean;
      allowMemberInvite: boolean;
      adminOnlyMessages: boolean;
    };
  }
  
  export interface NewGroupFormData {
    name: string;
    description?: string;
    isPrivate?: boolean;
    allowMemberInvite?: boolean;
    adminOnlyMessages?: boolean;
  }
  
  // =============================================================================
  // UTILITY TYPES
  // =============================================================================
  
  export type SelectionType = "user" | "group";
  
  export type GroupRole = "admin" | "participant";
  
  export type TabType = "contacts" | "groups";
  
  // =============================================================================
  // COMPONENT STATE TYPES
  // =============================================================================
  
  export interface ChatState {
    messages: ServerMessage[];
    message: string;
    file: File | null;
    isFileUploading: boolean;
    isGroupMenuOpen: boolean;
    isGroupInfoOpen: boolean;
    isSettingsOpen: boolean;
    updateGroupData: GroupFormData;
  }
  
  
  export interface UsersState {
    emailOrMobile: string;
    receivers: Receivers | undefined;
    isloading: boolean;
    isaddLoading: boolean;
  }

  export interface formatMessageType {
    type: "message",
    data: ServerMessage,
    id: string,
  }

  export interface formatLabelType {
    type: "label",
    text: string,
    id: string,
  }