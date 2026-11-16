import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Sobre from '../Sobre.jsx'

describe('página Sobre nós', () => {
    it('renderiza sem erro para visitante', () => {
        const html = renderToString(createElement(Sobre, {}))
        expect(html).toContain('Stack utilizada em cada camada')
        expect(html).toContain('Entrar')
    })

    it('mostra os links dos dois repositórios', () => {
        const html = renderToString(createElement(Sobre, {}))
        expect(html).toContain('https://github.com/luisciatti/web2_fullstack')
        expect(html).toContain('https://github.com/luisciatti/oci-web2')
    })

    it('troca a ação do cabeçalho quando o usuário está autenticado', () => {
        const html = renderToString(createElement(Sobre, { autenticado: true }))
        expect(html).toContain('Meus projetos')
    })
})
