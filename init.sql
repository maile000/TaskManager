CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
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
  IF NEW.last_login_date = yesterday THEN
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
(3, 1100),
(4, 1210),
(5, 1331),
(6, 1464),
(7, 1610),
(8, 1771),
(9, 1948),
(10, 2142),
(11, 2356),
(12, 2591),
(13, 2849),
(14, 3133),
(15, 3446),
(16, 3790),
(17, 4169),
(18, 4585),
(19, 5043),
(20, 5547),
(21, 6101),
(22, 6711),
(23, 7382),
(24, 8120),
(25, 8932),
(26, 9825),
(27, 10807),
(28, 11887),
(29, 13075),
(30, 14382),
(31, 15820),
(32, 17300),
(33, 19030),
(34, 20933),
(35, 23026),
(36, 25328),
(37, 27861),
(38, 30647),
(39, 33711),
(40, 37082),
(41, 40790),
(42, 44869),
(43, 49356),
(44, 54291),
(45, 59720),
(46, 65692),
(47, 72261),
(48, 79487),
(49, 87435),
(50, 96178);
