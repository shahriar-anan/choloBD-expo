import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import {
  NotoSansBengali_400Regular,
  NotoSansBengali_500Medium,
  NotoSansBengali_600SemiBold,
  NotoSansBengali_700Bold,
} from '@expo-google-fonts/noto-sans-bengali';

/**
 * Hook to preload fonts before the animated splash takes over.
 * Native splash visibility is owned by the root layout.
 */
export const usePreloadAssets = () => {
  const [isReady, setIsReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    NotoSansBengali_400Regular,
    NotoSansBengali_500Medium,
    NotoSansBengali_600SemiBold,
    NotoSansBengali_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      setIsReady(true);
    }
  }, [fontsLoaded, fontError]);

  return { isReady, fontsLoaded };
};

export default usePreloadAssets;
