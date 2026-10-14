package modelo;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;

@Getter
@Setter
@NoArgsConstructor
public class Role implements GrantedAuthority {
    @Id
    private String id;

    @NotBlank
    private String nome;

    @Override
    public String getAuthority() {
        return nome;
    }
}