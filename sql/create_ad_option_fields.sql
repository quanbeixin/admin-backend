-- 创建选型字段表
CREATE TABLE IF NOT EXISTS ad_option_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name VARCHAR(100) NOT NULL,
  option_value VARCHAR(100) NOT NULL,
  option_label VARCHAR(200) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- 添加唯一约束，确保同一字段名下的选项值不重复
  UNIQUE(field_name, option_value)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_ad_option_fields_field_name ON ad_option_fields(field_name);
CREATE INDEX IF NOT EXISTS idx_ad_option_fields_is_active ON ad_option_fields(is_active);
CREATE INDEX IF NOT EXISTS idx_ad_option_fields_sort_order ON ad_option_fields(sort_order);

-- 插入示例数据
INSERT INTO ad_option_fields (field_name, option_value, option_label, sort_order, is_active) VALUES
-- status 字段选项
('status', 'active', '激活', 1, true),
('status', 'inactive', '未激活', 2, true),
('status', 'archived', '已归档', 3, true),

-- stage 字段选项
('stage', 'draft', '草稿', 1, true),
('stage', 'review', '审核中', 2, true),
('stage', 'approved', '已批准', 3, true),
('stage', 'rejected', '已拒绝', 4, true),
('stage', 'published', '已发布', 5, true),

-- creative_type 字段选项
('creative_type', 'image', '图片', 1, true),
('creative_type', 'video', '视频', 2, true),
('creative_type', 'carousel', '轮播', 3, true),

-- review_status 字段选项
('review_status', 'pending', '待审核', 1, true),
('review_status', 'approved', '已通过', 2, true),
('review_status', 'rejected', '已拒绝', 3, true),

-- platform 字段选项
('platform', 'facebook', 'Facebook', 1, true),
('platform', 'tiktok', 'TikTok', 2, true),
('platform', 'google', 'Google Ads', 3, true),
('platform', 'instagram', 'Instagram', 4, true),
('platform', 'twitter', 'Twitter', 5, true)
ON CONFLICT (field_name, option_value) DO NOTHING;

-- 添加注释
COMMENT ON TABLE ad_option_fields IS '广告选型字段配置表';
COMMENT ON COLUMN ad_option_fields.id IS '主键';
COMMENT ON COLUMN ad_option_fields.field_name IS '字段名，例如 status、stage、creative_type';
COMMENT ON COLUMN ad_option_fields.option_value IS '选项值，例如 draft、image';
COMMENT ON COLUMN ad_option_fields.option_label IS '中文显示标签，例如 草稿、图片';
COMMENT ON COLUMN ad_option_fields.sort_order IS '排序顺序，数值越小越靠前';
COMMENT ON COLUMN ad_option_fields.is_active IS '是否启用，用于临时禁用某些选项';
COMMENT ON COLUMN ad_option_fields.created_at IS '创建时间';
COMMENT ON COLUMN ad_option_fields.updated_at IS '更新时间';
