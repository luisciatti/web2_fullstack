package gerador;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import modelo.ServicoCloudDef;

final class OciTerraformGenerator {
    private OciTerraformGenerator() {
    }

    static String gerar(List<ServicoCloudDef> servicos) {
        StringBuilder sb = new StringBuilder();
        String region = terraformRegion(servicos, "region", "us-ashburn-1");

        appendTerraformProvider(sb, "oci", "oracle/oci", region);

        for (ServicoCloudDef servico : servicos) {
            Map<String, String> conf = Optional.ofNullable(servico.getConfiguracao()).orElse(Map.of());
            String id = servico.getId();
            String tipo = servico.getTipo() == null ? "" : servico.getTipo().toUpperCase();

            switch (tipo) {
                case "NETWORK", "VCN" -> appendOciNetwork(sb, id, conf);
                case "COMPUTE", "INSTANCE" -> appendOciCompute(sb, id, conf);
                case "DB", "DATABASE" -> appendOciDatabase(sb, id, conf);
                case "OBJECT_STORAGE", "S3" -> appendOciStorage(sb, id, conf);
                case "LOAD_BALANCER", "ALB" -> appendOciLoadBalancer(sb, id, conf);
                default -> sb.append("# Servico OCI nao suportado: ").append(tipo).append(" (").append(id).append(")\n\n");
            }
        }

        return sb.toString();
    }

    private static String configValor(ServicoCloudDef servico, String chave) {
        Map<String, String> configuracao = servico.getConfiguracao();
        return configuracao != null ? configuracao.get(chave) : null;
    }

    private static String terraformRegion(List<ServicoCloudDef> servicos, String chave, String fallback) {
        return servicos.stream()
                .map(servico -> configValor(servico, chave))
                .filter(valor -> valor != null && !valor.isBlank())
                .findFirst()
                .orElse(fallback);
    }

    private static void appendTerraformProvider(StringBuilder sb, String provider, String source, String region) {
        sb.append("terraform {\n");
        sb.append("  required_providers {\n");
        sb.append("    ").append(provider).append(" = {\n");
        sb.append("      source  = \"").append(source).append("\"\n");
        sb.append("      version = \"~> 5.0\"\n");
        sb.append("    }\n");
        sb.append("  }\n");
        sb.append("}\n\n");

        sb.append("provider \"").append(provider).append("\" {\n");
        sb.append("  region = \"").append(region).append("\"\n");
        sb.append("}\n\n");
    }

    private static void appendOciNetwork(StringBuilder sb, String id, Map<String, String> conf) {
        String compartmentId = conf.getOrDefault("compartmentId", "ocid1.compartment.oc1..example");
        String cidr = conf.getOrDefault("cidrBlock", "10.0.0.0/16");
        String publicSubnet = conf.getOrDefault("publicSubnetCidr", "10.0.1.0/24");
        String privateSubnet = conf.getOrDefault("privateSubnetCidr", "10.0.2.0/24");

        sb.append("resource \"oci_core_vcn\" \"").append(id).append("\" {\n")
                .append("  cidr_block     = \"").append(cidr).append("\"\n")
                .append("  display_name   = \"").append(id).append("-vcn\"\n")
                .append("  compartment_id = \"").append(compartmentId).append("\"\n")
                .append("}\n\n");

        sb.append("resource \"oci_core_internet_gateway\" \"").append(id).append("_igw\" {\n")
                .append("  display_name   = \"").append(id).append("-igw\"\n")
                .append("  compartment_id = \"").append(compartmentId).append("\"\n")
                .append("  vcn_id         = oci_core_vcn.").append(id).append(".id\n")
                .append("}\n\n");

        sb.append("resource \"oci_core_nat_gateway\" \"").append(id).append("_nat\" {\n")
                .append("  display_name   = \"").append(id).append("-nat\"\n")
                .append("  compartment_id = \"").append(compartmentId).append("\"\n")
                .append("  vcn_id         = oci_core_vcn.").append(id).append(".id\n")
                .append("}\n\n");

        sb.append("resource \"oci_core_route_table\" \"").append(id).append("_public_rt\" {\n")
                .append("  display_name   = \"").append(id).append("-public-rt\"\n")
                .append("  compartment_id = \"").append(compartmentId).append("\"\n")
                .append("  vcn_id         = oci_core_vcn.").append(id).append(".id\n")
                .append("}\n\n");

        sb.append("resource \"oci_core_route_table\" \"").append(id).append("_private_rt\" {\n")
                .append("  display_name   = \"").append(id).append("-private-rt\"\n")
                .append("  compartment_id = \"").append(compartmentId).append("\"\n")
                .append("  vcn_id         = oci_core_vcn.").append(id).append(".id\n")
                .append("}\n\n");

        sb.append("resource \"oci_core_security_list\" \"").append(id).append("_security\" {\n")
                .append("  display_name   = \"").append(id).append("-security\"\n")
                .append("  compartment_id = \"").append(compartmentId).append("\"\n")
                .append("  vcn_id         = oci_core_vcn.").append(id).append(".id\n\n")
                .append("  ingress_security_rules {\n")
                .append("    protocol = \"6\"\n")
                .append("    source   = \"0.0.0.0/0\"\n")
                .append("    tcp_options {\n")
                .append("      min = 80\n")
                .append("      max = 80\n")
                .append("    }\n")
                .append("  }\n\n")
                .append("  ingress_security_rules {\n")
                .append("    protocol = \"6\"\n")
                .append("    source   = \"0.0.0.0/0\"\n")
                .append("    tcp_options {\n")
                .append("      min = 443\n")
                .append("      max = 443\n")
                .append("    }\n")
                .append("  }\n")
                .append("}\n\n");

        sb.append("resource \"oci_core_subnet\" \"").append(id).append("_public\" {\n")
                .append("  compartment_id             = \"").append(compartmentId).append("\"\n")
                .append("  vcn_id                     = oci_core_vcn.").append(id).append(".id\n")
                .append("  cidr_block                 = \"").append(publicSubnet).append("\"\n")
                .append("  display_name               = \"").append(id).append("-public\"\n")
                .append("  prohibit_public_ip_on_vnic = false\n")
                .append("  route_table_id             = oci_core_route_table.").append(id).append("_public_rt.id\n")
                .append("  security_list_ids          = [oci_core_security_list.").append(id).append("_security.id]\n")
                .append("}\n\n");

        sb.append("resource \"oci_core_subnet\" \"").append(id).append("_private\" {\n")
                .append("  compartment_id             = \"").append(compartmentId).append("\"\n")
                .append("  vcn_id                     = oci_core_vcn.").append(id).append(".id\n")
                .append("  cidr_block                 = \"").append(privateSubnet).append("\"\n")
                .append("  display_name               = \"").append(id).append("-private\"\n")
                .append("  prohibit_public_ip_on_vnic = true\n")
                .append("  route_table_id             = oci_core_route_table.").append(id).append("_private_rt.id\n")
                .append("  security_list_ids          = [oci_core_security_list.").append(id).append("_security.id]\n")
                .append("}\n\n");
    }

