#!/bin/bash

# INTRAK NAS Setup Script for Linux with Tailscale
# This script helps configure NAS connection for the INTRAK application on Linux servers

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
DRIVE_LETTER=""
BASE_PATH="intrak"
MOUNT_POINT="/mnt/nas/intrak"
CREDENTIALS_FILE="/etc/samba/nas-credentials"

# Function to print colored output
print_status() {
    echo -e "${CYAN}[$1/$6]${NC} $2"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Parse command line arguments
if [ $# -lt 4 ]; then
    echo "Usage: $0 -i <TailscaleIP> -s <ShareName> -u <Username> -p <Password> [options]"
    echo ""
    echo "Required:"
    echo "  -i, --ip          Tailscale IP address of NAS"
    echo "  -s, --share       SMB share name"
    echo "  -u, --username    NAS username"
    echo "  -p, --password    NAS password"
    echo ""
    echo "Optional:"
    echo "  -m, --mount       Mount point (default: /mnt/nas/intrak)"
    echo "  -b, --base        Base path (default: intrak)"
    echo "  -h, --help        Show this help message"
    exit 1
fi

while [[ $# -gt 0 ]]; do
    case $1 in
        -i|--ip)
            TAILSCALE_IP="$2"
            shift 2
            ;;
        -s|--share)
            SHARE_NAME="$2"
            shift 2
            ;;
        -u|--username)
            USERNAME="$2"
            shift 2
            ;;
        -p|--password)
            PASSWORD="$2"
            shift 2
            ;;
        -m|--mount)
            MOUNT_POINT="$2"
            shift 2
            ;;
        -b|--base)
            BASE_PATH="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 -i <IP> -s <Share> -u <User> -p <Pass>"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Validate required parameters
if [ -z "$TAILSCALE_IP" ] || [ -z "$SHARE_NAME" ] || [ -z "$USERNAME" ] || [ -z "$PASSWORD" ]; then
    print_error "Missing required parameters"
    exit 1
