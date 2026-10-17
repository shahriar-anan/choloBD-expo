// Use 4 spaces for indentation
import { createElement } from 'react';
import { Platform, StyleSheet, Text, TextInput, TextStyle, StyleProp } from 'react-native';
import i18next from 'i18next';

const BENGALI_FONT = {
    regular: 'NotoSansBengali_400Regular',
    medium: 'NotoSansBengali_500Medium',
    semibold: 'NotoSansBengali_600SemiBold',
    bold: 'NotoSansBengali_700Bold',
};

function isBangla(): boolean {
    const lang = (i18next.resolvedLanguage || i18next.language || '').toLowerCase();
    return lang.startsWith('bn');
}

function isUiFont(family: string | undefined): boolean {
    if (!family) return true;
    const name = family.toLowerCase();
    return name === 'system'
        || name === 'sans-serif'
        || name.startsWith('roboto')
        || name.startsWith('notosansbengali');
}

function fontForWeight(weight: TextStyle['fontWeight'] | undefined): string {
    const value = weight == null ? '400' : String(weight);
    if (value === '500' || value === 'medium') return BENGALI_FONT.medium;
    if (value === '600' || value === 'semibold') return BENGALI_FONT.semibold;
    const numeric = Number(value);
    if (value === 'bold' || (Number.isFinite(numeric) && numeric >= 700)) return BENGALI_FONT.bold;
    return BENGALI_FONT.regular;
}

export function withBanglaFont(style: StyleProp<TextStyle> | undefined): StyleProp<TextStyle> | undefined {
    if (!isBangla()) return style;
    let flat: TextStyle = {};
    try {
        flat = StyleSheet.flatten(style) || {};
    } catch {
        return style;
    }
    const family = typeof flat.fontFamily === 'string' ? flat.fontFamily : undefined;
    if (!isUiFont(family)) return style;
    return [style, { fontFamily: fontForWeight(flat.fontWeight), fontWeight: 'normal' }];
}

function BanglaText(props: Record<string, unknown>) {
    return createElement(Text as any, { ...props, style: withBanglaFont(props.style as StyleProp<TextStyle>) });
}
BanglaText.displayName = 'Text';

function BanglaTextInput(props: Record<string, unknown>) {
    return createElement(TextInput as any, { ...props, style: withBanglaFont(props.style as StyleProp<TextStyle>) });
}
BanglaTextInput.displayName = 'TextInput';

// NativeWind swaps JSX types through `interopComponents`; the defaults must be
// registered first or they would overwrite these entries on first render.
if (Platform.OS !== 'web') {
    require('react-native-css-interop/dist/runtime/components');
    const { cssInterop, interopComponents } = require('react-native-css-interop/dist/runtime/api');
    interopComponents.set(Text, cssInterop(BanglaText, { className: 'style' }));
    interopComponents.set(
        TextInput,
        cssInterop(BanglaTextInput, { className: { target: 'style', nativeStyleToProp: { textAlign: true } } }),
    );
}
