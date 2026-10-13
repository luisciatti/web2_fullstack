package dao.jpa.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;

@Entity
@Table(name = "role")
@Getter
@Setter
@NoArgsConstructor
public class RoleEntity implements GrantedAuthority {
    @Id
    private String id;

    @Column(nullable = false, unique = true, length = 50)
    private String nome;

    @Override
    public String getAuthority() {
        return nome;
    }
}