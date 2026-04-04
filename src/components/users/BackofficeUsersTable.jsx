// Table used by the backoffice user manager page.
// Action handlers are passed from the page so the table stays presentational.
import Pagination from '../ui/Pagination';
import { formatDateTime } from '../../utils/formatDateTime';
import {
    BACKOFFICE_STATUS_LABELS,
    getBackofficeStatusBadgeClass,
} from '../../domain/users';

export default function BackofficeUsersTable({
    rows,
    loading,
    isSuperUser,
    myId,
    total,
    page,
    totalPages,
    pageSize,
    onPageChange,
    onPageSizeChange,
    onEdit,
    onResetPassword,
    onEnable,
    onSuspend,
    onDelete,
}) {
    return (
        <div className="overflow-hidden rounded-xl border border-brand-divider bg-white">
            <div className="overflow-x-auto">
                <table className="min-w-[1180px] w-full table-auto text-sm">
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
                                ULTIMA MODIFICA
                            </th>
                            {isSuperUser && (
                                <th className="w-[220px] min-w-[220px] px-4 py-3 text-left">
                                    AZIONI
                                </th>
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
                                        <div className="flex flex-row items-center gap-2">
                                            <span>
                                                {user.role === 'super_user'
                                                    ? 'Super user'
                                                    : 'Operatore'}
                                            </span>

                                            {user.status ===
                                                'password_reset_requested' && (
                                                <span className="inline-flex items-center rounded-full border border-brand-error/25 bg-brand-error/10 px-3 py-1 text-xs font-semibold text-brand-error">
                                                    Urgente
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">{user.email}</td>
                                    <td className="px-4 py-3">
                                        {user.name} {user.surname}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={[
                                                'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold',
                                                getBackofficeStatusBadgeClass(
                                                    user.status,
                                                ),
                                            ].join(' ')}
                                        >
                                            {BACKOFFICE_STATUS_LABELS[
                                                user.status
                                            ] ?? user.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {formatDateTime(user.last_login_at)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {formatDateTime(user.created_at)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {formatDateTime(user.updated_at)}
                                    </td>

                                    {isSuperUser && (
                                        <td className="w-[220px] min-w-[220px] px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center flex-nowrap">
                                                <button
                                                    className="shrink-0 rounded-md bg-brand-warning/25 p-1.5 "
                                                    onClick={() => onEdit(user)}
                                                    type="button"
                                                >
                                                    <img
                                                        src="/icons/pencil-giallo.png"
                                                        alt="Modifica"
                                                        className="h-4 w-4 shrink-0"
                                                        draggable={false}
                                                    />
                                                </button>

                                                <button
                                                    className="shrink-0 ml-3 rounded-md bg-slate-200 p-1.5"
                                                    onClick={() =>
                                                        onResetPassword(user)
                                                    }
                                                    type="button"
                                                >
                                                    <img
                                                        src="/icons/password-nero.png"
                                                        alt="Reset password"
                                                        className="h-4 w-4 shrink-0"
                                                        draggable={false}
                                                    />
                                                </button>

                                                {isDisabled && !isMe && (
                                                    <button
                                                        className="shrink-0 ml-3 rounded-md bg-brand-error/25 p-1.5"
                                                        onClick={() =>
                                                            onEnable(user)
                                                        }
                                                        type="button"
                                                    >
                                                        <img
                                                            src="/icons/unlock-rosso.png"
                                                            alt="Riabilita"
                                                            className="h-4 w-4 shrink-0"
                                                            draggable={false}
                                                        />
                                                    </button>
                                                )}

                                                {!isDisabled && !isMe && (
                                                    <button
                                                        className="shrink-0 ml-3 rounded-md bg-brand-error/25 p-1.5"
                                                        onClick={() =>
                                                            onSuspend(user)
                                                        }
                                                        type="button"
                                                    >
                                                        <img
                                                            src="/icons/lock-rosso.png"
                                                            alt="Sospendi"
                                                            className="h-4 w-4 shrink-0"
                                                            draggable={false}
                                                        />
                                                    </button>
                                                )}

                                                {!isMe && (
                                                    <button
                                                        className="shrink-0 ml-3 rounded-md bg-brand-error/25 p-1.5"
                                                        onClick={() =>
                                                            onDelete(user)
                                                        }
                                                        type="button"
                                                    >
                                                        <img
                                                            src="/icons/delete-1-rosso.png"
                                                            alt="Elimina"
                                                            className="h-4 w-4 shrink-0"
                                                            draggable={false}
                                                        />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <Pagination
                total={total}
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                loading={loading}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
            />
        </div>
    );
}
