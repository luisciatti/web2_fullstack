package modelo;

public record ArtefatoGerado(
        String tipo,
        String nome,
        String conteudo) {
    public String getTipo() {
        return tipo;
    }

    public String getNome() {
        return nome;
    }

    public String getConteudo() {
        return conteudo;
    }
}
