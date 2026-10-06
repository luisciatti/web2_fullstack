package dao.jpa;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dao.jpa.entity.AtributoEntity;
import dao.jpa.entity.ClasseEntity;
import dao.jpa.entity.ConexaoCloudEntity;
import dao.jpa.entity.MetodoEntity;
import dao.jpa.entity.ProjetoEntity;
import dao.jpa.entity.RelacaoEntity;
import dao.jpa.entity.ServicoCloudEntity;
import modelo.AtributoDef;
import modelo.ClasseDef;
import modelo.ConexaoCloudDef;
import modelo.MetodoDef;
import modelo.Projeto;
import modelo.RelacaoDef;
import modelo.ServicoCloudDef;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Component
public class ProjetoMapper {

    private final ObjectMapper objectMapper;

    public ProjetoMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public ProjetoEntity toEntity(Projeto projeto) {
        ProjetoEntity entity = new ProjetoEntity();
        entity.setId(projeto.getId());
        entity.setNome(projeto.getNome());
        entity.setLinguagem(projeto.getLinguagem());
        entity.setFramework(projeto.getFramework());
        entity.setProvedorCloud(projeto.getProvedorCloud());

        List<ClasseEntity> classes = new ArrayList<>();
        for (int i = 0; i < projeto.getClasses().size(); i++) {
            ClasseDef classeDef = projeto.getClasses().get(i);
            ClasseEntity classeEntity = new ClasseEntity();
            classeEntity.setProjeto(entity);
            classeEntity.setNome(classeDef.nome());
            classeEntity.setOrdem(i);

            List<AtributoEntity> atributos = new ArrayList<>();
            for (int j = 0; j < classeDef.atributosSeguro().size(); j++) {
                AtributoDef atributoDef = classeDef.atributosSeguro().get(j);
                AtributoEntity atributoEntity = new AtributoEntity();
                atributoEntity.setClasse(classeEntity);
                atributoEntity.setNome(atributoDef.nome());
                atributoEntity.setTipo(atributoDef.tipo());
                atributoEntity.setOrdem(j);
                atributos.add(atributoEntity);
            }
            classeEntity.setAtributos(atributos);

            List<MetodoEntity> metodos = new ArrayList<>();
            for (int j = 0; j < classeDef.metodosSeguro().size(); j++) {
                MetodoDef metodoDef = classeDef.metodosSeguro().get(j);
                MetodoEntity metodoEntity = new MetodoEntity();
                metodoEntity.setClasse(classeEntity);
                metodoEntity.setNome(metodoDef.nome());
                metodoEntity.setTipoRetorno(metodoDef.tipoRetorno());
                metodoEntity.setOrdem(j);
                metodos.add(metodoEntity);
            }
            classeEntity.setMetodos(metodos);
            classes.add(classeEntity);
        }
        entity.setClasses(classes);

        List<RelacaoEntity> relacoes = new ArrayList<>();
        for (RelacaoDef relacaoDef : projeto.getRelacoes()) {
            RelacaoEntity relacaoEntity = new RelacaoEntity();
            relacaoEntity.setProjeto(entity);
            relacaoEntity.setOrigem(relacaoDef.origem());
            relacaoEntity.setDestino(relacaoDef.destino());
            relacaoEntity.setTipo(relacaoDef.tipo());
            relacoes.add(relacaoEntity);
        }
        entity.setRelacoes(relacoes);

        List<ServicoCloudEntity> servicosCloud = new ArrayList<>();
        for (ServicoCloudDef servicoCloudDef : projeto.getServicosCloud()) {
            ServicoCloudEntity servicoCloudEntity = new ServicoCloudEntity();
            servicoCloudEntity.setProjeto(entity);
            servicoCloudEntity.setIdentificador(servicoCloudDef.id());
            servicoCloudEntity.setTipo(servicoCloudDef.tipo());
            servicoCloudEntity.setCategoria(servicoCloudDef.categoria());
            servicoCloudEntity.setConfiguracaoJson(writeJson(servicoCloudDef.configuracao()));
            servicosCloud.add(servicoCloudEntity);
        }
        entity.setServicosCloud(servicosCloud);

        List<ConexaoCloudEntity> conexoesCloud = new ArrayList<>();
        for (ConexaoCloudDef conexaoCloudDef : projeto.getConexoesCloud()) {
            ConexaoCloudEntity conexaoCloudEntity = new ConexaoCloudEntity();
            conexaoCloudEntity.setProjeto(entity);
            conexaoCloudEntity.setDe(conexaoCloudDef.de());
            conexaoCloudEntity.setPara(conexaoCloudDef.para());
            conexaoCloudEntity.setRotulo(conexaoCloudDef.rotulo());
            conexoesCloud.add(conexaoCloudEntity);
        }
        entity.setConexoesCloud(conexoesCloud);

        return entity;
    }

