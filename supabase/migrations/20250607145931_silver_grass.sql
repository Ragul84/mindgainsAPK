/*
  # Pre-generated Study Notes System

  1. New Tables
    - `pre_generated_notes`
      - `id` (uuid, primary key)
      - `topic` (text, unique)
      - `category` (text)
      - `difficulty` (text)
      - `content` (jsonb) - stores the full breakdown
      - `status` (text) - draft, published, archived
      - `priority` (integer) - for ordering suggestions
      - `view_count` (integer) - track popularity
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `note_suggestions`
      - `id` (uuid, primary key)
      - `note_id` (uuid, references pre_generated_notes)
      - `category` (text)
      - `display_order` (integer)
      - `is_featured` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Allow public read access for published notes
    - Restrict write access to admin users

  3. Indexes
    - Add indexes for performance optimization
*/

-- Create pre_generated_notes table
CREATE TABLE IF NOT EXISTS pre_generated_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text UNIQUE NOT NULL,
  category text NOT NULL,
  difficulty text DEFAULT 'intermediate',
  content jsonb NOT NULL,
  status text DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  priority integer DEFAULT 0,
  view_count integer DEFAULT 0,
  tags text[] DEFAULT '{}',
  estimated_read_time integer DEFAULT 15, -- in minutes
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create note_suggestions table for managing what appears in suggestions
CREATE TABLE IF NOT EXISTS note_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES pre_generated_notes(id) ON DELETE CASCADE,
  category text NOT NULL,
  display_order integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pre_generated_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_suggestions ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can read published notes"
  ON pre_generated_notes
  FOR SELECT
  TO public
  USING (status = 'published');

