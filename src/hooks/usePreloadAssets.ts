import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';

/**
 * Hook to preload fonts before the animated splash takes over.
 * Native splash visibility is owned by the root layout.
 */
export const usePreloadAssets = () => {
  const [isReady, setIsReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    // Add any custom fonts here if needed
    // 'CustomFont': require('../../assets/fonts/CustomFont.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      setIsReady(true);
    }
  }, [fontsLoaded, fontError]);

  return { isReady, fontsLoaded };
};

export default usePreloadAssets;
