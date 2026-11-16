import React from 'react'

/** Reusable DiagramCode wordmark for public-facing screens. */
export default function DiagramCodeLogo({ compact = false, className = '' }) {
    return (
        <span className={`diagramcode-logo ${compact ? 'diagramcode-logo--compact' : ''} ${className}`.trim()}>
            <svg
                className="diagramcode-logo__mark"
                viewBox="0 0 20 20"
                aria-hidden="true"
                focusable="false"
            >
                <path d="M10 1.5 12.2 7.8 18.5 10l-6.3 2.2L10 18.5l-2.2-6.3L1.5 10l6.3-2.2L10 1.5Z" fill="currentColor" />
            </svg>
            <span>DiagramCode</span>
        </span>
    )
}