CREATE POLICY "Anyone can read note suggestions"
  ON note_suggestions
  FOR SELECT
  TO public
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pre_generated_notes_category ON pre_generated_notes(category);
CREATE INDEX IF NOT EXISTS idx_pre_generated_notes_status ON pre_generated_notes(status);
CREATE INDEX IF NOT EXISTS idx_pre_generated_notes_priority ON pre_generated_notes(priority DESC);
CREATE INDEX IF NOT EXISTS idx_pre_generated_notes_view_count ON pre_generated_notes(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_note_suggestions_category ON note_suggestions(category);
CREATE INDEX IF NOT EXISTS idx_note_suggestions_order ON note_suggestions(display_order);
CREATE INDEX IF NOT EXISTS idx_note_suggestions_featured ON note_suggestions(is_featured);

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_note_view_count(note_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE pre_generated_notes 
  SET view_count = view_count + 1,
      updated_at = now()
  WHERE id = note_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample pre-generated notes
INSERT INTO pre_generated_notes (topic, category, difficulty, content, priority, tags) VALUES
(
  'Mauryan Empire',
  'History',
  'intermediate',
  '{
    "overview": "The Mauryan Empire (322-185 BCE) was the first pan-Indian empire, founded by Chandragupta Maurya with the guidance of Chanakya. It reached its zenith under Ashoka the Great, covering most of the Indian subcontinent. The empire is renowned for its administrative efficiency, economic prosperity, and Ashoka''s promotion of Buddhism.",
    "timeline": [
      {"year": "322 BCE", "event": "Chandragupta Maurya establishes the Mauryan Empire"},
      {"year": "321 BCE", "event": "Defeat of Dhana Nanda, last ruler of Nanda dynasty"},
      {"year": "305 BCE", "event": "Treaty with Seleucus I Nicator"},
      {"year": "297 BCE", "event": "Bindusara becomes emperor"},
      {"year": "268 BCE", "event": "Ashoka ascends to the throne"},
      {"year": "261 BCE", "event": "Kalinga War - turning point for Ashoka"},
      {"year": "250 BCE", "event": "Third Buddhist Council held"},
      {"year": "232 BCE", "event": "Death of Ashoka"},
      {"year": "185 BCE", "event": "End of Mauryan Empire under Brihadratha"}
    ],
    "keyPeople": [
      {"name": "Chandragupta Maurya", "role": "Founder", "description": "Established the empire with Chanakya''s guidance, unified most of India"},
      {"name": "Chanakya (Kautilya)", "role": "Prime Minister & Strategist", "description": "Author of Arthashastra, mastermind behind Mauryan administration"},
      {"name": "Bindusara", "role": "Second Emperor", "description": "Expanded the empire southward, known as Amitraghata"},
      {"name": "Ashoka the Great", "role": "Third Emperor", "description": "Greatest Mauryan ruler, promoted Buddhism and non-violence"},
      {"name": "Megasthenes", "role": "Greek Ambassador", "description": "Seleucid ambassador who wrote Indica about Mauryan India"}
    ],
    "dynasties": [
      {"name": "Mauryan Dynasty", "founder": "Chandragupta Maurya", "period": "322-185 BCE", "capital": "Pataliputra (modern Patna)"}
    ],
    "importantFacts": [
      "First empire to unify most of the Indian subcontinent",
      "Arthashastra by Chanakya is one of the earliest treatises on statecraft",
      "Ashoka''s edicts are the earliest deciphered Indian inscriptions",
      "The empire had a sophisticated administrative system with provinces and districts",
      "Buddhism spread extensively during Ashoka''s reign",
      "The Mauryan army was one of the largest in the ancient world",
      "Trade and commerce flourished with standardized weights and measures",
      "The empire maintained diplomatic relations with Hellenistic kingdoms"
    ],
    "causes": [
      {"cause": "Political fragmentation after Alexander''s invasion", "effect": "Opportunity for Chandragupta to establish a unified empire"},
      {"cause": "Chanakya''s strategic planning and Arthashastra principles", "effect": "Efficient administrative system and military organization"},
      {"cause": "Kalinga War and its massive casualties", "effect": "Ashoka''s conversion to Buddhism and policy of Dhamma"},
      {"cause": "Ashoka''s promotion of Buddhism", "effect": "Spread of Buddhism across Asia through missionaries"}
    ],
    "significance": [
      "Established the template for future Indian empires",
      "Demonstrated the possibility of unifying the diverse Indian subcontinent",
      "Ashoka''s Dhamma influenced concepts of righteous governance",
      "Promoted cultural and religious tolerance",
      "Advanced administrative practices influenced later dynasties",
      "Facilitated trade and cultural exchange across the empire",
      "Ashoka''s edicts provide valuable historical insights",
      "Buddhism''s spread to other countries began during this period"
    ]
  }'::jsonb,
  10,
  ARRAY['Ancient India', 'Chandragupta', 'Ashoka', 'Buddhism', 'Arthashastra']
),
(
  'Delhi Sultanate',
  'History', 
  'intermediate',
  '{
    "overview": "The Delhi Sultanate (1206-1526 CE) was a series of five successive Muslim dynasties that ruled over large parts of the Indian subcontinent. Established by Qutb-ud-din Aibak, it marked the beginning of Muslim rule in India and significantly influenced Indian culture, architecture, and administration.",
    "timeline": [
      {"year": "1192 CE", "event": "Second Battle of Tarain - Muhammad Ghori defeats Prithviraj Chauhan"},
      {"year": "1206 CE", "event": "Qutb-ud-din Aibak establishes the Slave Dynasty"},
      {"year": "1290 CE", "event": "Khalji Dynasty begins under Jalal-ud-din Khalji"},
      {"year": "1320 CE", "event": "Tughlaq Dynasty established by Ghiyas-ud-din Tughlaq"},
      {"year": "1398 CE", "event": "Timur''s invasion of Delhi"},
      {"year": "1414 CE", "event": "Sayyid Dynasty begins"},
      {"year": "1451 CE", "event": "Lodi Dynasty established by Bahlul Lodi"},
      {"year": "1526 CE", "event": "First Battle of Panipat - Babur defeats Ibrahim Lodi"}
    ],
    "keyPeople": [
      {"name": "Qutb-ud-din Aibak", "role": "Founder of Delhi Sultanate", "description": "Established the Slave Dynasty, built Qutb Minar"},
      {"name": "Iltutmish", "role": "Slave Dynasty Sultan", "description": "Consolidated the Sultanate, introduced silver tanka"},
      {"name": "Razia Sultan", "role": "First Female Muslim Ruler", "description": "Only female ruler of Delhi Sultanate (1236-1240)"},
      {"name": "Alauddin Khalji", "role": "Khalji Dynasty Sultan", "description": "Implemented market control policies, repelled Mongol invasions"},
      {"name": "Muhammad bin Tughlaq", "role": "Tughlaq Dynasty Sultan", "description": "Known for experimental policies like token currency and capital transfer"}
    ],
    "dynasties": [
      {"name": "Slave Dynasty (Mamluk)", "founder": "Qutb-ud-din Aibak", "period": "1206-1290 CE", "capital": "Delhi"},
      {"name": "Khalji Dynasty", "founder": "Jalal-ud-din Khalji", "period": "1290-1320 CE", "capital": "Delhi"},
      {"name": "Tughlaq Dynasty", "founder": "Ghiyas-ud-din Tughlaq", "period": "1320-1414 CE", "capital": "Delhi/Daulatabad"},
      {"name": "Sayyid Dynasty", "founder": "Khizr Khan", "period": "1414-1451 CE", "capital": "Delhi"},
      {"name": "Lodi Dynasty", "founder": "Bahlul Lodi", "period": "1451-1526 CE", "capital": "Delhi"}
    ],
    "importantFacts": [
      "First Muslim empire to rule over large parts of India",
      "Introduced Persian administrative practices and culture",
      "Developed Indo-Islamic architecture (Qutb Minar, Red Fort)",
      "Established the iqta system of land revenue",
      "Promoted trade and commerce with Central Asia and Middle East",
      "Razia Sultan was the first and only female ruler",
      "Alauddin Khalji''s market control system was highly advanced",
      "Muhammad bin Tughlaq''s token currency experiment failed"
    ],
    "causes": [
      {"cause": "Political fragmentation among Rajput kingdoms", "effect": "Easy conquest by unified Muslim forces"},
      {"cause": "Superior military technology and tactics", "effect": "Successful establishment of Muslim rule"},
      {"cause": "Administrative innovations like iqta system", "effect": "Efficient revenue collection and governance"},
      {"cause": "Mongol invasions from the northwest", "effect": "Constant military pressure and defensive measures"}
    ],
    "significance": [
      "Established Muslim political dominance in North India",
      "Introduced new administrative and military practices",
      "Facilitated cultural synthesis between Islamic and Indian traditions",
      "Developed distinctive Indo-Islamic architectural style",
      "Promoted trade connections with Islamic world",
      "Set precedent for future Muslim dynasties in India",
      "Influenced language development (Urdu)",
      "Created a cosmopolitan culture in Delhi"
    ]
  }'::jsonb,
  9,
  ARRAY['Medieval India', 'Muslim Rule', 'Architecture', 'Razia Sultan', 'Alauddin Khalji']
),
(
  'Fundamental Rights',
  'Polity',
  'advanced',
  '{
    "overview": "Fundamental Rights are the basic human rights enshrined in Part III (Articles 12-35) of the Indian Constitution. They are justiciable rights that protect citizens from arbitrary state action and ensure individual liberty, equality, and dignity. These rights are inspired by the US Bill of Rights and can be enforced through courts.",
    "timeline": [
      {"year": "1928", "event": "Nehru Report recommends Fundamental Rights"},
      {"year": "1931", "event": "Karachi Resolution of Congress outlines Fundamental Rights"},
      {"year": "1946-47", "event": "Constituent Assembly debates on Fundamental Rights"},
      {"year": "1950", "event": "Constitution comes into effect with 7 Fundamental Rights"},
      {"year": "1978", "event": "Right to Property removed from Fundamental Rights (44th Amendment)"},
      {"year": "2002", "event": "Right to Education added as Fundamental Right (86th Amendment)"},
      {"year": "2017", "event": "Right to Privacy recognized as Fundamental Right (Puttaswamy case)"}
    ],
    "keyPeople": [
      {"name": "Dr. B.R. Ambedkar", "role": "Chairman, Drafting Committee", "description": "Principal architect of Fundamental Rights provisions"},
      {"name": "Sardar Vallabhbhai Patel", "role": "Chairman, Fundamental Rights Sub-Committee", "description": "Led the committee that drafted Fundamental Rights"},
      {"name": "H.N. Kunzru", "role": "Member, Fundamental Rights Sub-Committee", "description": "Contributed to the formulation of rights provisions"},
      {"name": "K.M. Munshi", "role": "Constitutional Expert", "description": "Played key role in drafting and defending Fundamental Rights"}
    ],
    "dynasties": [],
    "importantFacts": [
      "Originally 7 Fundamental Rights, now 6 after 44th Amendment",
      "Article 32 called ''Heart and Soul'' of Constitution by Dr. Ambedkar",
      "Fundamental Rights are not absolute and have reasonable restrictions",
      "Can be suspended during National Emergency (except Articles 20 & 21)",
      "Supreme Court is the guardian and protector of Fundamental Rights",
      "Directive Principles cannot override Fundamental Rights (Minerva Mills case)",
      "Right to Constitutional Remedies allows direct approach to Supreme Court",
      "Fundamental Rights apply to both citizens and non-citizens (with exceptions)"
    ],
    "causes": [
      {"cause": "Colonial experience of arbitrary rule", "effect": "Need for constitutional protection of individual rights"},
      {"cause": "Influence of American Bill of Rights", "effect": "Adoption of justiciable fundamental rights"},
      {"cause": "Nehru Report and Karachi Resolution", "effect": "Clear framework for rights in Indian context"},
      {"cause": "Constituent Assembly debates", "effect": "Comprehensive and balanced rights framework"}
    ],
    "significance": [
      "Ensures protection of individual liberty and dignity",
      "Provides constitutional remedy against state excesses",
      "Establishes India as a rights-based democracy",
      "Enables judicial review of legislative and executive actions",
      "Promotes equality and social justice",
      "Protects minorities and vulnerable sections",
      "Facilitates democratic participation and expression",
      "Serves as foundation for rule of law"
    ]
  }'::jsonb,
  8,
  ARRAY['Constitution', 'Rights', 'Article 32', 'Equality', 'Liberty']
);

-- Insert corresponding suggestions
INSERT INTO note_suggestions (note_id, category, display_order, is_featured) 
SELECT id, category, priority, (priority >= 9) as is_featured
FROM pre_generated_notes;