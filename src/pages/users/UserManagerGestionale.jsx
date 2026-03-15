/**
 * Backoffice user manager page.
 * Data loading and table rendering are split into smaller helpers to keep this page readable.
 */
import { useMemo, useState } from 'react';

import AppLayout from '../../components/layout/AppLayout';
import FormGroup from '../../components/ui/FormGroup';
import CustomSelect from '../../components/ui/CustomSelect';
import UsersFiltersBar from '../../components/users/UsersFiltersBar';
import BackofficeUsersTable from '../../components/users/BackofficeUsersTable';
import ModifyUserInfoModal from '../../components/modals/ModifyUserInfoModal';
import ModifyUserPasswordModal from '../../components/modals/ModifyUserPasswordModal';
import DeleteUserModal from '../../components/modals/DeleteUserModal';
import SuspendUserModal from '../../components/modals/SuspendUserModal';
import EnableUserModal from '../../components/modals/EnableUserModal';

import { useAuth } from '../../context/AuthContext';
import { withLoaderNotify } from '../../services/withLoaderNotify';
import { useUsersTable } from '../../hooks/users/useUsersTable';
import {
    deleteGestionaleUser,
    getGestionaleUsers,
    resetGestionaleUserPassword,
    suspendGestionaleUser,
    unsuspendGestionaleUser,
    updateGestionaleUserInfo,
} from '../../services/usersApi';
import {
    BACKOFFICE_MODAL_ROLE_OPTIONS,
    BACKOFFICE_ROLE_OPTIONS,
    BACKOFFICE_STATUS_OPTIONS,
} from '../../domain/users';

