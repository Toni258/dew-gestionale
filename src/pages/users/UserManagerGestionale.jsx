import AppLayout from '../../components/layout/AppLayout';
import { useCallback, useEffect, useMemo, useState } from 'react';

import SearchInput from '../../components/ui/SearchInput';
import CustomSelect from '../../components/ui/CustomSelect';
import Form from '../../components/ui/Form';
import FormGroup from '../../components/ui/FormGroup';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';

import { formatDateTime } from '../../utils/formatDateTime';
import { useAuth } from '../../context/AuthContext';
import { withLoader } from '../../services/withLoader';
import { withLoaderNotify } from '../../services/withLoaderNotify';
import {
    deleteGestionaleUser,
    getGestionaleUsers,
    resetGestionaleUserPassword,
    suspendGestionaleUser,
    unsuspendGestionaleUser,
    updateGestionaleUserInfo,
} from '../../services/usersApi';

import ModifyUserInfoModal from '../../components/modals/ModifyUserInfoModal';
import ModifyUserPasswordModal from '../../components/modals/ModifyUserPasswordModal';
import DeleteUserModal from '../../components/modals/DeleteUserModal';
import SuspendUserModal from '../../components/modals/SuspendUserModal';
import EnableUserModal from '../../components/modals/EnableUserModal';


