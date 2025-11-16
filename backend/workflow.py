import os
import sys
current_dir = os.path.dirname(__file__)
utils_path = os.path.join(current_dir,'..','backend')
sys.path.append(utils_path)

from chatbot import Chatbot

database_file = "history.txt"
context_file  = "context.txt"
# Necessary context keys: <persona>, <grade>, <subject>, <level>, <style>

# Clears all conversation history
def begin_conversation(settings):
    with open(context_file, 'r') as f:
        context = f.read()
        for key in settings.keys():
            context = context.replace(key, settings[key])
    with open(database_file, 'w') as g:
        g.write(f"system:::{context}\n")

# Adds a slide to the conversation
def add_slide(slide_url):
    image_file = f"{str(slide_url).zfill(3)}"
    with open(database_file, 'a') as f:
        f.write(f"slide:::{slide_url}\n")

# Gets a chatbot response after receiving a user response
def get_feedback(user_text):
    conversation = []
    with open(database_file, 'r+') as f:
        contents = f.read().split('\n')
        for c in contents:
            if not c:
                break
            role, content = c.split(':::')
            if role in ["system", "user", "assistant"]:
                conversation.append((role, content))
            else:
                conversation.append((
                    "user", [
                        {
                            "type" : "image_url",
                            "image_url" : {
                                "url"       : content,
                                "detail"    : "high"
                            }
                        }
                    ]
                ))
        print(conversation)
        conversation.append(("user", user_text))

        chatbot = Chatbot()
        response = chatbot.response(conversation)

    with open(database_file, 'a') as g:
        g.write(f"user:::{user_text}\n")
        g.write(f"assistant:::{response}\n")
    return response