fi

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}INTRAK NAS Setup Script (Linux)${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Step 1: Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_warning "Some operations require root privileges"
    print_warning "You may be prompted for sudo password"
    SUDO="sudo"
else
    SUDO=""
fi

# Step 2: Test Tailscale connectivity
print_status "1" "6" "Testing Tailscale connectivity..."
if ping -c 2 -W 2 "$TAILSCALE_IP" > /dev/null 2>&1; then
    print_success "Can ping $TAILSCALE_IP"
else
    print_error "Cannot ping $TAILSCALE_IP"
    print_warning "Please verify:"
    print_warning "  - Tailscale is running: sudo tailscale status"
    print_warning "  - Both devices are on the same Tailscale network"
    print_warning "  - NAS Tailscale IP is correct"
    exit 1
fi
echo ""

# Step 3: Test SMB port
print_status "2" "6" "Testing SMB connection (port 445)..."
if timeout 3 bash -c "cat < /dev/null > /dev/tcp/$TAILSCALE_IP/445" 2>/dev/null; then
    print_success "SMB port 445 is accessible"
else
    print_error "Cannot connect to SMB port 445"
    print_warning "Please verify SMB/CIFS service is enabled on your NAS"
    exit 1
fi
echo ""

# Step 4: Install required packages
print_status "3" "6" "Checking required packages..."
if ! command -v mount.cifs &> /dev/null; then
    print_warning "cifs-utils not found. Installing..."
    $SUDO apt-get update > /dev/null 2>&1 || $SUDO yum update -y > /dev/null 2>&1
    $SUDO apt-get install -y cifs-utils > /dev/null 2>&1 || $SUDO yum install -y cifs-utils > /dev/null 2>&1
    print_success "cifs-utils installed"
else
    print_success "cifs-utils is installed"
fi
echo ""

# Step 5: Create mount point
print_status "4" "6" "Creating mount point..."
if [ ! -d "$MOUNT_POINT" ]; then
    $SUDO mkdir -p "$MOUNT_POINT"
    print_success "Created mount point: $MOUNT_POINT"
else
    print_warning "Mount point already exists: $MOUNT_POINT"
    
    # Check if already mounted
    if mountpoint -q "$MOUNT_POINT"; then
        print_warning "Mount point is already mounted"
        read -p "Do you want to unmount and remount? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            $SUDO umount "$MOUNT_POINT" 2>/dev/null || true
        else
            print_warning "Skipping mount..."
            SKIP_MOUNT=true
        fi
    fi
fi
echo ""

# Step 6: Create credentials file
print_status "5" "6" "Creating credentials file..."
if [ ! -f "$CREDENTIALS_FILE" ]; then
    $SUDO tee "$CREDENTIALS_FILE" > /dev/null <<EOF
username=$USERNAME
password=$PASSWORD
domain=WORKGROUP
EOF
    $SUDO chmod 600 "$CREDENTIALS_FILE"
    print_success "Created credentials file: $CREDENTIALS_FILE"
else
    print_warning "Credentials file already exists"
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        $SUDO tee "$CREDENTIALS_FILE" > /dev/null <<EOF
username=$USERNAME
password=$PASSWORD
domain=WORKGROUP
EOF
        $SUDO chmod 600 "$CREDENTIALS_FILE"
        print_success "Updated credentials file"
    fi
fi
echo ""

# Step 7: Mount NAS share
if [ "$SKIP_MOUNT" != "true" ]; then
    print_status "6" "6" "Mounting NAS share..."
    NETWORK_PATH="//$TAILSCALE_IP/$SHARE_NAME"
    
    # Get current user ID and group ID
    USER_ID=$(id -u)
    GROUP_ID=$(id -g)
    
    if $SUDO mount -t cifs "$NETWORK_PATH" "$MOUNT_POINT" \
        -o credentials="$CREDENTIALS_FILE",uid=$USER_ID,gid=$GROUP_ID,iocharset=utf8,file_mode=0777,dir_mode=0777; then
        print_success "NAS share mounted successfully"
    else
        print_error "Failed to mount NAS share"
        print_warning "Please check:"
        print_warning "  - Share name is correct: $SHARE_NAME"
        print_warning "  - Credentials are correct"
        print_warning "  - SMB service is running on NAS"
        exit 1
    fi
    echo ""
fi

# Step 8: Create directory structure
print_status "7" "8" "Creating directory structure..."
DIRECTORIES=(
    "$MOUNT_POINT/$BASE_PATH"
    "$MOUNT_POINT/$BASE_PATH/documents"
    "$MOUNT_POINT/$BASE_PATH/documents/temp"
    "$MOUNT_POINT/$BASE_PATH/profile-photos"
    "$MOUNT_POINT/$BASE_PATH/templates"
)

for dir in "${DIRECTORIES[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        print_success "Created: $dir"
    else
        echo "  ℹ️  Already exists: $dir"
    fi
done
echo ""

# Step 9: Test write access
print_status "8" "8" "Testing write access..."
TEST_FILE="$MOUNT_POINT/$BASE_PATH/documents/.test_write"
if echo "NAS connection test" > "$TEST_FILE" 2>/dev/null; then
    if [ -f "$TEST_FILE" ]; then
        rm -f "$TEST_FILE"
        print_success "Write access verified"
    else
        print_error "Write test failed"
        exit 1
    fi
else
    print_error "Write access test failed"
    print_warning "Please check folder permissions"
    exit 1
fi
echo ""

# Step 10: Add to /etc/fstab for persistence
print_status "9" "10" "Configuring persistent mount..."
FSTAB_ENTRY="//$TAILSCALE_IP/$SHARE_NAME $MOUNT_POINT cifs credentials=$CREDENTIALS_FILE,uid=$USER_ID,gid=$GROUP_ID,iocharset=utf8,file_mode=0777,dir_mode=0777 0 0"

if grep -q "$MOUNT_POINT" /etc/fstab 2>/dev/null; then
    print_warning "Mount point already exists in /etc/fstab"
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        $SUDO sed -i "\|$MOUNT_POINT|d" /etc/fstab
        echo "$FSTAB_ENTRY" | $SUDO tee -a /etc/fstab > /dev/null
        print_success "Updated /etc/fstab"
    fi
else
    echo "$FSTAB_ENTRY" | $SUDO tee -a /etc/fstab > /dev/null
    print_success "Added to /etc/fstab for persistent mounting"
fi
echo ""

# Step 11: Generate .env configuration
print_status "10" "10" "Generating .env configuration..."
ENV_PATH="$(dirname "$0")/../.env"
ENV_CONTENT="# ============================================
# NAS Configuration (Tailscale VPN)
# Generated by setup-nas-linux.sh on $(date '+%Y-%m-%d %H:%M:%S')
# ============================================
USE_NAS=true
NAS_PATH=$MOUNT_POINT/$BASE_PATH
NAS_HOST=$TAILSCALE_IP
NAS_USERNAME=$USERNAME
NAS_PASSWORD=$PASSWORD
NAS_SHARE_NAME=$SHARE_NAME
"

if [ -f "$ENV_PATH" ]; then
    print_warning ".env file already exists"
    read -p "Do you want to update NAS configuration? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Remove old NAS config if exists
        sed -i '/# NAS Configuration/,/NAS_SHARE_NAME=/d' "$ENV_PATH"
        # Append new config
        echo "$ENV_CONTENT" >> "$ENV_PATH"
        print_success "Updated .env file with NAS configuration"
    else
        echo ""
        echo -e "${CYAN}Add these lines to your .env file:${NC}"
        echo "$ENV_CONTENT"
    fi
else
    echo "$ENV_CONTENT" > "$ENV_PATH"
    print_success "Created .env file with NAS configuration"
fi
echo ""

# Summary
echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${YELLOW}Summary:${NC}"
echo "  • Mount point: $MOUNT_POINT"
echo "  • Network path: //$TAILSCALE_IP/$SHARE_NAME"
echo "  • Base path: $MOUNT_POINT/$BASE_PATH"
echo "  • Configuration: $ENV_PATH"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review the .env file configuration"
echo "  2. Test mount persistence: sudo mount -a"
echo "  3. Restart your Node.js server"
echo "  4. Test file upload through the application"
echo ""
echo -e "${CYAN}To verify NAS connection, check server logs for:${NC}"
echo -e "${GREEN}  ✅ 'NAS connection validated successfully'${NC}"
echo ""

