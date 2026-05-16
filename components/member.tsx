import { Receiver } from '@/types';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Checkbox } from './ui/checkbox';
import { Text } from './ui/text';

interface MemberProps {
    receiver: Receiver;
    handleSelectedReceiver: (email: string, isSelected: boolean) => void;
}

export default function Member({ receiver, handleSelectedReceiver }: MemberProps) {
    const [checked, setChecked] = useState(false);

    const toggleChecked = async () => {
        const newCheckedState = !checked;

        if (newCheckedState) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setTimeout(() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }, 50);
        } else {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        setChecked(newCheckedState);
        handleSelectedReceiver(receiver.email, newCheckedState);
    };

    return (
        <TouchableOpacity activeOpacity={0.85} onPress={toggleChecked}>
            <View
                className={`flex-row items-center gap-3 p-3.5 rounded-2xl border ${
                    checked
                        ? 'bg-indigo-500/15 border-indigo-500/35'
                        : 'bg-white/[0.04] border-white/[0.08]'
                }`}
            >
                <Checkbox
                    id={`checkbox-${receiver._id}`}
                    checked={checked}
                    onCheckedChange={toggleChecked}
                    checkedClassName="bg-indigo-600 border-indigo-600"
                    className="border-slate-600"
                />
                <View className="flex-1">
                    <Text className="text-slate-100 text-[15px] font-semibold">
                        {receiver.name}
                    </Text>
                    <Text className="text-slate-500 text-xs mt-0.5">{receiver.email}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}
