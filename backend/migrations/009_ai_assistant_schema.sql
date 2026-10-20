-- Phase 10: AI Assistant, Chat History, Recommendations & AI Usage Logs

-- Drop existing tables if partially created
DROP TABLE IF EXISTS ai_messages CASCADE;
DROP TABLE IF EXISTS ai_conversations CASCADE;
DROP TABLE IF EXISTS ai_usage_logs CASCADE;

-- 1. AI Conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated ON ai_conversations(updated_at DESC);

-- 2. AI Messages table
CREATE TABLE IF NOT EXISTS ai_messages (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id VARCHAR(36) NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('USER', 'AI', 'SYSTEM')),
  message TEXT NOT NULL,
  suggestions JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created ON ai_messages(created_at ASC);

-- 3. AI Usage Logs table (Admin telemetry & rate monitoring)
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  request_type VARCHAR(50) NOT NULL,
  model VARCHAR(100),
  prompt_tokens INT DEFAULT 0,
  completion_tokens INT DEFAULT 0,
  success BOOLEAN DEFAULT true,
  error_message TEXT DEFAULT NULL,
  response_time_ms INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_type ON ai_usage_logs(request_type);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created ON ai_usage_logs(created_at DESC);
