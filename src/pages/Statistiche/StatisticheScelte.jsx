// Report page for food choices.
// Main logic for filters, data loading and report sections.
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
import StatisticsInfoModal from '../../components/modals/StatisticsInfoModal';
import { withLoader } from '../../services/withLoader';
import { getScelteMenus, getScelteReport } from '../../services/reportsApi';
import StatsMenuSelectionSync from '../../components/statistics/StatsMenuSelectionSync';
import StatsKpiCard from '../../components/statistics/StatsKpiCard';
import StatsRankCard from '../../components/statistics/StatsRankCard';
import StatsBarsCard from '../../components/statistics/StatsBarsCard';
import { buildMenuValue } from '../../utils/statistics/menuValue';
import {
    fmtInt,
    fmtPct,
    formatChooserLabel,
    formatCourseLabel,
    formatDate,
} from '../../utils/statistics/reportFormatters';

// Filter options
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

const WEEK_OPTIONS = [
    { value: '', label: 'Tutte le settimane' },
    { value: '1', label: 'Settimana 1' },
    { value: '2', label: 'Settimana 2' },
    { value: '3', label: 'Settimana 3' },
    { value: '4', label: 'Settimana 4' },
];

const CHOOSER_OPTIONS = [
    { value: '', label: 'Tutti i compilatori' },
    { value: 'guest', label: 'Ospite' },
    { value: 'family', label: 'Famiglia' },
    { value: 'caregiver', label: 'Caregiver' },
];

const BABY_FOOD_OPTIONS = [
    { value: '', label: 'Tutte le scelte' },
    { value: '1', label: 'Solo baby food' },
    { value: '0', label: 'Escludi baby food' },
];

// Empty fallback values used before data is loaded or when an error happens
const EMPTY_KPI = {
    total_choices: 0,
    distinct_dishes_chosen: 0,
    overall_choice_rate_pct: 0,
    never_chosen_count: 0,
    top_category_label: '—',
    caregiver_share_pct: 0,
    baby_food_share_pct: 0,
    patient_scope_count: 0,
    total_availability_occurrences: 0,
};

const EMPTY_RANKINGS = {
    topChosen: [],
    bottomChosen: [],
    neverChosen: [],
};

const EMPTY_CHARTS = {
    weeklyTrend: [],
    byCourse: [],
    byChooser: [],
};

const EMPTY_DISHES = {
    data: [],
    total: 0,
    totalPages: 1,
    page: 1,
    pageSize: 10,
};

const EMPTY_DETAILS = {
    data: [],
    total: 0,
    totalPages: 1,
    page: 1,
    pageSize: 10,
};

const EMPTY_OPTIONS = {
    patients: [],
    floors: [],
};

const EMPTY_FORM_VALUES = {
    menuValue: '',
    start: '',
    end: '',
    meal: '',
    patientId: '',
    floor: '',
    course: '',
    firstChoice: '',
    week: '',
    chooser: '',
    babyFood: '',
};

// Builds the filters object used for the report request.
// If some values are missing, menu dates are used as default range.
function buildAppliedFilters(menu, values = {}) {
    return {
        menuKind: menu?.kind ?? '',
        menuRef: menu?.ref ?? '',
        start: values.start ?? menu?.start_date ?? '',
        end: values.end ?? menu?.end_date ?? '',
        meal: values.meal ?? '',
        patientId: values.patientId ?? '',
        floor: values.floor ?? '',
        course: values.course ?? '',
        firstChoice: values.firstChoice ?? '',
        week: values.week ?? '',
        chooser: values.chooser ?? '',
        babyFood: values.babyFood ?? '',
    };
}

// Validates the filter form.
// It also checks that the selected dates stay inside the selected menu period.
function validateScelteFilters(values, menus) {
    const errs = {};

    if (!values.menuValue) {
        errs.menuValue = 'Seleziona un menù';
    }

    if (!values.start) {
        errs.start = 'Seleziona una data di inizio';
    }

    if (!values.end) {
        errs.end = 'Seleziona una data di fine';
    }

    if (values.start && values.end && values.end < values.start) {
        errs.end = 'La data di fine deve essere >= data inizio';
    }

    const currentSelected = (menus || []).find(
        (menu) => buildMenuValue(menu) === values.menuValue,
    );

    if (currentSelected) {
        if (values.start && values.start < currentSelected.start_date) {
            errs.start =
                'La data di inizio deve rientrare nel menù selezionato';
        }

        if (values.end && values.end > currentSelected.end_date) {
            errs.end = 'La data di fine deve rientrare nel menù selezionato';
        }
    }

    return errs;
}

