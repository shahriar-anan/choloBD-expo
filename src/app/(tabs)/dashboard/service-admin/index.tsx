import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AdminCard } from '../../../../components/ui/adminCard';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store/store';
import { useServiceAdminLogic } from '../../../../hooks/useServiceAdminLogic';
import theme from '../../../../constants/theme';
import { useTheme } from '../../../../hooks/useTheme';

export default function ServiceAdminIndex() {
  const router = useRouter();
  const auth = useSelector((s: RootState) => s.auth);
  const { isDark } = useTheme();
  const { fetchProfile, fetchMyHotel } = useServiceAdminLogic();
  const [hotels, setHotels] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        console.log('[ServiceAdminIndex] ▶️ Starting load...');
        console.log('[ServiceAdminIndex] auth.user?.id:', auth.user?.id);
        
        if (!auth.user?.id) {
          console.log('[ServiceAdminIndex] ❌ No user ID found');
          return;
        }

        // Step 1: Fetch profile (for debugging)
        console.log('[ServiceAdminIndex] 🔄 Fetching profile...');
        const profile = await fetchProfile();
        console.log('[ServiceAdminIndex] ✅ Profile received:', {
          serviceType: profile?.serviceType,
          serviceEntityId: profile?.serviceEntityId,
          userId: profile?.id,
          fullProfile: profile
        });

        // Step 2: Try to fetch hotels regardless of profile status
        console.log('[ServiceAdminIndex] Fetching hotels from GET /api/hotels/my (JWT-based)...');
        const res = await fetchMyHotel();
        console.log('[ServiceAdminIndex] ✅ Hotels API response:', {
          isArray: Array.isArray(res),
          length: Array.isArray(res) ? res.length : 'N/A',
          data: res
        });
        
        if (!res) {
          console.log('[ServiceAdminIndex] ⚠️ Response is null/undefined');
          
          // Check profile for debugging
          if (!profile || !profile.serviceType) {
            setMessage('❌ Service admin not properly configured. Contact support with ID: ' + auth.user.id);
          } else {
            setMessage('Hotel response is empty');
          }
          setHotels([]);
          return;
        }

        // Handle both array (SERVICE_ADMIN) and single object (EMPLOYEE) responses
        const hotelsList = Array.isArray(res) ? res : (res ? [res] : []);
        console.log('[ServiceAdminIndex] 📊 Processed hotels list:', {
          count: hotelsList.length,
          hotels: hotelsList.map((h: any) => ({ id: h.id, name: h.name }))
        });
        
        if (hotelsList.length === 0) {
          console.log('[ServiceAdminIndex] ⚠️ No hotels in response');
          setMessage('No hotels assigned. Profile serviceType: ' + (profile?.serviceType || 'null'));
          setHotels([]);
          return;
        }

        console.log('[ServiceAdminIndex] ✅ Setting', hotelsList.length, 'hotels to state');
        setHotels(hotelsList);
        setMessage(null);
      } catch (e: any) {
        console.error('[ServiceAdminIndex] ❌ Error:', {
          message: e.message,
          status: e?.response?.status,
          data: e?.response?.data,
          fullError: e
        });
        if (e?.response?.status === 404) {
          setMessage('❌ Hotels endpoint not found or no hotels assigned');
        } else if (e?.response?.status === 401) {
          setMessage('❌ Authentication failed - please re-login');
        } else {
          setMessage(`❌ Failed to load hotel: ${e?.response?.data?.message || e.message}`);
        }
        setHotels([]);
      } finally {
        setLoading(false);
        console.log('[ServiceAdminIndex] ✅ Load complete');
      }
    };
    load();
  }, [auth.user?.id, fetchMyHotel]);

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="px-6 pt-6 pb-8">
          <Text className="text-2xl font-bold text-text dark:text-text-dark">My Hotels</Text>
          <Text className="text-sm text-muted dark:text-muted-dark mt-1">Tap a hotel to view details and manage bookings</Text>

          {loading ? (
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text className="mt-3 text-sm text-muted dark:text-muted-dark">Loading hotels...</Text>
            </View>
          ) : message ? (
            <View className="p-4 mt-6 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
              <Text className="text-sm text-red-700 dark:text-red-200">{message}</Text>
            </View>
          ) : hotels.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Text className="text-lg font-semibold text-text dark:text-text-dark">No hotels found</Text>
              <Text className="mt-2 text-sm text-muted dark:text-muted-dark">Your hotel list is empty</Text>
            </View>
          ) : (
            <View className="mt-6 space-y-3">
              {hotels.map((hotel) => (
                <AdminCard
                  key={hotel.id}
                  title={hotel.name ?? 'Unnamed Hotel'}
                  subtitle={hotel.location?.name ?? '—'}
                  onPress={() => router.push(`/(tabs)/dashboard/service-admin/hotel-info?hotelId=${hotel.id}`)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
