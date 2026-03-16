// Shared list state for user management pages.
// It centralizes query text, applied filters, pagination and data loading.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { withLoader } from '../../services/withLoader';

// Manages the state and side effects for users table.
export function useUsersTable({
    initialFilters,
    fetcher,
    loaderMessage = 'Caricamento utenti…',
    loadErrorMessage = 'Errore nel caricamento degli utenti.',
}) {
    // Main state used by the page
    const [query, setQuery] = useState('');
    const [appliedFilters, setAppliedFilters] = useState(initialFilters);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const requestParams = useMemo(
        () => ({
            search: query,
            ...appliedFilters,
            page,
            pageSize,
        }),
        [query, appliedFilters, page, pageSize],
    );
    // Memoized handler used by the page

    const fetchRows = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            await withLoader(loaderMessage, async () => {
                const json = await fetcher(requestParams);
                setRows(json.data || []);
                setTotal(json.total || 0);
            });
        } catch {
            setError(loadErrorMessage);
            setRows([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [fetcher, loadErrorMessage, loaderMessage, requestParams]);
    // Load data when the component opens

    useEffect(() => {
        fetchRows();
    }, [fetchRows]);

    // Applies the changes used by filters.
    function applyFilters(nextFilters) {
        setAppliedFilters(nextFilters);
        setPage(1);
    }

    // Updates the search text and resets pagination.
    function handleSearch(nextQuery) {
        setQuery(nextQuery);
        setPage(1);
    }

    // Changes the page size and resets pagination.
    function handlePageSizeChange(event) {
        setPageSize(Number(event.target.value));
        setPage(1);
    }

    return {
        query,
        appliedFilters,
        page,
        pageSize,
        rows,
        total,
        totalPages,
        loading,
        error,
        requestParams,
        setPage,
        handleSearch,
        applyFilters,
        handlePageSizeChange,
        fetchRows,
    };
}