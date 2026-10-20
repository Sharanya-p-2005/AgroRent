-- AgroRent Phase 7: Government Schemes & Farmer Resources Schema
-- Provides scheme catalogs, bookmarking/saving, and farmer resource guides

CREATE TABLE IF NOT EXISTS government_schemes (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    short_description TEXT NOT NULL,
    full_description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    government_level VARCHAR(50) NOT NULL CHECK (government_level IN ('CENTRAL', 'STATE')),
    state VARCHAR(100) NOT NULL DEFAULT 'KARNATAKA',
    department VARCHAR(255),
    benefits TEXT,
    eligibility TEXT,
    required_documents TEXT,
    application_process TEXT,
    official_url VARCHAR(500),
    helpline VARCHAR(100),
    image_url VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_schemes_status ON government_schemes(status);
CREATE INDEX IF NOT EXISTS idx_schemes_category ON government_schemes(category);
CREATE INDEX IF NOT EXISTS idx_schemes_gov_level ON government_schemes(government_level);
CREATE INDEX IF NOT EXISTS idx_schemes_state ON government_schemes(state);
CREATE INDEX IF NOT EXISTS idx_schemes_featured ON government_schemes(featured);
CREATE INDEX IF NOT EXISTS idx_schemes_created_at ON government_schemes(created_at);

-- Saved / Bookmarked Schemes Table
CREATE TABLE IF NOT EXISTS saved_schemes (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheme_id VARCHAR(36) NOT NULL REFERENCES government_schemes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_saved_schemes_user_scheme UNIQUE (user_id, scheme_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_schemes_user ON saved_schemes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_schemes_scheme ON saved_schemes(scheme_id);

-- Farmer Educational Resources & Agricultural Guidance
CREATE TABLE IF NOT EXISTS farmer_resources (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('ARTICLE', 'GUIDE', 'VIDEO', 'DOCUMENT', 'WEBSITE', 'HELPLINE')),
    image_url VARCHAR(500),
    official_url VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resources_status ON farmer_resources(status);
CREATE INDEX IF NOT EXISTS idx_resources_category ON farmer_resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_type ON farmer_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON farmer_resources(created_at);
