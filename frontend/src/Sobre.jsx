import DiagramCodeLogo from './components/public/DiagramCodeLogo.jsx'
import PublicButton from './components/public/PublicButton.jsx'
import './Login.css'
import './Sobre.css'

const REPOS = [
    {
        nome: 'web2_fullstack',
        tag: 'Aplicação',
        url: 'https://github.com/luisciatti/web2_fullstack',
        descricao:
            'Front-end em React + Vite e back-end em Spring Boot, com testes automatizados, documentação Swagger, collection do Postman e pipeline de build e publicação da imagem.',
        linguagens: ['JavaScript', 'Java', 'Docker', 'GitHub Actions'],
    },
    {
        nome: 'oci-web2',
        tag: 'Infraestrutura',
        url: 'https://github.com/luisciatti/oci-web2',
        descricao:
            'OCI TestHub: infraestrutura como código com OpenTofu, organizada em camadas, com state remoto no Object Storage e deploy por GitHub Actions.',
        linguagens: ['HCL', 'OpenTofu', 'Shell', 'GitHub Actions'],
    },
]

const RESUMO = [
    ['Produto', 'Editor web de diagramas UML'],
    ['Front-end', 'React 19 + Vite'],
    ['Back-end', 'Java 21 + Spring Boot 3'],
    ['Banco', 'MySQL na OCI'],
    ['Nuvem', 'Oracle Cloud · São Paulo'],
    ['Infra', '100% como código (OpenTofu)'],
]

const STACK = [
    {
        icone: 'monitor',
        titulo: 'Front-end',
        subtitulo: 'Interface do editor',
        itens: ['React 19', 'Vite 8', 'Mermaid', 'JSZip', 'Vitest', 'Oxlint'],
    },
    {
        icone: 'server',
        titulo: 'Back-end',
        subtitulo: 'API REST',
        itens: ['Java 21', 'Spring Boot 3.1', 'Spring Security', 'JWT (jjwt)', 'Spring Data JPA', 'Flyway', 'MySQL / H2', 'Swagger (springdoc)', 'Actuator + Micrometer', 'JUnit 5'],
    },
    {
        icone: 'cloud',
        titulo: 'Cloud & DevOps',
        subtitulo: 'Infraestrutura na OCI',
        itens: ['Oracle Cloud (OCI)', 'OpenTofu', 'VM Ampere A1', 'Docker', 'Network Load Balancer', 'OCI MySQL', 'OCI Vault', 'Object Storage', 'Prometheus', 'Grafana', 'GitHub Actions', 'GHCR'],
    },
]

const FLUXO = [
    { icone: 'monitor', titulo: 'Usuário', detalhe: 'Navegador' },
    { icone: 'split', titulo: 'Load Balancer', detalhe: 'Subnet pública' },
    { icone: 'server', titulo: 'VM Ampere A1', detalhe: 'Docker · Spring Boot + front', destaque: true },
    { icone: 'db', titulo: 'MySQL', detalhe: 'OCI · subnet privada' },
]

const APOIO = [
    ['OCI Vault', 'Segredos do banco e do JWT'],
    ['Object Storage', 'State remoto do OpenTofu'],
    ['Prometheus + Grafana', 'Métricas e dashboard da API'],
    ['GitHub Actions + GHCR', 'Build, testes e imagem com tag prod'],
]

const ICONES = {
    monitor: <><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></>,
    server: <><rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><path d="M6 6h.01M6 18h.01" /></>,
    cloud: <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />,
    split: <><circle cx="12" cy="5" r="3" /><circle cx="5" cy="19" r="3" /><circle cx="19" cy="19" r="3" /><path d="M12 8v3M12 11l-5.5 5.5M12 11l5.5 5.5" /></>,
    db: <><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" /></>,
    branch: <><path d="M6 3v12" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" /></>,
    externo: <><path d="M7 17 17 7" /><path d="M7 7h10v10" /></>,
    seta: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
}

function Icone({ nome, className = '' }) {
    return (
        <svg
            className={`about-icon ${className}`.trim()}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            {ICONES[nome]}
        </svg>
    )
}

