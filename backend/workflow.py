import os, shutil

from .chatbot import Chatbot

database_file = "backend/data/history.txt"
context_file  = "backend/context.txt"


# Clears all conversation history
def begin_conversation():
    with open(context_file, 'r') as f:
        context = f.read()
    with open(database_file, 'w') as f:
        f.write(f"system:::{context}\n")

# Adds a slide to the conversation
def add_slide(slide_url):
    image_file = f"slide_{str(slide_url).zfill(3)}"
    with open(database_file, 'r+') as f:
        f.write(f"slide:::{image_file}\n")

# Gets a chatbot response after receiving a user response
def get_feedback(user_text):
    chatbot = Chatbot()
    conversation = []
    with open(database_file, 'r+') as f:
        contents = f.read().split('\n')
        for c in contents:
            role, content = c.split(':::')
            if role in ["system", "user", "assistant"]:
                conversation.append({
                    "role"      : role,
                    "content"   : content
                })
            else:
                conversation.append({
                    "role"      : "user",
                    "content"   : [
                        {
                            "type" : "image_url",
                            "image_url" : {
                                "url"       : content,
                                "detail"    : "high"
                            }
                        }
                    ]
                })
        conversation.append({"role" : "user", "content" : user_text})
        response = chatbot.response(conversation)

        with open(database_file, 'r+') as f:
            f.write(f"user:::{user_text}\n")
            f.write(f"assistant:::{response}\n")
        return response
