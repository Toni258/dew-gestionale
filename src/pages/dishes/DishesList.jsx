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
import DishStatusInfoModal from '../../components/modals/DishStatusInfoModal';

import { withLoader } from '../../services/withLoader';
import { withLoaderNotify } from '../../services/withLoaderNotify';
import { deleteDish, getDishes } from '../../services/dishesApi';

import { ALLERGEN_OPTIONS } from '../../domain/allergens';
import { TIPOLOGIA_OPTIONS } from '../../domain/tipologia';
import { STATO_OPTIONS } from '../../domain/stato';

export default function DishesList() {
    // Main state used by the page
    const [query, setQuery] = useState('');
    const [appliedFilters, setAppliedFilters] = useState({
        stato: '',
        tipologia: '',
        allergeni: [],
    });

    const [showStatusInfo, setShowStatusInfo] = useState(false);
    const [showAllergensInfo, setShowAllergensInfo] = useState(false);
    const [dishToDelete, setDishToDelete] = useState(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setPage(1);
    };

    const requestParams = useMemo(
        () => ({
            search: query,
            stato: appliedFilters.stato || '',
            tipologia: appliedFilters.tipologia || '',
            allergeni: appliedFilters.allergeni || [],
            page,
            pageSize,
        }),
        [query, appliedFilters, page, pageSize],
    );
    // Memoized handler used by the page

    const fetchDishes = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            await withLoader('Caricamento piatti…', async () => {
                const json = await getDishes(requestParams);
                setRows(json.data || []);
                setTotal(json.total || 0);
            });
        } catch {
            setError('Errore nel caricamento piatti.');
            setRows([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [requestParams]);
    // Load data when the component opens

    useEffect(() => {
        fetchDishes();
    }, [fetchDishes]);

    const handleFilters = (values) => {
        setAppliedFilters({
            stato: values.stato || '',
            tipologia: values.tipologia || '',
            allergeni: values.allergeni || [],
        });
        setPage(1);
    };

    return (
        <AppLayout title="GESTIONE PIATTI">
            <h1 className="text-3xl font-semibold">Elenco piatti</h1>

            <div className="mb-4 mt-2 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <SearchInput
                    placeholder="Cerca un piatto per nome..."
                    onSearch={(q) => {
                        setQuery(q);
                        setPage(1);
                    }}
                    className="w-full xl:w-[400px] [&>input]:rounded-full"
                />

                <Form
                    initialValues={{
                        stato: appliedFilters.stato,
                        allergeni: appliedFilters.allergeni,
                        tipologia: appliedFilters.tipologia,
                    }}
                    onSubmit={handleFilters}
                >
                    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
                        <FormGroup name="stato" className="w-full sm:w-[145px]">
                            <CustomSelect
                                name="stato"
                                placeholder="Stato piatto"
                                options={STATO_OPTIONS}
                                height="h-[45px]"
                                className="w-full [&>div>button]:rounded-full"
                            />
                        </FormGroup>

                        <FormGroup
                            name="allergeni"
                            className="w-full sm:w-[180px]"
                        >
                            <MultiSelectCheckbox
                                name="allergeni"
                                placeholder="Allergeni esclusi"
                                options={ALLERGEN_OPTIONS}
                                height="h-[45px]"
                                className="[&>div>button]:rounded-full"
                            />
                        </FormGroup>

                        <FormGroup
                            name="tipologia"
                            className="w-full sm:w-[145px]"
                        >
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
                onShowStatusInfo={() => setShowStatusInfo(true)}
                onShowAllergensInfo={() => setShowAllergensInfo(true)}
            />

            <DeleteDishModal
                dish={dishToDelete}
                onClose={() => setDishToDelete(null)}
                onConfirm={async (dish) => {
                    const res = await withLoaderNotify({
                        message: 'Eliminazione piatto…',
                        mode: 'blocking',
                        success: 'Piatto eliminato correttamente',
                        errorTitle: 'Errore eliminazione piatto',
                        errorMessage: 'Impossibile eliminare il piatto.',
                        fn: async () => {
                            await deleteDish(dish.id_food);
                            setDishToDelete(null);
                            await fetchDishes();
                            return true;
                        },
                    });

                    if (!res.ok) return;
                }}
            />

            <DishStatusInfoModal
                open={showStatusInfo}
                onClose={() => setShowStatusInfo(false)}
            />

            <AllergensModal
                open={showAllergensInfo}
                onClose={() => setShowAllergensInfo(false)}
            />

            {error && <div className="text-brand-error mb-2">{error}</div>}
            {loading && <div className="mb-2">Caricamento…</div>}
        </AppLayout>
    );
}
