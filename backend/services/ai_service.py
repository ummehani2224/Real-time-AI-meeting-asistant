import os
from openai import AsyncOpenAI
import json

client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY", "dummy"))

async def transcribe_audio(audio_file_path: str) -> str:
    """
    Transcribe audio using Whisper API.
    """
    if os.environ.get("OPENAI_API_KEY") in [None, "", "dummy"]:
        # Mock transcription if no API key
        return "This is a simulated transcription since no OpenAI API key is provided."

    try:
        with open(audio_file_path, "rb") as audio_file:
            transcript = await client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file
            )
        return transcript.text
    except Exception as e:
        print(f"Transcription error: {e}")
        return ""

async def generate_realtime_summary(transcript_text: str) -> str:
    """
    Generate a quick summary of the current transcript.
    """
    if os.environ.get("OPENAI_API_KEY") in [None, "", "dummy"]:
        return "Simulated summary of the current transcript segment."

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Summarize the following meeting transcript so far in 2-3 short sentences. Be concise."},
                {"role": "user", "content": transcript_text}
            ],
            max_tokens=100
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Summary error: {e}")
        return "Error generating summary."

async def generate_final_analysis(transcript_text: str) -> dict:
    """
    Generate final summary and extract action items.
    """
    if os.environ.get("OPENAI_API_KEY") in [None, "", "dummy"]:
        return {
            "summary": "Simulated comprehensive final meeting summary.",
            "action_items": [
                {"task": "Simulated action item", "owner": "John", "deadline": "Tomorrow"}
            ]
        }

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "Analyze the following meeting transcript. Provide a comprehensive summary and extract action items. Output in JSON format with keys 'summary' (string) and 'action_items' (list of objects with 'task', 'owner', 'deadline')."},
                {"role": "user", "content": transcript_text}
            ],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Final analysis error: {e}")
        return {"summary": "Error generating final summary.", "action_items": []}
