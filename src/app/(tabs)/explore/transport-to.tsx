import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TRANSLATION_KEYS } from '../../../constants/translationKeys';
import { TransportPlacePicker } from '../../../components/transportSearch/TransportPlacePicker';
import { useTransportSearch } from '../../../context/TransportSearchContext';
import { goBack } from '../../../utilities/navigation';

export default function TransportToPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const { params, setTo } = useTransportSearch();

    return (
        <TransportPlacePicker
            title={t(TRANSLATION_KEYS.TRANSPORT.TO)}
            selectedId={params.to?.id}
            onChoose={(place) => {
                setTo(place);
                goBack(router);
            }}
        />
    );
}
