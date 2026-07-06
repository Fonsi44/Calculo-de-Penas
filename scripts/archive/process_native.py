import asyncio
import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from google.antigravity import Agent, LocalAgentConfig, CapabilitiesConfig
from datetime import datetime

# Load env variables
load_dotenv('.env.local')
if not os.getenv('DATABASE_URL'):
    load_dotenv('.env')

DB_URL = os.getenv('DATABASE_URL')

if not DB_URL:
    print("ERROR: DATABASE_URL not found.")
    exit(1)

async def process_article(agent, article):
    prompt = f"""
Eres un formateador estructural puro experto en HTML. Tu tarea es extraer elementos clave del texto y estructurarlos en JSON.
  
## 📋 REGLAS ESTRICTAS
- **PROHIBIDO INVENTAR**: Usa ÚNICAMENTE el texto proporcionado. No añadas, sugieras ni inyectes nombres de instituciones ni leyes que no estén explícitamente en el texto original.
- No alucines, no enriquezcas el contexto, ni cruces referencias.
- Tu trabajo es extraer la información EXISTENTE y formatearla en los siguientes campos:
  1. bite_sized_summary: Extrae un resumen directo de 1-2 oraciones basado estrictamente en el texto original.
  2. html_table: Si el texto contiene datos numéricos o plazos, formatéalos como una tabla HTML. Si no, deja el string vacío ("").
  3. blockquote: Si el texto menciona una ley explícita, extrae la cita y envuélvela en <blockquote>. Si no, deja el string vacío ("").

Debes responder ÚNICAMENTE con un objeto JSON válido con la siguiente estructura:
{{
  "bite_sized_summary": "...",
  "html_table": "...",
  "blockquote": "..."
}}

**Título:** {article['title']}

**Cuerpo HTML:**
{article['body']}
"""
    response = await agent.chat(prompt)
    full_text = ""
    async for chunk in response:
        full_text += chunk
        
    return full_text

async def main():
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Fetch pending articles
    cursor.execute("SELECT id, slug, title, body FROM blog_posts WHERE review_status != 'reviewed' OR review_status IS NULL ORDER BY published_at ASC LIMIT 148;")
    articles = cursor.fetchall()
    
    if not articles:
        print("No pending articles found.")
        conn.close()
        return

    print(f"Total pending articles to process: {len(articles)}")
    
    # Configure the Antigravity Agent
    config = LocalAgentConfig(
        system_instructions="You are an expert strict JSON formatter. Reply only with valid JSON.",
        capabilities=CapabilitiesConfig()
    )
    
    success_count = 0
    error_count = 0
    
    async with Agent(config) as agent:
        for index, art in enumerate(articles):
            print(f"[{index+1}/{len(articles)}] Processing: {art['title']} ({art['slug']})")
            
            try:
                res_text = await process_article(agent, art)
                
                # Extract JSON
                raw_json = res_text.strip()
                if '```json' in raw_json:
                    raw_json = raw_json.split('```json')[1].split('```')[0].strip()
                elif '```' in raw_json:
                    raw_json = raw_json.split('```')[1].split('```')[0].strip()
                    
                parsed = json.loads(raw_json)
                
                bite = parsed.get("bite_sized_summary", "").strip()
                table = parsed.get("html_table", "").strip()
                quote = parsed.get("blockquote", "").strip()
                
                if not bite and not table and not quote:
                    raise Exception("Extracted all empty values. Invalid extraction.")
                
                new_body = art['body']
                if bite:
                    new_body = f'<div class="geo-summary"><strong>Resumen rápido:</strong> {bite}</div>\n' + new_body
                if quote:
                    new_body += f'\n<div class="geo-law">{quote}</div>'
                if table:
                    new_body += f'\n<div class="geo-data">{table}</div>'
                    
                now = datetime.now()
                cursor.execute("""
                    UPDATE blog_posts 
                    SET body = %s, review_status = 'reviewed', reviewed_at = %s, last_reviewed_at = %s, legal_review_notes = %s 
                    WHERE id = %s
                """, (new_body, now, now, 'Estructurado con GEO Nativamente (Antigravity Python SDK).', art['id']))
                
                print(f"  -> SUCCESS: Injected GEO blocks.")
                success_count += 1
                
            except Exception as e:
                print(f"  -> ERROR: {e}")
                error_count += 1
                
    conn.close()
    
    print("\n==================================")
    print(" BATCH PROCESSING COMPLETE")
    print("==================================")
    print(f" Total processed: {len(articles)}")
    print(f" ✅ Success:      {success_count}")
    print(f" ❌ Errors:       {error_count}")
    print("==================================\n")

if __name__ == '__main__':
    asyncio.run(main())
