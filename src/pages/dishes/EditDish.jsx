/**
 * Page used to edit an existing dish.
 * The page keeps only the high-level workflow, while the suspension preview
 * and form helpers live in dedicated modules.
 */
import { useNavigate, useParams } from 'react-router-dom';

import AppLayout from '../../components/layout/AppLayout';
import Form from '../../components/ui/Form';
import DishFormFields from '../../components/dishes/DishFormFields';
import SuspensionBlock from '../../components/dishes/SuspensionBlock';
import StickySaveBar from '../../components/dishes/StickySaveBar';
import DishSuspensionConflictsModal from '../../components/dishes/DishSuspensionConflictsModal';

import { notify } from '../../services/notify';
import { withLoaderNotify } from '../../services/withLoaderNotify';
import { useDish } from '../../hooks/useDish';
import { useDishSuspensionFlow } from '../../hooks/dishes/useDishSuspensionFlow';
import { hasDishChanged } from '../../utils/diffDish';
import {
    getDishFieldValidators,
    validateDishForm,
} from '../../utils/dishes/dishFormValidation';
import { buildDishFormData } from '../../utils/dishes/dishFormData';
import { hasDishSuspensionChanged } from '../../utils/dishes/dishSuspension';
import {
    checkDishNameExists,
    updateDish,
    unsuspendDish,
} from '../../services/dishesApi';

const DISH_VALIDATORS = getDishFieldValidators();