export default function UserManagerGestionale() {
    const { user, isSuperUser, refreshMe } = useAuth();
    const myId = user?.id;

    const [showModifyUserInfoModal, setShowModifyUserInfoModal] =
        useState(false);
    const [showPasswordChangeModal, setShowPasswordChangeModal] =
        useState(false);
    const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
    const [showDisableUserModal, setShowDisableUserModal] = useState(false);
    const [showEnableUserModal, setShowEnableUserModal] = useState(false);
    const [userSelected, setUserSelected] = useState(null);

    const {
        appliedFilters,
        page,
        pageSize,
        rows,
        total,
        totalPages,
        loading,
        handleSearch,
        applyFilters,
        handlePageSizeChange,
        setPage,
        fetchRows,
    } = useUsersTable({
        initialFilters: {
            ruolo: '',
            status: '',
        },
        fetcher: getGestionaleUsers,
    });

    const passwordResetRequestsCount = useMemo(
        () =>
            rows.filter((row) => row.status === 'password_reset_requested')
                .length,
        [rows],
    );

    function clearSelection() {
        setUserSelected(null);
        setShowModifyUserInfoModal(false);
        setShowPasswordChangeModal(false);
        setShowDeleteUserModal(false);
        setShowDisableUserModal(false);
        setShowEnableUserModal(false);
    }

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
                                <div className="mt-1 text-sm text-brand-textSecondary">
                                    {passwordResetRequestsCount === 1
                                        ? 'È presente 1 utente che ha richiesto il ripristino password.'
                                        : `Sono presenti ${passwordResetRequestsCount} utenti che hanno richiesto il ripristino password.`}
                                </div>
                            </div>

                            <button
                                type="button"
                                className="shrink-0 rounded-lg bg-brand-error px-4 py-2 text-white transition hover:opacity-90"
                                onClick={() => {
                                    applyFilters({
                                        ...appliedFilters,
                                        status: 'password_reset_requested',
                                    });
                                }}
                            >
                                Mostra richieste
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <UsersFiltersBar
                searchPlaceholder="Cerca un utente per nome..."
                onSearch={handleSearch}
                formKey={`${appliedFilters.ruolo}-${appliedFilters.status}`}
                initialValues={{
                    ruolo: appliedFilters.ruolo,
                    status: appliedFilters.status,
                }}
                onSubmit={(values) =>
                    applyFilters({
                        ruolo: values.ruolo || '',
                        status: values.status || '',
                    })
                }
            >
                <FormGroup name="ruolo" className="w-[145px]">
                    <CustomSelect
                        name="ruolo"
                        placeholder="Ruolo utente"
                        options={BACKOFFICE_ROLE_OPTIONS}
                        height="h-[45px]"
                        className="w-full [&>div>button]:rounded-full"
                    />
                </FormGroup>

                <FormGroup name="status" className="w-[250px]">
                    <CustomSelect
                        name="status"
                        placeholder="Stato utente"
                        options={BACKOFFICE_STATUS_OPTIONS}
                        height="h-[45px]"
                        className="w-full [&>div>button]:rounded-full"
                    />
                </FormGroup>
            </UsersFiltersBar>

            <BackofficeUsersTable
                rows={rows}
                loading={loading}
                isSuperUser={isSuperUser}
                myId={myId}
                total={total}
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={handlePageSizeChange}
                onEdit={(selectedUser) => {
                    setUserSelected(selectedUser);
                    setShowModifyUserInfoModal(true);
                }}
                onResetPassword={(selectedUser) => {
                    setUserSelected(selectedUser);
                    setShowPasswordChangeModal(true);
                }}
                onEnable={(selectedUser) => {
                    setUserSelected(selectedUser);
                    setShowEnableUserModal(true);
                }}
                onSuspend={(selectedUser) => {
                    setUserSelected(selectedUser);
                    setShowDisableUserModal(true);
                }}
                onDelete={(selectedUser) => {
                    setUserSelected(selectedUser);
                    setShowDeleteUserModal(true);
                }}
            />

            <ModifyUserInfoModal
                show={showModifyUserInfoModal}
                user={userSelected}
                ruoli={BACKOFFICE_MODAL_ROLE_OPTIONS}
                onClose={clearSelection}
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

                            clearSelection();
                            await fetchRows();
                            return true;
                        },
                    });

                    if (!result.ok) return;
                }}
            />

            <ModifyUserPasswordModal
                show={showPasswordChangeModal}
                user={userSelected}
                onClose={clearSelection}
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

                            clearSelection();
                            await fetchRows();
                            return true;
                        },
                    });

                    if (!result.ok) return;
                }}
            />

            <SuspendUserModal
                show={showDisableUserModal}
                user={userSelected}
                onClose={clearSelection}
                onConfirm={async () => {
                    const result = await withLoaderNotify({
                        message: 'Sospensione utente…',
                        mode: 'blocking',
                        success: 'Utente sospeso correttamente',
                        errorTitle: 'Errore sospensione utente',
                        errorMessage: 'Impossibile sospendere l’utente.',
                        fn: async () => {
                            await suspendGestionaleUser(userSelected.id);
                            clearSelection();
                            await fetchRows();
                            return true;
                        },
                    });

                    if (!result.ok) return;
                }}
            />

            <EnableUserModal
                show={showEnableUserModal}
                user={userSelected}
                onClose={clearSelection}
                onConfirm={async () => {
                    const result = await withLoaderNotify({
                        message: 'Riabilitazione utente…',
                        mode: 'blocking',
                        success: 'Utente riabilitato correttamente',
                        errorTitle: 'Errore riabilitazione utente',
                        errorMessage: 'Impossibile riabilitare l’utente.',
                        fn: async () => {
                            await unsuspendGestionaleUser(userSelected.id);
                            clearSelection();
                            await fetchRows();
                            return true;
                        },
                    });

                    if (!result.ok) return;
                }}
            />

            <DeleteUserModal
                show={showDeleteUserModal}
                user={userSelected}
                onClose={clearSelection}
                onConfirm={async () => {
                    const result = await withLoaderNotify({
                        message: 'Eliminazione utente…',
                        mode: 'blocking',
                        success: 'Utente eliminato correttamente',
                        errorTitle: 'Errore eliminazione utente',
                        errorMessage: 'Impossibile eliminare l’utente.',
                        fn: async () => {
                            await deleteGestionaleUser(userSelected.id);
                            clearSelection();
                            await fetchRows();
                            return true;
                        },
                    });

                    if (!result.ok) return;
                }}
            />
        </AppLayout>
    );
}
