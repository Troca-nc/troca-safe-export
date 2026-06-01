-- Notification preferences v1: email/push controls and unsubscribe tokens

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_new_message BOOLEAN NOT NULL DEFAULT TRUE,
  push_new_message BOOLEAN NOT NULL DEFAULT TRUE,
  email_search_alert BOOLEAN NOT NULL DEFAULT TRUE,
  push_search_alert BOOLEAN NOT NULL DEFAULT FALSE,
  email_performance_report BOOLEAN NOT NULL DEFAULT TRUE,
  push_performance_report BOOLEAN NOT NULL DEFAULT FALSE,
  performance_report_frequency VARCHAR(20) NOT NULL DEFAULT 'weekly'
    CHECK (performance_report_frequency IN ('daily', 'weekly', 'monthly', 'never')),
  new_message_unsubscribe_token VARCHAR(64) NOT NULL UNIQUE,
  performance_report_unsubscribe_token VARCHAR(64) NOT NULL UNIQUE,
  last_performance_report_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user
  ON notification_preferences (user_id);