export default function EditDish() {
    const { dishId } = useParams();
    const navigate = useNavigate();

    const {
        loading,
        error,
        initialValues,
        originalDish,
        initialSuspension,
        existingImageUrl,
    } = useDish(dishId);

    const {
        suspensionPreview,
        groupedConflicts,
        expandedMenus,
        replacementByPairing,
        optionsByType,
        optionsLoading,
        optionsError,
        allSelected,
        toggleMenu,
        closeSuspensionPreview,
        setReplacementForPairing,
        runDishSuspensionFlow,
        applySuspension,
    } = useDishSuspensionFlow(dishId);

    async function handleDishSubmit(values) {
        const dishChanged = hasDishChanged(originalDish, values);
        const imageChanged = values.img instanceof File;
        const suspensionEnabled = !!values.suspension_enabled;
        const suspensionChanged = hasDishSuspensionChanged(
            initialSuspension,
            values,
        );
        let suspensionActionHandled = false;

        if (initialSuspension?.enabled && suspensionEnabled === false) {
            const unsuspendResult = await withLoaderNotify({
                message: 'Riattivazione piatto…',
                mode: 'blocking',
                success: 'Sospensione disattivata correttamente',
                errorTitle: 'Errore riattivazione',
                errorMessage: 'Impossibile disattivare la sospensione.',
                fn: async () => {
                    await unsuspendDish(dishId);
                    return true;
                },
            });

            if (!unsuspendResult.ok) return;
            suspensionActionHandled = true;
        }

        if (suspensionEnabled && suspensionChanged) {
            const suspensionResult = await withLoaderNotify({
                message: 'Verifica sospensione…',
                mode: 'blocking',
                errorTitle: 'Errore sospensione',
                errorMessage: 'Impossibile verificare la sospensione.',
                fn: async () => {
                    return runDishSuspensionFlow({
                        start_date: values.start_date,
                        end_date: values.end_date,
                        reason: values.reason,
                    });
                },
            });

            if (!suspensionResult.ok) return;

            const result = suspensionResult.data;
            if (result?.pending) return;

            if (result?.applied === false) {
                notify.warning('Operazione annullata');
                return;
            }

            if (result?.applied === true) {
                suspensionActionHandled = true;
                notify.success('Sospensione salvata correttamente');
            }
        }

        if (!dishChanged && !imageChanged && !suspensionActionHandled) {
            notify.info('Nessuna modifica da salvare');
            navigate('/dishes');
            return;
        }

        if (suspensionActionHandled && !dishChanged && !imageChanged) {
            navigate('/dishes');
            return;
        }

        const updateResult = await withLoaderNotify({
            message: 'Salvataggio piatto…',
            mode: 'blocking',
            success: 'Piatto aggiornato correttamente',
            errorTitle: 'Errore aggiornamento piatto',
            errorMessage: 'Impossibile aggiornare il piatto.',
            fn: async () => {
                await updateDish(
                    dishId,
                    buildDishFormData(values, {
                        excludeSuspensionFields: true,
                    }),
                );
                return true;
            },
        });

        if (!updateResult.ok) return;
        navigate('/dishes');
    }

    async function handleSaveSuspensionWithoutReplacement() {
        const result = await withLoaderNotify({
            message: 'Salvataggio sospensione…',
            mode: 'blocking',
            success: 'Sospensione salvata',
            errorTitle: 'Errore salvataggio sospensione',
            errorMessage: 'Impossibile salvare la sospensione.',
            fn: async () => {
                await applySuspension({
                    start_date: suspensionPreview.suspension.valid_from,
                    end_date: suspensionPreview.suspension.valid_to,
                    reason: suspensionPreview.suspension.reason,
                    action: 'disable-only',
                });
                return true;
            },
        });

        if (!result.ok) return;

        notify.info('Attenzione: dovrai completare i menù manualmente.');
        navigate('/dishes');
    }

    async function handleSaveSuspensionWithReplacement() {
        const result = await withLoaderNotify({
            message: 'Salvataggio sostituzioni…',
            mode: 'blocking',
            success: 'Sospensione salvata e sostituzioni applicate.',
            errorTitle: 'Errore salvataggio sostituzioni',
            errorMessage: 'Impossibile salvare le sostituzioni.',
            fn: async () => {
                await applySuspension({
                    start_date: suspensionPreview.suspension.valid_from,
                    end_date: suspensionPreview.suspension.valid_to,
                    reason: suspensionPreview.suspension.reason,
                    action: 'replace',
                });
                return true;
            },
        });

        if (!result.ok) return;
        navigate('/dishes');
    }

    if (loading) {
        return (
            <AppLayout title="GESTIONE PIATTI">
                <div>Caricamento…</div>
            </AppLayout>
        );
    }

    if (error) {
        return (
            <AppLayout title="GESTIONE PIATTI">
                <div className="text-brand-error">{error}</div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="GESTIONE PIATTI">
            <h1 className="text-3xl font-semibold">Modifica del piatto</h1>

            <Form
                initialValues={initialValues}
                validate={DISH_VALIDATORS}
                asyncValidate={{
                    name: async (value) => {
                        const normalizedValue = (value ?? '').trim();
                        if (
                            !normalizedValue ||
                            normalizedValue.length < 3
                        ) {
                            return null;
                        }

                        try {
                            const data = await checkDishNameExists(
                                normalizedValue,
                                {
                                    excludeId: dishId,
                                },
                            );

                            return data.exists
                                ? 'Questo nome è già in uso'
                                : null;
                        } catch {
                            return 'Impossibile verificare il nome';
                        }
                    },
                }}
                validateForm={(values) =>
                    validateDishForm(values, {
                        includeSuspension: true,
                    })
                }
                validateOnBlur
                validateOnSubmit
                onSubmit={handleDishSubmit}
            >
                <DishFormFields existingImageUrl={existingImageUrl} />
                <SuspensionBlock initialSuspension={initialSuspension} />

                <StickySaveBar
                    originalDish={originalDish}
                    initialSuspension={initialSuspension}
                />
            </Form>

            <DishSuspensionConflictsModal
                preview={suspensionPreview}
                groupedConflicts={groupedConflicts}
                expandedMenus={expandedMenus}
                replacementByPairing={replacementByPairing}
                optionsByType={optionsByType}
                optionsLoading={optionsLoading}
                optionsError={optionsError}
                allSelected={allSelected}
                onToggleMenu={toggleMenu}
                onSelectReplacement={setReplacementForPairing}
                onClose={closeSuspensionPreview}
                onSaveWithoutReplacement={handleSaveSuspensionWithoutReplacement}
                onSaveAndReplace={handleSaveSuspensionWithReplacement}
            />
        </AppLayout>
    );
}
