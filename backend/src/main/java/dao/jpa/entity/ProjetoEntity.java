package dao.jpa.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projeto")
public class ProjetoEntity {

    @Id
    @Column(nullable = false, length = 64)
    private String id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false)
    private String linguagem;

    @Column(nullable = false)
    private String framework;

    @Column(name = "provedor_cloud", nullable = false)
    private String provedorCloud;

    @OneToMany(mappedBy = "projeto", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ClasseEntity> classes = new ArrayList<>();

    @OneToMany(mappedBy = "projeto", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RelacaoEntity> relacoes = new ArrayList<>();

    @OneToMany(mappedBy = "projeto", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ServicoCloudEntity> servicosCloud = new ArrayList<>();

    @OneToMany(mappedBy = "projeto", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ConexaoCloudEntity> conexoesCloud = new ArrayList<>();

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getLinguagem() {
        return linguagem;
    }

    public void setLinguagem(String linguagem) {
        this.linguagem = linguagem;
    }

    public String getFramework() {
        return framework;
    }

    public void setFramework(String framework) {
        this.framework = framework;
    }

    public String getProvedorCloud() {
        return provedorCloud;
    }

    public void setProvedorCloud(String provedorCloud) {
        this.provedorCloud = provedorCloud;
    }

    public List<ClasseEntity> getClasses() {
        return classes;
    }

    public void setClasses(List<ClasseEntity> classes) {
        this.classes = classes;
    }

    public List<RelacaoEntity> getRelacoes() {
        return relacoes;
    }

    public void setRelacoes(List<RelacaoEntity> relacoes) {
        this.relacoes = relacoes;
    }

    public List<ServicoCloudEntity> getServicosCloud() {
        return servicosCloud;
    }

    public void setServicosCloud(List<ServicoCloudEntity> servicosCloud) {
        this.servicosCloud = servicosCloud;
    }

    public List<ConexaoCloudEntity> getConexoesCloud() {
        return conexoesCloud;
    }

    public void setConexoesCloud(List<ConexaoCloudEntity> conexoesCloud) {
        this.conexoesCloud = conexoesCloud;
    }
}