export default function UserManagerGestionale() {
    const { user, isSuperUser, refreshMe } = useAuth();
    const myId = user?.id;

    const [query, setQuery] = useState('');
    const [appliedFilters, setAppliedFilters] = useState({
        ruolo: '',
        status: '',
    });

    const [showModifyUserInfoModal, setShowModifyUserInfoModal] =
        useState(false);
    const [showPasswordChangeModal, setShowPasswordChangeModal] =
        useState(false);
    const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
    const [showDisableUserModal, setShowDisableUserModal] = useState(false);
    const [showEnableUserModal, setShowEnableUserModal] = useState(false);
    const [userSelected, setUserSelected] = useState(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const passwordResetRequestsCount = rows.filter(
        (row) => row.status === 'password_reset_requested',
    ).length;

    const STATUS_LABELS = {
        active: 'Attivo',
        suspended: 'Sospeso',
        must_change_password: 'Password da cambiare',
        password_reset_requested: 'Reset password richiesto',
    };

    // Applica filtri: li “blocchi” e resetti pagina a 1
    const handleFilters = (values) => {
        setAppliedFilters({
            ruolo: values.ruolo || '',
            status: values.status || '',
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
            status: appliedFilters.status || '',
            page,
            pageSize,
        };
    }, [query, appliedFilters, page, pageSize]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            await withLoader('Caricamento utenti…', async () => {
                const json = await getGestionaleUsers(requestParams);
                setRows(json.data || []);
                setTotal(json.total || 0);
            });
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
        <AppLayout title="GESTIONE UTENTI">
            <h1 className="text-3xl font-semibold">
                Elenco utenti del gestionale
            </h1>

            {isSuperUser && passwordResetRequestsCount > 0 && (
                <div className="m-4">
                    <div className="rounded-2xl border border-brand-error/30 bg-brand-error/5 px-5 py-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-lg font-semibold text-brand-error">
                                    Richieste reset password da gestire
                                </div>
                                <div className="text-sm text-brand-textSecondary mt-1">
                                    {passwordResetRequestsCount === 1
                                        ? 'È presente 1 utente che ha richiesto il ripristino password.'
                                        : `Sono presenti ${passwordResetRequestsCount} utenti che hanno richiesto il ripristino password.`}
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="danger"
                                size="md"
                                className="rounded-lg shrink-0"
                                onClick={() => {
                                    setAppliedFilters((prev) => ({
                                        ...prev,
                                        status: 'password_reset_requested',
                                    }));
                                    setPage(1);
                                }}
                            >
                                Mostra richieste
                            </Button>
                        </div>
                    </div>
                </div>
            )}

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
                    key={`${appliedFilters.ruolo}-${appliedFilters.status}`}
                    initialValues={{
                        ruolo: appliedFilters.ruolo,
                        status: appliedFilters.status,
                    }}
                    onSubmit={handleFilters}
                >
                    <div className="flex items-center gap-5">
                        <FormGroup name="ruolo" className="w-[145px]">
                            <CustomSelect
                                name="ruolo"
                                placeholder="Ruolo utente"
                                options={[
                                    { value: '', label: '— Tutti —' },
                                    {
                                        value: 'super_user',
                                        label: 'Super User',
                                    },
                                    {
                                        value: 'operator',
                                        label: 'Operatore',
                                    },
                                ]}
                                height="h-[45px]"
                                className="w-full [&>div>button]:rounded-full"
                            />
                        </FormGroup>

                        <FormGroup name="status" className="w-[250px]">
                            <CustomSelect
                                name="status"
                                placeholder="Stato utente"
                                options={[
                                    { value: '', label: '— Tutti —' },
                                    {
                                        value: 'active',
                                        label: 'Attivo',
                                    },
                                    {
                                        value: 'password_reset_requested',
                                        label: 'Reset password richiesto',
                                    },
                                    {
                                        value: 'must_change_password',
                                        label: 'Password da cambiare',
                                    },
                                    {
                                        value: 'suspended',
                                        label: 'Sospeso',
                                    },
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
                            <th className="px-4 py-3 text-left">STATO</th>
                            <th className="px-4 py-3 text-left">
                                ULTIMO ACCESSO
                            </th>
                            <th className="px-4 py-3 text-left">CREATO IL</th>
                            <th className="px-4 py-3 text-left">
                                ULTIMO AGGIORNAMENTO
                            </th>
                            {isSuperUser && (
                                <th className="px-4 py-3 text-left">AZIONI</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {!loading && rows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={isSuperUser ? 8 : 7}
                                    className="px-4 py-4 text-brand-textSecondary"
                                >
                                    Nessun utente trovato.
                                </td>
                            </tr>
                        )}

                        {rows.map((user) => {
                            const isDisabled = user.status === 'suspended';
                            const isMe = myId === user.id;

                            return (
                                <tr key={user.id} className="border-b">
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span>
                                                {user.role == 'super_user'
                                                    ? 'Super user'
                                                    : 'Operatore'}
                                            </span>

                                            {user.status ===
                                                'password_reset_requested' && (
                                                <span className="inline-flex items-center rounded-full border border-brand-error/25 bg-brand-error/10 px-3 py-1 text-xs font-semibold text-brand-error">
                                                    Richiesta urgente
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span>{user.email}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span>
                                            {user.name} {user.surname}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={[
                                                'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold',
                                                user.status ===
                                                'password_reset_requested'
                                                    ? 'border-brand-error/25 bg-brand-error/10 text-brand-error'
                                                    : user.status ===
                                                        'suspended'
                                                      ? 'border-brand-error/20 bg-brand-error/8 text-brand-error'
                                                      : user.status ===
                                                          'must_change_password'
                                                        ? 'border-brand-warning/20 bg-brand-warning/10 text-brand-warning'
                                                        : 'border-brand-primary/20 bg-brand-primary/10 text-brand-primary',
                                            ].join(' ')}
                                        >
                                            {STATUS_LABELS[user.status] ??
                                                user.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span>
                                            {formatDateTime(user.last_login_at)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span>
                                            {formatDateTime(user.created_at)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span>
                                            {formatDateTime(user.updated_at)}
                                        </span>
                                    </td>

                                    {isSuperUser && (
                                        <td className="px-4 py-3">
                                            <button
                                                className="text-red-500"
                                                onClick={() => {
                                                    setUserSelected(user);
                                                    setShowModifyUserInfoModal(
                                                        true,
                                                    );
                                                }}
                                            >
                                                ✏
                                            </button>
                                            <button
                                                className="ml-3 text-red-500"
                                                onClick={() => {
                                                    setUserSelected(user);
                                                    setShowPasswordChangeModal(
                                                        true,
                                                    );
                                                }}
                                            >
                                                🔑
                                            </button>
                                            {isDisabled && !isMe && (
                                                <button
                                                    className="ml-3 text-red-500"
                                                    onClick={() => {
                                                        setUserSelected(user);
                                                        setShowEnableUserModal(
                                                            true,
                                                        );
                                                    }}
                                                >
                                                    🔓
                                                </button>
                                            )}

                                            {!isDisabled && !isMe && (
                                                <button
                                                    className="ml-3 text-red-500"
                                                    onClick={() => {
                                                        setUserSelected(user);
                                                        setShowDisableUserModal(
                                                            true,
                                                        );
                                                    }}
                                                >
                                                    🚫
                                                </button>
                                            )}

                                            {/* delete: non puoi eliminare te stesso */}
                                            {!isMe && (
                                                <button
                                                    className="ml-3 text-red-500"
                                                    onClick={() => {
                                                        setUserSelected(user);
                                                        setShowDeleteUserModal(
                                                            true,
                                                        );
                                                    }}
                                                >
                                                    🗑
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
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
                ruoli={[
                    {
                        value: 'super_user',
                        label: 'Super User',
                    },
                    { value: 'operator', label: 'Operatore' },
                ]}
                onClose={() => {
                    setUserSelected(null);
                    setShowModifyUserInfoModal(false);
                }}
                onConfirm={async (payload) => {
                    const result = await withLoaderNotify({
                        message: 'Salvataggio modifiche…',
                        mode: 'blocking',
                        success: 'Informazioni utente modificate correttamente',
                        errorTitle: 'Errore aggiornamento utente',
                        errorMessage:
                            'Impossibile aggiornare le informazioni utente.',
                        fn: async () => {
                            await updateGestionaleUserInfo(userSelected.id, {
                                name: payload.name,
                                surname: payload.surname,
                                email: payload.email,
                                role: payload.role,
                            });

                            if (userSelected?.id === user?.id) {
                                await refreshMe();
                            }

                            setUserSelected(null);
                            setShowModifyUserInfoModal(false);
                            await fetchUsers();
                            return true;
                        },
                    });

                    if (!result.ok) return;
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
                    const result = await withLoaderNotify({
                        message: 'Aggiornamento password…',
                        mode: 'blocking',
                        success: 'Password modificata correttamente',
                        errorTitle: 'Errore cambio password',
                        errorMessage: 'Impossibile aggiornare la password.',
                        fn: async () => {
                            await resetGestionaleUserPassword(
                                userSelected.id,
                                values.new_password,
                            );

                            setUserSelected(null);
                            setShowPasswordChangeModal(false);
                            await fetchUsers();
                            return true;
                        },
                    });

                    if (!result.ok) return;
                }}
            />

            {/* MODALE DISABILITA UTENTE */}
            <SuspendUserModal
                show={showDisableUserModal}
                user={userSelected}
                onClose={() => {
                    setUserSelected(null);
                    setShowDisableUserModal(false);
                }}
                onConfirm={async () => {
                    const result = await withLoaderNotify({
                        message: 'Sospensione utente…',
                        mode: 'blocking',
                        success: 'Utente sospeso correttamente',
                        errorTitle: 'Errore sospensione utente',
                        errorMessage: 'Impossibile sospendere l’utente.',
                        fn: async () => {
                            await suspendGestionaleUser(userSelected.id);

                            setUserSelected(null);
                            setShowDisableUserModal(false);
                            await fetchUsers();
                            return true;
                        },
                    });

                    if (!result.ok) return;
                }}
            />

            {/* MODALE DISABILITA UTENTE */}
            <EnableUserModal
                show={showEnableUserModal}
                user={userSelected}
                onClose={() => {
                    setUserSelected(null);
                    setShowEnableUserModal(false);
                }}
                onConfirm={async () => {
                    const result = await withLoaderNotify({
                        message: 'Riabilitazione utente…',
                        mode: 'blocking',
                        success: 'Utente riabilitato correttamente',
                        errorTitle: 'Errore riabilitazione utente',
                        errorMessage: 'Impossibile riabilitare l’utente.',
                        fn: async () => {
                            await unsuspendGestionaleUser(userSelected.id);

                            setUserSelected(null);
                            setShowEnableUserModal(false);
                            await fetchUsers();
                            return true;
                        },
                    });

                    if (!result.ok) return;
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
                onConfirm={async () => {
                    const result = await withLoaderNotify({
                        message: 'Eliminazione utente…',
                        mode: 'blocking',
                        success: 'Utente eliminato correttamente',
                        errorTitle: 'Errore eliminazione utente',
                        errorMessage: 'Impossibile eliminare l’utente.',
                        fn: async () => {
                            await deleteGestionaleUser(userSelected.id);

                            setUserSelected(null);
                            setShowDeleteUserModal(false);
                            await fetchUsers();
                            return true;
                        },
                    });

                    if (!result.ok) return;
                }}
            />
        </AppLayout>
    );
}
