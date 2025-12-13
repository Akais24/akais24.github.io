variable "aws_region" {
  description = "AWS 리전"
  type        = string
  default     = "ap-northeast-2" # 서울 리전
}

variable "aws_profile" {
  description = "AWS CLI 프로필 이름"
  type        = string
  default     = "default"
}

variable "github_token" {
  description = "GitHub Personal Access Token (환경변수 GITHUB_TOKEN으로도 설정 가능)"
  type        = string
  sensitive   = true
}

variable "deploy_key_public" {
  description = "Deploy Key의 Public Key 내용 (SSH public key)"
  type        = string
}
