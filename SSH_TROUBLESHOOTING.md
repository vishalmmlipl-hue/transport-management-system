# SSH Connection Troubleshooting

## Problem: SSH Connection Timed Out

Your domain `mmlipl.info` points to:
- 75.2.60.5 (timed out)
- 99.83.190.102 (try this one)

## Try These Solutions

### 1. Try the Second IP Address
```bash
ssh root@99.83.190.102
ssh ubuntu@99.83.190.102
```

### 2. Try Different SSH Ports
Some servers use non-standard ports:
```bash
ssh -p 2222 root@75.2.60.5
ssh -p 2200 root@75.2.60.5
```

### 3. Check If It's AWS EC2
If this is AWS, you might need:
- **EC2 Instance Connect** (via AWS Console)
- **Session Manager** (via AWS Systems Manager)
- **SSH Key** (`.pem` file)

### 4. Check Firewall/Security Groups
- Port 22 (SSH) might be blocked
- Your IP might not be whitelisted
- Check AWS Security Groups or server firewall

### 5. Alternative Access Methods

#### If it's AWS:
- Use **AWS Console** → EC2 → Connect → EC2 Instance Connect
- Use **AWS Systems Manager Session Manager**
- Use **AWS CloudShell**

#### If it's a hosting provider:
- Check their **web-based file manager**
- Use **FTP/SFTP** (might be enabled when SSH isn't)
- Use their **control panel** (cPanel, Plesk, etc.)

## Alternative Deployment Methods

Since SSH isn't working, here are other ways to deploy:

### Option 1: FTP/SFTP Upload
Many hosting providers offer FTP access even when SSH is disabled.

### Option 2: Web-Based File Manager
Most hosting providers have a file manager in their control panel.

### Option 3: AWS S3 + CloudFront (if AWS)
Deploy static files to S3 and serve via CloudFront.

### Option 4: Git-Based Deployment
If you can push to a Git repository, some hosts auto-deploy from Git.

## Questions to Help Diagnose

1. **Who is your hosting provider?**
   - AWS?
   - DigitalOcean?
   - Other?

2. **Do you have access to a control panel?**
   - cPanel?
   - Plesk?
   - AWS Console?

3. **Do you have FTP credentials?**
   - Usually provided by hosting provider

4. **Is this a managed hosting service?**
   - Some managed services disable SSH but provide other access methods

