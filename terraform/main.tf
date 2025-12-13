terraform {
  required_version = ">= 1.0"

  backend "s3" {
    bucket = "jy-terraform-state"
    key    = "github.io.tfstate"
    region = "ap-northeast-2"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
}

provider "github" {
  token = var.github_token
}
