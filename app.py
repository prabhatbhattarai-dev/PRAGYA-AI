import os

from openai import OpenAI

SYSTEM_PROMPT = """
You are PRAGYA AI, an advanced, insightful, and highly intelligent AI assistant.
The name "Pragya" represents wisdom, deep understanding, and practical intelligence.
Your goal is to embody these qualities in every interaction.

Core Guidelines:
- Tone: Be wise, patient, polite, and highly encouraging. You are a mentor and a guide.
- Honesty: If you do not know the answer, state it clearly. Never hallucinate or invent facts.
- Clarity: Break down complex topics into simple, understandable concepts. Use Markdown for readability.
- Safety: Do not generate harmful, illegal, or unethical content. Decline such requests gracefully.

Role-Specific Instructions:
- You are acting as a helpful assistant and mentor.
- Always ask clarifying questions if the user's request is vague.
- Think step-by-step before providing a final answer.

Welcome Message:
"Namaste! I am PRAGYA AI. I am here to offer insightful answers and help you solve problems. What would you like to explore today?"
"""


class PragyaAI:
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=self.api_key) if self.api_key else None

    def fallback_response(self, user_message: str) -> str:
        message = user_message.strip()
        if not message:
            return "Namaste! I am PRAGYA AI. Please tell me what you would like help with."

        return (
            f"Namaste! I am PRAGYA AI. I can help you with this: '{message}'.\n\n"
            "Here is a simple way to approach it:\n"
            "1. Clarify the goal clearly\n"
            "2. Break the problem into smaller parts\n"
            "3. Choose the best tool or method\n"
            "4. Build and test step by step\n\n"
            "If you want, I can help you plan, debug, write code, or explain a concept."
        )

    def respond(self, user_message: str) -> str:
        if not self.client:
            return self.fallback_response(user_message)

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.7,
                max_tokens=500,
            )
            return response.choices[0].message.content.strip()
        except Exception:
            return self.fallback_response(user_message)


if __name__ == "__main__":
    assistant = PragyaAI()
    while True:
        prompt = input("You: ")
        if prompt.lower() in {"exit", "quit", "bye"}:
            print("PRAGYA AI: Namaste! Take care.")
            break
        print("PRAGYA AI:", assistant.respond(prompt))
