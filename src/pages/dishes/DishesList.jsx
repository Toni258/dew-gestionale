import AppLayout from '../../components/layout/AppLayout';
import { useCallback, useEffect, useMemo, useState } from 'react';

import SearchInput from '../../components/ui/SearchInput';
import CustomSelect from '../../components/ui/CustomSelect';
import MultiSelectCheckbox from '../../components/ui/MultiSelectCheckbox';
import Form from '../../components/ui/Form';
import FormGroup from '../../components/ui/FormGroup';
import Button from '../../components/ui/Button';
import DishesTable from '../../components/dishes/DishesTable';

import DeleteDishModal from '../../components/modals/DeleteDishModal';
import AllergensModal from '../../components/modals/AllergensModal';

const ALLERGEN_OPTIONS = [
    { value: 'glutine', label: 'Glutine' },
    { value: 'latte', label: 'Latte / Lattosio' },
    { value: 'uova', label: 'Uova' },
    { value: 'arachidi', label: 'Arachidi' },
    { value: 'frutta a guscio', label: 'Frutta a guscio' },
    { value: 'pesce', label: 'Pesce' },
    { value: 'crostacei', label: 'Crostacei' },
    { value: 'molluschi', label: 'Molluschi' },
    { value: 'soia', label: 'Soia' },
    { value: 'sedano', label: 'Sedano' },
    { value: 'sesamo', label: 'Semi di sesamo' },
    {
        value: 'anidride solforosa e solfiti',
        label: 'Anidride solforosa e solfiti',
    },
    { value: 'lupini', label: 'Lupini' },
];

const TIPOLOGIA_OPTIONS = [
    { value: '', label: '— Tipologia —' },
    { value: 'primo', label: 'Primo' },
    { value: 'secondo', label: 'Secondo' },
    { value: 'contorno', label: 'Contorno' },
    { value: 'ultimo', label: 'Ultimo' },
    { value: 'speciale', label: 'Speciale' },
    { value: 'coperto', label: 'Coperto' },
];

const STATO_OPTIONS = [
    { value: '', label: '— Stato —' },
    { value: 'attivo', label: 'Attivo' },
    { value: 'sospeso', label: 'Sospeso' },
    { value: 'inattivo', label: 'Inattivo' },
];

export default function DishesList() {
    const [query, setQuery] = useState('');
    const [appliedFilters, setAppliedFilters] = useState({
        stato: '',
        tipologia: '',
        allergeni: [],
    });

    const [showAllergensInfo, setShowAllergensInfo] = useState(false);
    const [dishToDelete, setDishToDelete] = useState(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Quando cambio la page size, resetto a pagina 1
    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setPage(1);
    };

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
    }, [query, appliedFilters, page, pageSize]);

    const fetchDishes = useCallback(async () => {
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
        } catch {
            setError('Errore nel caricamento piatti.');
            setRows([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [requestParams]);

    // Caricamento iniziale + quando cambiano filtri applicati/pagina/query
    useEffect(() => {
        fetchDishes();
    }, [fetchDishes]);

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
                                options={STATO_OPTIONS}
                                height="h-[45px]"
                                className="w-full [&>div>button]:rounded-full"
                            />
                        </FormGroup>

                        <FormGroup name="allergeni" className="w-[180px]">
                            <MultiSelectCheckbox
                                name="allergeni"
                                placeholder="Allergeni esclusi"
                                options={ALLERGEN_OPTIONS}
                                height="h-[45px]"
                                className="[&>div>button]:rounded-full"
                            />
                        </FormGroup>

                        <FormGroup name="tipologia" className="w-[145px]">
                            <CustomSelect
                                name="tipologia"
                                placeholder="Tutti i tipi"
                                options={TIPOLOGIA_OPTIONS}
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

            {/* TABELLA PIATTI */}
            <DishesTable
                rows={rows}
                loading={loading}
                total={total}
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={handlePageSizeChange}
                onDelete={(dish) => setDishToDelete(dish)}
                onShowAllergensInfo={() => setShowAllergensInfo(true)}
            />

            {/* MODALE ELIMINA PIATTO */}
            <DeleteDishModal
                dish={dishToDelete}
                onClose={() => setDishToDelete(null)}
                onConfirm={(dish) => {
                    console.log('Elimina piatto', dish.id_food, dish.name);

                    // TODO: chiamata API DELETE
                    // await deleteDish(dish.id_food)

                    setDishToDelete(null);
                    fetchDishes(); // ricarichi lista
                }}
            />

            {/* MODALE LEGENDA ALLERGENI */}
            <AllergensModal
                open={showAllergensInfo}
                onClose={() => setShowAllergensInfo(false)}
            />

            {/* STATO */}
            {error && <div className="text-brand-error mb-2">{error}</div>}
            {loading && <div className="mb-2">Caricamento…</div>}
        </AppLayout>
    );
}