    private static void appendOciCompute(StringBuilder sb, String id, Map<String, String> conf) {
        sb.append("resource \"oci_core_instance\" \"").append(id).append("\" {\n")
                .append("  display_name        = \"").append(id).append("\"\n")
                .append("  compartment_id      = \"").append(conf.getOrDefault("compartmentId", "ocid1.compartment.oc1..example")).append("\"\n")
                .append("  shape               = \"").append(conf.getOrDefault("shape", "VM.Standard.E4.Flex")).append("\"\n")
                .append("  availability_domain = \"").append(conf.getOrDefault("availabilityDomain", "Uocm:US-ASHBURN-AD-1")).append("\"\n\n")
                .append("  create_vnic_details {\n")
                .append("    subnet_id        = \"").append(conf.getOrDefault("subnetId", "ocid1.subnet.oc1..example")).append("\"\n")
                .append("    assign_public_ip = ").append(conf.getOrDefault("assignPublicIp", "true")).append("\n")
                .append("    display_name     = \"").append(id).append("-vnic\"\n")
                .append("  }\n\n")
                .append("  source_details {\n")
                .append("    source_type = \"image\"\n")
                .append("    source_id   = \"").append(conf.getOrDefault("imageId", "ocid1.image.oc1..example")).append("\"\n")
                .append("  }\n")
                .append("}\n\n");
    }

    private static void appendOciDatabase(StringBuilder sb, String id, Map<String, String> conf) {
        sb.append("resource \"oci_database_db_system\" \"").append(id).append("\" {\n")
                .append("  display_name           = \"").append(id).append("\"\n")
                .append("  compartment_id         = \"").append(conf.getOrDefault("compartmentId", "ocid1.compartment.oc1..example")).append("\"\n")
                .append("  shape                  = \"").append(conf.getOrDefault("shape", "VM.Standard.E4.Flex")).append("\"\n")
                .append("  database_edition       = \"").append(conf.getOrDefault("edition", "ENTERPRISE_EDITION")).append("\"\n")
                .append("  subnet_id              = \"").append(conf.getOrDefault("subnetId", "ocid1.subnet.oc1..example")).append("\"\n")
                .append("  cpu_core_count         = ").append(conf.getOrDefault("cpuCoreCount", "1")).append("\n")
                .append("  data_storage_size_in_gb = ").append(conf.getOrDefault("storageSizeInGB", "50")).append("\n")
                .append("}\n\n");
    }

    private static void appendOciStorage(StringBuilder sb, String id, Map<String, String> conf) {
        sb.append("resource \"oci_objectstorage_bucket\" \"").append(id).append("\" {\n")
                .append("  compartment_id = \"").append(conf.getOrDefault("compartmentId", "ocid1.compartment.oc1..example")).append("\"\n")
                .append("  namespace      = \"").append(conf.getOrDefault("namespace", "namespace_example")).append("\"\n")
                .append("  name           = \"").append(conf.getOrDefault("bucketName", id.toLowerCase() + "-bucket")).append("\"\n")
                .append("  access_type    = \"").append(conf.getOrDefault("accessType", "NoPublicAccess")).append("\"\n")
                .append("}\n\n");
    }

    private static void appendOciLoadBalancer(StringBuilder sb, String id, Map<String, String> conf) {
        sb.append("resource \"oci_load_balancer_load_balancer\" \"").append(id).append("\" {\n")
                .append("  compartment_id = \"").append(conf.getOrDefault("compartmentId", "ocid1.compartment.oc1..example")).append("\"\n")
                .append("  display_name   = \"").append(id).append("\"\n")
                .append("  shape          = \"").append(conf.getOrDefault("shape", "flexible")).append("\"\n")
                .append("  subnet_ids     = ").append(conf.getOrDefault("subnetIds", "[\"ocid1.subnet.oc1..example\"]")).append("\n")
                .append("}\n\n");
    }
}
