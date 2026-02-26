FROM php:8.2-cli

# Force rebuild - v3
# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libpq-dev

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy all files first
COPY . .

# Debug: List files to see what was copied
RUN ls -la && ls -la composer.json || echo "composer.json NOT FOUND"

# Install dependencies
RUN composer install --no-dev --optimize-autoloader

# Set permissions for storage and cache
RUN mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Create storage:link (symlink public/storage -> storage/app/public)
RUN php artisan storage:link || true

# Ensure uploads directory exists and has correct permissions
RUN mkdir -p public/uploads/toko public/uploads/products public/uploads/produk public/uploads/site public/uploads/dokumen public/uploads/events public/uploads/gift-packages public/uploads/event_agreements public/uploads/variants \
    && chmod -R 775 public/uploads

# Expose port (Railway will use $PORT)
EXPOSE 8080

# Copy and make start script executable
RUN chmod +x start.sh

# Start command
CMD ["sh", "start.sh"]

