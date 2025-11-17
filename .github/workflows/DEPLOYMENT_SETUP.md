# GitHub Actions Deployment Setup Guide

This guide explains how to set up the GitHub Actions workflow for automated deployment to `healthcare.hremsoftconsulting.com`.

## Workflow Overview

The deployment workflow (`deploy-production.yml`) performs the following steps:

1. **Build and Push to ECR**: Builds Docker images for backend and frontend, then pushes them to AWS ECR
2. **Deploy to Production**: SSH into the production server and:
   - Pulls latest code from GitHub
   - Stops existing containers
   - Builds new containers
   - Runs database migrations
   - Starts services
   - Verifies deployment

## Required GitHub Secrets

You need to configure the following secrets in your GitHub repository:

### AWS Secrets (for ECR)
- `AWS_ACCESS_KEY_ID`: AWS access key with ECR permissions
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key

### SSH Secrets (for server deployment)
- `SSH_HOST`: Production server hostname or IP (e.g., `healthcare.hremsoftconsulting.com` or `123.45.67.89`)
- `SSH_USER`: SSH username (e.g., `ubuntu`, `ec2-user`, `root`)
- `SSH_PRIVATE_KEY`: Private SSH key for server access
- `DEPLOY_PATH`: Path to the project on the server (e.g., `~/healthcare-app` or `/var/www/healthcare-app`)

### Optional Secrets
- `DISCORD_WEBHOOK_URL`: (Optional) Discord webhook URL for deployment notifications

## Setting Up GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret listed above

## Setting Up SSH Access

### Generate SSH Key Pair (if you don't have one)

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
```

This creates:
- `~/.ssh/github_actions_deploy` (private key - add to GitHub secrets)
- `~/.ssh/github_actions_deploy.pub` (public key - add to server)

### Add Public Key to Server

```bash
# Copy public key to server
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub user@healthcare.hremsoftconsulting.com

# Or manually add to ~/.ssh/authorized_keys on the server
cat ~/.ssh/github_actions_deploy.pub | ssh user@healthcare.hremsoftconsulting.com "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### Add Private Key to GitHub Secrets

1. Copy the private key content:
   ```bash
   cat ~/.ssh/github_actions_deploy
   ```

2. Add it to GitHub Secrets as `SSH_PRIVATE_KEY`

## AWS ECR Setup

### Create ECR Repositories

```bash
aws ecr create-repository --repository-name healthcare-backend --region us-east-1
aws ecr create-repository --repository-name healthcare-frontend --region us-east-1
```

### Create IAM User for GitHub Actions

1. Create IAM user with programmatic access
2. Attach policy with ECR permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "ecr:GetAuthorizationToken",
           "ecr:BatchCheckLayerAvailability",
           "ecr:GetDownloadUrlForLayer",
           "ecr:BatchGetImage",
           "ecr:PutImage",
           "ecr:InitiateLayerUpload",
           "ecr:UploadLayerPart",
           "ecr:CompleteLayerUpload",
           "ecr:DescribeRepositories"
         ],
         "Resource": "*"
       }
     ]
   }
   ```
3. Add credentials to GitHub Secrets

## Server Requirements

Your production server should have:

1. **Docker and Docker Compose** installed
2. **Git** installed
3. **PostgreSQL client** (for migrations)
4. **SSH access** configured
5. **Project directory** with proper permissions

### Install Docker on Server

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## Workflow Triggers

The workflow runs automatically when:
- Code is pushed to the `main` branch
- Changes are made to:
  - `backend/**`
  - `frontend/**`
  - `docs-website/**`
  - `docker-compose.yml`
  - `.github/workflows/deploy-production.yml`

You can also trigger it manually via **Actions** → **Deploy to Production** → **Run workflow**

## Testing the Workflow

1. Make a small change to trigger the workflow
2. Go to **Actions** tab in GitHub
3. Watch the workflow run
4. Check the logs for any errors
5. Verify deployment by visiting:
   - https://healthcare.hremsoftconsulting.com
   - https://api.hremsoftconsulting.com/docs

## Troubleshooting

### SSH Connection Failed
- Verify `SSH_HOST`, `SSH_USER`, and `SSH_PRIVATE_KEY` are correct
- Test SSH connection manually: `ssh -i ~/.ssh/github_actions_deploy user@host`
- Check server firewall allows SSH (port 22)

### ECR Push Failed
- Verify AWS credentials are correct
- Check IAM user has ECR permissions
- Verify ECR repositories exist

### Deployment Failed
- Check server has Docker and Docker Compose installed
- Verify `DEPLOY_PATH` is correct
- Check server has enough disk space
- Review deployment logs in GitHub Actions

### Services Not Starting
- Check Docker logs: `sudo docker-compose logs`
- Verify database is accessible
- Check environment variables are set correctly

## Manual Deployment (Fallback)

If the workflow fails, you can deploy manually:

```bash
# SSH into server
ssh user@healthcare.hremsoftconsulting.com

# Navigate to project
cd ~/healthcare-app

# Pull latest code
git pull origin main

# Rebuild and restart
sudo docker-compose down
sudo docker-compose build --no-cache
sudo docker-compose up -d

# Run migrations
sudo docker exec -i healthcare_db psql -U postgres -d healthcare < backend/migrations/001_multi_tenancy.sql
sudo docker exec -i healthcare_db psql -U postgres -d healthcare < backend/migrations/002_add_discord_webhook.sql
```

## Security Best Practices

1. **Use least privilege**: Only grant necessary permissions to IAM users
2. **Rotate secrets regularly**: Update SSH keys and AWS credentials periodically
3. **Monitor deployments**: Review GitHub Actions logs regularly
4. **Use environment protection**: Configure branch protection rules
5. **Review code changes**: Always review code before merging to main

## Support

If you encounter issues:
1. Check GitHub Actions logs
2. Review server logs: `sudo docker-compose logs`
3. Verify all secrets are correctly configured
4. Test SSH and AWS access manually

