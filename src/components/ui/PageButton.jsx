import { memo } from 'react';

export default memo(function PageButton({ pageNum, current, onClick }) {
    const active = pageNum === current;

    return (
        <button
            type="button"
            onClick={() => onClick(pageNum)}
            className={`
                px-3 py-2 
                flex items-center justify-center
                text-base font-medium
                rounded-full border
                transition
                select-none
                ${
                    active
                        ? 'bg-brand-primary text-white border-brand-primary'
                        : 'border-brand-divider hover:bg-black/5'
                }
            `}
        >
            {pageNum}
        </button>
    );
});
