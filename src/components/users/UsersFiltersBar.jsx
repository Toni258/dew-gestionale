// Shared top bar for user management pages.
// It keeps the same search + filter layout across different user lists.
import SearchInput from '../ui/SearchInput';
import Form from '../ui/Form';
import Button from '../ui/Button';

export default function UsersFiltersBar({
    searchPlaceholder,
    onSearch,
    formKey,
    initialValues,
    onSubmit,
    children,
}) {
    return (
        <div className="mb-4 mt-2 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <SearchInput
                placeholder={searchPlaceholder}
                onSearch={onSearch}
                className="w-full xl:w-[400px] [&>input]:rounded-full"
            />

            <Form key={formKey} initialValues={initialValues} onSubmit={onSubmit}>
                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
                    {children}

                    <Button
                        type="submit"
                        size="md"
                        variant="primary"
                        className="rounded-full px-4 py-2"
                    >
                        Applica filtri
                    </Button>
                </div>
            </Form>
        </div>
    );
}
