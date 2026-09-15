package gerador;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import modelo.ServicoCloudDef;

final class AwsTerraformGenerator {
    private AwsTerraformGenerator() {
    }

    static String gerar(List<ServicoCloudDef> servicos) {
        StringBuilder sb = new StringBuilder();
        String region = terraformRegion(servicos, "region", "us-east-1");

        appendTerraformProvider(sb, "aws", "hashicorp/aws", region);
        appendAwsGlobals(sb);

        for (ServicoCloudDef servico : servicos) {
            Map<String, String> conf = Optional.ofNullable(servico.getConfiguracao()).orElse(Map.of());
            String id = servico.getId();
            String tipo = servico.getTipo() == null ? "" : servico.getTipo().toUpperCase();

            switch (tipo) {
                case "NETWORK", "VPC" -> appendAwsNetwork(sb, id, conf, region);
                case "COMPUTE", "EC2" -> appendAwsCompute(sb, id, conf);
                case "AUTOSCALING", "ASG" -> appendAwsAutoscaling(sb, id, conf);
                case "ALB", "LOAD_BALANCER" -> appendAwsLoadBalancer(sb, id, conf);
                case "RDS", "DB" -> appendAwsDatabase(sb, id, conf);
                case "S3", "OBJECT_STORAGE" -> appendAwsStorage(sb, id, conf);
                case "LAMBDA" -> appendAwsLambda(sb, id, conf);
                case "SQS" -> appendAwsQueue(sb, id, conf);
                case "SNS" -> appendAwsTopic(sb, id, conf);
                case "CLOUDWATCH", "LOGGING" -> appendAwsLogs(sb, id, conf);
                case "DYNAMODB" -> appendAwsDynamo(sb, id, conf);
                default -> sb.append("# Servico AWS nao suportado: ").append(tipo).append(" (").append(id).append(")\n\n");
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

    private static void appendAwsGlobals(StringBuilder sb) {
        sb.append("variable \"db_password\" {\n");
        sb.append("  type      = string\n");
        sb.append("  sensitive = true\n");
        sb.append("  default   = \"troque_esta_senha\"\n");
        sb.append("}\n\n");

        sb.append("variable \"aws_ssh_public_key\" {\n");
        sb.append("  type        = string\n");
        sb.append("  sensitive   = true\n");
        sb.append("  description = \"SSH public key used for EC2 access\"\n");
        sb.append("  default     = \"\"\n");
        sb.append("}\n\n");
    }

    private static void appendAwsNetwork(StringBuilder sb, String id, Map<String, String> conf, String region) {
        String cidr = conf.getOrDefault("cidrBlock", "10.0.0.0/16");
        String publicSubnet = conf.getOrDefault("publicSubnetCidr", "10.0.1.0/24");
        String privateSubnet = conf.getOrDefault("privateSubnetCidr", "10.0.2.0/24");
        String az = conf.getOrDefault("availabilityZone", region + "a");

        sb.append("resource \"aws_vpc\" \"").append(id).append("\" {\n")
                .append("  cidr_block           = \"").append(cidr).append("\"\n")
                .append("  enable_dns_support   = true\n")
                .append("  enable_dns_hostnames = true\n")
                .append("  tags = {\n")
                .append("    Name = \"").append(id).append("-vpc\"\n")
                .append("  }\n")
                .append("}\n\n");

        sb.append("resource \"aws_internet_gateway\" \"").append(id).append("_igw\" {\n")
                .append("  vpc_id = aws_vpc.").append(id).append(".id\n")
                .append("  tags = {\n")
                .append("    Name = \"").append(id).append("-igw\"\n")
                .append("  }\n")
                .append("}\n\n");

        sb.append("resource \"aws_subnet\" \"").append(id).append("_public\" {\n")
                .append("  vpc_id                  = aws_vpc.").append(id).append(".id\n")
                .append("  cidr_block              = \"").append(publicSubnet).append("\"\n")
                .append("  map_public_ip_on_launch = true\n")
                .append("  availability_zone       = \"").append(az).append("\"\n")
                .append("  tags = {\n")
                .append("    Name = \"").append(id).append("-public\"\n")
                .append("  }\n")
                .append("}\n\n");

        sb.append("resource \"aws_subnet\" \"").append(id).append("_private\" {\n")
                .append("  vpc_id            = aws_vpc.").append(id).append(".id\n")
                .append("  cidr_block        = \"").append(privateSubnet).append("\"\n")
                .append("  availability_zone = \"").append(az).append("\"\n")
                .append("  tags = {\n")
                .append("    Name = \"").append(id).append("-private\"\n")
                .append("  }\n")
                .append("}\n\n");

        sb.append("resource \"aws_eip\" \"").append(id).append("_nat\" {\n")
                .append("  domain = \"vpc\"\n")
                .append("  tags = {\n")
                .append("    Name = \"").append(id).append("-nat-eip\"\n")
                .append("  }\n")
                .append("}\n\n");

        sb.append("resource \"aws_nat_gateway\" \"").append(id).append("\" {\n")
                .append("  allocation_id = aws_eip.").append(id).append("_nat.id\n")
                .append("  subnet_id     = aws_subnet.").append(id).append("_public.id\n")
                .append("  depends_on    = [aws_internet_gateway.").append(id).append("_igw]\n")
                .append("  tags = {\n")
                .append("    Name = \"").append(id).append("-nat\"\n")
                .append("  }\n")
                .append("}\n\n");

        sb.append("resource \"aws_route_table\" \"").append(id).append("_public\" {\n")
                .append("  vpc_id = aws_vpc.").append(id).append(".id\n")
                .append("  route {\n")
                .append("    cidr_block = \"0.0.0.0/0\"\n")
                .append("    gateway_id = aws_internet_gateway.").append(id).append("_igw.id\n")
                .append("  }\n")
                .append("}\n\n");

        sb.append("resource \"aws_route_table\" \"").append(id).append("_private\" {\n")
                .append("  vpc_id = aws_vpc.").append(id).append(".id\n")
                .append("  route {\n")
                .append("    cidr_block     = \"0.0.0.0/0\"\n")
                .append("    nat_gateway_id = aws_nat_gateway.").append(id).append(".id\n")
                .append("  }\n")
                .append("}\n\n");

        sb.append("resource \"aws_route_table_association\" \"").append(id).append("_public\" {\n")
                .append("  subnet_id      = aws_subnet.").append(id).append("_public.id\n")
                .append("  route_table_id = aws_route_table.").append(id).append("_public.id\n")
                .append("}\n\n");

        sb.append("resource \"aws_route_table_association\" \"").append(id).append("_private\" {\n")
                .append("  subnet_id      = aws_subnet.").append(id).append("_private.id\n")
                .append("  route_table_id = aws_route_table.").append(id).append("_private.id\n")
                .append("}\n\n");

        sb.append("resource \"aws_security_group\" \"").append(id).append("_sg\" {\n")
                .append("  name        = \"").append(id).append("-sg\"\n")
                .append("  description = \"Security group for ").append(id).append("\"\n")
                .append("  vpc_id      = aws_vpc.").append(id).append(".id\n\n")
                .append("  ingress {\n")
                .append("    from_port   = 22\n")
                .append("    to_port     = 22\n")
                .append("    protocol    = \"tcp\"\n")
                .append("    cidr_blocks = [\"0.0.0.0/0\"]\n")
                .append("  }\n\n")
                .append("  ingress {\n")
                .append("    from_port   = 80\n")
                .append("    to_port     = 80\n")
                .append("    protocol    = \"tcp\"\n")
                .append("    cidr_blocks = [\"0.0.0.0/0\"]\n")
                .append("  }\n\n")
                .append("  ingress {\n")
                .append("    from_port   = 443\n")
                .append("    to_port     = 443\n")
                .append("    protocol    = \"tcp\"\n")
                .append("    cidr_blocks = [\"0.0.0.0/0\"]\n")
                .append("  }\n\n")
                .append("  egress {\n")
                .append("    from_port   = 0\n")
                .append("    to_port     = 0\n")
                .append("    protocol    = \"-1\"\n")
                .append("    cidr_blocks = [\"0.0.0.0/0\"]\n")
                .append("  }\n")
                .append("}\n\n");
    }

    private static void appendAwsCompute(StringBuilder sb, String id, Map<String, String> conf) {
        sb.append("resource \"aws_iam_role\" \"").append(id).append("_role\" {\n")
                .append("  name = \"").append(id).append("-role\"\n")
                .append("  assume_role_policy = jsonencode({\n")
                .append("    Version = \"2012-10-17\"\n")
                .append("    Statement = [{\n")
                .append("      Action = \"sts:AssumeRole\"\n")
                .append("      Effect = \"Allow\"\n")
                .append("      Principal = { Service = \"ec2.amazonaws.com\" }\n")
                .append("    }]\n")
                .append("  })\n")
                .append("}\n\n");

        sb.append("resource \"aws_iam_instance_profile\" \"").append(id).append("_profile\" {\n")
                .append("  name = \"").append(id).append("-profile\"\n")
                .append("  role = aws_iam_role.").append(id).append("_role.name\n")
                .append("}\n\n");

        sb.append("resource \"aws_instance\" \"").append(id).append("\" {\n")
                .append("  ami                    = \"").append(conf.getOrDefault("ami", "ami-123456")).append("\"\n")
                .append("  instance_type          = \"").append(conf.getOrDefault("instanceType", "t3.micro")).append("\"\n")
                .append("  subnet_id              = \"").append(conf.getOrDefault("subnetId", "subnet-123456")).append("\"\n")
                .append("  vpc_security_group_ids = ").append(conf.getOrDefault("securityGroupIds", "[\"sg-123456\"]")).append("\n")
                .append("  iam_instance_profile   = aws_iam_instance_profile.").append(id).append("_profile.name\n")
                .append("  associate_public_ip_address = ").append(conf.getOrDefault("associatePublicIpAddress", "true")).append("\n")
                .append("  user_data = <<-EOF\n")
                .append(conf.getOrDefault("userData", "#!/bin/bash\necho 'bootstrap' > /var/tmp/bootstrap.log")).append("\n")
                .append("EOF\n")
                .append("  tags = {\n")
                .append("    Name = \"").append(id).append("\"\n")
                .append("  }\n")
                .append("}\n\n");
    }

    private static void appendAwsAutoscaling(StringBuilder sb, String id, Map<String, String> conf) {
        sb.append("resource \"aws_launch_template\" \"").append(id).append("_lt\" {\n")
                .append("  name_prefix   = \"").append(id).append("-lt-\"\n")
                .append("  image_id      = \"").append(conf.getOrDefault("ami", "ami-123456")).append("\"\n")
                .append("  instance_type = \"").append(conf.getOrDefault("instanceType", "t3.micro")).append("\"\n")
                .append("  vpc_security_group_ids = ").append(conf.getOrDefault("securityGroupIds", "[\"sg-123456\"]")).append("\n")
                .append("}\n\n");

        sb.append("resource \"aws_autoscaling_group\" \"").append(id).append("\" {\n")
                .append("  name                = \"").append(id).append("\"\n")
                .append("  min_size            = ").append(conf.getOrDefault("minSize", "1")).append("\n")
                .append("  max_size            = ").append(conf.getOrDefault("maxSize", "3")).append("\n")
                .append("  desired_capacity    = ").append(conf.getOrDefault("desiredCapacity", "1")).append("\n")
                .append("  vpc_zone_identifier = ").append(conf.getOrDefault("subnetIds", "[\"subnet-123456\"]")).append("\n\n")
                .append("  launch_template {\n")
                .append("    id      = aws_launch_template.").append(id).append("_lt.id\n")
                .append("    version = \"$Latest\"\n")
                .append("  }\n")
                .append("}\n\n");
    }

    private static void appendAwsLoadBalancer(StringBuilder sb, String id, Map<String, String> conf) {
        sb.append("resource \"aws_lb\" \"").append(id).append("\" {\n")
                .append("  name               = \"").append(id).append("\"\n")
                .append("  internal           = ").append(conf.getOrDefault("internal", "false")).append("\n")
                .append("  load_balancer_type = \"").append(conf.getOrDefault("loadBalancerType", "application")).append("\"\n")
                .append("  security_groups    = ").append(conf.getOrDefault("securityGroupIds", "[\"sg-123456\"]")).append("\n")
                .append("  subnets            = ").append(conf.getOrDefault("subnetIds", "[\"subnet-123456\"]")).append("\n")
                .append("}\n\n");

        sb.append("resource \"aws_lb_target_group\" \"").append(id).append("_tg\" {\n")
                .append("  name     = \"").append(id).append("-tg\"\n")
                .append("  port     = ").append(conf.getOrDefault("targetPort", "80")).append("\n")
                .append("  protocol = \"").append(conf.getOrDefault("protocol", "HTTP")).append("\"\n")
                .append("  vpc_id   = \"").append(conf.getOrDefault("vpcId", "vpc-123456")).append("\"\n")
                .append("}\n\n");

        sb.append("resource \"aws_lb_listener\" \"").append(id).append("_listener\" {\n")
                .append("  load_balancer_arn = aws_lb.").append(id).append(".arn\n")
                .append("  port              = ").append(conf.getOrDefault("listenerPort", "80")).append("\n")
                .append("  protocol          = \"").append(conf.getOrDefault("listenerProtocol", "HTTP")).append("\"\n\n")
                .append("  default_action {\n")
                .append("    type             = \"forward\"\n")
                .append("    target_group_arn = aws_lb_target_group.").append(id).append("_tg.arn\n")
                .append("  }\n")
                .append("}\n\n");
    }

    private static void appendAwsDatabase(StringBuilder sb, String id, Map<String, String> conf) {
        sb.append("resource \"aws_db_subnet_group\" \"").append(id).append("_subnets\" {\n")
                .append("  name       = \"").append(id).append("-subnets\"\n")
                .append("  subnet_ids = ").append(conf.getOrDefault("subnetIds", "[\"subnet-123456\"]")).append("\n")
                .append("}\n\n");

        sb.append("resource \"aws_db_instance\" \"").append(id).append("\" {\n")
                .append("  identifier              = \"").append(id).append("\"\n")
                .append("  engine                  = \"").append(conf.getOrDefault("engine", "postgres")).append("\"\n")
                .append("  engine_version          = \"").append(conf.getOrDefault("engineVersion", "15")).append("\"\n")
                .append("  instance_class          = \"").append(conf.getOrDefault("instanceClass", "db.t3.micro")).append("\"\n")
                .append("  allocated_storage       = ").append(conf.getOrDefault("allocatedStorage", conf.getOrDefault("storage", "20"))).append("\n")
                .append("  db_name                 = \"").append(conf.getOrDefault("dbName", id)).append("\"\n")
                .append("  username                = \"").append(conf.getOrDefault("username", "admin")).append("\"\n")
                .append("  password                = var.db_password\n")
                .append("  db_subnet_group_name    = aws_db_subnet_group.").append(id).append("_subnets.name\n")
                .append("  skip_final_snapshot     = ").append(conf.getOrDefault("skipFinalSnapshot", "true")).append("\n")
                .append("  publicly_accessible     = ").append(conf.getOrDefault("publiclyAccessible", "false")).append("\n")
                .append("  backup_retention_period = ").append(conf.getOrDefault("backupRetentionDays", "7")).append("\n")
                .append("}\n\n");
    }

    private static void appendAwsStorage(StringBuilder sb, String id, Map<String, String> conf) {
        sb.append("resource \"aws_s3_bucket\" \"").append(id).append("\" {\n")
                .append("  bucket = \"").append(conf.getOrDefault("bucket", id.toLowerCase() + "-bucket")).append("\"\n")
                .append("}\n\n");

        sb.append("resource \"aws_s3_bucket_versioning\" \"").append(id).append("_versioning\" {\n")
                .append("  bucket = aws_s3_bucket.").append(id).append(".id\n")
                .append("  versioning_configuration {\n")
                .append("    status = \"").append(conf.getOrDefault("versioning", "Enabled")).append("\"\n")
                .append("  }\n")
                .append("}\n\n");

        sb.append("resource \"aws_s3_bucket_server_side_encryption_configuration\" \"").append(id).append("_encryption\" {\n")
                .append("  bucket = aws_s3_bucket.").append(id).append(".id\n")
                .append("  rule {\n")
                .append("    apply_server_side_encryption_by_default {\n")
                .append("      sse_algorithm = \"").append(conf.getOrDefault("encryptionAlgorithm", "AES256")).append("\"\n")
                .append("    }\n")
                .append("  }\n")
                .append("}\n\n");
    }

    private static void appendAwsLambda(StringBuilder sb, String id, Map<String, String> conf) {
        sb.append("resource \"aws_iam_role\" \"").append(id).append("_lambda_role\" {\n")
                .append("  name = \"").append(id).append("-lambda-role\"\n")
                .append("  assume_role_policy = jsonencode({\n")
                .append("    Version = \"2012-10-17\"\n")
                .append("    Statement = [{\n")
                .append("      Action = \"sts:AssumeRole\"\n")
                .append("      Effect = \"Allow\"\n")
                .append("      Principal = { Service = \"lambda.amazonaws.com\" }\n")
                .append("    }]\n")
                .append("  })\n")
                .append("}\n\n");

        sb.append("resource \"aws_cloudwatch_log_group\" \"").append(id).append("_logs\" {\n")
                .append("  name              = \"/aws/lambda/").append(id).append("\"\n")
                .append("  retention_in_days = ").append(conf.getOrDefault("retentionInDays", "14")).append("\n")
                .append("}\n\n");

        sb.append("resource \"aws_lambda_function\" \"").append(id).append("\" {\n")
                .append("  function_name    = \"").append(id).append("\"\n")
                .append("  handler          = \"").append(conf.getOrDefault("handler", "index.handler")).append("\"\n")
                .append("  runtime          = \"").append(conf.getOrDefault("runtime", "nodejs20.x")).append("\"\n")
                .append("  role             = aws_iam_role.").append(id).append("_lambda_role.arn\n")
                .append("  filename         = \"").append(conf.getOrDefault("filename", "lambda.zip")).append("\"\n")
                .append("  source_code_hash = filebase64sha256(\"").append(conf.getOrDefault("filename", "lambda.zip")).append("\")\n")
                .append("  depends_on       = [aws_cloudwatch_log_group.").append(id).append("_logs]\n")
                .append("}\n\n");
    }

    private static void appendAwsQueue(StringBuilder sb, String id, Map<String, String> conf) {
        sb.append("resource \"aws_sqs_queue\" \"").append(id).append("\" {\n")
                .append("  name                       = \"").append(conf.getOrDefault("queueName", id)).append("\"\n")
                .append("  visibility_timeout_seconds = ").append(conf.getOrDefault("visibilityTimeoutSeconds", "30")).append("\n")
                .append("  message_retention_seconds   = ").append(conf.getOrDefault("messageRetentionSeconds", "345600")).append("\n")
                .append("  receive_wait_time_seconds   = ").append(conf.getOrDefault("receiveWaitTimeSeconds", "0")).append("\n")
                .append("}\n\n");
    }

    private static void appendAwsTopic(StringBuilder sb, String id, Map<String, String> conf) {
        sb.append("resource \"aws_sns_topic\" \"").append(id).append("\" {\n")
                .append("  name = \"").append(conf.getOrDefault("topicName", id)).append("\"\n")
                .append("}\n\n");
    }

    private static void appendAwsLogs(StringBuilder sb, String id, Map<String, String> conf) {
        sb.append("resource \"aws_cloudwatch_log_group\" \"").append(id).append("\" {\n")
                .append("  name              = \"").append(conf.getOrDefault("logGroupName", "/aws/" + id)).append("\"\n")
                .append("  retention_in_days = ").append(conf.getOrDefault("retentionInDays", "14")).append("\n")
                .append("}\n\n");
    }

    private static void appendAwsDynamo(StringBuilder sb, String id, Map<String, String> conf) {
        String hashKey = conf.getOrDefault("hashKey", "id");

        sb.append("resource \"aws_dynamodb_table\" \"").append(id).append("\" {\n")
                .append("  name         = \"").append(conf.getOrDefault("tableName", id)).append("\"\n")
                .append("  billing_mode = \"").append(conf.getOrDefault("billingMode", "PAY_PER_REQUEST")).append("\"\n")
                .append("  hash_key     = \"").append(hashKey).append("\"\n\n")
                .append("  attribute {\n")
                .append("    name = \"").append(hashKey).append("\"\n")
                .append("    type = \"S\"\n")
                .append("  }\n")
                .append("}\n\n");
    }
}
