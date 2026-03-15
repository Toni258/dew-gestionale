/**
 * Handles the suspension preview/apply flow for a dish.
 * The page only keeps the submit orchestration, while this hook stores
 * the preview state, grouped conflicts and replacement options.
 */
import { useEffect, useMemo, useState } from 'react';
import {
    suspendDishApply,
    suspendDishDryRun,
} from '../../services/dishesApi';
import { getAvailableFoodsForMenu } from '../../services/foodsApi';
import {
    buildDishSuspensionMenuKey,
    buildDishSuspensionReplacementsPayload,
    groupDishConflictsBySeason,
} from '../../utils/dishes/dishSuspension';

export function useDishSuspensionFlow(dishId) {
    const [suspensionPreview, setSuspensionPreview] = useState(null);
    const [expandedMenus, setExpandedMenus] = useState({});
    const [replacementByPairing, setReplacementByPairing] = useState({});
    const [optionsByType, setOptionsByType] = useState({});
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [optionsError, setOptionsError] = useState('');

    const groupedConflicts = useMemo(() => {
        return suspensionPreview
            ? groupDishConflictsBySeason(suspensionPreview.conflicts)
            : [];
    }, [suspensionPreview]);

    const allConflictIds = useMemo(
        () =>
            suspensionPreview?.conflicts?.map((item) => item.id_dish_pairing) ??
            [],
        [suspensionPreview],
    );

    const allSelected = useMemo(
        () =>
            allConflictIds.length > 0 &&
            allConflictIds.every((id) => !!replacementByPairing[id]),
        [allConflictIds, replacementByPairing],
    );

    useEffect(() => {
        let alive = true;

        async function loadOptions() {
            if (!suspensionPreview?.conflicts?.length) {
                setOptionsByType({});
                setReplacementByPairing({});
                setOptionsError('');
                setExpandedMenus({});
                return;
            }

            setOptionsLoading(true);
            setOptionsError('');

            try {
                const uniqueKeys = [
                    ...new Set(
                        suspensionPreview.conflicts.map((conflict) =>
                            buildDishSuspensionMenuKey(conflict),
                        ),
                    ),
                ];

                // Load replacement lists in parallel because each key maps
                // to an independent API request.
                const entries = await Promise.all(
                    uniqueKeys.map(async (key) => {
                        const [season_type, meal_type, type] = key.split('__');
                        const json = await getAvailableFoodsForMenu({
                            type,
                            season_type,
                            meal_type,
                            date_from: suspensionPreview.suspension.valid_from,
                            date_to: suspensionPreview.suspension.valid_to,
                            exclude_id_food: String(dishId),
                        });

                        return [
                            key,
                            (json.data ?? []).map((food) => ({
                                value: String(food.id_food),
                                label: food.name,
                            })),
                        ];
                    }),
                );

                if (!alive) return;

                setOptionsByType(Object.fromEntries(entries));
                setReplacementByPairing({});
            } catch (error) {
                if (!alive) return;
                setOptionsByType({});
                setReplacementByPairing({});
                setOptionsError(
                    error?.message ||
                        'Impossibile caricare i possibili piatti sostitutivi.',
                );
            } finally {
                if (alive) {
                    setOptionsLoading(false);
                }
            }
        }

        loadOptions();

        return () => {
            alive = false;
        };
    }, [dishId, suspensionPreview]);

    function toggleMenu(seasonType) {
        setExpandedMenus((prev) => ({
            ...prev,
            [seasonType]: !prev[seasonType],
        }));
    }

    function closeSuspensionPreview() {
        setSuspensionPreview(null);
    }

    function setReplacementForPairing(pairingId, value) {
        setReplacementByPairing((prev) => ({
            ...prev,
            [pairingId]: value,
        }));
    }

    async function runDishSuspensionFlow({ start_date, end_date, reason }) {
        const dryJson = await suspendDishDryRun(dishId, {
            valid_from: start_date,
            valid_to: end_date,
            reason: reason ?? '',
        });

        if (!dryJson.conflicts || dryJson.conflicts.length === 0) {
            await suspendDishApply(dishId, {
                valid_from: start_date,
                valid_to: end_date,
                reason: reason ?? '',
                action: 'disable-only',
                replacements: [],
            });
            return { applied: true };
        }

        setSuspensionPreview({
            dish: dryJson.dish,
            suspension: dryJson.suspension,
            conflicts: dryJson.conflicts,
            summary: dryJson.summary,
        });

        return { applied: false, pending: true };
    }

    async function applySuspension({ start_date, end_date, reason, action }) {
        await suspendDishApply(dishId, {
            valid_from: start_date,
            valid_to: end_date,
            reason: reason ?? '',
            action,
            replacements:
                action === 'replace'
                    ? buildDishSuspensionReplacementsPayload(
                          replacementByPairing,
                      )
                    : [],
        });

        setSuspensionPreview(null);
        return { applied: true };
    }

    return {
        suspensionPreview,
        groupedConflicts,
        expandedMenus,
        replacementByPairing,
        optionsByType,
        optionsLoading,
        optionsError,
        allSelected,
        toggleMenu,
        closeSuspensionPreview,
        setReplacementForPairing,
        runDishSuspensionFlow,
        applySuspension,
    };
}
