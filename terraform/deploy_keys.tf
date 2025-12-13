locals {
  deploy_key_repositories = toset([
    "witchform-searcher-web",
  ])
}

resource "github_repository_deploy_key" "repositories" {
  for_each = local.deploy_key_repositories

  title      = "GitHub Pages Submodule Access"
  repository = each.value
  key        = var.deploy_key_public
  read_only  = true
}

# GitHub Actions Secret (수동 관리)
# - Name: SUBMODULE_DEPLOY_KEY
# - Repository: akais24.github.io
# - Value: SSH private key (cat ~/.ssh/github_pages_deploy_key)
# - Terraform으로 관리하지 않음 (state에 저장 방지)
