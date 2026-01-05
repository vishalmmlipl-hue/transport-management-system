#!/bin/bash

# Test SSH connection to mmlipl.info servers

echo "Testing SSH connection to mmlipl.info servers..."
echo ""

IP1="75.2.60.5"
IP2="99.83.190.102"

# Common usernames to try
usernames=("root" "ubuntu" "ec2-user" "admin")

for ip in "$IP1" "$IP2"; do
    echo "Testing IP: $ip"
    for user in "${usernames[@]}"; do
        echo -n "  Trying $user@$ip... "
        timeout 3 ssh -o ConnectTimeout=3 -o StrictHostKeyChecking=no $user@$ip "echo 'Connection successful!'" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "✅ SUCCESS! Use: $user@$ip"
            exit 0
        else
            echo "❌ Failed"
        fi
    done
    echo ""
done

echo "Could not connect automatically. Please try manually:"
echo "  ssh root@75.2.60.5"
echo "  ssh ubuntu@75.2.60.5"
echo "  ssh ec2-user@75.2.60.5"

