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

function fmtInt(n) {
    const x = Number(n) || 0;
    return Math.round(x).toLocaleString('it-IT');
}

function formatDateTime(value) {
    if (!value) return '';
    const d = new Date(value);
    return d.toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

function fmtDec(n, digits = 2) {
    const x = Number(n) || 0;
    return x.toLocaleString('it-IT', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    });
}

function fmtPct(n) {
    const x = Number(n) || 0;
    return `${fmtInt(x)}%`;
}

function toIso(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function defaultRange() {
    // ultimo mese
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return { start: toIso(start), end: toIso(end) };
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
    const initial = useMemo(() => {
        const r = defaultRange();
        return {
            start: r.start,
            end: r.end,
            meal: '',
            patientId: '',
            floor: '',
            course: '',
        };
    }, []);

    const [applied, setApplied] = useState(initial);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

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

    const [options, setOptions] = useState({
        patients: [],
        floors: [],
    });

    const requestParams = useMemo(() => {
        return {
            ...applied,
            page,
            pageSize,
        };
    }, [applied, page, pageSize]);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            await withLoader('Caricamento report consumi…', async () => {
                const qs = new URLSearchParams();

                qs.set('start', requestParams.start);
                qs.set('end', requestParams.end);

                if (requestParams.meal) qs.set('meal', requestParams.meal);
                if (requestParams.patientId)
                    qs.set('patientId', requestParams.patientId);
                if (requestParams.floor) qs.set('floor', requestParams.floor);
                if (requestParams.course)
                    qs.set('course', requestParams.course);

                qs.set('page', String(requestParams.page));
                qs.set('pageSize', String(requestParams.pageSize));

                const res = await fetch(
                    `/api/reports/consumi?${qs.toString()}`,
                );
                if (!res.ok) {
                    let msg = `HTTP ${res.status}`;
                    try {
                        const j = await res.json();
                        if (j?.error) msg = j.error;
                    } catch {}
                    throw new Error(msg);
                }

                const json = await res.json();

                setKpi(json.kpi || {});
                setTopLiked(json.topLiked || []);
                setTopDisliked(json.topDisliked || []);

                setDetails(
                    json.details || { data: [], total: 0, totalPages: 1 },
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

    const handleApplyFilters = (values) => {
        setApplied({
            start: values.start,
            end: values.end,
            meal: values.meal || '',
            patientId: values.patientId || '',
            floor: values.floor || '',
            course: values.course || '',
        });
        setPage(1);
    };

    const floorOptionsFinal = useMemo(() => {
        return [
            { value: '', label: 'Tutti i piani' },
            ...(options.floors || []),
        ];
    }, [options.floors]);

    // KPI CARDS (icona semplice: emoji + stile simile al mock)
    const KpiCard = ({ icon, iconBg, value, label, sub }) => (
        <Card className="p-5">
            <div className="flex items-start gap-3">
                <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}
                >
                    <span className="text-lg">{icon}</span>
                </div>

                <div>
                    <div className="text-2xl font-bold text-brand-text">
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

    const renderRankList = (rows, mode) => {
        // mode: 'good' | 'bad'
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
                    // “Consumo %” come proxy: clamp 0..1 (sopra 1 lo trattiamo come 1)
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
                                <div
                                    className={`font-bold ${pctText}`}
                                >{`${fmtInt(proxyPct)}%`}</div>
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

            {/* FILTRI */}
            <div className="mt-4">
                <Card>
                    <Form
                        initialValues={{
                            start: applied.start,
                            end: applied.end,
                            meal: applied.meal,
                            patientId: applied.patientId,
                            floor: applied.floor,
                            course: applied.course,
                        }}
                        validateForm={(v) => {
                            const errs = {};
                            if (!v.start)
                                errs.start = 'Seleziona una data di inizio';
                            if (!v.end) errs.end = 'Seleziona una data di fine';
                            if (v.start && v.end && v.end <= v.start) {
                                errs.end =
                                    'La data di fine deve essere > data inizio';
                            }
                            return errs;
                        }}
                        onSubmit={handleApplyFilters}
                    >
                        <div className="flex justify-between">
                            <FormGroup name="start" className="min-w-[240px]">
                                <DateRangePicker
                                    startName="start"
                                    endName="end"
                                    placeholderStart="Inizio"
                                    placeholderEnd="Fine"
                                />
                            </FormGroup>

                            <FormGroup name="meal">
                                <CustomSelect
                                    name="meal"
                                    options={MEAL_OPTIONS}
                                    placeholder="Tutti i pasti"
                                    className="w-full"
                                />
                            </FormGroup>

                            <FormGroup name="patientId" className="w-[320px]">
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
                                />
                            </FormGroup>

                            <FormGroup name="floor">
                                <CustomSelect
                                    name="floor"
                                    options={floorOptionsFinal}
                                    placeholder="Tutti i piani"
                                    className="w-full"
                                />
                            </FormGroup>

                            <FormGroup name="course">
                                <CustomSelect
                                    name="course"
                                    options={COURSE_OPTIONS}
                                    placeholder="Tutte le portate"
                                    className="w-full"
                                />
                            </FormGroup>

                            <Button
                                type="submit"
                                variant="primary"
                                size="md"
                                className="px-6 py-2 rounded-md"
                                disabled={loading}
                            >
                                Applica filtri
                            </Button>
                        </div>
                    </Form>
                </Card>
            </div>

            {/* KPI */}
            <div className="mt-6 grid grid-cols-5 gap-5">
                <KpiCard
                    icon="⚠️"
                    iconBg="bg-yellow-100"
                    value={`${fmtInt(kpi.waste_kg)} kg`}
                    label="Spreco totale stimato"
                    sub="Periodo stimato"
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
                    sub="Pasti con questionari completati"
                />
            </div>

            {/* TOP / BOTTOM */}
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

            {/* DETTAGLI */}
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

            {error && <div className="text-brand-error mt-3">{error}</div>}
        </AppLayout>
    );
}
