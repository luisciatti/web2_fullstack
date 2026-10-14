package modelo;

import jakarta.persistence.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
public class RefreshToken {
    @Id
    private String id;

    @NotBlank
    private String token;

    @Valid
    private Usuario usuario;

    @Valid
    private Instant expiraEm;

    @Valid
    private Boolean revogado = false;

    public boolean isExpirado() {
        return Instant.now().isAfter(expiraEm);
    }
}
