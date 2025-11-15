import os
from openai import OpenAI

class Chatbot:
    def __init__(self):
        self.client = OpenAI()
        self.model_version = os.getenv("OPENAI_MODEL")

    def response(self, conversation, temperature=0.7, max_tokens=100):
        messages = []
        for role, message in conversation:
            messages.append({"role": role, "content": message})
        response = self.client.chat.completions.create(
            model       = self.model_version,
            messages    = messages,
            temperature = temperature,
            max_tokens  = max_tokens,
        )
        return response.choices[0].message.content.strip()