import AppLayout from '../../components/layout/AppLayout';
import { useCallback, useEffect, useMemo, useState } from 'react';

import SearchInput from '../../components/ui/SearchInput';
import CustomSelect from '../../components/ui/CustomSelect';
import Form from '../../components/ui/Form';
import FormGroup from '../../components/ui/FormGroup';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';

import { formatDateTime } from '../../utils/formatDateTime';

import ModifyUserInfoModal from '../../components/modals/ModifyUserInfoModal';
import ModifyUserPasswordModal from '../../components/modals/ModifyUserPasswordModal';
import DeleteUserModal from '../../components/modals/DeleteUserModal';

export default function UserManagerMobileApp() {
    const [query, setQuery] = useState('');
    const [appliedFilters, setAppliedFilters] = useState({
        ruolo: '',
    });

    const [showModifyUserInfoModal, setShowModifyUserInfoModal] =
        useState(false);
    const [showPasswordChangeModal, setShowPasswordChangeModal] =
        useState(false);
    const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
    const [userSelected, setUserSelected] = useState(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    // Applica filtri: li “blocchi” e resetti pagina a 1
    const handleFilters = (values) => {
        setAppliedFilters({
            ruolo: values.ruolo || '',
        });
        setPage(1);
    };

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setPage(1);
    };

    // Payload “finale” usato per chiamare API
    const requestParams = useMemo(() => {
        return {
            search: query,
            ruolo: appliedFilters.ruolo || '',
            page,
            pageSize,
        };
    }, [query, appliedFilters, page, pageSize]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const qs = new URLSearchParams();
            if (requestParams.search) qs.set('search', requestParams.search);
            if (requestParams.ruolo) qs.set('ruolo', requestParams.ruolo);
            qs.set('page', String(requestParams.page));
            qs.set('pageSize', String(requestParams.pageSize));

            const res = await fetch(`/api/users/mobile?${qs.toString()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const json = await res.json();
            setRows(json.data || []);
            setTotal(json.total || 0);
        } catch {
            setError('Errore nel caricamento degli utenti.');
            setRows([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [requestParams]);

    // Caricamento iniziale + quando cambiano filtri applicati/pagina/query
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    return (
        <AppLayout title="GESTIONE UTENTI" username="Antonio">
            <h1 className="text-3xl font-semibold">
                Elenco utenti dell'app mobile
            </h1>

            {/* BARRA FILTRI */}
            <div className="mt-1 mb-3 h-[60px] flex justify-between items-center">
                {/* SEARCH INPUT */}
                <SearchInput
                    placeholder="Cerca un utente per nome..."
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
                        <FormGroup name="ruolo" className="w-[145px]">
                            <CustomSelect
                                name="ruolo"
                                placeholder="Ruolo utente"
                                options={[
                                    { value: '', label: '— Ruolo —' },
                                    {
                                        value: 'super_user',
                                        label: 'Super User',
                                    },
                                    { value: 'caregiver', label: 'Caregiver' },
                                    { value: 'altro', label: 'Altro' },
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

            <div className="bg-white border border-brand-divider rounded-xl overflow-hidden">
                <table className="w-full text-sm table-auto">
                    <thead className="bg-brand-primary text-white">
                        <tr>
                            <th className="px-4 py-3 text-left">RUOLO</th>
                            <th className="px-4 py-3 text-left">EMAIL</th>
                            <th className="px-4 py-3 text-left">UTENTE</th>
                            <th className="px-4 py-3 text-left">
                                ULTIMO ACCESSO
                            </th>
                            <th className="px-4 py-3 text-left">AZIONI</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!loading && rows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-4 py-4 text-brand-textSecondary"
                                >
                                    Nessun utente trovato.
                                </td>
                            </tr>
                        )}

                        {rows.map((r) => (
                            <tr key={r.id_caregiver} className="border-b">
                                <td className="px-4 py-3">
                                    <span>{r.role}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <span>{r.email}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <span>
                                        {r.name} {r.surname}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span>
                                        {formatDateTime(r.acceptance_time)}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <button
                                        className="text-red-500"
                                        onClick={() => {
                                            setUserSelected(r);
                                            setShowModifyUserInfoModal(true);
                                        }}
                                    >
                                        ✏
                                    </button>
                                    <button
                                        className="ml-3 text-red-500"
                                        onClick={() => {
                                            setUserSelected(r);
                                            setShowPasswordChangeModal(true);
                                        }}
                                    >
                                        🔑
                                    </button>
                                    <button
                                        className="ml-3 text-red-500"
                                        onClick={() => {
                                            setUserSelected(r);
                                            setShowDeleteUserModal(true);
                                        }}
                                    >
                                        🗑
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <Pagination
                    total={total}
                    page={page}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    loading={loading}
                    onPageChange={setPage}
                    onPageSizeChange={handlePageSizeChange}
                />
            </div>

            {/* MODALE MODIFICA INFO UTENTE */}
            <ModifyUserInfoModal
                show={showModifyUserInfoModal}
                user={userSelected}
                onClose={() => {
                    setUserSelected(null);
                    setShowModifyUserInfoModal(false);
                }}
                onConfirm={async (payload) => {
                    try {
                        console.log('Cambio info utente', payload);

                        // await modifyUserInfo(userSelected?.id_caregiver, values); // Chiamata ancora da implementare
                        // alert('Informazioni reimpostate correttamente');

                        setUserSelected(null);
                        setShowModifyUserInfoModal(false);
                        await fetchUsers();
                    } catch (e) {
                        alert(e.message);
                    }
                }}
            />

            {/* MODALE REIMPOSTA PASSWORD UTENTE */}
            <ModifyUserPasswordModal
                show={showPasswordChangeModal}
                user={userSelected}
                onClose={() => {
                    setUserSelected(null);
                    setShowPasswordChangeModal(false);
                }}
                onConfirm={async (values) => {
                    try {
                        console.log('Cambio password', {
                            id_caregiver: userSelected?.id_caregiver,
                            email: userSelected?.email,
                            new_password: values.new_password,
                        });

                        // await modifyUserPassword(userSelected?.id_caregiver); // Chiamata ancora da implementare
                        // alert('Password reimpostata correttamente');

                        setUserSelected(null);
                        setShowPasswordChangeModal(false);
                        await fetchUsers();
                    } catch (e) {
                        alert(e.message);
                    }
                }}
            />

            {/* MODALE ELIMINA UTENTE */}
            <DeleteUserModal
                show={showDeleteUserModal}
                user={userSelected}
                onClose={() => {
                    setUserSelected(null);
                    setShowDeleteUserModal(false);
                }}
                onConfirm={async (user) => {
                    try {
                        await deleteUser(user.id_caregiver); // Chiamata ancora da implementare
                        console.log(
                            'Elimina user',
                            user.id_caregiver,
                            user.name,
                            user.surname,
                        );
                        alert('Utente eliminato correttamente');
                        setUserSelected(null);
                        setShowDeleteUserModal(false);
                        await fetchUsers();
                    } catch (e) {
                        alert(e.message);
                    }
                }}
            />
        </AppLayout>
    );
}
