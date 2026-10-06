package dao.jpa.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "servico_cloud")
public class ServicoCloudEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projeto_id", nullable = false)
    private ProjetoEntity projeto;

    @Column(name = "identificador", nullable = false)
    private String identificador;

    @Column(nullable = false)
    private String tipo;

    private String categoria;

    @Lob
    @Column(name = "configuracao_json")
    private String configuracaoJson;

    public Long getId() {
        return id;
    }

    public ProjetoEntity getProjeto() {
        return projeto;
    }

    public void setProjeto(ProjetoEntity projeto) {
        this.projeto = projeto;
    }

    public String getIdentificador() {
        return identificador;
    }

    public void setIdentificador(String identificador) {
        this.identificador = identificador;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public String getConfiguracaoJson() {
        return configuracaoJson;
    }

    public void setConfiguracaoJson(String configuracaoJson) {
        this.configuracaoJson = configuracaoJson;
    }
}