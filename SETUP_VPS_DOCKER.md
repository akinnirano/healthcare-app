# VPS Server Docker Setup Guide

This guide helps you configure your VPS server (78.138.17.185) so that the GitHub Actions deployment can run docker commands without requiring a password.

## Problem

The deployment workflow is failing because docker commands require `sudo`, but in a non-interactive SSH session, there's no way to enter a password.

## Solution: Choose One Option

### Option 1: Add User to Docker Group (Recommended) ⭐

This is the **safest and recommended** approach. It allows the user to run docker commands without sudo.

#### Steps:

1. **SSH into your VPS server:**
   ```bash
   ssh your_username@78.138.17.185
   ```

2. **Add your user to the docker group:**
   ```bash
   sudo usermod -aG docker $USER
   ```

3. **Verify the docker group exists:**
   ```bash
   grep docker /etc/group
   ```
   You should see a line like: `docker:x:999:your_username`

4. **Apply the group changes:**
   
   **Option A: Logout and login again (recommended)**
   ```bash
   exit
   # Then SSH back in
   ssh your_username@78.138.17.185
   ```
   
   **Option B: Use newgrp (applies immediately)**
   ```bash
   newgrp docker
   ```

5. **Test that docker works without sudo:**
   ```bash
   docker ps
   ```
   
   If this works without errors, you're done! ✅

6. **If you still get permission errors:**
   ```bash
   # Check if docker socket has correct permissions
   ls -la /var/run/docker.sock
   # Should show: srw-rw---- 1 root docker
   
   # If permissions are wrong, fix them:
   sudo chmod 666 /var/run/docker.sock
   # Or better, ensure docker group owns it:
   sudo chown root:docker /var/run/docker.sock
   sudo chmod 660 /var/run/docker.sock
   ```

---

### Option 2: Configure Passwordless Sudo for Docker

This allows the user to run docker commands with sudo without entering a password.

#### Steps:

1. **SSH into your VPS server:**
   ```bash
   ssh your_username@78.138.17.185
   ```

2. **Edit the sudoers file:**
   ```bash
   sudo visudo
   ```
   
   ⚠️ **Important:** Always use `visudo`, never edit `/etc/sudoers` directly!

3. **Add this line at the end of the file:**
   ```
   your_username ALL=(ALL) NOPASSWD: /usr/bin/docker, /usr/local/bin/docker-compose, /usr/bin/docker-compose
   ```
   
   Replace `your_username` with your actual username (the one you use for SSH).

4. **Save and exit:**
   - Press `Ctrl+X`
   - Press `Y` to confirm
   - Press `Enter` to save

5. **Test passwordless sudo:**
   ```bash
   sudo -n docker ps
   ```
   
   If this works without asking for a password, you're done! ✅

---

## Verify the Setup

After configuring either option, test it:

```bash
# Test docker without sudo (Option 1)
docker ps

# OR test sudo without password (Option 2)
sudo -n docker ps
```

Both should work without errors.

## Troubleshooting

### "Permission denied" errors

If you still get permission errors:

1. **Check docker group membership:**
   ```bash
   groups
   ```
   You should see `docker` in the list.

2. **Check docker socket permissions:**
   ```bash
   ls -la /var/run/docker.sock
   ```
   Should show: `srw-rw---- 1 root docker`

3. **Restart docker service (if needed):**
   ```bash
   sudo systemctl restart docker
   ```

### "docker: command not found"

If docker is not installed:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## Security Notes

- **Option 1 (docker group)** is more secure because it only grants docker permissions, not full sudo access
- **Option 2 (passwordless sudo)** grants passwordless sudo for docker commands only, which is acceptable for deployment automation
- Never grant full passwordless sudo (`NOPASSWD: ALL`) as it's a security risk

## After Configuration

Once configured, the GitHub Actions deployment will automatically detect the setup and use the appropriate method. The deployment script will:

1. Try to run docker without sudo first
2. If that fails, check for passwordless sudo
3. If both fail, show clear error messages with setup instructions

## Need Help?

If you're still having issues:

1. Check the deployment logs in GitHub Actions
2. SSH into the server and manually test docker commands
3. Verify your SSH user matches the user configured for docker

