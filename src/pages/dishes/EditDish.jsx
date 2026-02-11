// src/pages/dishes/EditDish.jsx
import { useEffect, useMemo, useState, Fragment } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import AppLayout from '../../components/layout/AppLayout';
import Form from '../../components/ui/Form';
import Modal from '../../components/ui/Modal';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SearchableSelect from '../../components/ui/SearchableSelect';

import DishFormFields from '../../components/dishes/DishFormFields';
import SuspensionBlock from '../../components/dishes/SuspensionBlock';
import StickySaveBar from '../../components/dishes/StickySaveBar';

import { useDish } from '../../hooks/useDish';
import { hasDishChanged } from '../../utils/diffDish';
import {
    isDecimal,
    isPositive,
    validateMacrosVsGrammage,
} from '../../utils/validators';

import {
    checkDishNameExists,
    updateDish,
    unsuspendDish,
    suspendDishDryRun,
    suspendDishApply,
} from '../../services/dishesApi';

export default function EditDish() {
    const { dishId } = useParams();
    const navigate = useNavigate();

    const {
        loading,
        error,
        initialValues,
        originalDish,
        initialSuspension,
        existingImageUrl,
    } = useDish(dishId);

    // ====== MODALE CONFLITTI (resta qui per ora) ======
    const [suspensionPreview, setSuspensionPreview] = useState(null);
    const [expandedMenus, setExpandedMenus] = useState({});
    const [replacementByPairing, setReplacementByPairing] = useState({});
    const [optionsByType, setOptionsByType] = useState({});

    const allConflictIds =
        suspensionPreview?.conflicts?.map((c) => c.id_dish_pairing) ?? [];

    const allSelected =
        allConflictIds.length > 0 &&
        allConflictIds.every((id) => !!replacementByPairing[id]);

    function toggleMenu(seasonType) {
        setExpandedMenus((prev) => ({
            ...prev,
            [seasonType]: !prev[seasonType],
        }));
    }

    function groupConflictsBySeason(conflicts = []) {
        const map = new Map();

        for (const c of conflicts) {
            if (!map.has(c.season_type)) {
                map.set(c.season_type, {
                    season_type: c.season_type,
                    is_active_menu: false,
                    total_occurrences: 0,
                    fixed_occurrences: 0,
                    items: [],
                });
            }

            const group = map.get(c.season_type);

            group.total_occurrences += 1;
            if (c.first_choice === 1) group.fixed_occurrences += 1;
            if (c.is_menu_active_today === 1) group.is_active_menu = true;

            group.items.push(c);
        }

        return Array.from(map.values());
    }

    const groupedConflicts = useMemo(() => {
        return suspensionPreview
            ? groupConflictsBySeason(suspensionPreview.conflicts)
            : [];
    }, [suspensionPreview]);

    // Carico le options dei sostituti quando ho i conflitti
    useEffect(() => {
        const loadOptions = async () => {
            if (!suspensionPreview?.conflicts?.length) return;

            const keySet = new Set();
            for (const c of suspensionPreview.conflicts) {
                keySet.add(
                    `${c.season_type}__${c.meal_type}__${c.course_type}`,
                );
            }

            const result = {};
            for (const key of keySet) {
                const [season_type, meal_type, type] = key.split('__');

                const qs = new URLSearchParams({
                    type,
                    season_type,
                    meal_type,
                    date_from: suspensionPreview.suspension.valid_from,
                    date_to: suspensionPreview.suspension.valid_to,
                    exclude_id_food: String(dishId),
                });

                const res = await fetch(
                    `/api/foods/available-for-menu?${qs.toString()}`,
                );
                const json = await res.json().catch(() => ({}));

                result[key] = (json.data ?? []).map((f) => ({
                    value: String(f.id_food),
                    label: f.name,
                }));
            }

            setOptionsByType(result);
            setReplacementByPairing({});
        };

        loadOptions();
    }, [suspensionPreview, dishId]);

    // ====== FLOW SOSPENSIONE ======
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
        const replacements = Object.entries(replacementByPairing).map(
            ([id_dish_pairing, id_food_new]) => ({
                id_dish_pairing: Number(id_dish_pairing),
                id_food_new: id_food_new ? Number(id_food_new) : null,
            }),
        );

        await suspendDishApply(dishId, {
            valid_from: start_date,
            valid_to: end_date,
            reason: reason ?? '',
            action,
            replacements,
        });

        setSuspensionPreview(null);
        return { applied: true };
    }

    // ====== RENDER ======
    if (loading) {
        return (
            <AppLayout title="GESTIONE PIATTI" username="Antonio">
                <div>Caricamento…</div>
            </AppLayout>
        );
    }

    if (error) {
        return (
            <AppLayout title="GESTIONE PIATTI" username="Antonio">
                <div className="text-brand-error">{error}</div>
            </AppLayout>
        );
    }

    const isEmpty = (v) => v === '' || v === null || v === undefined;

    return (
        <AppLayout title="GESTIONE PIATTI" username="Antonio">
            <h1 className="text-3xl font-semibold">Modifica del piatto</h1>

            <Form
                initialValues={initialValues}
                validate={{
                    name: (v) =>
                        !v
                            ? 'Obbligatorio'
                            : v.length < 3
                              ? 'Troppo corto'
                              : null,
                    type: (v) => (!v ? 'Seleziona un tipo' : null),

                    grammage_tot: (v) =>
                        isEmpty(v)
                            ? 'Obbligatorio'
                            : isDecimal(v) || isPositive(v),
                    kcal_tot: (v) =>
                        isEmpty(v)
                            ? 'Obbligatorio'
                            : isDecimal(v) || isPositive(v),
                    proteins: (v) =>
                        isEmpty(v)
                            ? 'Obbligatorio'
                            : isDecimal(v) || isPositive(v),
                    carbohydrates: (v) =>
                        isEmpty(v)
                            ? 'Obbligatorio'
                            : isDecimal(v) || isPositive(v),
                    fats: (v) =>
                        isEmpty(v)
                            ? 'Obbligatorio'
                            : isDecimal(v) || isPositive(v),
                }}
                asyncValidate={{
                    name: async (value) => {
                        const v = (value ?? '').trim();
                        if (!v || v.length < 3) return null;

                        try {
                            const data = await checkDishNameExists(v, {
                                excludeId: dishId,
                            });
                            return data.exists
                                ? 'Questo nome è già in uso'
                                : null;
                        } catch {
                            return 'Impossibile verificare il nome';
                        }
                    },
                }}
                validateForm={(values) => {
                    const errs = validateMacrosVsGrammage(values) || {};

                    if (values.suspension_enabled) {
                        if (!values.start_date)
                            errs.start_date = 'Obbligatorio';
                        if (!values.end_date) errs.end_date = 'Obbligatorio';
                        if (
                            values.start_date &&
                            values.end_date &&
                            values.end_date < values.start_date
                        ) {
                            errs.end_date =
                                'La data fine deve essere >= data inizio';
                        }
                    }

                    return Object.keys(errs).length ? errs : null;
                }}
                validateOnBlur
                validateOnSubmit
                onSubmit={async (values) => {
                    const changed = hasDishChanged(originalDish, values);
                    const suspensionEnabled = !!values.suspension_enabled;

                    // === 1) gestione UNSUSPEND (se esisteva ed ora è OFF)
                    if (
                        initialSuspension?.enabled &&
                        suspensionEnabled === false
                    ) {
                        try {
                            await unsuspendDish(dishId);
                        } catch (e) {
                            alert(e.message);
                            return;
                        }
                    }

                    // === 2) gestione SUSPEND (se ON + cambiata)
                    const suspensionChanged =
                        initialSuspension &&
                        (suspensionEnabled !== initialSuspension.enabled ||
                            (suspensionEnabled &&
                                (values.start_date !==
                                    initialSuspension.valid_from ||
                                    values.end_date !==
                                        initialSuspension.valid_to ||
                                    (values.reason ?? '') !==
                                        (initialSuspension.reason ?? ''))));

                    if (suspensionEnabled && suspensionChanged) {
                        try {
                            const result = await runDishSuspensionFlow({
                                start_date: values.start_date,
                                end_date: values.end_date,
                                reason: values.reason,
                            });

                            if (result.pending) return;
                            if (result.applied === false) {
                                alert('Operazione annullata');
                                return;
                            }
                        } catch (e) {
                            alert(e.message);
                            return;
                        }
                    }

                    // se NON è cambiato nulla (piatto) e immagine non è File
                    const imageChanged = values.img instanceof File;
                    if (!changed && !imageChanged) {
                        alert('Nessuna modifica da salvare');
                        navigate('/dishes');
                        return;
                    }

                    // === 3) update dish (senza i campi sospensione)
                    const formData = new FormData();

                    Object.entries(values).forEach(([key, value]) => {
                        if (value === null || value === '') return;

                        if (
                            [
                                'suspension_enabled',
                                'suspension_id',
                                'start_date',
                                'end_date',
                                'reason',
                            ].includes(key)
                        ) {
                            return;
                        }

                        if (key === 'img' && typeof value === 'string') return;

                        if (Array.isArray(value)) {
                            value.forEach((v) =>
                                formData.append(`${key}[]`, v),
                            );
                        } else {
                            formData.append(key, value);
                        }
                    });

                    try {
                        await updateDish(dishId, formData);
                        alert('Piatto aggiornato correttamente');
                        navigate('/dishes');
                    } catch (e) {
                        alert(e.message);
                    }
                }}
            >
                <DishFormFields existingImageUrl={existingImageUrl} />
                <SuspensionBlock initialSuspension={initialSuspension} />

                <StickySaveBar
                    originalDish={originalDish}
                    initialSuspension={initialSuspension}
                />
            </Form>

            {/* ===== MODALE CONFLITTI ===== */}
            {suspensionPreview && (
                <Modal
                    onClose={() => {
                        setSuspensionPreview(null);
                    }}
                >
                    <Card className="w-[900px] max-h-[80vh] overflow-y-auto p-6">
                        <h2 className="text-2xl font-semibold mb-2">
                            Sospensione piatto – conflitti rilevati
                        </h2>

                        <p className="text-brand-textSecondary mb-4">
                            Il piatto{' '}
                            <strong>{suspensionPreview.dish.name}</strong> è
                            presente nei seguenti menù nel periodo selezionato.
                            Procedendo verrà{' '}
                            <strong>rimosso automaticamente</strong>.
                        </p>

                        {suspensionPreview.summary?.conflicts_in_active_menu >
                            0 && (
                            <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700">
                                ⚠️ Attenzione:{' '}
                                {
                                    suspensionPreview.summary
                                        .conflicts_in_active_menu
                                }{' '}
                                conflitti riguardano un{' '}
                                <strong>menù attivo</strong>.
                            </div>
                        )}

                        <p className="text-sm text-brand-textSecondary mb-2">
                            Menù coinvolti:{' '}
                            <strong>{groupedConflicts.length}</strong> —
                            Occorrenze totali:{' '}
                            <strong>
                                {suspensionPreview.summary.conflicts_total}
                            </strong>
                        </p>

                        <table className="w-full text-sm border border-brand-divider mb-6">
                            <thead className="bg-brand-bgSecondary">
                                <tr>
                                    <th className="p-2 text-left">Menù</th>
                                    <th className="p-2 text-left">Stato</th>
                                    <th className="p-2 text-left">
                                        Occorrenze
                                    </th>
                                    <th className="p-2 text-left">Tipo</th>
                                    <th className="p-2 text-right"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupedConflicts.map((menu) => {
                                    const isExpanded =
                                        !!expandedMenus[menu.season_type];
                                    const isFixedOnly =
                                        menu.fixed_occurrences ===
                                        menu.total_occurrences;

                                    return (
                                        <Fragment key={menu.season_type}>
                                            <tr className="border-t border-brand-divider">
                                                <td className="p-2 font-medium">
                                                    {menu.season_type}
                                                </td>
                                                <td className="p-2">
                                                    {menu.is_active_menu ? (
                                                        <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-700">
                                                            Attivo
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                                                            Futuro
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-2">
                                                    {menu.total_occurrences}
                                                </td>
                                                <td className="p-2">
                                                    {isFixedOnly ? (
                                                        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
                                                            Piatto fisso
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 rounded text-xs bg-green-100 text-gray-600">
                                                            Piatto del giorno
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-2 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            toggleMenu(
                                                                menu.season_type,
                                                            )
                                                        }
                                                        className="text-brand-primary hover:underline text-sm"
                                                    >
                                                        {isExpanded
                                                            ? 'Nascondi dettagli'
                                                            : 'Mostra dettagli'}
                                                    </button>
                                                </td>
                                            </tr>

                                            {isExpanded && (
                                                <tr>
                                                    <td
                                                        colSpan={5}
                                                        className="p-3 bg-gray-50"
                                                    >
                                                        <table className="w-full text-xs border">
                                                            <thead>
                                                                <tr className="bg-gray-100">
                                                                    <th className="p-1 text-left">
                                                                        Giorno
                                                                    </th>
                                                                    <th className="p-1 text-left">
                                                                        Pasto
                                                                    </th>
                                                                    <th className="p-1 text-left">
                                                                        Tipo
                                                                    </th>
                                                                    <th className="p-1 text-left">
                                                                        Portata
                                                                    </th>
                                                                    <th className="p-1 text-left">
                                                                        Sostituzione
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {menu.items.map(
                                                                    (
                                                                        c,
                                                                        idx,
                                                                    ) => (
                                                                        <tr
                                                                            key={
                                                                                idx
                                                                            }
                                                                            className="border-t"
                                                                        >
                                                                            <td className="p-1">
                                                                                {c.meal_date ??
                                                                                    `Giorno ${c.day_index + 1}`}
                                                                            </td>
                                                                            <td className="p-1 capitalize">
                                                                                {
                                                                                    c.meal_type
                                                                                }
                                                                            </td>
                                                                            <td className="p-1">
                                                                                {c.first_choice ===
                                                                                1
                                                                                    ? 'Piatto fisso'
                                                                                    : 'Piatto del giorno'}
                                                                            </td>
                                                                            <td className="p-1 capitalize">
                                                                                {
                                                                                    c.course_type
                                                                                }
                                                                            </td>
                                                                            <td className="p-1 w-[380px]">
                                                                                <SearchableSelect
                                                                                    value={
                                                                                        replacementByPairing[
                                                                                            c
                                                                                                .id_dish_pairing
                                                                                        ] ??
                                                                                        ''
                                                                                    }
                                                                                    className="text-sm"
                                                                                    onChange={(
                                                                                        newVal,
                                                                                    ) =>
                                                                                        setReplacementByPairing(
                                                                                            (
                                                                                                prev,
                                                                                            ) => ({
                                                                                                ...prev,
                                                                                                [c.id_dish_pairing]:
                                                                                                    newVal,
                                                                                            }),
                                                                                        )
                                                                                    }
                                                                                    options={
                                                                                        optionsByType[
                                                                                            `${c.season_type}__${c.meal_type}__${c.course_type}`
                                                                                        ] ??
                                                                                        []
                                                                                    }
                                                                                    placeholder="Seleziona sostituto…"
                                                                                />
                                                                            </td>
                                                                        </tr>
                                                                    ),
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>

                        <div className="flex justify-end gap-4">
                            <Button
                                variant="underline"
                                onClick={() => setSuspensionPreview(null)}
                            >
                                Annulla
                            </Button>

                            <Button
                                variant="secondary"
                                onClick={async () => {
                                    try {
                                        await applySuspension({
                                            start_date:
                                                suspensionPreview.suspension
                                                    .valid_from,
                                            end_date:
                                                suspensionPreview.suspension
                                                    .valid_to,
                                            reason: suspensionPreview.suspension
                                                .reason,
                                            action: 'disable-only',
                                        });

                                        alert(
                                            'Sospensione salvata. Attenzione: dovrai completare i menù manualmente.',
                                        );
                                        navigate('/dishes');
                                    } catch (e) {
                                        alert(e.message);
                                    }
                                }}
                            >
                                Salva sospensione (non sostituire)
                            </Button>

                            <Button
                                variant="primary"
                                disabled={!allSelected}
                                onClick={async () => {
                                    try {
                                        await applySuspension({
                                            start_date:
                                                suspensionPreview.suspension
                                                    .valid_from,
                                            end_date:
                                                suspensionPreview.suspension
                                                    .valid_to,
                                            reason: suspensionPreview.suspension
                                                .reason,
                                            action: 'replace',
                                        });

                                        alert(
                                            'Sospensione salvata e sostituzioni applicate.',
                                        );
                                        navigate('/dishes');
                                    } catch (e) {
                                        alert(e.message);
                                    }
                                }}
                            >
                                Salva e sostituisci
                            </Button>
                        </div>
                    </Card>
                </Modal>
            )}
        </AppLayout>
    );
}

// Erano 1092 righe
