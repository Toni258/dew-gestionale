/**
 * Report page for food consumption.
 * Shared helpers keep common formatting logic outside the page file.
 */
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
    formatDateTime,
} from '../../utils/statistics/reportFormatters';

const MenuSelectionSync = StatsMenuSelectionSync;
const KpiCard = StatsKpiCard;

function fmtPct(value) {
    const numericValue = Number(value) || 0;
    return `${fmtInt(numericValue)}%`;
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
export default function StatisticheConsumi() {
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

    useEffect(() => {
        let cancelled = false;

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
    }, [applied, page, pageSize]);

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
                setComments(json.comments || []);
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
    }, [requestParams]);

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
        });

        setPage(1);
        setCommentsPage(1);
    };


    const renderRankList = (rows, mode) => {
        const badgeBg = mode === 'good' ? 'bg-brand-primary' : 'bg-red-600';
        const pctText = mode === 'good' ? 'text-brand-primary' : 'text-red-600';

        if (!rows || rows.length === 0) {
            return (
                <div className="text-brand-textSecondary italic">
                    Nessun dato nel periodo selezionato.
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-3">
                {rows.map((r, idx) => {
                    const avg = Number(r.avg_portion || 0);
                    const proxyPct = Math.max(0, Math.min(1, avg)) * 100;

                    return (
                        <div
                            key={`${r.id_food}-${idx}`}
                            className="bg-brand-sidebar rounded-xl px-4 py-3 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold ${badgeBg}`}
                                >
                                    {idx + 1}
                                </div>
                                <div>
                                    <div className="font-semibold text-brand-text">
                                        {r.name}
                                    </div>
                                    <div className="text-xs text-brand-textSecondary">
                                        {r.type}
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className={`font-bold ${pctText}`}>
                                    {`${fmtInt(proxyPct)}%`}
                                </div>
                                <div className="text-xs text-brand-textSecondary">
                                    Consumo
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <AppLayout title="REPORT CONSUMI">
            <h1 className="text-3xl font-semibold">
                Statistiche e analisi consumi
            </h1>

            <div className="mt-4">
                <Card className="">
                    {selectedMenu && !menusLoading && (
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
                                selectedMenu={selectedMenu}
                                setSelectedMenu={setSelectedMenu}
                                setFormVersion={setFormVersion}
                            />

                            <div className="flex justify-between gap-4 flex-wrap">
                                <div className="flex flex-col gap-4 flex-[1]">
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

                                <div className="flex flex-col flex-[2] gap-4">
                                    <div className="flex gap-4">
                                        <FormGroup
                                            name="meal"
                                            className="flex-[0.8]"
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
                                            className="flex-[1.1]"
                                        >
                                            <CustomSelect
                                                name="course"
                                                options={COURSE_OPTIONS}
                                                placeholder="Tutte le portate"
                                                className="w-full"
                                            />
                                        </FormGroup>

                                        <FormGroup
                                            name="patientId"
                                            className="flex-[1.8]"
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
                                            className="flex-[0.7]"
                                        >
                                            <CustomSelect
                                                name="floor"
                                                options={floorOptionsFinal}
                                                placeholder="Tutti i piani"
                                                className="w-full"
                                            />
                                        </FormGroup>
                                    </div>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="md"
                                        className="mx-auto mx-12 px-6 py-2 rounded-md"
                                        disabled={loading || menusLoading}
                                    >
                                        Applica filtri
                                    </Button>
                                </div>
                            </div>
                        </Form>
                    )}
                </Card>
            </div>

            <div className="mt-6 grid grid-cols-5 gap-5">
                <KpiCard
                    icon="⚠️"
                    iconBg="bg-yellow-100"
                    value={`${fmtDec(kpi.waste_kg, 2)} kg`}
                    label="Spreco totale stimato"
                    sub="Periodo selezionato"
                />
                <KpiCard
                    icon="🔥"
                    iconBg="bg-red-100"
                    value={fmtInt(kpi.kcal_wasted)}
                    label="Kcal sprecate"
                    sub="Energia non consumata"
                />
                <KpiCard
                    icon="🍽️"
                    iconBg="bg-blue-100"
                    value={fmtDec(kpi.avg_consumption, 2)}
                    label="Consumo medio"
                    sub="Porzione media consumata"
                />
                <KpiCard
                    icon="👍"
                    iconBg="bg-green-100"
                    value={fmtPct(kpi.gradimento_pct)}
                    label="Gradimento"
                    sub="Pasti consumati completamente"
                />
                <KpiCard
                    icon="📋"
                    iconBg="bg-green-100"
                    value={fmtPct(kpi.coverage_pct)}
                    label="Copertura questionario"
                    sub="Portate con questionari completati"
                />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-6">
                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-green-600 text-lg">★</span>
                        <div className="font-semibold text-brand-text">
                            Piatti più graditi
                        </div>
                    </div>
                    {renderRankList(topLiked, 'good')}
                </Card>

                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-red-600 text-lg">↘</span>
                        <div className="font-semibold text-brand-text">
                            Piatti meno graditi
                        </div>
                    </div>
                    {renderRankList(topDisliked, 'bad')}
                </Card>
            </div>

            <div className="mt-8">
                <Card className="p-0 overflow-hidden">
                    <div className="px-6 py-4">
                        <div className="font-semibold text-brand-text">
                            Dettagli questionari
                        </div>
                    </div>

                    <div className="px-6 pb-4 overflow-x-auto">
                        <table className="w-full text-sm">
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
                                        Pasto
                                    </th>
                                    <th className="text-left py-2 pr-4">
                                        Portata
                                    </th>
                                    <th className="text-left py-2 pr-4">
                                        Piatto
                                    </th>
                                    <th className="text-left py-2 pr-4">
                                        Porzione
                                    </th>
                                    <th className="text-left py-2 pr-4">
                                        Spreco
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
                                            colSpan={9}
                                            className="py-6 text-brand-textSecondary italic"
                                        >
                                            Nessun questionario trovato.
                                        </td>
                                    </tr>
                                ) : (
                                    details.data.map((r, idx) => (
                                        <tr
                                            key={`${r.date}-${idx}`}
                                            className="border-b border-brand-divider/70"
                                        >
                                            <td className="py-2 pr-4">
                                                {formatDateTime(r.date)}
                                            </td>
                                            <td className="py-2 pr-4 capitalize">
                                                {r.patient_surname}{' '}
                                                {r.patient_name}
                                            </td>
                                            <td className="py-2 pr-4">
                                                Piano {r.floor} Stanza {r.room}
                                            </td>
                                            <td className="py-2 pr-4 capitalize">
                                                {r.meal_type}
                                            </td>
                                            <td className="py-2 pr-4 capitalize">
                                                {r.course_type}
                                            </td>
                                            <td className="py-2 pr-4 capitalize">
                                                {r.dish_name}
                                            </td>
                                            <td className="py-2 pr-4">
                                                {fmtDec(r.portion, 2)}
                                            </td>
                                            <td className="py-2 pr-4">
                                                {fmtInt(r.waste_g)} g
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
                        page={page}
                        totalPages={details.totalPages || 1}
                        pageSize={pageSize}
                        loading={loading}
                        onPageChange={setPage}
                        onPageSizeChange={handlePageSizeChange}
                    />
                </Card>
            </div>

            <div className="mt-8">
                <Card className="p-0 overflow-hidden">
                    <div className="px-6 py-4">
                        <div className="font-semibold text-brand-text">
                            Questionari commenti
                        </div>
                    </div>

                    <div className="px-6 pb-4 overflow-x-auto">
                        {(comments.data || []).length === 0 ? (
                            <div className="py-6 text-brand-textSecondary italic">
                                {comments.total > 0
                                    ? 'Esistono record dei questionari commenti, ma in questa pagina nessuno contiene un commento testuale valorizzato.'
                                    : 'Non ci sono questionari commenti.'}
                            </div>
                        ) : (
                            <table className="w-full text-sm">
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
                                            Pasto
                                        </th>
                                        <th className="text-left py-2 pr-4">
                                            Commento
                                        </th>
                                        <th className="text-left py-2 pr-4">
                                            Caregiver
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {comments.data.map((r, idx) => (
                                        <tr
                                            key={`${r.date}-${r.patient_name}-${r.patient_surname}-${r.day_number}-${r.meal_type}-${idx}`}
                                            className="border-b border-brand-divider/70"
                                        >
                                            <td className="py-2 pr-4">
                                                {formatDateTime(r.date)}
                                            </td>
                                            <td className="py-2 pr-4 capitalize">
                                                {r.patient_surname}{' '}
                                                {r.patient_name}
                                            </td>
                                            <td className="py-2 pr-4">
                                                Piano {r.floor} Stanza {r.room}
                                            </td>
                                            <td className="py-2 pr-4">
                                                {r.day_number}
                                            </td>
                                            <td className="py-2 pr-4 capitalize">
                                                {r.meal_type}
                                            </td>
                                            <td className="py-2 pr-4 whitespace-pre-wrap">
                                                {String(
                                                    r.comments ?? '',
                                                ).trim() || '—'}
                                            </td>
                                            <td className="py-2 pr-4 capitalize">
                                                {r.caregiver_name}{' '}
                                                {r.caregiver_surname}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <Pagination
                        total={comments.total || 0}
                        page={commentsPage}
                        totalPages={comments.totalPages || 1}
                        pageSize={commentsPageSize}
                        loading={loading}
                        onPageChange={setCommentsPage}
                        onPageSizeChange={handleCommentsPageSizeChange}
                    />
                </Card>
            </div>

            {error && <div className="text-brand-error mt-3">{error}</div>}
        </AppLayout>
    );
}
