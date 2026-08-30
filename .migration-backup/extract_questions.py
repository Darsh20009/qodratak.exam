#!/usr/bin/env python3
import json
import re
import requests

# Read the file
with open('attached_assets/Pasted--id-2019-category-text--1761602244955_1761602244956.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all complete question objects using regex
# Pattern to match complete question objects
pattern = r'\{\s*"id":\s*\d+,\s*"category":\s*"[^"]+",\s*"text":\s*"[^"]+",\s*"options":\s*\[[^\]]+\],\s*"correctOptionIndex":\s*\d+,\s*"explanation":\s*"[^"]+"\s*\}'

# Find all matches
matches = re.findall(pattern, content, re.DOTALL)

print(f"Found {len(matches)} complete question objects")

# Parse each match to extract the questions
questions = []
for match in matches:
    try:
        question = json.loads(match)
        questions.append(question)
    except json.JSONDecodeError as e:
        print(f"Error parsing question: {e}")
        continue

print(f"Successfully parsed {len(questions)} questions")

if len(questions) > 0:
    # Send to API
    payload = {'questions': questions}
    
    try:
        response = requests.post('http://localhost:5000/api/questions/bulk', json=payload)
        result = response.json()
        
        if result.get('success'):
            print(f"✅ Successfully added {result['count']} questions to the database!")
        else:
            print(f"❌ Error: {result.get('message')}")
    except Exception as e:
        print(f"❌ Request error: {e}")
else:
    print("No questions to upload")
