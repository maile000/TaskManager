CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_login_date DATE NOT NULL DEFAULT CURRENT_DATE,
  login_streak INTEGER NOT NULL DEFAULT 1,
  streak_started_at DATE NOT NULL DEFAULT CURRENT_DATE,
  total_points INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT chk_login_streak_nonneg CHECK (login_streak >= 0)
);

CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    invite_code VARCHAR(10) UNIQUE NOT NULL,
    total_team_points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    column_order TEXT NOT NULL DEFAULT '["To Do", "Planning", "In Progress", "Done"]'
);

CREATE TABLE team_members (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    team_id INT REFERENCES teams(id) ON DELETE CASCADE,
    role VARCHAR(50) CHECK (role IN ('Team Lead', 'Member')) NOT NULL,
    joined_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) CHECK (status IN ('To Do', 'Planning', 'In Progress', 'Done', 'Archiv')) NOT NULL DEFAULT 'Planning',
    points INTEGER DEFAULT 10,
    position INTEGER NOT NULL DEFAULT 0,
    assigned_to INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    deadline TIMESTAMP,
    priority_flag VARCHAR(20) CHECK (priority_flag IN ('Low', 'Medium', 'High', 'Critical')) NOT NULL DEFAULT 'Medium',
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
);

CREATE TABLE team_points (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    team_id INT REFERENCES teams(id) ON DELETE CASCADE,
    points_in_team INTEGER DEFAULT 0
);

CREATE TABLE gamification_rewards (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    reward_type VARCHAR(50) CHECK (reward_type IN ('Badge', 'Level Up', 'Streak Bonus')) NOT NULL,
    reward_name VARCHAR(100) NOT NULL,
    points INTEGER DEFAULT 0,
    achieved_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE task_comments (
    id SERIAL PRIMARY KEY,
    task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE level_thresholds (
  level INTEGER PRIMARY KEY,
  points_required INTEGER NOT NULL,
  streak_bonus_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  CONSTRAINT chk_level_positive CHECK (level > 0),
  CONSTRAINT chk_points_req_nonneg CHECK (points_required >= 0)
);

CREATE TABLE streak_rewards (
  streak_days INTEGER PRIMARY KEY,
  base_points INTEGER NOT NULL,
  bonus_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  CONSTRAINT chk_streak_days_positive CHECK (streak_days > 0)
);

CREATE TABLE user_streak_history (
  hist_id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  login_streak INTEGER NOT NULL,
  total_points INTEGER NOT NULL,
  level INTEGER NOT NULL,
  note VARCHAR(255)
);

CREATE INDEX idx_users_last_login_date ON users(last_login_date);

CREATE OR REPLACE FUNCTION update_login_streak()
RETURNS TRIGGER AS $$
DECLARE
  yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  rewards_row streak_rewards%ROWTYPE;
  lvl_row level_thresholds%ROWTYPE;
  earned_points INTEGER;
BEGIN
  IF OLD.last_login_date = CURRENT_DATE - INTERVAL '1 day' THEN
    NEW.login_streak := OLD.login_streak + 1;
  ELSE
    NEW.login_streak := 1;
    NEW.streak_started_at := CURRENT_DATE;
  END IF;

  SELECT * INTO rewards_row
    FROM streak_rewards
    WHERE streak_days = NEW.login_streak
    LIMIT 1;
  IF FOUND THEN
    earned_points := rewards_row.base_points * COALESCE(rewards_row.bonus_multiplier, 1.0);
  ELSE
    earned_points := 1;
  END IF;

  NEW.total_points := OLD.total_points + earned_points;

  SELECT * INTO lvl_row
    FROM level_thresholds
    WHERE NEW.total_points >= points_required
    ORDER BY level DESC
    LIMIT 1;
  IF FOUND AND lvl_row.level > OLD.level THEN
    NEW.level := lvl_row.level;
  END IF;

  INSERT INTO user_streak_history(user_id, login_streak, total_points, level, note)
  VALUES (OLD.id, NEW.login_streak, NEW.total_points, NEW.level,
          'Automatisch nach Login am ' || CURRENT_DATE);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_login_streak
BEFORE UPDATE OF last_login_date ON users
FOR EACH ROW
WHEN (NEW.last_login_date > OLD.last_login_date)
EXECUTE FUNCTION update_login_streak();

INSERT INTO level_thresholds (level, points_required) VALUES
(1, 0),
(2, 1000),
(3, 2500),
(4, 4500),
(5, 7000),
(6, 10000),
(7, 13500),
(8, 17500),
(9, 22000),
(10, 27000),
(11, 32500),
(12, 38500),
(13, 45000),
(14, 52000),
(15, 59500),
(16, 67500),
(17, 76000),
(18, 85000),
(19, 94500),
(20, 104500),
(21, 115000),
(22, 126000),
(23, 137500),
(24, 149500),
(25, 162000),
(26, 175000),
(27, 188500),
(28, 202500),
(29, 217000),
(30, 232000),
(31, 247500),
(32, 263500),
(33, 280000),
(34, 297000),
(35, 314500),
(36, 332500),
(37, 351000),
(38, 370000),
(39, 389500),
(40, 409500),
(41, 430000),
(42, 451000),
(43, 472500),
(44, 494500),
(45, 517000),
(46, 540000),
(47, 563500),
(48, 587500),
(49, 612000),
(50, 637000);

INSERT INTO streak_rewards (streak_days, base_points, bonus_multiplier) VALUES
(1, 10, 1.0),
(3, 15, 1.1),
(7, 20, 1.2),
(14, 30, 1.3),
(30, 50, 1.5);