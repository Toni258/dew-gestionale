import AppLayout from '../../components/layout/AppLayout';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Form, { useFormContext } from '../../components/ui/Form';
import FormGroup from '../../components/ui/FormGroup';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DateRangePicker from '../../components/ui/DateRangePicker';
import CustomSelect from '../../components/ui/CustomSelect';
import SearchableSelect from '../../components/ui/SearchableSelect';
import Pagination from '../../components/ui/Pagination';
import { withLoader } from '../../services/withLoader';
import { getScelteMenus, getScelteReport } from '../../services/reportsApi';

function fmtInt(n) {
    const x = Number(n) || 0;
    return Math.round(x).toLocaleString('it-IT');
}

function fmtDec(n, digits = 2) {
    const x = Number(n) || 0;
    return x.toLocaleString('it-IT', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    });
}

function fmtPct(n, digits = 1) {
    const x = Number(n) || 0;
    return `${x.toLocaleString('it-IT', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    })}%`;
}

function formatDate(value) {
    if (!value) return '';
    const d = new Date(value);
    return d.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function formatCourseLabel(value) {
    if (value === 'ultimo') return 'Dessert';
    if (!value) return '';
    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

function formatChooserLabel(value) {
    if (value === 'guest') return 'Ospite';
    if (value === 'family') return 'Famiglia';
    if (value === 'caregiver') return 'Caregiver';
    return value || '';
}

function buildMenuValue(menu) {
    return `${menu.kind}:${menu.ref}`;
}

function parseMenuValue(value) {
    const [menuKind = '', ...rest] = String(value || '').split(':');
    return {
        menuKind,
        menuRef: rest.join(':'),
    };
}

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

function MenuSelectionSync({ menuRows, setSelectedMenu, setFormVersion }) {
    const form = useFormContext();
    const prevMenuValueRef = useRef('');

    const menuValue = form?.values?.menuValue ?? '';

    useEffect(() => {
        if (!menuValue) return;

        const found = (menuRows || []).find(
            (m) => buildMenuValue(m) === menuValue,
        );
        if (!found) return;

        const prev = prevMenuValueRef.current;
        prevMenuValueRef.current = menuValue;

        const firstMount = prev === '';
        const changed = prev !== '' && prev !== menuValue;

        setSelectedMenu(found);

        if (firstMount) return;
        if (!changed) return;

        setFormVersion((v) => v + 1);
    }, [menuValue, menuRows, setSelectedMenu, setFormVersion]);

    return null;
}

function KpiCard({ icon, iconBg, value, label, sub }) {
    return (
        <Card className="p-5">
            <div className="flex items-start gap-3">
                <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}
                >
                    <span className="text-lg">{icon}</span>
                </div>
                <div className="min-w-0">
                    <div className="text-2xl font-bold text-brand-text break-words capitalize">
                        {value}
                    </div>
                    <div className="text-sm text-brand-textSecondary">
                        {label}
                    </div>
                    {sub && (
                        <div className="text-xs text-brand-textSecondary opacity-80 mt-1">
                            {sub}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}

function RankCard({ title, icon, rows, mode = 'top' }) {
    const badgeBg =
        mode === 'top'
            ? 'bg-brand-primary'
            : mode === 'bottom'
              ? 'bg-red-600'
              : 'bg-slate-600';

    const valueTextClass =
        mode === 'top'
            ? 'text-brand-primary'
            : mode === 'bottom'
              ? 'text-red-600'
              : 'text-slate-700';

    return (
        <Card>
            <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">{icon}</span>
                <div className="font-semibold text-brand-text">{title}</div>
            </div>

            {!rows || rows.length === 0 ? (
                <div className="text-brand-textSecondary italic">
                    Nessun dato nel periodo selezionato.
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {rows.map((r, idx) => (
                        <div
                            key={`${r.food_id}-${idx}`}
                            className="bg-brand-sidebar rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div
                                    className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold shrink-0 ${badgeBg}`}
                                >
                                    {idx + 1}
                                </div>

                                <div className="min-w-0">
                                    <div className="font-semibold text-brand-text truncate">
                                        {r.name}
                                    </div>
                                    <div className="text-xs text-brand-textSecondary">
                                        {formatCourseLabel(r.type)}
                                    </div>
                                </div>
                            </div>

                            <div className="text-right shrink-0">
                                {mode === 'never' ? (
                                    <>
                                        <div
                                            className={`font-bold ${valueTextClass}`}
                                        >
                                            0 scelte
                                        </div>
                                        <div className="text-xs text-brand-textSecondary">
                                            {fmtInt(r.availability_count)}{' '}
                                            disponibilità
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div
                                            className={`font-bold ${valueTextClass}`}
                                        >
                                            {fmtPct(r.selection_rate_pct, 1)}
                                        </div>
                                        <div className="text-xs text-brand-textSecondary">
                                            {fmtInt(r.chosen_count)} scelte ·{' '}
                                            {fmtInt(r.availability_count)}{' '}
                                            disponibilità
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}

function BarsCard({
    title,
    icon,
    rows,
    barMode = 'percent',
    emptyText = 'Nessun dato nel periodo selezionato.',
    metaRenderer,
}) {
    const maxValue =
        barMode === 'relative'
            ? Math.max(1, ...(rows || []).map((r) => Number(r.value ?? 0)))
            : 100;

    return (
        <Card>
            <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">{icon}</span>
                <div className="font-semibold text-brand-text">{title}</div>
            </div>

            {!rows || rows.length === 0 ? (
                <div className="text-brand-textSecondary italic">
                    {emptyText}
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {rows.map((row, idx) => {
                        const rawValue = Number(row.value ?? 0);
                        const width =
                            barMode === 'percent'
                                ? Math.max(0, Math.min(100, rawValue))
                                : Math.max(
                                      0,
                                      Math.min(
                                          100,
                                          (rawValue / maxValue) * 100,
                                      ),
                                  );

                        return (
                            <div key={`${row.label}-${idx}`}>
                                <div className="flex items-center justify-between gap-3 mb-1">
                                    <div className="font-medium text-brand-text">
                                        {row.label}
                                    </div>
                                    <div className="text-sm font-semibold text-brand-text shrink-0">
                                        {row.valueLabel}
                                    </div>
                                </div>

                                <div className="w-full h-3 rounded-full bg-brand-sidebar overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-brand-primary transition-all duration-300"
                                        style={{ width: `${width}%` }}
                                    />
                                </div>

                                {metaRenderer && (
                                    <div className="text-xs text-brand-textSecondary mt-1">
                                        {metaRenderer(row)}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}

export default function StatisticheScelte() {
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

    const [kpi, setKpi] = useState({
        total_choices: 0,
        distinct_dishes_chosen: 0,
        overall_choice_rate_pct: 0,
        never_chosen_count: 0,
        top_category_label: '—',
        caregiver_share_pct: 0,
        baby_food_share_pct: 0,
        patient_scope_count: 0,
        total_availability_occurrences: 0,
    });

    const [rankings, setRankings] = useState({
        topChosen: [],
        bottomChosen: [],
        neverChosen: [],
    });

    const [charts, setCharts] = useState({
        weeklyTrend: [],
        byCourse: [],
        byChooser: [],
    });

    const [dishes, setDishes] = useState({
        data: [],
        total: 0,
        totalPages: 1,
        page: 1,
        pageSize: 10,
    });

    const [details, setDetails] = useState({
        data: [],
        total: 0,
        totalPages: 1,
        page: 1,
        pageSize: 10,
    });

    const [options, setOptions] = useState({
        patients: [],
        floors: [],
    });

    useEffect(() => {
        let cancelled = false;

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
                    setApplied({
                        menuKind: firstMenu.kind,
                        menuRef: firstMenu.ref,
                        start: firstMenu.start_date,
                        end: firstMenu.end_date,
                        meal: '',
                        patientId: '',
                        floor: '',
                        course: '',
                        week: '',
                        chooser: '',
                        babyFood: '',
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
                week: '',
                chooser: '',
                babyFood: '',
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
            week: appliedMatchesSelectedMenu ? (applied?.week ?? '') : '',
            chooser: appliedMatchesSelectedMenu ? (applied?.chooser ?? '') : '',
            babyFood: appliedMatchesSelectedMenu
                ? (applied?.babyFood ?? '')
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
            detailsPage,
            detailsPageSize,
        };
    }, [applied, page, pageSize, detailsPage, detailsPageSize]);

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
                    week: requestParams.week,
                    chooser: requestParams.chooser,
                    babyFood: requestParams.babyFood,
                    page: requestParams.page,
                    pageSize: requestParams.pageSize,
                    detailsPage: requestParams.detailsPage,
                    detailsPageSize: requestParams.detailsPageSize,
                });

                setKpi(json.kpi || {});
                setRankings(
                    json.rankings || {
                        topChosen: [],
                        bottomChosen: [],
                        neverChosen: [],
                    },
                );
                setCharts(
                    json.charts || {
                        weeklyTrend: [],
                        byCourse: [],
                        byChooser: [],
                    },
                );
                setDishes(json.dishes || { data: [], total: 0, totalPages: 1 });
                setDetails(
                    json.details || { data: [], total: 0, totalPages: 1 },
                );
                setOptions(json.options || { patients: [], floors: [] });
            });
        } catch (e) {
            console.error(e);
            setError('Errore nel caricamento del report scelte.');
            setKpi({
                total_choices: 0,
                distinct_dishes_chosen: 0,
                overall_choice_rate_pct: 0,
                never_chosen_count: 0,
                top_category_label: '—',
                caregiver_share_pct: 0,
                baby_food_share_pct: 0,
                patient_scope_count: 0,
                total_availability_occurrences: 0,
            });
            setRankings({
                topChosen: [],
                bottomChosen: [],
                neverChosen: [],
            });
            setCharts({
                weeklyTrend: [],
                byCourse: [],
                byChooser: [],
            });
            setDishes({ data: [], total: 0, totalPages: 1 });
            setDetails({ data: [], total: 0, totalPages: 1 });
        } finally {
            setLoading(false);
        }
    }, [requestParams]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setPage(1);
    };

    const handleDetailsPageSizeChange = (e) => {
        setDetailsPageSize(Number(e.target.value));
        setDetailsPage(1);
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
            week: values.week || '',
            chooser: values.chooser || '',
            babyFood: values.babyFood ?? '',
        });

        setPage(1);
        setDetailsPage(1);
    };

    const weeklyChartRows = useMemo(() => {
        return (charts.weeklyTrend || []).map((row) => ({
            label: row.label,
            value: Number(row.selection_rate_pct || 0),
            valueLabel: fmtPct(row.selection_rate_pct, 1),
            chosen_count: Number(row.chosen_count || 0),
            opportunity_count: Number(row.opportunity_count || 0),
        }));
    }, [charts.weeklyTrend]);

    const byCourseChartRows = useMemo(() => {
        return (charts.byCourse || []).map((row) => ({
            label: row.label || formatCourseLabel(row.course_type),
            value: Number(row.selection_rate_pct || 0),
            valueLabel: fmtPct(row.selection_rate_pct, 1),
            chosen_count: Number(row.chosen_count || 0),
            opportunity_count: Number(row.opportunity_count || 0),
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

            <div className="mt-4">
                <Card>
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
                                            className="min-w-[150px] flex-1"
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
                                            name="week"
                                            className="min-w-[170px] flex-1"
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
                                            className="min-w-[180px] flex-1"
                                        >
                                            <CustomSelect
                                                name="chooser"
                                                options={CHOOSER_OPTIONS}
                                                placeholder="Tutti i compilatori"
                                                className="w-full"
                                            />
                                        </FormGroup>

                                        <FormGroup
                                            name="babyFood"
                                            className="min-w-[180px] flex-1"
                                        >
                                            <CustomSelect
                                                name="babyFood"
                                                options={BABY_FOOD_OPTIONS}
                                                placeholder="Tutte le scelte"
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
                        <div className="text-brand-textSecondary italic">
                            Nessun menù disponibile.
                        </div>
                    )}
                </Card>
            </div>

            <div className="mt-6 grid grid-cols-6 gap-5">
                <KpiCard
                    icon="📦"
                    iconBg="bg-blue-100"
                    value={fmtInt(kpi.total_choices)}
                    label="Scelte totali"
                    sub="Record di scelta nel periodo"
                />
                <KpiCard
                    icon="🍽️"
                    iconBg="bg-green-100"
                    value={fmtInt(kpi.distinct_dishes_chosen)}
                    label="Piatti distinti scelti"
                    sub="Varietà reale delle preferenze"
                />
                <KpiCard
                    icon="📈"
                    iconBg="bg-purple-100"
                    value={fmtPct(kpi.overall_choice_rate_pct, 1)}
                    label="Tasso medio di scelta"
                    sub="Scelte / opportunità stimate"
                />
                <KpiCard
                    icon="🚫"
                    iconBg="bg-red-100"
                    value={fmtInt(kpi.never_chosen_count)}
                    label="Piatti mai scelti"
                    sub="Disponibili ma mai richiesti"
                />
                <KpiCard
                    icon="🏷️"
                    iconBg="bg-yellow-100"
                    value={kpi.top_category_label || '—'}
                    label="Categoria più richiesta"
                    sub="Basata sulle scelte registrate"
                />
                <KpiCard
                    icon="🥣"
                    iconBg="bg-orange-100"
                    value={fmtPct(kpi.baby_food_share_pct, 1)}
                    label="Scelte baby food"
                    sub="Quota sul totale delle scelte"
                />
            </div>

            <div className="mt-4 text-sm text-brand-textSecondary">
                Tasso di scelta = scelte registrate / opportunità stimate. Le
                opportunità stimate sono calcolate come disponibilità del piatto
                × pazienti nel perimetro filtrato (
                {fmtInt(kpi.patient_scope_count)}).
            </div>

            <div className="mt-6 grid grid-cols-3 gap-6">
                <RankCard
                    title="Piatti più richiesti"
                    icon="⭐"
                    rows={rankings.topChosen}
                    mode="top"
                />

                <RankCard
                    title="Piatti meno richiesti"
                    icon="↘"
                    rows={rankings.bottomChosen}
                    mode="bottom"
                />

                <RankCard
                    title="Piatti mai scelti"
                    icon="🕳️"
                    rows={rankings.neverChosen}
                    mode="never"
                />
            </div>

            <div className="mt-8 grid grid-cols-2 gap-6">
                <BarsCard
                    title="Trend di scelta per settimana"
                    icon="📆"
                    rows={weeklyChartRows}
                    barMode="percent"
                    metaRenderer={(row) =>
                        `${fmtInt(row.chosen_count)} scelte · ${fmtInt(
                            row.opportunity_count,
                        )} opportunità`
                    }
                />

                <BarsCard
                    title="Tasso di scelta per portata"
                    icon="🧩"
                    rows={byCourseChartRows}
                    barMode="percent"
                    metaRenderer={(row) =>
                        `${fmtInt(row.chosen_count)} scelte · ${fmtInt(
                            row.opportunity_count,
                        )} opportunità`
                    }
                />
            </div>

            <div className="mt-6">
                <BarsCard
                    title="Distribuzione per compilatore"
                    icon="👥"
                    rows={byChooserChartRows}
                    barMode="percent"
                    metaRenderer={(row) => `${fmtInt(row.chosen_count)} scelte`}
                />
            </div>

            <div className="mt-8">
                <Card className="p-0 overflow-hidden">
                    <div className="px-6 py-4 flex items-center justify-between gap-4">
                        <div>
                            <div className="font-semibold text-brand-text">
                                Tabella aggregata piatti
                            </div>
                            <div className="text-sm text-brand-textSecondary">
                                Disponibilità, opportunità e tasso di scelta per
                                piatto
                            </div>
                        </div>
                    </div>

                    <div className="px-6 pb-4 overflow-x-auto">
                        <table className="w-full text-sm min-w-[1250px]">
                            <thead>
                                <tr className="text-brand-textSecondary border-b border-brand-divider">
                                    <th className="text-left py-2 pr-4">
                                        Piatto
                                    </th>
                                    <th className="text-left py-2 pr-4">
                                        Portata
                                    </th>
                                    <th className="text-right py-2 pr-4">
                                        Disponibilità
                                    </th>
                                    <th className="text-right py-2 pr-4">
                                        Pazienti
                                    </th>
                                    <th className="text-right py-2 pr-4">
                                        Opportunità
                                    </th>
                                    <th className="text-right py-2 pr-4">
                                        Scelte
                                    </th>
                                    <th className="text-right py-2 pr-4">
                                        Tasso
                                    </th>
                                    <th className="text-right py-2 pr-4">
                                        Ospite
                                    </th>
                                    <th className="text-right py-2 pr-4">
                                        Famiglia
                                    </th>
                                    <th className="text-right py-2 pr-4">
                                        Caregiver
                                    </th>
                                    <th className="text-right py-2">
                                        Baby food
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {(dishes.data || []).length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={12}
                                            className="py-6 text-brand-textSecondary italic"
                                        >
                                            Nessun dato disponibile nel periodo
                                            selezionato.
                                        </td>
                                    </tr>
                                ) : (
                                    dishes.data.map((r, idx) => (
                                        <tr
                                            key={`${r.food_id}-${idx}`}
                                            className="border-b border-brand-divider/70"
                                        >
                                            <td className="py-2 pr-4 font-medium text-brand-text">
                                                {r.name}
                                            </td>
                                            <td className="py-2 pr-4 capitalize">
                                                {formatCourseLabel(r.type)}
                                            </td>
                                            <td className="py-2 pr-4 text-right">
                                                {fmtInt(r.availability_count)}
                                            </td>
                                            <td className="py-2 pr-4 text-right">
                                                {fmtInt(r.patient_scope_count)}
                                            </td>
                                            <td className="py-2 pr-4 text-right">
                                                {fmtInt(r.opportunity_count)}
                                            </td>
                                            <td className="py-2 pr-4 text-right font-semibold text-brand-text">
                                                {fmtInt(r.chosen_count)}
                                            </td>
                                            <td className="py-2 pr-4 text-right font-semibold text-brand-primary">
                                                {fmtPct(
                                                    r.selection_rate_pct,
                                                    1,
                                                )}
                                            </td>
                                            <td className="py-2 pr-4 text-right">
                                                {fmtInt(r.guest_count)}
                                            </td>
                                            <td className="py-2 pr-4 text-right">
                                                {fmtInt(r.family_count)}
                                            </td>
                                            <td className="py-2 pr-4 text-right">
                                                {fmtInt(r.caregiver_count)}
                                            </td>
                                            <td className="py-2 text-right">
                                                {fmtInt(r.baby_food_count)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        total={dishes.total || 0}
                        page={page}
                        totalPages={dishes.totalPages || 1}
                        pageSize={pageSize}
                        loading={loading}
                        onPageChange={setPage}
                        onPageSizeChange={handlePageSizeChange}
                    />
                </Card>
            </div>

            <div className="mt-8">
                <Card className="p-0 overflow-hidden">
                    <div className="px-6 py-4 flex items-center justify-between gap-4">
                        <div>
                            <div className="font-semibold text-brand-text">
                                Dettaglio singole scelte
                            </div>
                            <div className="text-sm text-brand-textSecondary">
                                Tracciato completo delle scelte effettuate
                            </div>
                        </div>
                    </div>

                    <div className="px-6 pb-4 overflow-x-auto">
                        <table className="w-full text-sm min-w-[1200px]">
                            <thead>
                                <tr className="text-brand-textSecondary border-b border-brand-divider">
                                    <th className="text-left py-2 pr-4">
                                        Data
                                    </th>
                                    <th className="text-left py-2 pr-4">
                                        Paziente
                                    </th>
                                    <th className="text-left py-2 pr-4">
                                        Locazione
                                    </th>
                                    <th className="text-left py-2 pr-4">
                                        Giorno
                                    </th>
                                    <th className="text-left py-2 pr-4">
                                        Settimana
                                    </th>
                                    <th className="text-left py-2 pr-4">
                                        Pasto
                                    </th>
                                    <th className="text-left py-2 pr-4">
                                        Portata
                                    </th>
                                    <th className="text-left py-2 pr-4">
                                        Piatto
                                    </th>
                                    <th className="text-left py-2 pr-4">
                                        Scelta da
                                    </th>
                                    <th className="text-left py-2 pr-4">
                                        Baby food
                                    </th>
                                    <th className="text-left py-2 pr-4">
                                        Caregiver
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {(details.data || []).length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={11}
                                            className="py-6 text-brand-textSecondary italic"
                                        >
                                            Nessuna scelta trovata.
                                        </td>
                                    </tr>
                                ) : (
                                    details.data.map((r, idx) => (
                                        <tr
                                            key={`${r.date}-${r.patient_name}-${r.dish_name}-${idx}`}
                                            className="border-b border-brand-divider/70"
                                        >
                                            <td className="py-2 pr-4">
                                                {formatDate(r.date)}
                                            </td>
                                            <td className="py-2 pr-4 capitalize">
                                                {r.patient_surname}{' '}
                                                {r.patient_name}
                                            </td>
                                            <td className="py-2 pr-4">
                                                Piano {r.floor} Stanza {r.room}
                                            </td>
                                            <td className="py-2 pr-4">
                                                {fmtInt(r.day_number)}
                                            </td>
                                            <td className="py-2 pr-4">
                                                {fmtInt(r.week_number)}
                                            </td>
                                            <td className="py-2 pr-4 capitalize">
                                                {r.meal_type}
                                            </td>
                                            <td className="py-2 pr-4 capitalize">
                                                {formatCourseLabel(
                                                    r.course_type,
                                                )}
                                            </td>
                                            <td className="py-2 pr-4">
                                                {r.dish_name}
                                            </td>
                                            <td className="py-2 pr-4">
                                                {formatChooserLabel(r.chooser)}
                                            </td>
                                            <td className="py-2 pr-4">
                                                {Number(r.baby_food) === 1
                                                    ? 'Sì'
                                                    : 'No'}
                                            </td>
                                            <td className="py-2 pr-4 capitalize">
                                                {r.caregiver_name}{' '}
                                                {r.caregiver_surname}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        total={details.total || 0}
                        page={detailsPage}
                        totalPages={details.totalPages || 1}
                        pageSize={detailsPageSize}
                        loading={loading}
                        onPageChange={setDetailsPage}
                        onPageSizeChange={handleDetailsPageSizeChange}
                    />
                </Card>
            </div>

            {error && <div className="text-brand-error mt-3">{error}</div>}
        </AppLayout>
    );
}