function rolarPara(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Sobre({ autenticado = false, onEntrar, onComecar }) {
    const entrar = (event) => {
        if (!onEntrar) return
        event.preventDefault()
        onEntrar()
    }

    const comecar = (event) => {
        if (!onComecar) return
        event.preventDefault()
        onComecar()
    }

    return (
        <div className="public-auth about-page">
            <header className="public-header">
                <div className="public-header__inner">
                    <a className="public-header__brand" href="#inicio" aria-label="DiagramCode — início">
                        <DiagramCodeLogo />
                    </a>

                    <nav className="public-nav" aria-label="Navegação principal">
                        <a href="#inicio" className="public-nav__home" aria-current="page">
                            Início
                        </a>
                        <PublicButton
                            className="public-nav__signup"
                            variant="outline"
                            onClick={autenticado ? entrar : comecar}
                        >
                            {autenticado ? 'Meus projetos' : 'Criar conta'}
                        </PublicButton>
                    </nav>
                </div>
            </header>

            <main>
                <section className="about-hero" aria-labelledby="about-title">
                    <div className="about-container about-hero__grid">
                        <div className="about-hero__copy">
                            <span className="public-eyebrow">Sobre o projeto</span>
                            <h1 id="about-title">Da modelagem UML ao código — rodando na Oracle Cloud.</h1>
                            <p>
                                O DiagramCode é um editor web para modelar diagramas de classes UML, gerar artefatos
                                de código a partir do modelo e visualizar a arquitetura cloud do sistema. É um projeto
                                full stack: interface em React, API em Spring Boot e toda a infraestrutura provisionada
                                como código na OCI.
                            </p>
                            <div className="about-actions">
                                <button type="button" className="about-btn about-btn--primary" onClick={() => rolarPara('tecnologias')}>
                                    Ver tecnologias
                                </button>
                                <button type="button" className="about-btn about-btn--outline" onClick={() => rolarPara('repositorios')}>
                                    <Icone nome="branch" />
                                    Repositórios no GitHub
                                </button>
                            </div>
                        </div>

                        <aside className="about-summary" aria-label="Resumo do projeto">
                            <span className="about-summary__title">Em resumo</span>
                            <dl>
                                {RESUMO.map(([rotulo, valor]) => (
                                    <div className="about-summary__row" key={rotulo}>
                                        <dt>{rotulo}</dt>
                                        <dd>{valor}</dd>
                                    </div>
                                ))}
                            </dl>
                        </aside>
                    </div>
                </section>

                <section className="about-section about-section--white" id="tecnologias" aria-labelledby="tech-title">
                    <div className="about-container">
                        <header className="about-section__head">
                            <span className="about-eyebrow">Tecnologias</span>
                            <h2 id="tech-title">Stack utilizada em cada camada</h2>
                            <p>Do navegador à infraestrutura, cada parte do projeto foi escolhida para ser simples de manter e fácil de publicar.</p>
                        </header>

                        <div className="about-tech-grid">
                            {STACK.map((camada) => (
                                <article className="about-card about-card--soft about-tech" key={camada.titulo}>
                                    <div className="about-tech__top">
                                        <span className="about-icon-box about-icon-box--dark"><Icone nome={camada.icone} /></span>
                                        <div>
                                            <h3>{camada.titulo}</h3>
                                            <span>{camada.subtitulo}</span>
                                        </div>
                                    </div>
                                    <ul className="about-chips">
                                        {camada.itens.map((item) => <li className="about-chip about-chip--white" key={item}>{item}</li>)}
                                    </ul>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="about-section" id="arquitetura" aria-labelledby="arch-title">
                    <div className="about-container">
                        <header className="about-section__head">
                            <span className="about-eyebrow">Arquitetura na nuvem</span>
                            <h2 id="arch-title">Como a aplicação roda na Oracle Cloud</h2>
                            <p>Infraestrutura organizada em camadas (foundation, global, security, network, database e application), com state remoto e deploy automatizado.</p>
                        </header>

                        <div className="about-card about-arch">
                            <ol className="about-flow" aria-label="Caminho da requisição">
                                {FLUXO.map((no, indice) => (
                                    <li className="about-flow__item" key={no.titulo}>
                                        <div className={`about-flow__node${no.destaque ? ' is-highlight' : ''}`}>
                                            <Icone nome={no.icone} className="about-flow__icon" />
                                            <div>
                                                <strong>{no.titulo}</strong>
                                                <span>{no.detalhe}</span>
                                            </div>
                                        </div>
                                        {indice < FLUXO.length - 1 && <Icone nome="seta" className="about-flow__arrow" />}
                                    </li>
                                ))}
                            </ol>

                            <ul className="about-support">
                                {APOIO.map(([titulo, detalhe]) => (
                                    <li key={titulo}>
                                        <strong>{titulo}</strong>
                                        <span>{detalhe}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="about-section about-section--white" id="repositorios" aria-labelledby="repo-title">
                    <div className="about-container">
                        <header className="about-section__head">
                            <span className="about-eyebrow">Código aberto</span>
                            <h2 id="repo-title">Repositórios do projeto</h2>
                            <p>O código está dividido em dois repositórios: a aplicação e a infraestrutura.</p>
                        </header>

                        <div className="about-repo-grid">
                            {REPOS.map((repo) => (
                                <article className="about-card about-repo" key={repo.nome}>
                                    <div className="about-repo__top">
                                        <span className="about-icon-box"><Icone nome="branch" /></span>
                                        <div className="about-repo__name">
                                            <h3>luisciatti / {repo.nome}</h3>
                                            <span className="about-repo__tag">{repo.tag}</span>
                                        </div>
                                    </div>
                                    <p>{repo.descricao}</p>
                                    <ul className="about-chips">
                                        {repo.linguagens.map((item) => <li className="about-chip" key={item}>{item}</li>)}
                                    </ul>
                                    <div className="about-repo__footer">
                                        <span className="about-repo__url">{repo.url.replace('https://', '')}</span>
                                        <a
                                            className="about-btn about-btn--primary about-btn--sm"
                                            href={repo.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Abrir no GitHub
                                            <Icone nome="externo" />
                                        </a>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="about-cta" aria-labelledby="cta-title">
                    <div className="about-container about-cta__inner">
                        <div>
                            <h2 id="cta-title">Quer ver na prática?</h2>
                            <p>Crie uma conta e modele seu primeiro diagrama em poucos minutos.</p>
                        </div>
                        <a className="about-btn about-btn--light" href="#acesso" onClick={comecar}>
                            {autenticado ? 'Ir para meus projetos' : 'Começar agora'}
                        </a>
                    </div>
                </section>
            </main>
        </div>
    )
}
