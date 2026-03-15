/**
 * Keeps the selected report menu in sync with the custom form component.
 */
import { useEffect, useRef } from 'react';
import { useFormContext } from '../ui/Form';
import { buildMenuValue } from '../../utils/statistics/menuValue';

export default function StatsMenuSelectionSync({
    menuRows,
    setSelectedMenu,
    setFormVersion,
}) {
    const form = useFormContext();
    const prevMenuValueRef = useRef('');
    const menuValue = form?.values?.menuValue ?? '';

    useEffect(() => {
        if (!menuValue) return;

        const found = (menuRows || []).find(
            (menu) => buildMenuValue(menu) === menuValue,
        );
        if (!found) return;

        const previousValue = prevMenuValueRef.current;
        prevMenuValueRef.current = menuValue;

        const firstMount = previousValue === '';
        const changed = previousValue !== '' && previousValue !== menuValue;

        setSelectedMenu(found);

        if (firstMount || !changed) return;
        setFormVersion((value) => value + 1);
    }, [menuRows, menuValue, setFormVersion, setSelectedMenu]);

    return null;
}
