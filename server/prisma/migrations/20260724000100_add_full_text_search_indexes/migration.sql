CREATE INDEX IF NOT EXISTS position_full_text_search_idx ON "Position" USING GIN (
  to_tsvector(
    'simple',
    coalesce("title", '') || ' ' ||
    coalesce("description", '') || ' ' ||
    coalesce("company", '') || ' ' ||
    coalesce("location", '') || ' ' ||
    coalesce("department", '')
  )
);

CREATE INDEX IF NOT EXISTS attribute_full_text_search_idx ON "Attribute" USING GIN (
  to_tsvector(
    'simple',
    coalesce("name", '') || ' ' ||
    coalesce("category", '')
  )
);

CREATE INDEX IF NOT EXISTS project_full_text_search_idx ON "Project" USING GIN (
  to_tsvector(
    'simple',
    coalesce("title", '') || ' ' ||
    coalesce("description", '')
  )
);

CREATE INDEX IF NOT EXISTS cv_full_text_search_idx ON "CV" USING GIN (
  to_tsvector(
    'simple',
    coalesce("fullName", '') || ' ' ||
    coalesce("email", '') || ' ' ||
    coalesce("phone", '') || ' ' ||
    coalesce("summary", '') || ' ' ||
    coalesce("skills", '') || ' ' ||
    coalesce("education", '') || ' ' ||
    coalesce("experience", '') || ' ' ||
    coalesce("projects", '')
  )
);

CREATE INDEX IF NOT EXISTS discussion_full_text_search_idx ON "Discussion" USING GIN (
  to_tsvector(
    'simple',
    coalesce("content", '')
  )
);