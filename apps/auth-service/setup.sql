CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ATENÇÃO: Comentado para evitar perda de dados acidental
-- Se precisar recriar do zero, descomente a linha abaixo:
-- DROP SCHEMA IF EXISTS auth CASCADE;

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    last_login_at TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}'::jsonb,
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE auth.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    permissions JSONB DEFAULT '[]'::jsonb,
    hierarchy_level INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE auth.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES auth.roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

INSERT INTO auth.roles (name, description, type, permissions, hierarchy_level)
VALUES ('Super Admin', 'Super Administrator', 'SUPER_ADMIN', '["*:*"]'::jsonb, 100);

INSERT INTO auth.users (email, password_hash, first_name, last_name, email_verified, email_verified_at)
VALUES ('admin@nexustransit.com', '$2b$10$SE/yl/ssGDgRfOAtlOqZJuX3dfdMBdzWT6V5kr6QYxPGVcPXTKFgm', 'Admin', 'System', true, NOW());

INSERT INTO auth.user_roles (user_id, role_id)
SELECT u.id, r.id 
FROM auth.users u, auth.roles r 
WHERE u.email = 'admin@nexustransit.com' AND r.type = 'SUPER_ADMIN';
