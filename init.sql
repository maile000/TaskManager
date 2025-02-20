CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    invite_code VARCHAR(10) UNIQUE NOT NULL,
    total_team_points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
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
    status VARCHAR(50) CHECK (status IN ('To Do', 'In Progress', 'Done')) NOT NULL DEFAULT 'To Do',
    points INTEGER DEFAULT 10,
    assigned_to INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    deadline TIMESTAMP
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