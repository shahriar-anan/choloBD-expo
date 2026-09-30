import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { TransportPlacePicker } from '../../../components/transportSearch/TransportPlacePicker';
import { useTransportSearch } from '../../../context/TransportSearchContext';

export default function TransportFromPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const { params, setFrom } = useTransportSearch();

    return (
        <TransportPlacePicker
            title={t(TRANSLATION_KEYS.TRANSPORT.FROM)}
            selectedId={params.from?.id}
            onChoose={(place) => {
                setFrom(place);
                router.back();
            }}
        />
    );
}
