import { db } from './db';
import * as schema from '@shared/schema';
import { sql } from 'drizzle-orm';

async function runMigrations() {
  console.log('Running database migrations...');
  
  try {
    // Create tables if they don't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "username" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "points" INTEGER NOT NULL DEFAULT 0,
        "level" INTEGER NOT NULL DEFAULT 1,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "last_login" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS "questions" (
        "id" SERIAL PRIMARY KEY,
        "category" TEXT NOT NULL,
        "text" TEXT NOT NULL,
        "options" JSONB NOT NULL,
        "correct_option_index" INTEGER NOT NULL,
        "difficulty" TEXT NOT NULL,
        "topic" TEXT DEFAULT 'general',
        "dialect" TEXT DEFAULT 'standard',
        "keywords" JSONB DEFAULT '["general"]'::jsonb,
        "section" INTEGER DEFAULT 1,
        "explanation" TEXT
      );
      
      CREATE TABLE IF NOT EXISTS "user_test_results" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "test_type" TEXT NOT NULL,
        "difficulty" TEXT NOT NULL,
        "score" INTEGER NOT NULL,
        "total_questions" INTEGER NOT NULL,
        "completed_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "points_earned" INTEGER NOT NULL DEFAULT 0,
        "time_taken" INTEGER DEFAULT 0,
        "is_official" BOOLEAN DEFAULT FALSE
      );
      
      CREATE TABLE IF NOT EXISTS "exam_templates" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "total_sections" INTEGER NOT NULL DEFAULT 1,
        "total_questions" INTEGER NOT NULL,
        "total_time" INTEGER NOT NULL,
        "is_qiyas" BOOLEAN DEFAULT FALSE,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS "exam_sections" (
        "id" SERIAL PRIMARY KEY,
        "exam_id" INTEGER NOT NULL,
        "name" TEXT NOT NULL,
        "section_number" INTEGER NOT NULL,
        "category" TEXT NOT NULL,
        "question_count" INTEGER NOT NULL,
        "time_limit" INTEGER NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS "user_custom_exams" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "question_count" INTEGER NOT NULL,
        "time_limit" INTEGER NOT NULL,
        "categories" JSONB NOT NULL,
        "difficulty" TEXT NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS "dialects" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL UNIQUE,
        "description" TEXT,
        "examples" JSONB DEFAULT '[]'::jsonb
      );
      
      CREATE TABLE IF NOT EXISTS "synonyms" (
        "id" SERIAL PRIMARY KEY,
        "word" TEXT NOT NULL,
        "synonyms" JSONB NOT NULL,
        "dialect" TEXT DEFAULT 'standard'
      );
    `);
    
    console.log('Database migrations completed successfully');
    return true;
  } catch (error) {
    console.error('Error running migrations:', error);
    return false;
  }
}

export default runMigrations;