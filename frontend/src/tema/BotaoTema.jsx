import { alternarTema, useTema } from './tema.js'
import './BotaoTema.css'

export default function BotaoTema({ className = '' }) {
    const tema = useTema()
    const escuro = tema === 'escuro'
    const rotulo = escuro ? 'Ativar modo claro' : 'Ativar modo escuro'

    return (
        <button
            type="button"
            className={`botao-tema${escuro ? ' is-escuro' : ''} ${className}`.trim()}
            onClick={alternarTema}
            aria-label={rotulo}
            aria-pressed={escuro}
            title={rotulo}
        >
            <span className="botao-tema__trilho" aria-hidden="true">
                <span className="botao-tema__icone botao-tema__icone--sol">☀</span>
                <span className="botao-tema__icone botao-tema__icone--lua">☾</span>
                <span className="botao-tema__bolinha" />
            </span>
        </button>
    )
}
