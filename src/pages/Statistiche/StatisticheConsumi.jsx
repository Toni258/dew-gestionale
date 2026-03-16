// Report page for food consumption.
// Shared helpers keep common formatting logic outside the page file.
import AppLayout from '../../components/layout/AppLayout';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Form from '../../components/ui/Form';
import FormGroup from '../../components/ui/FormGroup';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DateRangePicker from '../../components/ui/DateRangePicker';
import CustomSelect from '../../components/ui/CustomSelect';
import SearchableSelect from '../../components/ui/SearchableSelect';
import Pagination from '../../components/ui/Pagination';
import { withLoader } from '../../services/withLoader';
import { getConsumiMenus, getConsumiReport } from '../../services/reportsApi';
import StatsMenuSelectionSync from '../../components/statistics/StatsMenuSelectionSync';
import StatsKpiCard from '../../components/statistics/StatsKpiCard';
import {
    buildMenuValue,
    parseMenuValue,
} from '../../utils/statistics/menuValue';
import {
    fmtDec,
    fmtInt,
    formatCourseLabel,
    formatDateTime,
} from '../../utils/statistics/reportFormatters';

const MenuSelectionSync = StatsMenuSelectionSync;
const KpiCard = StatsKpiCard;

// Helper function used by fmt pct.
function fmtPct(value) {
    const numericValue = Number(value) || 0;
    return `${fmtInt(numericValue)}%`;
}

// Select options used by the form
const MEAL_OPTIONS = [
    { value: '', label: 'Tutti i pasti' },
    { value: 'pranzo', label: 'Pranzo' },
    { value: 'cena', label: 'Cena' },
];

const COURSE_OPTIONS = [
    { value: '', label: 'Tutte le portate' },
    { value: 'primo', label: 'Primo' },
    { value: 'secondo', label: 'Secondo' },
    { value: 'contorno', label: 'Contorno' },
    { value: 'ultimo', label: 'Ultimo (dessert)' },
    { value: 'coperto', label: 'Coperto' },
    { value: 'speciale', label: 'Speciale' },
];

const FIRST_CHOICE_OPTIONS = [
    { value: '', label: 'Tutti i tipi piatto' },
    { value: '0', label: 'Solo piatti del giorno' },
    { value: '1', label: 'Solo piatti fissi' },
];

