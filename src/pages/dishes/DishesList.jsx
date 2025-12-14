import AppLayout from '../../components/layout/AppLayout';
import { NavLink } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';

import SearchInput from '../../components/ui/SearchInput';
import CustomSelect from '../../components/ui/CustomSelect';
import MultiSelectCheckbox from '../../components/ui/MultiSelectCheckbox';
import Form from '../../components/ui/Form';
import FormGroup from '../../components/ui/FormGroup';
import Button from '../../components/ui/Button';

export default function DishesList() {
    const [query, setQuery] = useState('');
    const [appliedFilters, setAppliedFilters] = useState({
        stato: '',
        tipologia: '',
        allergeni: [],
    });

    const [page, setPage] = useState(1);
    const pageSize = 30;

    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Payload “finale” usato per chiamare API
    const requestParams = useMemo(() => {
        return {
            search: query,
            stato: appliedFilters.stato || '',
            tipologia: appliedFilters.tipologia || '',
            allergeni: appliedFilters.allergeni || [],
            page,
            pageSize,
        };
    }, [query, appliedFilters, page]);

    const fetchDishes = async () => {
        setLoading(true);
        setError('');

        try {
            const qs = new URLSearchParams();
            if (requestParams.search) qs.set('search', requestParams.search);
            if (requestParams.stato) qs.set('stato', requestParams.stato);
            if (requestParams.tipologia)
                qs.set('tipologia', requestParams.tipologia);
            qs.set('page', String(requestParams.page));
            qs.set('pageSize', String(requestParams.pageSize));
            (requestParams.allergeni || []).forEach((a) =>
                qs.append('allergeni', a)
            );

            const res = await fetch(`/api/dishes?${qs.toString()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const json = await res.json();
            setRows(json.data || []);
            setTotal(json.total || 0);
        } catch (e) {
            setError('Errore nel caricamento piatti.');
            setRows([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    // Caricamento iniziale + quando cambiano filtri applicati/pagina/query
    useEffect(() => {
        fetchDishes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [requestParams]);

    // Applica filtri: li “blocchi” e resetti pagina a 1
    const handleFilters = (values) => {
        setAppliedFilters({
            stato: values.stato || '',
            tipologia: values.tipologia || '',
            allergeni: values.allergeni || [],
        });
        setPage(1);
    };

    return (
        <AppLayout title="GESTIONE PIATTI" username="Antonio">
            <h1 className="text-3xl font-semibold">Elenco piatti</h1>

            {/* BARRA FILTRI */}
            <div className="mt-1 mb-3 h-[60px] flex justify-between items-center">
                {/* SEARCH INPUT */}
                <SearchInput
                    placeholder="Cerca un piatto per nome..."
                    onSearch={(q) => {
                        setQuery(q);
                        setPage(1);
                    }}
                    className="w-[400px] [&>input]:rounded-full"
                />

                {/* FILTRI */}
                <Form
                    initialValues={{
                        stato: appliedFilters.stato,
                        allergeni: appliedFilters.allergeni,
                        tipologia: appliedFilters.tipologia,
                    }}
                    onSubmit={handleFilters}
                >
                    <div className="flex items-center gap-5">
                        <FormGroup name="stato" className="w-[145px]">
                            <CustomSelect
                                name="stato"
                                placeholder="Stato piatto"
                                options={[
                                    { value: '', label: '— Stato —' },
                                    { value: 'attivo', label: 'Attivo' },
                                    { value: 'sospeso', label: 'Sospeso' },
                                    { value: 'inattivo', label: 'Inattivo' },
                                ]}
                                height="h-[45px]"
                                className="w-full [&>div>button]:rounded-full"
                            />
                        </FormGroup>

                        <FormGroup name="allergeni" className="w-[180px]">
                            <MultiSelectCheckbox
                                name="allergeni"
                                placeholder="Allergeni esclusi"
                                options={[
                                    { value: 'glutine', label: 'Glutine' },
                                    {
                                        value: 'latte',
                                        label: 'Latte / Lattosio',
                                    },
                                    { value: 'uova', label: 'Uova' },
                                    { value: 'arachidi', label: 'Arachidi' },
                                    {
                                        value: 'frutta a guscio',
                                        label: 'Frutta a guscio',
                                    },
                                    { value: 'pesce', label: 'Pesce' },
                                    { value: 'crostacei', label: 'Crostacei' },
                                    { value: 'molluschi', label: 'Molluschi' },
                                    { value: 'soia', label: 'Soia' },
                                    { value: 'sedano', label: 'Sedano' },
                                    {
                                        value: 'sesamo',
                                        label: 'Semi di sesamo',
                                    },
                                    {
                                        value: 'anidride solforosa e solfiti',
                                        label: 'Anidride solforosa e solfiti',
                                    },
                                    { value: 'lupini', label: 'Lupini' },
                                ]}
                                height="h-[45px]"
                                className="[&>div>button]:rounded-full"
                            />
                        </FormGroup>

                        <FormGroup name="tipologia" className="w-[145px]">
                            <CustomSelect
                                name="tipologia"
                                placeholder="Tutti i tipi"
                                options={[
                                    { value: '', label: '— Tipologia —' },
                                    { value: 'primo', label: 'Primo' },
                                    { value: 'secondo', label: 'Secondo' },
                                    { value: 'contorno', label: 'Contorno' },
                                    { value: 'ultimo', label: 'Ultimo' },
                                    { value: 'speciale', label: 'Speciale' },
                                    { value: 'coperto', label: 'Coperto' },
                                ]}
                                height="h-[45px]"
                                className="w-full [&>div>button]:rounded-full"
                            />
                        </FormGroup>

                        <Button
                            type="submit"
                            size="md"
                            variant="primary"
                            className="px-4 py-2 rounded-full"
                        >
                            Applica filtri
                        </Button>
                    </div>
                </Form>
            </div>

            {/* STATO */}
            {error && <div className="text-brand-error mb-2">{error}</div>}
            {loading && <div className="mb-2">Caricamento…</div>}

            {/* TABELLA */}
            <div className="bg-white rounded-xl border border-brand-divider overflow-hidden">
                <div className="px-4 py-3 border-b border-brand-divider flex justify-between items-center">
                    <div className="font-semibold">Risultati: {total}</div>
                    <div className="text-sm text-brand-textSecondary">
                        Pagina {page} / {totalPages}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-black/5">
                            <tr className="text-left">
                                <th className="px-4 py-3">Nome</th>
                                <th className="px-4 py-3">Tipo</th>
                                <th className="px-4 py-3">g tot</th>
                                <th className="px-4 py-3">kcal</th>
                                <th className="px-4 py-3">P</th>
                                <th className="px-4 py-3">C</th>
                                <th className="px-4 py-3">F</th>
                                <th className="px-4 py-3">Note allergeni</th>
                                <th className="px-4 py-3">Azioni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading && rows.length === 0 && (
                                <tr>
                                    <td
                                        className="px-4 py-4 text-brand-textSecondary"
                                        colSpan={9}
                                    >
                                        Nessun piatto trovato.
                                    </td>
                                </tr>
                            )}

                            {rows.map((r, idx) => (
                                <tr
                                    key={`${r.name}-${idx}`}
                                    className="border-t border-brand-divider"
                                >
                                    <td className="px-4 py-3">{r.name}</td>
                                    <td className="px-4 py-3">{r.type}</td>
                                    <td className="px-4 py-3">
                                        {r.grammage_tot}
                                    </td>
                                    <td className="px-4 py-3">{r.kcal_tot}</td>
                                    <td className="px-4 py-3">{r.proteins}</td>
                                    <td className="px-4 py-3">{r.carbs}</td>
                                    <td className="px-4 py-3">{r.fats}</td>
                                    <td className="px-4 py-3">
                                        {r.allergy_notes || '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <NavLink
                                            to={`/dishes/edit/${encodeURIComponent(
                                                r.name
                                            )}`}
                                            className="text-brand-primary font-semibold hover:underline"
                                        >
                                            Modifica
                                        </NavLink>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* PAGINAZIONE */}
                <div className="px-4 py-3 border-t border-brand-divider flex justify-between items-center">
                    <button
                        type="button"
                        disabled={page <= 1 || loading}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-2 rounded-full border border-brand-divider disabled:opacity-40"
                    >
                        ◀ Prev
                    </button>

                    <button
                        type="button"
                        disabled={page >= totalPages || loading}
                        onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                        }
                        className="px-3 py-2 rounded-full border border-brand-divider disabled:opacity-40"
                    >
                        Next ▶
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}
