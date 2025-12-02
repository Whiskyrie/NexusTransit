-- Setup Auth Service Database
-- Creates tables for users, roles, and user_roles

-- Create schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Create UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP,
    last_login_at TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    preferences JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create roles table
CREATE TABLE IF NOT EXISTS auth.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255),
    type VARCHAR(50) NOT NULL,
    permissions JSONB DEFAULT '[]'::jsonb,
    hierarchy_level INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    settings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS auth.user_roles (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES auth.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON auth.users(email);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON auth.users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_roles_name ON auth.roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_type ON auth.roles(type);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON auth.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON auth.user_roles(role_id);

-- Insert default admin role
INSERT INTO auth.roles (name, description, type, permissions, hierarchy_level, is_active)
VALUES (
    'Super Admin',
    'Administrador com acesso total ao sistema',
    'SUPER_ADMIN',
    '["*:*"]'::jsonb,
    0,
    true
) ON CONFLICT (name) DO NOTHING;

-- Print success message
DO $$
BEGIN
    RAISE NOTICE '✅ Database setup completed successfully!';
    RAISE NOTICE '📊 Created tables: users, roles, user_roles';
    RAISE NOTICE '🔐 Created default Super Admin role';
END $$;
