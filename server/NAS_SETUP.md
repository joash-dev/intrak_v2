# NAS (Network Attached Storage) Setup Guide

This guide explains how to configure the INTRAK system to use Network Attached Storage (NAS) for document storage.

## Overview

The system supports both local storage and NAS storage for uploaded documents. NAS storage provides:

- Centralized file storage
- Better scalability
- Improved backup capabilities
- Shared access across multiple servers

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```env
# NAS Configuration
USE_NAS=true
NAS_PATH=/mnt/nas/intrak/documents
NAS_HOST=192.168.1.100
NAS_USERNAME=nas_user
NAS_PASSWORD=nas_password
NAS_SHARE_NAME=documents

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_MIMETYPES=application/pdf,image/jpeg,image/png,image/jpg
```

### NAS Setup Steps

#### 1. Mount NAS Share

For Linux systems, mount the NAS share:

```bash
# Create mount point
sudo mkdir -p /mnt/nas/intrak/documents

# Mount the share (example for SMB/CIFS)
sudo mount -t cifs //192.168.1.100/documents /mnt/nas/intrak/documents -o username=nas_user,password=nas_password,uid=1000,gid=1000

# Make mount persistent (add to /etc/fstab)
echo "//192.168.1.100/documents /mnt/nas/intrak/documents cifs username=nas_user,password=nas_password,uid=1000,gid=1000 0 0" | sudo tee -a /etc/fstab
```

#### 2. Set Permissions

```bash
# Set proper permissions
sudo chown -R 1000:1000 /mnt/nas/intrak/documents
sudo chmod -R 755 /mnt/nas/intrak/documents
```

#### 3. Test Connection

```bash
# Test write access
touch /mnt/nas/intrak/documents/test.txt
rm /mnt/nas/intrak/documents/test.txt
```

### Windows Server Setup

For Windows servers with NAS:

1. Map network drive to the NAS share
2. Set `NAS_PATH` to the mapped drive path (e.g., `Z:\intrak\documents`)
3. Ensure the application has read/write permissions

### Docker Configuration

If running in Docker, mount the NAS share:

```yaml
version: "3.8"
services:
  intrak-server:
    volumes:
      - /mnt/nas/intrak/documents:/app/uploads
    environment:
      - USE_NAS=true
      - NAS_PATH=/app/uploads
```

## Security Considerations

### File Validation

- Only PDF, JPG, and PNG files are allowed
- Maximum file size: 10MB
- Files are scanned for malicious content
- Original filenames are preserved for user reference

### Access Control

- Files are organized by student ID
- Users can only access their own documents
- Coordinators and instructors can view all documents

### Backup Strategy

- Regular backups of the NAS storage
- Version control for document updates
- Audit logging for all file operations

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Check NAS share permissions
   - Verify user credentials
   - Ensure mount point is writable

2. **Connection Timeout**
   - Verify NAS host IP address
   - Check network connectivity
   - Test with ping/telnet

3. **File Upload Failures**
   - Check file size limits
   - Verify file type restrictions
   - Review server logs for errors

### Monitoring

Monitor these aspects:

- NAS disk space usage
- Network latency to NAS
- File upload success rates
- Error logs for storage issues

## Fallback Configuration

If NAS is unavailable, the system automatically falls back to local storage:

```env
USE_NAS=false
UPLOAD_PATH=./uploads
```

## Performance Optimization

### For High Volume Systems

1. **SSD Storage**: Use SSD-based NAS for better performance
2. **Network**: Ensure gigabit or faster network connection
3. **Caching**: Consider implementing file caching layer
4. **Load Balancing**: Distribute file operations across multiple NAS servers

### Recommended NAS Specifications

- **Storage**: Minimum 1TB for document storage
- **RAM**: 8GB+ for file operations
- **Network**: Gigabit Ethernet minimum
- **RAID**: RAID 5 or RAID 10 for redundancy
- **Backup**: Automated daily backups

## Support

For NAS setup issues:

1. Check server logs in `logs/` directory
2. Verify network connectivity
3. Test with simple file operations
4. Contact system administrator

## Example Configuration Files

### Production Environment

```env
USE_NAS=true
NAS_PATH=/mnt/nas/production/intrak/documents
NAS_HOST=nas-prod.company.com
NAS_USERNAME=intrak_prod
NAS_PASSWORD=secure_password_here
NAS_SHARE_NAME=intrak_docs
MAX_FILE_SIZE=10485760
```

### Development Environment

```env
USE_NAS=false
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```