// Page component for statistiche consumi.
function ConsumiRankCard({
    title,
    iconSrc,
    iconAlt = '',
    rows,
    mode = 'good',
}) {
    const rowBgClass =
        mode === 'good'
            ? 'bg-[rgba(57,142,59,0.07)] border-[rgba(57,142,59,0.10)]'
            : 'bg-[rgba(224,72,72,0.07)] border-[rgba(224,72,72,0.10)]';

    const badgeBg =
        mode === 'good'
            ? 'bg-[rgba(57,142,59,0.6)]'
            : 'bg-[rgba(224,72,72,0.6)]';

    const valueTextClass =
        mode === 'good' ? 'text-brand-primary' : 'text-brand-error';

    return (
        <Card className="rounded-[24px] border border-white/60 bg-white/85 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
            <div className="mb-5 flex items-center gap-2.5">
                {iconSrc ? (
                    <img
                        src={iconSrc}
                        alt={iconAlt || title}
                        className="h-5 w-5 shrink-0 object-contain"
                    />
                ) : null}

                <div className="text-[15px] font-semibold text-brand-text">
                    {title}
                </div>
            </div>

            {!rows || rows.length === 0 ? (
                <div className="italic text-brand-textSecondary">
                    Nessun dato nel periodo selezionato.
                </div>
            ) : (
                <div className="flex flex-col gap-3.5">
                    {rows.map((row, index) => {
                        const avg = Number(row.avg_portion || 0);
                        const proxyPct = Math.max(0, Math.min(1, avg)) * 100;

                        return (
                            <div
                                key={`${row.id_food}-${index}`}
                                className={`flex items-center justify-between gap-4 rounded-[20px] border px-4 py-3 shadow-[0_4px_14px_rgba(15,23,42,0.04)] ${rowBgClass}`}
                            >
                                <div className="flex min-w-0 items-center gap-3.5">
                                    <div
                                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_16px_rgba(15,23,42,0.06)] ${badgeBg}`}
                                    >
                                        <span className="text-md font-semibold leading-none text-brand-text">
                                            {index + 1}
                                        </span>
                                    </div>

                                    <div className="min-w-0">
                                        <div className="truncate text-[15px] font-semibold leading-5 text-brand-text">
                                            {row.name}
                                        </div>
                                        <div className="mt-0.5 text-[12px] leading-4 text-brand-textSecondary">
                                            {formatCourseLabel(row.type)}
                                        </div>
                                    </div>
                                </div>

                                <div className="shrink-0 text-right">
                                    <div
                                        className={`text-[19px] font-semibold leading-none tracking-[-0.02em] ${valueTextClass}`}
                                    >
                                        {fmtPct(proxyPct)}
                                    </div>
                                    <div className="mt-1 text-[12px] leading-4 text-brand-textSecondary">
                                        Consumo medio
                                    </div>
                                    <div className="mt-1 text-[11px] leading-4 text-brand-textSecondary/80">
                                        {fmtInt(row.n)} questionari
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}

export default function StatisticheConsumi() {
    // Main state used by the page
    const [menus, setMenus] = useState([]);
    const [menusLoading, setMenusLoading] = useState(true);

    const [selectedMenu, setSelectedMenu] = useState(null);
    const [formVersion, setFormVersion] = useState(0);

    const [applied, setApplied] = useState(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [commentsPage, setCommentsPage] = useState(1);
    const [commentsPageSize, setCommentsPageSize] = useState(10);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [kpi, setKpi] = useState({
        waste_kg: 0,
        kcal_wasted: 0,
        avg_consumption: 0,
        gradimento_pct: 0,
        coverage_pct: 0,
    });

    const [topLiked, setTopLiked] = useState([]);
    const [topDisliked, setTopDisliked] = useState([]);
    const [details, setDetails] = useState({
        data: [],
        total: 0,
        totalPages: 1,
    });
    const [comments, setComments] = useState({
        data: [],
        total: 0,
        totalPages: 1,
        page: 1,
        pageSize: 10,
        hasOnlyEmptyComments: false,
    });

    const [options, setOptions] = useState({
        patients: [],
        floors: [],
    });
    // Load data when the component opens

    useEffect(() => {
        let cancelled = false;

        // Loads the available menus for the page.
        async function loadMenus() {
            setMenusLoading(true);
            setError('');

            try {
                const json = await getConsumiMenus();
                const rows = json?.data || [];

                if (cancelled) return;

                setMenus(rows);

                const firstMenu = rows[0] || null;
                setSelectedMenu(firstMenu);

                if (firstMenu) {
                    setApplied({
                        menuKind: firstMenu.kind,
                        menuRef: firstMenu.ref,
                        start: firstMenu.start_date,
                        end: firstMenu.end_date,
                        meal: '',
                        patientId: '',
                        floor: '',
                        course: '',
                        firstChoice: '',
                    });
                }
            } catch (e) {
                console.error(e);
                if (!cancelled) {
                    setError('Errore nel caricamento dei menù disponibili.');
                }
            } finally {
                if (!cancelled) {
                    setMenusLoading(false);
                }
            }
        }

        loadMenus();

        return () => {
            cancelled = true;
        };
    }, []);
    // Derived data used by the UI

    const formInitialValues = useMemo(() => {
        if (!selectedMenu) {
            return {
                menuValue: '',
                start: '',
                end: '',
                meal: '',
                patientId: '',
                floor: '',
                course: '',
                firstChoice: '',
            };
        }

        const menuValue = buildMenuValue(selectedMenu);

        const appliedMatchesSelectedMenu =
            applied &&
            applied.menuKind === selectedMenu.kind &&
            applied.menuRef === selectedMenu.ref;

        return {
            menuValue,
            start: appliedMatchesSelectedMenu
                ? (applied?.start ?? selectedMenu.start_date)
                : selectedMenu.start_date,
            end: appliedMatchesSelectedMenu
                ? (applied?.end ?? selectedMenu.end_date)
                : selectedMenu.end_date,
            meal: appliedMatchesSelectedMenu ? (applied?.meal ?? '') : '',
            patientId: appliedMatchesSelectedMenu
                ? (applied?.patientId ?? '')
                : '',
            floor: appliedMatchesSelectedMenu ? (applied?.floor ?? '') : '',
            course: appliedMatchesSelectedMenu ? (applied?.course ?? '') : '',
            firstChoice: appliedMatchesSelectedMenu
                ? (applied?.firstChoice ?? '')
                : '',
        };
    }, [selectedMenu, applied]);

    const formKey = useMemo(() => {
        return `${selectedMenu ? buildMenuValue(selectedMenu) : 'none'}-${formVersion}`;
    }, [selectedMenu, formVersion]);

    const menuOptions = useMemo(() => {
        return (menus || []).map((m) => ({
            value: buildMenuValue(m),
            label: m.label,
        }));
    }, [menus]);

    const floorOptionsFinal = useMemo(() => {
        return [
            { value: '', label: 'Tutti i piani' },
            ...(options.floors || []),
        ];
    }, [options.floors]);

    const requestParams = useMemo(() => {
        if (!applied) return null;
        return {
            ...applied,
            page,
            pageSize,
            commentsPage,
            commentsPageSize,
        };
    }, [applied, page, pageSize, commentsPage, commentsPageSize]);
    // Memoized handler used by the page

    const fetchReport = useCallback(async () => {
        if (!requestParams) return;

        setLoading(true);
        setError('');

        try {
            await withLoader('Caricamento report consumi…', async () => {
                const json = await getConsumiReport({
                    menuKind: requestParams.menuKind,
                    menuRef: requestParams.menuRef,
                    start: requestParams.start,
                    end: requestParams.end,
                    meal: requestParams.meal,
                    patientId: requestParams.patientId,
                    floor: requestParams.floor,
                    course: requestParams.course,
                    firstChoice: requestParams.firstChoice,
                    page: requestParams.page,
                    pageSize: requestParams.pageSize,
                    commentsPage: requestParams.commentsPage,
                    commentsPageSize: requestParams.commentsPageSize,
                });

                setKpi(json.kpi || {});
                setTopLiked(json.topLiked || []);
                setTopDisliked(json.topDisliked || []);
                setDetails(
                    json.details || { data: [], total: 0, totalPages: 1 },
                );
                setComments(
                    json.comments || {
                        data: [],
                        total: 0,
                        totalPages: 1,
                        page: 1,
                        pageSize: commentsPageSize,
                        hasOnlyEmptyComments: false,
                    },
                );
                setOptions(json.options || { patients: [], floors: [] });
            });
        } catch (e) {
            console.error(e);
            setError('Errore nel caricamento del report consumi.');
            setKpi({
                waste_kg: 0,
                kcal_wasted: 0,
                avg_consumption: 0,
                gradimento_pct: 0,
                coverage_pct: 0,
            });
            setTopLiked([]);
            setTopDisliked([]);
            setDetails({ data: [], total: 0, totalPages: 1 });
            setComments({
                data: [],
                total: 0,
                totalPages: 1,
                page: 1,
                pageSize: commentsPageSize,
                hasOnlyEmptyComments: false,
            });
        } finally {
            setLoading(false);
        }
    }, [requestParams, commentsPageSize]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setPage(1);
    };

    const handleCommentsPageSizeChange = (e) => {
        setCommentsPageSize(Number(e.target.value));
        setCommentsPage(1);
    };

    const handleApplyFilters = (values) => {
        const parsed = parseMenuValue(values.menuValue);
        const menu = (menus || []).find(
            (m) => buildMenuValue(m) === values.menuValue,
        );

        if (!menu) return;

        setSelectedMenu(menu);

        setApplied({
            menuKind: parsed.menuKind,
            menuRef: parsed.menuRef,
            start: values.start,
            end: values.end,
            meal: values.meal || '',
            patientId: values.patientId || '',
            floor: values.floor || '',
            course: values.course || '',
            firstChoice: values.firstChoice || '',
        });

        setPage(1);
        setCommentsPage(1);
    };

    return (
        <AppLayout title="REPORT CONSUMI">
            <h1 className="text-3xl font-semibold">
                Statistiche e analisi consumi
            </h1>

            <div className="relative z-20 mt-4">
                <Card className="relative z-20 overflow-visible rounded-[24px] border border-black/5 bg-white/85 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
                    {selectedMenu && !menusLoading ? (
                        <Form
                            key={formKey}
                            initialValues={formInitialValues}
                            validateForm={(v) => {
                                const errs = {};

                                if (!v.menuValue) {
                                    errs.menuValue = 'Seleziona un menù';
                                }

                                if (!v.start) {
                                    errs.start = 'Seleziona una data di inizio';
                                }

                                if (!v.end) {
                                    errs.end = 'Seleziona una data di fine';
                                }

                                if (v.start && v.end && v.end < v.start) {
                                    errs.end =
                                        'La data di fine deve essere >= data inizio';
                                }

                                const currentSelected = (menus || []).find(
                                    (m) => buildMenuValue(m) === v.menuValue,
                                );

                                if (currentSelected) {
                                    if (
                                        v.start &&
                                        v.start < currentSelected.start_date
                                    ) {
                                        errs.start =
                                            'La data di inizio deve rientrare nel menù selezionato';
                                    }

                                    if (
                                        v.end &&
                                        v.end > currentSelected.end_date
                                    ) {
                                        errs.end =
                                            'La data di fine deve rientrare nel menù selezionato';
                                    }
                                }

                                return errs;
                            }}
                            onSubmit={handleApplyFilters}
                        >
                            <MenuSelectionSync
                                menuRows={menus}
                                setSelectedMenu={setSelectedMenu}
                                setFormVersion={setFormVersion}
                            />

                            <div className="flex justify-between gap-4 flex-wrap">
                                <div className="flex flex-col gap-4 flex-[1] min-w-[280px]">
                                    <FormGroup name="menuValue">
                                        <SearchableSelect
                                            name="menuValue"
                                            options={menuOptions}
                                            placeholder="Seleziona un menù"
                                            loading={false}
                                        />
                                    </FormGroup>

                                    <FormGroup
                                        name="start"
                                        className="min-w-[240px]"
                                    >
                                        <DateRangePicker
                                            startName="start"
                                            endName="end"
                                            placeholderStart="Inizio"
                                            placeholderEnd="Fine"
                                            minDate={
                                                selectedMenu?.start_date ?? null
                                            }
                                            maxDate={
                                                selectedMenu?.end_date ?? null
                                            }
                                        />
                                    </FormGroup>
                                </div>

                                <div className="w-px w-full bg-[repeating-linear-gradient(to_bottom,#C6C6C6_0,#C6C6C6_6px,transparent_6px,transparent_12px)]" />

                                <div className="flex flex-col flex-[2] gap-4 min-w-[620px]">
                                    <div className="flex gap-4 flex-wrap">
                                        <FormGroup
                                            name="meal"
                                            className="max-w-[150px] flex-1"
                                        >
                                            <CustomSelect
                                                name="meal"
                                                options={MEAL_OPTIONS}
                                                placeholder="Tutti i pasti"
                                                className="w-full"
                                            />
                                        </FormGroup>

                                        <FormGroup
                                            name="course"
                                            className="min-w-[170px] flex-1"
                                        >
                                            <CustomSelect
                                                name="course"
                                                options={COURSE_OPTIONS}
                                                placeholder="Tutte le portate"
                                                className="w-full"
                                            />
                                        </FormGroup>

                                        <FormGroup
                                            name="firstChoice"
                                            className="min-w-[210px] flex-1"
                                        >
                                            <CustomSelect
                                                name="firstChoice"
                                                options={FIRST_CHOICE_OPTIONS}
                                                placeholder="Tutti i tipi piatto"
                                                className="w-full"
                                            />
                                        </FormGroup>
                                    </div>

                                    <div className="flex gap-4 flex-wrap items-end">
                                        <FormGroup
                                            name="patientId"
                                            className="min-w-[320px] flex-[2]"
                                        >
                                            <SearchableSelect
                                                name="patientId"
                                                options={[
                                                    {
                                                        value: '',
                                                        label: 'Tutti i pazienti',
                                                    },
                                                    ...(options.patients || []),
                                                ]}
                                                placeholder="Tutti i pazienti"
                                                loading={false}
                                                className="w-full"
                                            />
                                        </FormGroup>

                                        <FormGroup
                                            name="floor"
                                            className="min-w-[160px] flex-1"
                                        >
                                            <CustomSelect
                                                name="floor"
                                                options={floorOptionsFinal}
                                                placeholder="Tutti i piani"
                                                className="w-full"
                                            />
                                        </FormGroup>

                                        <Button
                                            type="submit"
                                            variant="primary"
                                            size="md"
                                            className="px-6 py-2 rounded-md"
                                            disabled={loading || menusLoading}
                                        >
                                            Applica filtri
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Form>
                    ) : (
                        <div className="p-5 text-brand-textSecondary italic">
                            Nessun menù disponibile.
                        </div>
                    )}
                </Card>
            </div>

            <div className="mt-6 grid grid-cols-5 gap-5">
                <KpiCard
                    iconSrc="/warning giallo.png"
                    iconAlt="Spreco totale"
                    iconBg="bg-yellow-100"
                    value={`${fmtDec(kpi.waste_kg, 2)} kg`}
                    label="Spreco totale stimato"
                    sub="Periodo selezionato"
                />
                <KpiCard
                    iconSrc="/fire red.png"
                    iconAlt="Kcal sprecate"
                    iconBg="bg-red-100"
                    value={fmtInt(kpi.kcal_wasted)}
                    label="Kcal sprecate"
                    sub="Energia non consumata"
                />
                <KpiCard
                    iconSrc="/pie chart blue.png"
                    iconAlt="Consumo medio"
                    iconBg="bg-blue-100"
                    value={fmtDec(kpi.avg_consumption, 2)}
                    label="Consumo medio"
                    sub="Porzione media consumata"
                />
                <KpiCard
                    iconSrc="/like primary.png"
                    iconAlt="Gradimento"
                    iconBg="bg-green-100"
                    value={fmtPct(kpi.gradimento_pct)}
                    label="Gradimento"
                    sub="Pasti consumati completamente"
                />
                <KpiCard
                    iconSrc="/clipboard check primary.png"
                    iconAlt="Copertura questionario"
                    iconBg="bg-green-100"
                    value={fmtPct(kpi.coverage_pct)}
                    label="Copertura questionario"
                    sub="Portate con questionari completati"
                />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-6">
                <ConsumiRankCard
                    title="Piatti più graditi"
                    iconSrc="/star primary.png"
                    iconAlt="Piatti più graditi"
                    rows={topLiked}
                    mode="good"
                />

                <ConsumiRankCard
                    title="Piatti meno graditi"
                    iconSrc="/down trend red.png"
                    iconAlt="Piatti meno graditi"
                    rows={topDisliked}
                    mode="bad"
                />
            </div>

            <div className="mt-8">
                <Card className="overflow-hidden rounded-[24px] border border-white/60 bg-white/85  shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
                    <div className="border-b border-black/5 px-3 pb-4 pt-1">
                        <div className="font-semibold text-brand-text">
                            Dettagli questionari
                        </div>
                        <div className="mt-1 text-sm text-brand-textSecondary">
                            Tracciato completo dei questionari compilati
                        </div>
                    </div>

                    <div className="px-4 pb-5 pt-4 overflow-x-auto">
                        <table className="w-full min-w-[1200px] border-separate border-spacing-0 text-sm">
                            <thead>
                                <tr className="text-xs uppercase tracking-[0.08em] text-brand-textSecondary">
                                    <th className="rounded-l-2xl bg-black/[0.03] px-4 py-3 text-left font-semibold">
                                        Data
                                    </th>
                                    <th className="bg-black/[0.03] px-3 py-3 text-left font-semibold">
                                        Paziente
                                    </th>
                                    <th className="bg-black/[0.03] px-3 py-3 text-left font-semibold">
                                        Locazione
                                    </th>
                                    <th className="bg-black/[0.03] px-3 py-3 text-left font-semibold">
                                        Pasto
                                    </th>
                                    <th className="bg-black/[0.03] px-3 py-3 text-left font-semibold">
                                        Portata
                                    </th>
                                    <th className="bg-black/[0.03] px-3 py-3 text-left font-semibold">
                                        Piatto
                                    </th>
                                    <th className="bg-black/[0.03] px-3 py-3 text-right font-semibold">
                                        Porzione
                                    </th>
                                    <th className="bg-black/[0.03] px-3 py-3 text-right font-semibold">
                                        Spreco
                                    </th>
                                    <th className="rounded-r-2xl bg-black/[0.03] px-3 py-3 text-left font-semibold">
                                        Caregiver
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {(details.data || []).length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="px-4 py-8 text-center italic text-brand-textSecondary"
                                        >
                                            Nessun questionario trovato.
                                        </td>
                                    </tr>
                                ) : (
                                    details.data.map((r, idx) => (
                                        <tr
                                            key={`${r.date}-${idx}`}
                                            className="group"
                                        >
                                            <td className="border-b border-black/[0.05] px-3 py-2.5 whitespace-nowrap tabular-nums text-brand-text transition-colors group-hover:bg-black/[0.015]">
                                                {formatDateTime(r.date)}
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2.5 font-medium text-brand-text transition-colors group-hover:bg-black/[0.015]">
                                                {r.patient_surname}{' '}
                                                {r.patient_name}
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2.5 whitespace-nowrap text-brand-textSecondary transition-colors group-hover:bg-black/[0.015]">
                                                Piano {r.floor} · Stanza{' '}
                                                {r.room}
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2.5 transition-colors group-hover:bg-black/[0.015]">
                                                <span className="inline-flex rounded-md bg-[rgba(74,144,226,0.10)] px-2.5 py-1 text-xs font-medium capitalize text-brand-secondary">
                                                    {r.meal_type}
                                                </span>
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2.5 transition-colors group-hover:bg-black/[0.015]">
                                                <span className="inline-flex rounded-md bg-[rgba(245,197,66,0.16)] px-2.5 py-1 text-xs font-medium text-[#A06A00]">
                                                    {formatCourseLabel(
                                                        r.course_type,
                                                    )}
                                                </span>
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2.5 font-medium text-brand-text transition-colors group-hover:bg-black/[0.015]">
                                                {r.dish_name}
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2.5 text-right tabular-nums font-medium text-brand-text transition-colors group-hover:bg-black/[0.015]">
                                                {fmtDec(r.portion, 2)}
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2.5 text-right transition-colors group-hover:bg-black/[0.015]">
                                                <span className="inline-flex rounded-md bg-[rgba(224,72,72,0.10)] px-2.5 py-1 text-xs font-semibold tabular-nums text-brand-error">
                                                    {fmtInt(r.waste_g)} g
                                                </span>
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2.5 whitespace-nowrap text-brand-textSecondary transition-colors group-hover:bg-black/[0.015]">
                                                {r.caregiver_name}{' '}
                                                {r.caregiver_surname}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-black/5">
                        <Pagination
                            total={details.total || 0}
                            page={page}
                            totalPages={details.totalPages || 1}
                            pageSize={pageSize}
                            loading={loading}
                            onPageChange={setPage}
                            onPageSizeChange={handlePageSizeChange}
                        />
                    </div>
                </Card>
            </div>

            <div className="mt-8">
                <Card className="overflow-hidden rounded-[24px] border border-white/60 bg-white/85 p-0 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
                    <div className="border-b border-black/5 px-3 pb-4 pt-1">
                        <div className="font-semibold text-brand-text">
                            Questionari commenti
                        </div>
                        <div className="mt-1 text-sm text-brand-textSecondary">
                            Commenti testuali registrati nei questionari
                        </div>
                    </div>

                    <div className="px-4 pb-3 pt-4 overflow-x-auto">
                        {(comments.data || []).length === 0 ? (
                            <div className="px-4 py-8 text-center italic text-brand-textSecondary">
                                {comments.total > 0
                                    ? 'Esistono record dei questionari commenti, ma in questa pagina nessuno contiene un commento testuale valorizzato.'
                                    : 'Non ci sono questionari commenti.'}
                            </div>
                        ) : (
                            <table className="w-full min-w-[1100px] border-separate border-spacing-0 text-sm">
                                <thead>
                                    <tr className="text-xs uppercase tracking-[0.08em] text-brand-textSecondary">
                                        <th className="rounded-l-2xl bg-black/[0.03] px-4 py-3 text-left font-semibold">
                                            Data
                                        </th>
                                        <th className="bg-black/[0.03] px-3 py-3 text-left font-semibold">
                                            Paziente
                                        </th>
                                        <th className="bg-black/[0.03] px-3 py-3 text-left font-semibold">
                                            Locazione
                                        </th>
                                        <th className="bg-black/[0.03] px-3 py-3 text-right font-semibold">
                                            Giorno
                                        </th>
                                        <th className="bg-black/[0.03] px-3 py-3 text-left font-semibold">
                                            Pasto
                                        </th>
                                        <th className="bg-black/[0.03] px-3 py-3 text-left font-semibold">
                                            Commento
                                        </th>
                                        <th className="rounded-r-2xl bg-black/[0.03] px-3 py-3 text-left font-semibold">
                                            Caregiver
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {comments.data.map((r, idx) => (
                                        <tr
                                            key={`${r.date}-${r.patient_name}-${r.patient_surname}-${r.day_number}-${r.meal_type}-${idx}`}
                                            className="group"
                                        >
                                            <td className="border-b border-black/[0.05] px-3 py-2.5 whitespace-nowrap tabular-nums text-brand-text transition-colors group-hover:bg-black/[0.015]">
                                                {formatDateTime(r.date)}
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2.5 font-medium text-brand-text transition-colors group-hover:bg-black/[0.015]">
                                                {r.patient_surname}{' '}
                                                {r.patient_name}
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2.5 whitespace-nowrap text-brand-textSecondary transition-colors group-hover:bg-black/[0.015]">
                                                Piano {r.floor} · Stanza{' '}
                                                {r.room}
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2.5 text-right tabular-nums text-brand-textSecondary transition-colors group-hover:bg-black/[0.015]">
                                                {fmtInt(r.day_number)}
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2.5 transition-colors group-hover:bg-black/[0.015]">
                                                <span className="inline-flex rounded-md bg-[rgba(74,144,226,0.10)] px-2.5 py-1 text-xs font-medium capitalize text-brand-secondary">
                                                    {r.meal_type}
                                                </span>
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2.5 text-brand-textSecondary transition-colors group-hover:bg-black/[0.015]">
                                                {String(
                                                    r.comments ?? '',
                                                ).trim() || '—'}
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2.5 whitespace-nowrap text-brand-textSecondary transition-colors group-hover:bg-black/[0.015]">
                                                {r.caregiver_name}{' '}
                                                {r.caregiver_surname}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="border-t border-black/5">
                        <Pagination
                            total={comments.total || 0}
                            page={commentsPage}
                            totalPages={comments.totalPages || 1}
                            pageSize={commentsPageSize}
                            loading={loading}
                            onPageChange={setCommentsPage}
                            onPageSizeChange={handleCommentsPageSizeChange}
                        />
                    </div>
                </Card>
            </div>

            {error && <div className="mt-3 text-brand-error">{error}</div>}
        </AppLayout>
    );
}