import React from 'react'

/** Shared button styling for public-facing actions. */
export default function PublicButton({
    children,
    variant = 'primary',
    className = '',
    type = 'button',
    ...props
}) {
    return (
        <button
            className={`public-button public-button--${variant} ${className}`.trim()}
            type={type}
            {...props}
        >
            {children}
        </button>
    )
}
