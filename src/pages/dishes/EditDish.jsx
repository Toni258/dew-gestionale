import { useEffect, useState, Fragment } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import AppLayout from '../../components/layout/AppLayout';
import Form from '../../components/ui/Form';
import FormGroup from '../../components/ui/FormGroup';
import Input from '../../components/ui/Input';
import CustomSelect from '../../components/ui/CustomSelect';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ImageUploader from '../../components/ui/ImageUploader';
import AllergenCheckboxGroup from '../../components/ui/AllergenCheckboxGroup';
import DatePicker from '../../components/ui/DatePicker';
import TextArea from '../../components/ui/TextArea';
import Modal from '../../components/ui/Modal';
import { hasDishChanged } from '../../utils/diffDish';
import { useFormContext } from '../../components/ui/Form';

import { isDecimal, isPositive } from '../../utils/validators';
import { validateMacrosVsGrammage } from '../../utils/validators';

export default function EditDish() {
    const { dishId } = useParams();
    const navigate = useNavigate();

    const [initialValues, setInitialValues] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [originalDish, setOriginalDish] = useState(null);
    const [existingImageUrl, setExistingImageUrl] = useState('');
    const [initialSuspension, setInitialSuspension] = useState(null);
    const [initialImage, setInitialImage] = useState(null);
    const [suspensionPreview, setSuspensionPreview] = useState(null);
    const [expandedMenus, setExpandedMenus] = useState({});
    const [showUnsuspendHint, setShowUnsuspendHint] = useState(false);

    const isEmpty = (v) => v === '' || v === null || v === undefined; // Serve perchè se no non riconosce 0 come valore valido nei macro

    function hasSuspensionChanged(initial, current) {
        if (!initial) return false;

        const enabledNow = !!current.suspension_enabled;

        // toggle ON/OFF
        if (enabledNow !== initial.enabled) return true;

        // se disattivata e lo era anche prima → nessuna differenza
        if (!enabledNow) return false;

        // confronto dettagli
        return (
            (current.start_date ?? '') !== (initial.valid_from ?? '') ||
            (current.end_date ?? '') !== (initial.valid_to ?? '') ||
            (current.reason ?? '') !== (initial.reason ?? '')
        );
    }

    function StickySaveBar({ originalDish, initialSuspension }) {
        const form = useFormContext();
        if (!form || !originalDish) return null;

        const dishChanged = hasDishChanged(originalDish, form.values);

        const suspensionChanged = hasSuspensionChanged(
            initialSuspension,
            form.values
        );

        const imageChanged = form.values.img instanceof File;

        const changed = dishChanged || suspensionChanged || imageChanged;

        return (
            <div
                className="
                sticky bottom-0 z-30
                -mx-6      /* annulla il padding di AppLayout del main */
                mt-10
                bg-white/95 backdrop-blur
                border-t border-brand-divider
            "
            >
                <div className="py-4 flex justify-center">
                    <Button
                        type="submit"
                        disabled={!changed}
                        className="w-[240px]"
                    >
                        Salva modifiche
                    </Button>
                </div>
            </div>
        );
    }

    useEffect(() => {
        const loadDish = async () => {
            try {
                const res = await fetch(`/api/dishes/${dishId}`);
                if (!res.ok) {
                    const text = await res.text().catch(() => '');
                    throw new Error(
                        `GET /api/dishes/${dishId} -> ${res.status} ${text}`
                    );
                }

                const data = await res.json();
                const imgUrl = data.image_url
                    ? `/food-images/${data.image_url}`
                    : null;

                setExistingImageUrl(imgUrl);
                setInitialImage(imgUrl);

                setInitialValues({
                    name: data.name ?? '',
                    type: data.type ?? '',
                    img: imgUrl,
                    grammage_tot: data.grammage_tot ?? '',
                    kcal_tot: data.kcal_tot ?? '',
                    proteins: data.proteins ?? '',
                    carbohydrates: data.carbs ?? '',
                    fats: data.fats ?? '',
                    allergy_notes: data.allergy_notes ?? [],

                    // sospensione
                    suspension_enabled: data.suspension ? true : false,
                    suspension_id: data.suspension?.id_avail ?? '',
                    start_date: data.suspension?.valid_from ?? '',
                    end_date: data.suspension?.valid_to ?? '',
                    reason: data.suspension?.reason ?? '',
                });

                setInitialSuspension({
                    enabled: !!data.suspension,
                    valid_from: data.suspension?.valid_from ?? '',
                    valid_to: data.suspension?.valid_to ?? '',
                    reason: data.suspension?.reason ?? '',
                });

                setOriginalDish({
                    name: data.name ?? '',
                    type: data.type ?? '',
                    grammage_tot: data.grammage_tot ?? '',
                    kcal_tot: data.kcal_tot ?? '',
                    proteins: data.proteins ?? '',
                    carbohydrates: data.carbs ?? '',
                    fats: data.fats ?? '',
                    allergy_notes: data.allergy_notes ?? [],
                });
            } catch (err) {
                console.error('loadDish error:', err);
                setError('Impossibile caricare il piatto');
            } finally {
                setLoading(false);
            }
        };

        loadDish();
    }, [dishId]);

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

    async function runDishSuspensionFlow({
        dishId,
        start_date,
        end_date,
        reason,
    }) {
        // 1) dry-run
        const dryRes = await fetch(`/api/dishes/${dishId}/suspend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                valid_from: start_date,
                valid_to: end_date,
                reason: reason ?? '',
                mode: 'dry-run',
            }),
        });

        const dryJson = await dryRes.json().catch(() => ({}));

        console.log('DRY-RUN RESPONSE:', dryJson);
        console.log(
            'conflicts:',
            dryJson?.conflicts?.length,
            dryJson?.conflicts
        );

        if (!dryRes.ok) {
            throw new Error(dryJson?.error || 'Errore verifica sospensione');
        }

        // Se NON ci sono conflitti → applica subito
        if (!dryJson.conflicts || dryJson.conflicts.length === 0) {
            return applySuspension({ dishId, start_date, end_date, reason });
        }

        // Se ci sono conflitti → mostra modale
        setSuspensionPreview({
            dish: dryJson.dish,
            suspension: dryJson.suspension,
            conflicts: dryJson.conflicts,
            summary: dryJson.summary,
        });

        return { applied: false, pending: true };
    }

    async function applySuspension({ dishId, start_date, end_date, reason }) {
        const applyRes = await fetch(`/api/dishes/${dishId}/suspend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                valid_from: start_date,
                valid_to: end_date,
                reason: reason ?? '',
                mode: 'apply',
            }),
        });

        const applyJson = await applyRes.json().catch(() => ({}));
        if (!applyRes.ok) {
            throw new Error(
                applyJson?.error || 'Errore applicazione sospensione'
            );
        }

        setSuspensionPreview(null);
        setShowUnsuspendHint(false);
        return { applied: true };
    }

    function SuspensionBlock() {
        const form = useFormContext();
        const enabled = !!form.values.suspension_enabled;

        return (
            <>
                {/* TITOLO + TOGGLE IOS */}
                <div className="mt-8 flex items-center gap-6">
                    <h2 className="text-3xl font-semibold">
                        Sospensione piatto
                    </h2>

                    <button
                        type="button"
                        onClick={() => {
                            const nextEnabled = !enabled;
                            form.setFieldValue(
                                'suspension_enabled',
                                nextEnabled
                            );

                            // Se sto spegnendo una sospensione che esisteva già → mostra micro-alert
                            const hadSuspensionBefore =
                                !!initialSuspension?.enabled;
                            if (!nextEnabled && hadSuspensionBefore) {
                                setShowUnsuspendHint(true);
                            } else {
                                setShowUnsuspendHint(false);
                            }

                            // Se spengo, pulisco i campi (come già facevi)
                            if (enabled) {
                                form.setFieldValue('start_date', '');
                                form.setFieldValue('end_date', '');
                                form.setFieldValue('reason', '');
                            }
                        }}
                        className={`
                        mt-2 relative w-12 h-7 rounded-full transition-colors
                        ${enabled ? 'bg-green-500' : 'bg-gray-300'}
                    `}
                    >
                        <span
                            className={`
                            absolute top-1 left-1 w-5 h-5 bg-white rounded-full
                            transition-transform
                            ${enabled ? 'translate-x-5' : ''}
                        `}
                        />
                    </button>
                </div>

                {showUnsuspendHint && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-sm">
                        La sospensione verrà chiusa alla data odierna
                    </div>
                )}

                {/* CARD SOSPENSIONE */}
                <Card className="mt-4 relative overflow-visible">
                    {!enabled && (
                        <div className="absolute inset-0 z-10 bg-gray-200/70 rounded-xl" />
                    )}

                    <div className="flex gap-6 relative z-0">
                        <div className="w-1/6 flex flex-col gap-4">
                            <FormGroup label="Data inizio" required={enabled}>
                                <DatePicker
                                    name="start_date"
                                    disabled={!enabled}
                                />
                            </FormGroup>

                            <FormGroup label="Data fine" required={enabled}>
                                <DatePicker
                                    name="end_date"
                                    disabled={!enabled}
                                />
                            </FormGroup>
                        </div>

                        <div className="w-5/6">
                            <FormGroup label="Motivo">
                                <TextArea
                                    name="reason"
                                    placeholder="Motivo della sospensione del piatto (consigliato)"
                                    rows={5}
                                    disabled={!enabled}
                                />
                            </FormGroup>
                        </div>
                    </div>
                </Card>
            </>
        );
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
            if (c.first_choice === 1) {
                group.fixed_occurrences += 1;
            }

            if (c.is_menu_active_today === 1) {
                group.is_active_menu = true;
            }

            group.items.push(c);
        }

        return Array.from(map.values());
    }

    function toggleMenu(seasonType) {
        setExpandedMenus((prev) => ({
            ...prev,
            [seasonType]: !prev[seasonType],
        }));
    }

    const groupedConflicts = suspensionPreview
        ? groupConflictsBySeason(suspensionPreview.conflicts)
        : [];

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

                        const res = await fetch(
                            `/api/dishes/exists?name=${encodeURIComponent(
                                v
                            )}&excludeId=${dishId}`
                        );

                        if (!res.ok) {
                            return 'Impossibile verificare il nome';
                        }

                        const data = await res.json();
                        return data.exists ? 'Questo nome è già in uso' : null;
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
                    // controlla se qualcosa è cambiato
                    const changed = hasDishChanged(originalDish, values);
                    const suspensionEnabled = !!values.suspension_enabled;

                    // Se la sospensione è cambiata rispetto allo snapshot iniziale, gestiscila via endpoint dedicato.
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

                    // === GESTIONE SOSPENSIONE ===

                    // CASO 1: disattivazione sospensione
                    if (
                        initialSuspension?.enabled &&
                        suspensionEnabled === false
                    ) {
                        const res = await fetch(
                            `/api/dishes/${dishId}/unsuspend`,
                            { method: 'POST' }
                        );

                        if (!res.ok) {
                            const err = await res.json().catch(() => ({}));
                            alert(err.error || 'Errore rimozione sospensione');
                            return;
                        }

                        setShowUnsuspendHint(false);
                    }

                    // CASO 2: creazione o modifica sospensione
                    if (suspensionEnabled && suspensionChanged) {
                        const result = await runDishSuspensionFlow({
                            dishId,
                            start_date: values.start_date,
                            end_date: values.end_date,
                            reason: values.reason,
                        });

                        if (result.pending) return;

                        if (result.applied === false) {
                            alert('Operazione annullata');
                            return;
                        }
                    }

                    // se NON è cambiato nulla
                    if (!changed && !values.img) {
                        alert('Nessuna modifica da salvare');
                        navigate('/dishes');
                        return;
                    }

                    const formData = new FormData();
                    const payload = {
                        ...values,
                        suspension_enabled: values.suspension_enabled
                            ? '1'
                            : '0',
                    };

                    Object.entries(payload).forEach(([key, value]) => {
                        if (value === null || value === '') return;

                        // NON mandare più i campi sospensione a updateDish (sono gestiti dal nuovo endpoint)
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

                        // non mandare la stringa dell'immagine
                        if (key === 'img' && typeof value === 'string') return;

                        // se toggle OFF, non mandare questi campi
                        if (
                            !suspensionEnabled &&
                            ['start_date', 'end_date', 'reason'].includes(key)
                        ) {
                            return;
                        }

                        // checkbox -> manda 1/0
                        if (key === 'suspension_enabled') {
                            formData.append(
                                'suspension_enabled',
                                suspensionEnabled ? '1' : '0'
                            );
                            return;
                        }

                        if (Array.isArray(value)) {
                            value.forEach((v) =>
                                formData.append(`${key}[]`, v)
                            );
                        } else {
                            formData.append(key, value);
                        }
                    });

                    const res = await fetch(`/api/dishes/${dishId}`, {
                        method: 'PUT',
                        body: formData,
                    });

                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        alert(
                            err.error || 'Errore aggiornamento piatto pagina'
                        );
                        return;
                    }

                    alert('Piatto aggiornato correttamente');
                    navigate('/dishes');
                }}
            >
                <Card className="mt-4">
                    <div className="flex items-start gap-8">
                        <div className="w-2/3">
                            <FormGroup label="Nome piatto" name="name" required>
                                <Input name="name" className="w-full" />
                            </FormGroup>
                        </div>

                        <div className="w-1/3">
                            <FormGroup label="Tipo" name="type" required>
                                <CustomSelect
                                    name="type"
                                    options={[
                                        {
                                            value: '',
                                            label: '— Seleziona un tipo —',
                                        },
                                        { value: 'primo', label: 'Primo' },
                                        { value: 'secondo', label: 'Secondo' },
                                        {
                                            value: 'contorno',
                                            label: 'Contorno',
                                        },
                                        { value: 'ultimo', label: 'Dessert' },
                                        {
                                            value: 'speciale',
                                            label: 'Speciale',
                                        },
                                        { value: 'coperto', label: 'Coperto' },
                                    ]}
                                />
                            </FormGroup>
                        </div>
                    </div>

                    <div className="flex items-center gap-8 mt-6">
                        <div className="w-1/5">
                            <FormGroup label="Immagine" name="img">
                                <ImageUploader
                                    name="img"
                                    initialUrl={existingImageUrl}
                                />
                            </FormGroup>
                        </div>

                        <div className="w-4/5 flex flex-col gap-4">
                            <div className="flex gap-4">
                                <FormGroup
                                    label="Grammatura"
                                    name="grammage_tot"
                                    required
                                >
                                    <Input
                                        type="number"
                                        step="0.001"
                                        name="grammage_tot"
                                    />
                                </FormGroup>
                                <FormGroup
                                    label="Kcal"
                                    name="kcal_tot"
                                    required
                                >
                                    <Input
                                        type="number"
                                        step="0.001"
                                        name="kcal_tot"
                                    />
                                </FormGroup>
                            </div>

                            <div className="flex gap-4">
                                <FormGroup
                                    label="Proteine"
                                    name="proteins"
                                    required
                                >
                                    <Input
                                        type="number"
                                        step="0.001"
                                        name="proteins"
                                    />
                                </FormGroup>
                                <FormGroup
                                    label="Carboidrati"
                                    name="carbohydrates"
                                    required
                                >
                                    <Input
                                        type="number"
                                        step="0.001"
                                        name="carbohydrates"
                                    />
                                </FormGroup>
                                <FormGroup label="Grassi" name="fats" required>
                                    <Input
                                        type="number"
                                        step="0.001"
                                        name="fats"
                                    />
                                </FormGroup>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <FormGroup label="Allergeni" name="allergy_notes">
                            <AllergenCheckboxGroup name="allergy_notes" />
                        </FormGroup>
                    </div>
                </Card>

                <SuspensionBlock />

                <StickySaveBar
                    originalDish={originalDish}
                    initialSuspension={initialSuspension}
                />
            </Form>

            {suspensionPreview && (
                <Modal
                    onClose={() => {
                        setSuspensionPreview(null);
                        setShowUnsuspendHint(false);
                    }}
                >
                    <Card className="w-[900px] max-h-[80vh] overflow-y-auto p-6">
                        <h2 className="text-2xl font-semibold mb-2">
                            Sospensione piatto – conflitti rilevati
                        </h2>

                        <p className="text-brand-textSecondary mb-4">
                            Il piatto{' '}
                            <strong>{suspensionPreview.dish.name}</strong> è
                            presente nei seguenti menù che hanno almeno un
                            giorno compreso nel periodo di sospensione
                            selezionato. Procedendo verrà{' '}
                            <strong>rimosso automaticamente</strong> da questi
                            menù.
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
                                            {/* RIGA PRINCIPALE */}
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
                                                                menu.season_type
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

                                            {/* DETTAGLI ESPANDIBILI */}
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
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {menu.items.map(
                                                                    (
                                                                        c,
                                                                        idx
                                                                    ) => (
                                                                        <tr
                                                                            key={
                                                                                idx
                                                                            }
                                                                            className="border-t"
                                                                        >
                                                                            <td className="p-1">
                                                                                {c.meal_date ??
                                                                                    `Giorno ${
                                                                                        c.day_index +
                                                                                        1
                                                                                    }`}
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
                                                                        </tr>
                                                                    )
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
                                variant="secondary"
                                onClick={() => setSuspensionPreview(null)}
                            >
                                Annulla
                            </Button>

                            <Button
                                variant="primary"
                                onClick={async () => {
                                    try {
                                        await applySuspension({
                                            dishId,
                                            start_date:
                                                suspensionPreview.suspension
                                                    .valid_from,
                                            end_date:
                                                suspensionPreview.suspension
                                                    .valid_to,
                                            reason: suspensionPreview.suspension
                                                .reason,
                                        });

                                        alert(
                                            'Sospensione applicata e piatti rimossi dai menu.'
                                        );
                                        navigate('/dishes');
                                    } catch (e) {
                                        alert(
                                            e.message || 'Errore applicazione'
                                        );
                                    }
                                }}
                            >
                                Conferma e applica
                            </Button>
                        </div>
                    </Card>
                </Modal>
            )}
        </AppLayout>
    );
}
