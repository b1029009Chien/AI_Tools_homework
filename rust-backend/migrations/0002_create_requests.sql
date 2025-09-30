-- Requests table for the frontend form
CREATE TABLE IF NOT EXISTS requests (
    id UUID PRIMARY KEY,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT '待處理',
    contact_person TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    address TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

