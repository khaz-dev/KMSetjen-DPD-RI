#!/bin/bash
# Fix PostgreSQL to listen on all addresses instead of just localhost

echo "Step 1: Updating postgresql.conf..."
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/16/main/postgresql.conf

echo "Step 2: Updating pg_hba.conf..."
# Add or update the line to allow connections from Docker gateway
sudo sed -i 's/#host    all             all             127.0.0.1\/32/host    all             all             0.0.0.0\/0/' /etc/postgresql/16/main/pg_hba.conf

echo "Step 3: Restarting PostgreSQL..."
sudo systemctl restart postgresql@16-main

echo "Step 4: Verifying changes..."
echo "listen_addresses setting:"
sudo grep "^listen_addresses" /etc/postgresql/16/main/postgresql.conf
echo ""
echo "Listening ports:"
sudo ss -tlnp | grep 5432

echo ""
echo "Done! PostgreSQL should now be accessible from Docker containers."
