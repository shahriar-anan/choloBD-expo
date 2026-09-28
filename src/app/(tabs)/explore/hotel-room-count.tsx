import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { GradientAppBar, PillButton, Stepper } from '../../../components/hotelSearch/HotelFlowChrome';
import { useHotelSearch } from '../../../context/HotelSearchContext';

export default function HotelRoomCountPage() {
    const router = useRouter();
    const { params, setRoomCount } = useHotelSearch();
    const [count, setCount] = useState(params.roomCount);
    const title = count === 1 ? '1 Room' : `${count} Rooms`;

    return (
        <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
            <GradientAppBar title={title} onBack={() => router.back()} />
            <View className="flex-1 px-6 pt-6">
                <Text className="text-lg font-bold text-text dark:text-text-dark">Rooms</Text>
                <Text className="mt-1 mb-6 text-sm text-muted dark:text-muted-dark">How many rooms do you need?</Text>
                <View className="flex-row items-center justify-between">
                    <Text className="font-semibold text-text dark:text-text-dark">Rooms</Text>
                    <Stepper value={count} min={1} onChange={setCount} />
                </View>
                <Pressable onPress={() => setCount((current) => current + 1)} className="mt-6">
                    <Text className="font-semibold text-primary dark:text-primary-dark">Add another room</Text>
                </Pressable>
            </View>
            <View className="px-4 pb-4">
                <PillButton
                    label="Confirm"
                    onPress={() => {
                        setRoomCount(count);
                        router.back();
                    }}
                />
            </View>
        </SafeAreaView>
    );
}