export default function StatisticheScelte() {
    // Main page state
    const [menus, setMenus] = useState([]);
    const [menusLoading, setMenusLoading] = useState(true);

    const [selectedMenu, setSelectedMenu] = useState(null);
    const [formVersion, setFormVersion] = useState(0);

    const [applied, setApplied] = useState(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [detailsPage, setDetailsPage] = useState(1);
    const [detailsPageSize, setDetailsPageSize] = useState(10);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeInfoModal, setActiveInfoModal] = useState('');

    const [kpi, setKpi] = useState(EMPTY_KPI);
    const [rankings, setRankings] = useState(EMPTY_RANKINGS);
    const [charts, setCharts] = useState(EMPTY_CHARTS);
    const [dishes, setDishes] = useState(EMPTY_DISHES);
    const [details, setDetails] = useState(EMPTY_DETAILS);
    const [options, setOptions] = useState(EMPTY_OPTIONS);

    // Load available menus when the page opens
    useEffect(() => {
        let cancelled = false;

        // Loads the available menus for the page.
        async function loadMenus() {
            setMenusLoading(true);
            setError('');

            try {
                const json = await getScelteMenus();
                const rows = json?.data || [];

                if (cancelled) return;

                setMenus(rows);

                const firstMenu = rows[0] || null;
                setSelectedMenu(firstMenu);

                if (firstMenu) {
                    setApplied(buildAppliedFilters(firstMenu));
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

    // Initial form values follow the selected menu and the last applied filters
    const formInitialValues = useMemo(() => {
        if (!selectedMenu) {
            return EMPTY_FORM_VALUES;
        }

        const menuValue = buildMenuValue(selectedMenu);

        const appliedMatchesSelectedMenu =
            applied &&
            applied.menuKind === selectedMenu.kind &&
            applied.menuRef === selectedMenu.ref;

        const currentValues = appliedMatchesSelectedMenu
            ? applied
            : buildAppliedFilters(selectedMenu);

        return {
            menuValue,
            start: currentValues.start,
            end: currentValues.end,
            meal: currentValues.meal,
            patientId: currentValues.patientId,
            floor: currentValues.floor,
            course: currentValues.course,
            firstChoice: currentValues.firstChoice,
            week: currentValues.week,
            chooser: currentValues.chooser,
            babyFood: currentValues.babyFood,
        };
    }, [selectedMenu, applied]);

    // Changes the form key when menu changes, so the form can reset correctly
    const formKey = useMemo(() => {
        return `${selectedMenu ? buildMenuValue(selectedMenu) : 'none'}-${formVersion}`;
    }, [selectedMenu, formVersion]);

    const menuOptions = useMemo(() => {
        return (menus || []).map((menu) => ({
            value: buildMenuValue(menu),
            label: menu.label,
        }));
    }, [menus]);

    const floorOptionsFinal = useMemo(() => {
        return [
            { value: '', label: 'Tutti i piani' },
            ...(options.floors || []),
        ];
    }, [options.floors]);

    // Full request params used by the report API, including pagination
    const requestParams = useMemo(() => {
        if (!applied) return null;

        return {
            ...applied,
            page,
            pageSize,
            detailsPage,
            detailsPageSize,
        };
    }, [applied, page, pageSize, detailsPage, detailsPageSize]);

    // Loads the whole report based on current filters and pagination
    const fetchReport = useCallback(async () => {
        if (!requestParams) return;

        setLoading(true);
        setError('');

        try {
            await withLoader('Caricamento report scelte…', async () => {
                const json = await getScelteReport({
                    menuKind: requestParams.menuKind,
                    menuRef: requestParams.menuRef,
                    start: requestParams.start,
                    end: requestParams.end,
                    meal: requestParams.meal,
                    patientId: requestParams.patientId,
                    floor: requestParams.floor,
                    course: requestParams.course,
                    firstChoice: requestParams.firstChoice,
                    week: requestParams.week,
                    chooser: requestParams.chooser,
                    babyFood: requestParams.babyFood,
                    page: requestParams.page,
                    pageSize: requestParams.pageSize,
                    detailsPage: requestParams.detailsPage,
                    detailsPageSize: requestParams.detailsPageSize,
                });

                setKpi(json.kpi || EMPTY_KPI);
                setRankings(json.rankings || EMPTY_RANKINGS);
                setCharts(json.charts || EMPTY_CHARTS);
                setDishes(json.dishes || EMPTY_DISHES);
                setDetails(json.details || EMPTY_DETAILS);
                setOptions(json.options || EMPTY_OPTIONS);
            });
        } catch (e) {
            console.error(e);
            setError('Errore nel caricamento del report scelte.');
            setKpi(EMPTY_KPI);
            setRankings(EMPTY_RANKINGS);
            setCharts(EMPTY_CHARTS);
            setDishes(EMPTY_DISHES);
            setDetails(EMPTY_DETAILS);
            setOptions(EMPTY_OPTIONS);
        } finally {
            setLoading(false);
        }
    }, [requestParams]);

    // Reload report when filters or pagination change
    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    // Pagination handlers
    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setPage(1);
    };

    const handleDetailsPageSizeChange = (e) => {
        setDetailsPageSize(Number(e.target.value));
        setDetailsPage(1);
    };

    // Applies filters from the form and resets pagination
    const handleApplyFilters = (values) => {
        const menu = (menus || []).find(
            (menuRow) => buildMenuValue(menuRow) === values.menuValue,
        );

        if (!menu) return;

        setSelectedMenu(menu);
        setApplied(buildAppliedFilters(menu, values));
        setPage(1);
        setDetailsPage(1);
    };

    // Data prepared for charts
    const weeklyChartRows = useMemo(() => {
        return (charts.weeklyTrend || []).map((row) => ({
            label: row.label,
            value: Number(row.selection_rate_pct || 0),
            valueLabel: fmtPct(row.selection_rate_pct, 1),
            chosen_count: Number(row.chosen_count || 0),
            opportunity_count: Number(row.opportunity_count || 0),
            availability_count: Number(row.availability_count || 0),
        }));
    }, [charts.weeklyTrend]);

    const byCourseChartRows = useMemo(() => {
        return (charts.byCourse || []).map((row) => ({
            label: row.label || formatCourseLabel(row.course_type),
            value: Number(row.selection_rate_pct || 0),
            valueLabel: fmtPct(row.selection_rate_pct, 1),
            chosen_count: Number(row.chosen_count || 0),
            opportunity_count: Number(row.opportunity_count || 0),
            availability_count: Number(row.availability_count || 0),
        }));
    }, [charts.byCourse]);

    const byChooserChartRows = useMemo(() => {
        return (charts.byChooser || []).map((row) => ({
            label: row.label || formatChooserLabel(row.chooser),
            value: Number(row.share_pct || 0),
            valueLabel: fmtPct(row.share_pct, 1),
            chosen_count: Number(row.chosen_count || 0),
        }));
    }, [charts.byChooser]);

    return (
        <AppLayout title="REPORT SCELTE">
            <h1 className="text-3xl font-semibold">
                Statistiche e analisi scelte piatti
            </h1>

            {/* Filters section */}
            <div className="relative z-20 mt-4">
                <Card className="relative z-20 overflow-visible rounded-[24px] border border-black/5 bg-white/85 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
                    {selectedMenu && !menusLoading ? (
                        <Form
                            key={formKey}
                            initialValues={formInitialValues}
                            validateForm={(values) =>
                                validateScelteFilters(values, menus)
                            }
                            onSubmit={handleApplyFilters}
                        >
                            {/* Keeps selected menu and form values in sync */}
                            <StatsMenuSelectionSync
                                menuRows={menus}
                                setSelectedMenu={setSelectedMenu}
                                setFormVersion={setFormVersion}
                            />

                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
                                <div className="flex w-full flex-col gap-4 xl:max-w-[440px] xl:flex-[1]">
                                    <FormGroup name="menuValue">
                                        <SearchableSelect
                                            name="menuValue"
                                            options={menuOptions}
                                            placeholder="Seleziona un menù"
                                            loading={false}
                                        />
                                    </FormGroup>

                                    <FormGroup name="start" className="w-full">
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

                                {/* Visual separator between main and secondary filters */}
                                <div className="hidden self-stretch bg-[repeating-linear-gradient(to_bottom,#C6C6C6_0,#C6C6C6_6px,transparent_6px,transparent_12px)] xl:block xl:w-px" />

                                <div className="flex w-full flex-col gap-4 xl:flex-[2]">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                                        <FormGroup
                                            name="meal"
                                            className="w-full sm:min-w-[150px] sm:flex-1"
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
                                            className="w-full sm:min-w-[170px] sm:flex-1"
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
                                            className="w-full sm:min-w-[210px] sm:flex-1"
                                        >
                                            <CustomSelect
                                                name="firstChoice"
                                                options={FIRST_CHOICE_OPTIONS}
                                                placeholder="Tutti i tipi piatto"
                                                className="w-full"
                                            />
                                        </FormGroup>

                                        <FormGroup
                                            name="week"
                                            className="w-full sm:min-w-[170px] sm:flex-1"
                                        >
                                            <CustomSelect
                                                name="week"
                                                options={WEEK_OPTIONS}
                                                placeholder="Tutte le settimane"
                                                className="w-full"
                                            />
                                        </FormGroup>

                                        <FormGroup
                                            name="chooser"
                                            className="w-full sm:min-w-[180px] sm:flex-1"
                                        >
                                            <CustomSelect
                                                name="chooser"
                                                options={CHOOSER_OPTIONS}
                                                placeholder="Tutti i compilatori"
                                                className="w-full"
                                            />
                                        </FormGroup>
                                    </div>

                                    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
                                        <FormGroup
                                            name="babyFood"
                                            className="w-full sm:min-w-[180px] sm:flex-1"
                                        >
                                            <CustomSelect
                                                name="babyFood"
                                                options={BABY_FOOD_OPTIONS}
                                                placeholder="Tutte le scelte"
                                                className="w-full"
                                            />
                                        </FormGroup>

                                        <FormGroup
                                            name="patientId"
                                            className="w-full sm:min-w-[320px] sm:flex-[2]"
                                        >
                                            <SearchableSelect
                                                name="patientId"
                                                options={[
                                                    {
                                                        value: '',
                                                        label: 'Tutti gli ospiti',
                                                    },
                                                    ...(options.patients || []),
                                                ]}
                                                placeholder="Tutti gli ospiti"
                                                loading={false}
                                                className="w-full"
                                            />
                                        </FormGroup>

                                        <FormGroup
                                            name="floor"
                                            className="w-full sm:min-w-[160px] sm:flex-1"
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
                        <div className="text-brand-textSecondary italic">
                            Nessun menù disponibile.
                        </div>
                    )}
                </Card>
            </div>

            {/* KPI cards */}
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 min-[1800px]:grid-cols-6">
                <StatsKpiCard
                    iconSrc="/icons/checklist-secondary.png"
                    iconAlt="Scelte totali"
                    iconBg="bg-blue-100"
                    value={fmtInt(kpi.total_choices)}
                    label="Scelte totali"
                    sub="Record di scelta nel periodo"
                />
                <StatsKpiCard
                    iconSrc="/icons/dish-primary.png"
                    iconAlt="Piatti distinti scelti"
                    iconBg="bg-green-100"
                    value={fmtInt(kpi.distinct_dishes_chosen)}
                    label="Piatti distinti scelti"
                    sub="Varietà reale delle preferenze"
                />
                <StatsKpiCard
                    iconSrc="/icons/percentage-chart-secondary.png"
                    iconAlt="Tasso di scelta"
                    iconBg="bg-purple-100"
                    value={fmtPct(kpi.overall_choice_rate_pct, 1)}
                    label="Tasso medio stimato"
                    sub="Scelte registrate / opportunità stimate"
                    onInfoClick={() => setActiveInfoModal('choiceRate')}
                    infoLabel="Informazioni sul KPI Tasso medio stimato"
                />
                <StatsKpiCard
                    iconSrc="/icons/empty-plate-error.png"
                    iconAlt=""
                    iconBg="bg-red-100"
                    value={fmtInt(kpi.never_chosen_count)}
                    label="Piatti mai scelti"
                    sub="Disponibili ma mai richiesti"
                />
                <StatsKpiCard
                    iconSrc="/icons/tag-warning.png"
                    iconAlt="Categoria più richiesta"
                    iconBg="bg-yellow-100"
                    value={kpi.top_category_label || '—'}
                    label="Categoria più richiesta"
                    sub="Basata sulle scelte registrate"
                />
                <StatsKpiCard
                    iconSrc="/icons/baby-food-primary.png"
                    iconAlt="Scelte baby food"
                    iconBg="bg-green-100"
                    value={fmtPct(kpi.baby_food_share_pct, 1)}
                    label="Scelte baby food"
                    sub="Quota sul totale delle scelte"
                />
            </div>

            {/* Small note to explain how the main rate is calculated */}
            <div className="mt-4 text-sm text-brand-textSecondary">
                Tasso di scelta = scelte registrate / opportunità stimate. Le
                opportunità stimate sono calcolate come apparizioni del piatto
                nel menù × ospiti nel perimetro filtrato (
                {fmtInt(kpi.patient_scope_count)}).
            </div>

            {/* Ranking cards */}
            <div className="mt-6 grid grid-cols-1 gap-6 min-[1800px]:grid-cols-3">
                <StatsRankCard
                    title="Piatti più richiesti"
                    iconSrc="/icons/star primary.png"
                    iconAlt="Piatti più richiesti"
                    rows={rankings.topChosen}
                    mode="top"
                />

                <StatsRankCard
                    title="Piatti meno richiesti"
                    iconSrc="/icons/down trend red.png"
                    iconAlt="Piatti meno richiesti"
                    rows={rankings.bottomChosen}
                    mode="bottom"
                />

                <StatsRankCard
                    title="Piatti mai scelti"
                    iconSrc="/icons/no-food-text-secondary.png"
                    iconAlt="Piatti mai scelti"
                    rows={rankings.neverChosen}
                    mode="never"
                />
            </div>

            {/* Main charts */}
            <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
                <StatsBarsCard
                    title="Trend di scelta per settimana"
                    sub="Scelte registrate / opportunità stimate nel perimetro filtrato"
                    iconSrc="/icons/calendar-primary.png"
                    iconAlt="Trend settimanale"
                    rows={weeklyChartRows}
                    barMode="percent"
                    metaRenderer={(row) =>
                        `${fmtInt(row.chosen_count)} scelte · ${fmtInt(
                            row.opportunity_count,
                        )} opportunità · ${fmtInt(row.availability_count)} apparizioni`
                    }
                />

                <StatsBarsCard
                    title="Tasso di scelta per portata"
                    sub="Scelte registrate / opportunità stimate nel perimetro filtrato"
                    iconSrc="/icons/category-primary.png"
                    iconAlt="Tasso di scelta per portata"
                    rows={byCourseChartRows}
                    barMode="percent"
                    metaRenderer={(row) =>
                        `${fmtInt(row.chosen_count)} scelte · ${fmtInt(
                            row.opportunity_count,
                        )} opportunità · ${fmtInt(row.availability_count)} apparizioni`
                    }
                />
            </div>

            <div className="mt-6">
                <StatsBarsCard
                    title="Distribuzione per compilatore"
                    iconSrc="/icons/group-users-secondary.png"
                    iconAlt="Distribuzione per compilatore"
                    rows={byChooserChartRows}
                    barMode="percent"
                    metaRenderer={(row) => `${fmtInt(row.chosen_count)} scelte`}
                />
            </div>

            {/* Aggregated dishes table */}
            <div className="mt-8">
                <Card className="overflow-hidden rounded-[24px] border border-white/60 bg-white/85 p-0 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
                    <div className="border-b border-black/5 px-3 pb-4 pt-1">
                        <div className="flex items-center gap-2">
                            <div className="font-semibold text-brand-text">
                                Tabella aggregata piatti
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setActiveInfoModal('aggregatedDishes')
                                }
                                aria-label="Informazioni sulla tabella aggregata piatti"
                                className="inline-flex items-center justify-center hover:opacity-80 transition"
                            >
                                <img
                                    src="/icons/information blue.png"
                                    alt="Informazioni sulla tabella aggregata piatti"
                                    className="h-4 w-4"
                                    draggable={false}
                                />
                            </button>
                        </div>
                        <div className="mt-1 text-sm text-brand-textSecondary">
                            Apparizioni nel menù, opportunità stimate e tasso di
                            scelta per piatto
                        </div>
                    </div>

                    <div className="px-4 pb-5 pt-4 overflow-x-auto">
                        <table className="w-full min-w-[1250px] border-separate border-spacing-0 text-sm">
                            <thead>
                                <tr className="text-xs uppercase tracking-[0.08em] text-brand-textSecondary">
                                    <th className="rounded-l-2xl bg-black/[0.03] px-3 py-3 text-left font-semibold">
                                        Piatto
                                    </th>
                                    <th className="bg-black/[0.03] px-3 py-3 text-left font-semibold">
                                        Portata
                                    </th>
                                    <th className="bg-black/[0.03] px-3 py-3 text-right font-semibold">
                                        Apparizioni
                                    </th>
                                    <th className="bg-black/[0.03] px-3 py-3 text-right font-semibold">
                                        Ospiti
                                    </th>
                                    <th className="bg-black/[0.03] px-3 py-3 text-right font-semibold">
                                        Opportunità
                                    </th>
                                    <th className="bg-black/[0.03] px-3 py-3 text-right font-semibold">
                                        Scelte
                                    </th>
                                    <th className="bg-black/[0.03] px-3 py-3 text-right font-semibold">
                                        Tasso
                                    </th>
                                    <th className="bg-black/[0.03] px-3 py-3 text-right font-semibold">
                                        Ospite
                                    </th>
                                    <th className="bg-black/[0.03] px-3 py-3 text-right font-semibold">
                                        Famiglia
                                    </th>
                                    <th className="bg-black/[0.03] px-3 py-3 text-right font-semibold">
                                        Caregiver
                                    </th>
                                    <th className="rounded-r-2xl bg-black/[0.03] px-3 py-3 text-right font-semibold">
                                        Baby food
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {(dishes.data || []).length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={11}
                                            className="px-4 py-8 text-center italic text-brand-textSecondary"
                                        >
                                            Nessun dato disponibile nel periodo
                                            selezionato.
                                        </td>
                                    </tr>
                                ) : (
                                    dishes.data.map((row, idx) => (
                                        <tr
                                            key={`${row.food_id}-${idx}`}
                                            className="group"
                                        >
                                            <td className="border-b border-black/[0.05] px-3 py-2 font-semibold text-brand-text transition-colors group-hover:bg-black/[0.015]">
                                                {row.name}
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2 transition-colors group-hover:bg-black/[0.015]">
                                                <span className="inline-flex rounded-md bg-[rgba(74,144,226,0.10)] px-2.5 py-1 text-xs font-medium text-brand-secondary">
                                                    {formatCourseLabel(
                                                        row.type,
                                                    )}
                                                </span>
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2 text-right tabular-nums transition-colors group-hover:bg-black/[0.015]">
                                                {fmtInt(row.availability_count)}
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2 text-right tabular-nums transition-colors group-hover:bg-black/[0.015]">
                                                {fmtInt(
                                                    row.patient_scope_count,
                                                )}
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2 text-right tabular-nums transition-colors group-hover:bg-black/[0.015]">
                                                {fmtInt(row.opportunity_count)}
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2 text-right font-semibold tabular-nums text-brand-text transition-colors group-hover:bg-black/[0.015]">
                                                {fmtInt(row.chosen_count)}
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2 text-right transition-colors group-hover:bg-black/[0.015]">
                                                <span className="inline-flex rounded-md bg-[rgba(57,142,59,0.10)] px-2.5 py-1 text-xs font-semibold tabular-nums text-brand-primary">
                                                    {fmtPct(
                                                        row.selection_rate_pct,
                                                        1,
                                                    )}
                                                </span>
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2 text-right tabular-nums text-brand-textSecondary transition-colors group-hover:bg-black/[0.015]">
                                                {fmtInt(row.guest_count)}
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2 text-right tabular-nums text-brand-textSecondary transition-colors group-hover:bg-black/[0.015]">
                                                {fmtInt(row.family_count)}
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2 text-right tabular-nums text-brand-textSecondary transition-colors group-hover:bg-black/[0.015]">
                                                {fmtInt(row.caregiver_count)}
                                            </td>

                                            <td className="border-b border-black/[0.05] px-4 py-2 text-right tabular-nums text-brand-textSecondary transition-colors group-hover:bg-black/[0.015]">
                                                {fmtInt(row.baby_food_count)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination for aggregated dishes */}
                    <div className="border-t border-black/5">
                        <Pagination
                            total={dishes.total || 0}
                            page={page}
                            totalPages={dishes.totalPages || 1}
                            pageSize={pageSize}
                            loading={loading}
                            onPageChange={setPage}
                            onPageSizeChange={handlePageSizeChange}
                        />
                    </div>
                </Card>
            </div>

            {/* Detailed choices table */}
            <div className="mt-8">
                <Card className="overflow-hidden rounded-[24px] border border-white/60 bg-white/85 p-0 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
                    <div className="border-b border-black/5 px-3 pb-4 pt-1">
                        <div className="font-semibold text-brand-text">
                            Dettaglio singole scelte
                        </div>
                        <div className="mt-1 text-sm text-brand-textSecondary">
                            Tracciato completo delle scelte effettuate
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
                                        Ospite
                                    </th>
                                    <th className="bg-black/[0.03] px-3 py-3 text-left font-semibold">
                                        Locazione
                                    </th>
                                    <th className="bg-black/[0.03] px-3 py-3 text-right font-semibold">
                                        Giorno
                                    </th>
                                    <th className="bg-black/[0.03] px-3 py-3 text-right font-semibold">
                                        Settimana
                                    </th>
                                    <th className="bg-black/[0.03] px-3 py-3 text-left font-semibold">
                                        Pasto
                                    </th>
                                    <th className="bg-black/[0.03] px-3 py-3 text-left font-semibold">
                                        Tipo piatto
                                    </th>
                                    <th className="bg-black/[0.03] px-3 py-3 text-left font-semibold">
                                        Portata
                                    </th>
                                    <th className="bg-black/[0.03] px-3 py-3 text-left font-semibold">
                                        Piatto
                                    </th>
                                    <th className="bg-black/[0.03] px-3 py-3 text-left font-semibold">
                                        Scelta da
                                    </th>
                                    <th className="bg-black/[0.03] px-3 py-3 text-left font-semibold">
                                        Baby food
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
                                            colSpan={12}
                                            className="px-4 py-8 text-center italic text-brand-textSecondary"
                                        >
                                            Nessuna scelta trovata.
                                        </td>
                                    </tr>
                                ) : (
                                    details.data.map((row, idx) => (
                                        <tr
                                            key={`${row.date}-${row.patient_name}-${row.dish_name}-${idx}`}
                                            className="group"
                                        >
                                            <td className="border-b border-black/[0.05] px-3 py-2.5 whitespace-nowrap tabular-nums text-brand-text transition-colors group-hover:bg-black/[0.015]">
                                                {formatDate(row.date)}
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2.5 font-medium text-brand-text transition-colors group-hover:bg-black/[0.015]">
                                                {row.patient_surname}{' '}
                                                {row.patient_name}
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2.5 whitespace-nowrap text-brand-textSecondary transition-colors group-hover:bg-black/[0.015]">
                                                Piano {row.floor} · Stanza{' '}
                                                {row.room}
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2.5 tabular-nums text-right text-brand-textSecondary transition-colors group-hover:bg-black/[0.015]">
                                                {fmtInt(row.day_number)}
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2.5 tabular-nums text-right text-brand-textSecondary transition-colors group-hover:bg-black/[0.015]">
                                                {fmtInt(row.week_number)}
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2.5 transition-colors group-hover:bg-black/[0.015]">
                                                <span className="inline-flex rounded-md bg-[rgba(74,144,226,0.10)] px-2.5 py-1 text-xs font-medium capitalize text-brand-secondary">
                                                    {row.meal_type}
                                                </span>
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2.5 transition-colors group-hover:bg-black/[0.015]">
                                                <span
                                                    className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${
                                                        Number(
                                                            row.first_choice,
                                                        ) === 1
                                                            ? 'bg-[rgba(57,142,59,0.10)] text-brand-primary'
                                                            : 'bg-black/[0.05] text-brand-textSecondary'
                                                    }`}
                                                >
                                                    {Number(
                                                        row.first_choice,
                                                    ) === 1
                                                        ? 'Fisso'
                                                        : 'Del giorno'}
                                                </span>
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2.5 transition-colors group-hover:bg-black/[0.015]">
                                                <span className="inline-flex rounded-md bg-[rgba(245,197,66,0.16)] px-2.5 py-1 text-xs font-medium text-[#A06A00]">
                                                    {formatCourseLabel(
                                                        row.course_type,
                                                    )}
                                                </span>
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2.5 font-medium text-brand-text transition-colors group-hover:bg-black/[0.015]">
                                                {row.dish_name}
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2.5 transition-colors group-hover:bg-black/[0.015]">
                                                <span className="inline-flex rounded-md bg-black/[0.05] px-2.5 py-1 text-xs font-medium text-brand-textSecondary">
                                                    {formatChooserLabel(
                                                        row.chooser,
                                                    )}
                                                </span>
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2.5 transition-colors group-hover:bg-black/[0.015]">
                                                <span
                                                    className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${
                                                        Number(
                                                            row.baby_food,
                                                        ) === 1
                                                            ? 'bg-[rgba(245,197,66,0.16)] text-[#A06A00]'
                                                            : 'bg-black/[0.05] text-brand-textSecondary'
                                                    }`}
                                                >
                                                    {Number(row.baby_food) === 1
                                                        ? 'Sì'
                                                        : 'No'}
                                                </span>
                                            </td>

                                            <td className="border-b border-black/[0.05] px-3 py-2.5 whitespace-nowrap text-brand-textSecondary transition-colors group-hover:bg-black/[0.015]">
                                                {row.caregiver_name}{' '}
                                                {row.caregiver_surname}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination for detailed choices */}
                    <div className="border-t border-black/5">
                        <Pagination
                            total={details.total || 0}
                            page={detailsPage}
                            totalPages={details.totalPages || 1}
                            pageSize={detailsPageSize}
                            loading={loading}
                            onPageChange={setDetailsPage}
                            onPageSizeChange={handleDetailsPageSizeChange}
                        />
                    </div>
                </Card>
            </div>

            <StatisticsInfoModal
                open={activeInfoModal === 'choiceRate'}
                onClose={() => setActiveInfoModal('')}
                title="Come leggere il KPI Tasso medio stimato"
                description="Il tasso confronta le scelte realmente registrate con le opportunità teoriche di scelta nel perimetro filtrato."
                rows={[
                    {
                        label: 'Scelte registrate',
                        description:
                            'Numero di scelte effettivamente presenti nei dati.',
                    },
                    {
                        label: 'Opportunità stimate',
                        description:
                            'Numero teorico di occasioni di scelta: apparizioni del piatto nel menù × ospiti nel perimetro filtrato.',
                    },
                    {
                        label: 'Tasso %',
                        description:
                            'Rapporto tra scelte registrate e opportunità stimate.',
                    },
                ]}
                note={`Il numero di ospiti considerato nel calcolo corrente è ${fmtInt(
                    kpi.patient_scope_count,
                )}.`}
            />

            <StatisticsInfoModal
                open={activeInfoModal === 'aggregatedDishes'}
                onClose={() => setActiveInfoModal('')}
                title="Come leggere la tabella aggregata piatti"
                description="Questa tabella riassume per ogni piatto presenza nel menù, bacino potenziale di scelta e scelte effettivamente registrate."
                rows={[
                    {
                        label: 'Apparizioni',
                        description:
                            'Quante volte il piatto compare nel menù nel periodo filtrato.',
                    },
                    {
                        label: 'Ospiti',
                        description:
                            'Numero di ospiti considerati dal filtro applicato.',
                    },
                    {
                        label: 'Opportunità',
                        description:
                            'Apparizioni × ospiti, cioè occasioni teoriche di scelta per quel piatto.',
                    },
                    {
                        label: 'Scelte',
                        description:
                            'Numero di volte in cui il piatto è stato effettivamente scelto.',
                    },
                    {
                        label: 'Tasso',
                        description:
                            'Rapporto tra scelte registrate e opportunità stimate.',
                    },
                    {
                        label: 'Ospite / Famiglia / Caregiver',
                        description:
                            'Ripartizione delle scelte per tipo di compilatore.',
                    },
                    {
                        label: 'Baby food',
                        description:
                            'Numero di scelte registrate come baby food.',
                    },
                ]}
            />

            {/* Error message */}
            {error && <div className="text-brand-error mt-3">{error}</div>}
        </AppLayout>
    );
}
