import React, { useEffect, useState } from 'react';
import { View, Text, Image } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { theme } from '../../constants/theme';
import { profileInitial, profilePhotoUri } from '../../utilities/profileImage';

interface ProfileAvatarProps {
  imageUrl?: string | null;
  userName?: string | null;
  email?: string | null;
  size?: number;
}

export function ProfileAvatar({ imageUrl, userName, email, size = 48 }: ProfileAvatarProps) {
  const { isDark } = useTheme();
  const [failed, setFailed] = useState(false);
  const primaryColor = isDark ? theme.colors['primary-dark'] : theme.colors.primary;
  const onPrimaryColor = isDark ? theme.colors['onPrimary-dark'] : theme.colors['onPrimary'];
  const photoUri = failed ? null : profilePhotoUri(imageUrl);
  const letter = profileInitial(userName, email);

  useEffect(() => {
    setFailed(false);
  }, [imageUrl]);

  if (photoUri) {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
        <Image
          source={{ uri: photoUri }}
          style={{ width: size, height: size }}
          resizeMode="cover"
          onError={() => setFailed(true)}
          accessibilityRole="image"
          accessibilityLabel={`${userName || email || 'User'} profile photo`}
        />
      </View>
    );
  }

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`${userName || email || 'User'} profile initial`}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: primaryColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: onPrimaryColor, fontSize: Math.round(size * 0.42), fontWeight: '700' }}>
        {letter}
      </Text>
    </View>
  );
}
