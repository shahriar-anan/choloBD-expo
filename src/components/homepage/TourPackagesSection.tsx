import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../constants/translationKeys';
import { TourPackage } from '../../types/tours';
import TourPackageCard from './TourPackageCard';
import { HomeFeedStatus, HomeSectionHeader } from './HomeSectionHeader';

interface TourPackagesSectionProps {
  packages: TourPackage[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export default function TourPackagesSection({ packages, isLoading, error, onRetry }: TourPackagesSectionProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const visible = packages.slice(0, 4);
  const [lead, ...rest] = visible;

  if (!isLoading && !error && visible.length === 0) return null;

  const openPackage = (id: string) => {
    router.push({ pathname: '/tour-package-detail', params: { id } });
  };

  return (
    <View style={{ paddingTop: 22, paddingBottom: 4, paddingHorizontal: 16 }}>
      <HomeSectionHeader
        title={t(TRANSLATION_KEYS.HOME.FEATURED_HOLIDAYS)}
        onSeeAll={visible.length > 0 ? () => router.push('/(tabs)/explore/tour-list') : undefined}
      />
      <HomeFeedStatus isLoading={isLoading} error={error} onRetry={onRetry} />
      {!isLoading && !error && lead ? (
        <View>
          <TourPackageCard tourPackage={lead} layout="cover" onPress={() => openPackage(lead.id)} />
          {rest.map((pkg) => (
            <TourPackageCard key={pkg.id} tourPackage={pkg} layout="row" onPress={() => openPackage(pkg.id)} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
