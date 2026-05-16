import { useUserInfo } from '@/hooks/useAuth';
import { Group, GroupMember } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, ScrollView, Text, View } from 'react-native';

interface GroupInfoProps {
    group: Group;
}

function InfoRow({
    icon,
    iconColor,
    title,
    value,
    isLast,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    title: string;
    value: string;
    isLast?: boolean;
}) {
    return (
        <View
            className={`flex-row items-center py-3.5 ${!isLast ? 'border-b border-white/[0.06]' : ''}`}
        >
            <View className="w-10 h-10 rounded-xl bg-indigo-500/10 items-center justify-center mr-3">
                <Ionicons name={icon} size={18} color={iconColor} />
            </View>
            <View className="flex-1">
                <Text className="text-slate-100 text-[14px] font-semibold">{title}</Text>
                <Text className="text-slate-500 text-xs mt-0.5 leading-relaxed">{value}</Text>
            </View>
        </View>
    );
}

function MemberItem({
    member,
    isCurrentUser,
    isOwner,
}: {
    member: GroupMember;
    isCurrentUser?: boolean;
    isOwner?: boolean;
}) {
    const initial = member.user.name?.charAt(0)?.toUpperCase() || 'U';

    return (
        <View className="flex-row items-center py-3 mb-2 rounded-2xl bg-white/[0.04] border border-white/[0.06] px-3">
            <LinearGradient
                colors={['#6366f1', '#4f46e5']}
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    padding: 2,
                    marginRight: 12,
                }}
            >
                <View className="flex-1 rounded-full overflow-hidden bg-[#0D1117] items-center justify-center">
                    {member.user?.profilePic ? (
                        <Image
                            source={{ uri: member.user.profilePic }}
                            style={{ width: 40, height: 40, borderRadius: 20 }}
                        />
                    ) : (
                        <Text className="text-white font-bold text-base">{initial}</Text>
                    )}
                </View>
            </LinearGradient>

            <View className="flex-1 min-w-0">
                <View className="flex-row items-center flex-wrap gap-1.5">
                    <Text className="text-slate-100 text-[15px] font-semibold" numberOfLines={1}>
                        {member.user.name || 'Unknown'}
                    </Text>
                    {isCurrentUser && (
                        <View className="bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                            <Text className="text-indigo-300 text-[10px] font-bold">YOU</Text>
                        </View>
                    )}
                </View>
                <Text className="text-slate-500 text-xs mt-0.5" numberOfLines={1}>
                    {member.user.email}
                </Text>
            </View>

            <View className="flex-row items-center gap-1.5 ml-1">
                {isOwner && (
                    <View className="flex-row items-center bg-amber-500/15 border border-amber-500/25 px-2 py-1 rounded-lg">
                        <Ionicons name="star" size={12} color="#fbbf24" />
                        <Text className="text-amber-300 text-[10px] font-bold ml-0.5">Owner</Text>
                    </View>
                )}
                {member.role === 'admin' && !isOwner && (
                    <View className="flex-row items-center bg-violet-500/15 border border-violet-500/25 px-2 py-1 rounded-lg">
                        <Ionicons name="shield-checkmark" size={12} color="#a78bfa" />
                        <Text className="text-violet-300 text-[10px] font-bold ml-0.5">Admin</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

export default function GroupInfo({ group }: GroupInfoProps) {
    const { data: userInfo } = useUserInfo();
    const members = group.members || [];
    const admins = members.filter((m) => m.role === 'admin');
    const participants = members.filter((m) => m.role === 'participant');
    const initial = group.name?.charAt(0)?.toUpperCase() || 'G';

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <ScrollView
            className="flex-1"
            style={{ backgroundColor: '#12151F' }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 28 }}
        >
            {/* Hero */}
            <View className="items-center px-6 pt-2 pb-6">
                <LinearGradient
                    colors={['#7c3aed', '#4f46e5', '#6366f1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                        width: 96,
                        height: 96,
                        borderRadius: 48,
                        padding: 3,
                        marginBottom: 14,
                    }}
                >
                    <View className="flex-1 rounded-full overflow-hidden bg-[#0D1117] items-center justify-center">
                        {group.profilePic ? (
                            <Image
                                source={{ uri: group.profilePic }}
                                style={{ width: 90, height: 90, borderRadius: 45 }}
                            />
                        ) : (
                            <LinearGradient
                                colors={['#4f46e5', '#7c3aed']}
                                style={{
                                    width: 90,
                                    height: 90,
                                    borderRadius: 45,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Text className="text-white text-4xl font-bold">{initial}</Text>
                            </LinearGradient>
                        )}
                    </View>
                </LinearGradient>

                <Text className="text-indigo-400 text-[10px] font-semibold tracking-[2.5px] uppercase mb-2">
                    Group info
                </Text>
                <Text className="text-white text-2xl font-bold tracking-tight text-center">
                    {group.name}
                </Text>

                {group.description ? (
                    <Text className="text-slate-400 text-sm text-center mt-2 px-4 leading-relaxed">
                        {group.description}
                    </Text>
                ) : null}

                <View className="flex-row items-center mt-4 bg-indigo-500/15 border border-indigo-500/25 rounded-full px-4 py-2 gap-2">
                    <Ionicons name="people" size={16} color="#818cf8" />
                    <Text className="text-indigo-300 text-sm font-semibold">
                        {members.length} {members.length === 1 ? 'member' : 'members'}
                    </Text>
                </View>

                <View className="flex-row items-center mt-3 gap-2">
                    <Ionicons name="person-circle-outline" size={14} color="#64748b" />
                    <Text className="text-slate-500 text-xs">
                        Created by {group.createdBy?.name || 'Unknown'}
                    </Text>
                </View>
            </View>

            {/* Settings */}
            <View className="px-4 mb-4">
                <Text className="text-[10px] font-semibold tracking-widest uppercase text-slate-500 mb-3 px-2">
                    Permissions
                </Text>
                <View className="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4">
                    <InfoRow
                        icon={group.settings?.isPrivate ? 'lock-closed' : 'lock-open'}
                        iconColor={group.settings?.isPrivate ? '#a78bfa' : '#34d399'}
                        title="Privacy"
                        value={
                            group.settings?.isPrivate
                                ? 'Only admins can edit group details'
                                : 'Members can edit group details'
                        }
                    />
                    <InfoRow
                        icon={group.settings?.allowMemberInvite ? 'person-add' : 'person-remove'}
                        iconColor={group.settings?.allowMemberInvite ? '#34d399' : '#f87171'}
                        title="Member invites"
                        value={
                            group.settings?.allowMemberInvite
                                ? 'Members can invite others'
                                : 'Only admins can invite'
                        }
                    />
                    <InfoRow
                        icon={
                            group.settings?.adminOnlyMessages
                                ? 'chatbubble-ellipses'
                                : 'chatbubbles'
                        }
                        iconColor={group.settings?.adminOnlyMessages ? '#fb923c' : '#34d399'}
                        title="Messages"
                        value={
                            group.settings?.adminOnlyMessages
                                ? 'Only admins can send messages'
                                : 'All members can send messages'
                        }
                    />
                    {group.createdAt && (
                        <InfoRow
                            icon="calendar-outline"
                            iconColor="#94a3b8"
                            title="Created"
                            value={formatDate(group.createdAt)}
                            isLast
                        />
                    )}
                </View>
            </View>

            {/* Members */}
            <View className="px-4">
                <View className="flex-row items-center justify-between mb-3 px-2">
                    <Text className="text-[10px] font-semibold tracking-widest uppercase text-slate-500">
                        Members
                    </Text>
                    <Text className="text-slate-600 text-xs">{members.length} total</Text>
                </View>

                {admins.length > 0 && (
                    <View className="mb-4">
                        <Text className="text-indigo-400/90 text-xs font-semibold mb-2 px-2">
                            Administrators · {admins.length}
                        </Text>
                        {admins.map((member) => (
                            <MemberItem
                                key={member._id}
                                member={member}
                                isCurrentUser={member.user._id === userInfo?._id}
                                isOwner={member.user._id === group.createdBy._id}
                            />
                        ))}
                    </View>
                )}

                {participants.length > 0 && (
                    <View>
                        <Text className="text-slate-500 text-xs font-semibold mb-2 px-2">
                            Participants · {participants.length}
                        </Text>
                        {participants.map((member) => (
                            <MemberItem
                                key={member._id}
                                member={member}
                                isCurrentUser={member.user._id === userInfo?._id}
                            />
                        ))}
                    </View>
                )}

                {members.length === 0 && (
                    <View className="items-center py-10 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                        <Ionicons name="people-outline" size={32} color="#475569" />
                        <Text className="text-slate-500 text-sm mt-3">No members to show</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}
