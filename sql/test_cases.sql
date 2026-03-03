-- 测试用例管理表
CREATE TABLE IF NOT EXISTS test_cases (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  steps JSONB NOT NULL,
  test_type VARCHAR(50),
  environment VARCHAR(50),
  creator BIGINT,
  status VARCHAR(20) DEFAULT 'active',
  tags JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_test_cases_name ON test_cases(name);
CREATE INDEX IF NOT EXISTS idx_test_cases_test_type ON test_cases(test_type);
CREATE INDEX IF NOT EXISTS idx_test_cases_environment ON test_cases(environment);
CREATE INDEX IF NOT EXISTS idx_test_cases_status ON test_cases(status);
CREATE INDEX IF NOT EXISTS idx_test_cases_creator ON test_cases(creator);
CREATE INDEX IF NOT EXISTS idx_test_cases_deleted_at ON test_cases(deleted_at);

-- 添加注释
COMMENT ON TABLE test_cases IS '测试用例管理表';
COMMENT ON COLUMN test_cases.id IS '主键ID';
COMMENT ON COLUMN test_cases.name IS '用例名称';
COMMENT ON COLUMN test_cases.description IS '用例描述';
COMMENT ON COLUMN test_cases.steps IS '测试步骤（JSON格式）';
COMMENT ON COLUMN test_cases.test_type IS '测试类型';
COMMENT ON COLUMN test_cases.environment IS '测试环境';
COMMENT ON COLUMN test_cases.creator IS '创建人ID';
COMMENT ON COLUMN test_cases.status IS '状态';
COMMENT ON COLUMN test_cases.tags IS '标签（JSON格式）';
COMMENT ON COLUMN test_cases.created_at IS '创建时间';
COMMENT ON COLUMN test_cases.updated_at IS '更新时间';
COMMENT ON COLUMN test_cases.deleted_at IS '删除时间（软删除）';
