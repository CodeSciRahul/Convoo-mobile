import Member from "@/components/member";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createGroup, getReceivers } from "@/services/apiServices";
import { Receiver, ReceiversResponse } from "@/types";
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import * as Haptics from 'expo-haptics';
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import Toast from "react-native-toast-message";

export default function CreateGroupScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedReceivers, setSelectedReceivers] = useState<string[]>([]);
  
  const { data: receivers, isLoading } = useQuery<ReceiversResponse>({
    queryKey: ['receivers'],
    queryFn: async () => {
      const response = await getReceivers();
      return response.data as ReceiversResponse;
    },
  });

  const [groupSettings, setGroupSettings] = useState<{
    isPrivateGroup: boolean;
    allowMemberInvite: boolean;
    adminOnlyMessages: boolean;
  }>({ isPrivateGroup: false, allowMemberInvite: false, adminOnlyMessages: false });

  const {mutate: createGroupMutation, isPending: isCreatingGroup} = useMutation({
    mutationFn: async (payload: { name: string, description: string, settings: { isPrivateGroup: boolean, allowMemberInvite: boolean, adminOnlyMessages: boolean }, memberEmails: string[] }) => {
      const response = await createGroup(payload);
      return response.data;
    },
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Group created successfully' });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      router.back();
    },
    onError: (error) => {
      Toast.show({ type: 'error', text1: (error as AxiosError<{ message: string }>)?.response?.data?.message || 'Failed to create group' });
    },
  });

  function onSettingsPress(key: keyof typeof groupSettings) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGroupSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function handleNextStep() {
    if (!groupName.trim()) {
      Toast.show({ type: 'error', text1: 'Group name is required' });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentStep(2);
  }

  function handleBackStep() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentStep(1);
  }

  function handleCreateGroup() {
    if (selectedReceivers.length === 0) {
      Toast.show({ type: 'error', text1: 'Please select at least one member' });
      return;
    }
    createGroupMutation({ 
      name: groupName, 
      description: groupDescription, 
      settings: groupSettings, 
      memberEmails: selectedReceivers 
    });
  }

  function renderProgressIndicator() {
    return (
      <View className="px-4 pt-4 pb-2 bg-white dark:bg-black">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center flex-1">
            <View className={`w-8 h-8 rounded-full items-center justify-center ${currentStep >= 1 ? 'bg-blue-500' : 'bg-gray-300'}`}>
              {currentStep > 1 ? (
                <Ionicons name="checkmark" size={20} color="white" />
              ) : (
                <Text className={`text-sm font-bold ${currentStep >= 1 ? 'text-white' : 'text-gray-500'}`}>1</Text>
              )}
            </View>
            <View className={`flex-1 h-1 mx-2 ${currentStep >= 2 ? 'bg-blue-500' : 'bg-gray-300'}`} />
            <View className={`w-8 h-8 rounded-full items-center justify-center ${currentStep >= 2 ? 'bg-blue-500' : 'bg-gray-300'}`}>
              <Text className={`text-sm font-bold ${currentStep >= 2 ? 'text-white' : 'text-gray-500'}`}>2</Text>
            </View>
          </View>
        </View>
        <View className="flex-row justify-between px-2">
          <Text className={`text-xs font-semibold ${currentStep >= 1 ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`}>
            Group Info
          </Text>
          <Text className={`text-xs font-semibold ${currentStep >= 2 ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`}>
            Add Members
          </Text>
        </View>
      </View>
    );
  }

  function renderStep1() {
    return (
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-4 py-6">
          <View className="items-center justify-center mb-6">
            <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center mb-4">
              <Ionicons name="people" size={32} color="#007AFF" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Create New Group</Text>
            <Text className="text-gray-600 dark:text-gray-300">Set up your group information and preferences</Text>
          </View>

          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Group Name *</Text>
            <Input 
              placeholder="Enter group name" 
              value={groupName} 
              onChangeText={setGroupName}
              className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Description</Text>
            <Input 
              placeholder="Enter group description (optional)" 
              value={groupDescription} 
              onChangeText={setGroupDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 min-h-[80px]"
            />
          </View>

          <View className="my-6">
            <Text className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Group Settings</Text>
            
            <View className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <View className="flex-row items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center mr-3">
                    <Ionicons 
                      name={groupSettings.isPrivateGroup ? 'lock-closed' : 'lock-open'} 
                      size={20} 
                      color={groupSettings.isPrivateGroup ? '#8B5CF6' : '#10B981'} 
                    />
                  </View>
                  <View className="flex-1">
                    <Label 
                      nativeID="private-group" 
                      htmlFor="private-group" 
                      onPress={() => onSettingsPress('isPrivateGroup')}
                      className="text-base font-semibold text-gray-900 dark:text-gray-100"
                    >
                      Private Group
                    </Label>
                    <Text className="text-sm text-gray-500 dark:text-gray-400">
                      Only admins can change settings
                    </Text>
                  </View>
                </View>
                <Switch
                  checked={groupSettings.isPrivateGroup}
                  onCheckedChange={() => onSettingsPress('isPrivateGroup')}
                  id="private-group"
                  nativeID="private-group"
                  className="bg-blue-500"
                />
              </View>

              <View className="flex-row items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
                    <Ionicons 
                      name={groupSettings.allowMemberInvite ? 'person-add' : 'person-remove'} 
                      size={20} 
                      color={groupSettings.allowMemberInvite ? '#10B981' : '#EF4444'} 
                    />
                  </View>
                  <View className="flex-1">
                    <Label 
                      nativeID="allow-member-invite" 
                      htmlFor="allow-member-invite" 
                      onPress={() => onSettingsPress('allowMemberInvite')}
                      className="text-base font-semibold text-gray-900 dark:text-gray-100"
                    >
                      Allow Member Invite
                    </Label>
                    <Text className="text-sm text-gray-500 dark:text-gray-400">
                      Members can invite others
                    </Text>
                  </View>
                </View>
                <Switch
                  checked={groupSettings.allowMemberInvite}
                  onCheckedChange={() => onSettingsPress('allowMemberInvite')}
                  id="allow-member-invite"
                  nativeID="allow-member-invite"
                  className="bg-blue-500"
                />
              </View>

              <View className="flex-row items-center justify-between py-3">
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 rounded-full bg-orange-100 items-center justify-center mr-3">
                    <Ionicons 
                      name={groupSettings.adminOnlyMessages ? 'chatbubble-ellipses' : 'chatbubbles'} 
                      size={20} 
                      color={groupSettings.adminOnlyMessages ? '#F97316' : '#10B981'} 
                    />
                  </View>
                  <View className="flex-1">
                    <Label 
                      nativeID="admin-only-messages" 
                      htmlFor="admin-only-messages" 
                      onPress={() => onSettingsPress('adminOnlyMessages')}
                      className="text-base font-semibold text-gray-900 dark:text-gray-100"
                    >
                      Admin Only Messages
                    </Label>
                    <Text className="text-sm text-gray-500 dark:text-gray-400">
                      Only admins can send messages
                    </Text>
                  </View>
                </View>
                <Switch
                  checked={groupSettings.adminOnlyMessages}
                  onCheckedChange={() => onSettingsPress('adminOnlyMessages')}
                  id="admin-only-messages"
                  nativeID="admin-only-messages"
                  className="bg-blue-500"
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  function renderStep2() {
    return (
      <View className="flex-1 px-4 bg-white dark:bg-black">
        <View className="px-4 py-4 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-700">
          <View className="items-center justify-center mb-2">
            <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Add Members</Text>
            <Text className="text-gray-600 dark:text-gray-300">Select members to add to your group</Text>
          </View>
          {selectedReceivers.length > 0 && (
            <View className="mt-3 bg-blue-50 rounded-lg px-3 py-2 flex-row items-center">
              <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
              <Text className="ml-2 text-sm font-semibold text-blue-700">
                {selectedReceivers.length} {selectedReceivers.length === 1 ? 'member' : 'members'} selected
              </Text>
            </View>
          )}
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#007AFF" />
            <Text className="mt-4 text-gray-600 dark:text-gray-300">Loading contacts...</Text>
          </View>
        ) : (
          <FlatList
            data={receivers?.receivers || []}
            renderItem={({ item }: { item: Receiver }) => (
              <View className="mb-1 w-full px-4">
                <Member
                  handleSelectedReceiver={(email, isSelected) => {
                    setSelectedReceivers((prev) => {
                      if (isSelected) {
                        if (!prev.includes(email)) {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          return [...prev, email];
                        }
                      } else {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        return prev.filter((e) => e !== email);
                      }
                      return prev;
                    });
                  }}
                  receiver={item}
                  key={item._id}
                />
              </View>
            )}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => item._id}
            ListEmptyComponent={
              <View className="items-center justify-center py-12 px-4">
                <Ionicons name="people-outline" size={64} color="#D1D5DB" />
                <Text className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">No members found</Text>
              </View>
            }
          />
        )
      }
      </View>
    );
  }

  return (
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} 
      className="flex-1 px-4 bg-white dark:bg-black">
        {renderProgressIndicator()}
        {currentStep === 1 ? renderStep1() : renderStep2()}

        <View className="px-4 py-4 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-700">
          <View className="flex-row gap-3">
            {currentStep === 2 && <Button
              variant="outline"
              className="flex-1 py-3 rounded-lg border-gray-300 dark:border-gray-600"
              onPress={handleBackStep}
              disabled={isCreatingGroup}
            >
              <Text className="text-center text-gray-700 dark:text-gray-200 font-semibold">Back</Text>
            </Button>}

              {currentStep === 1 ? (<Button
                className="flex-1 bg-blue-500 py-3 rounded-lg"
                onPress={handleNextStep}
              >
                <Text className="text-center text-white font-bold">Next</Text>
              </Button>) : (<Button
                className="flex-1 bg-blue-500 py-3 rounded-lg"
                onPress={handleCreateGroup}
                disabled={isCreatingGroup || !groupName.trim()}
              >
                <Text className="text-center text-white font-bold">Create Group</Text>
              </Button>)}
          </View>
        </View>
      </KeyboardAvoidingView>
  );
}