    public Projeto toModel(ProjetoEntity entity) {
        Projeto projeto = new Projeto();
        projeto.setId(entity.getId());
        projeto.setNome(entity.getNome());
        projeto.setLinguagem(entity.getLinguagem());
        projeto.setFramework(entity.getFramework());
        projeto.setProvedorCloud(entity.getProvedorCloud());

        List<ClasseDef> classes = new ArrayList<>();
        for (ClasseEntity classeEntity : entity.getClasses()) {
            List<AtributoDef> atributos = new ArrayList<>();
            for (AtributoEntity atributoEntity : classeEntity.getAtributos()) {
                atributos.add(new AtributoDef(atributoEntity.getNome(), atributoEntity.getTipo()));
            }

            List<MetodoDef> metodos = new ArrayList<>();
            for (MetodoEntity metodoEntity : classeEntity.getMetodos()) {
                metodos.add(new MetodoDef(metodoEntity.getNome(), metodoEntity.getTipoRetorno()));
            }

            classes.add(new ClasseDef(classeEntity.getNome(), atributos, metodos));
        }
        projeto.setClasses(classes);

        List<RelacaoDef> relacoes = new ArrayList<>();
        for (RelacaoEntity relacaoEntity : entity.getRelacoes()) {
            relacoes.add(
                    new RelacaoDef(relacaoEntity.getOrigem(), relacaoEntity.getDestino(), relacaoEntity.getTipo()));
        }
        projeto.setRelacoes(relacoes);

        List<ServicoCloudDef> servicosCloud = new ArrayList<>();
        for (ServicoCloudEntity servicoCloudEntity : entity.getServicosCloud()) {
            servicosCloud.add(new ServicoCloudDef(
                    servicoCloudEntity.getIdentificador(),
                    servicoCloudEntity.getTipo(),
                    servicoCloudEntity.getCategoria(),
                    readJson(servicoCloudEntity.getConfiguracaoJson())));
        }
        projeto.setServicosCloud(servicosCloud);

        List<ConexaoCloudDef> conexoesCloud = new ArrayList<>();
        for (ConexaoCloudEntity conexaoCloudEntity : entity.getConexoesCloud()) {
            conexoesCloud.add(new ConexaoCloudDef(
                    conexaoCloudEntity.getDe(),
                    conexaoCloudEntity.getPara(),
                    conexaoCloudEntity.getRotulo()));
        }
        projeto.setConexoesCloud(conexoesCloud);

        return projeto;
    }

    private String writeJson(Map<String, String> configuracao) {
        if (configuracao == null || configuracao.isEmpty()) {
            return null;
        }

        try {
            return objectMapper.writeValueAsString(configuracao);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Não foi possível serializar a configuração do serviço cloud", ex);
        }
    }

    private Map<String, String> readJson(String configuracaoJson) {
        if (configuracaoJson == null || configuracaoJson.isBlank()) {
            return Collections.emptyMap();
        }

        try {
            return objectMapper.readValue(configuracaoJson, new TypeReference<>() {
            });
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Não foi possível desserializar a configuração do serviço cloud", ex);
        }
    }
}