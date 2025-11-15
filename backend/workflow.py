from .chatbot import Chatbot

database_file = "backend/history.txt"
context_file  = "backend/context.txt"
# Necessary context keys: <persona>, <grade>, <subject>, <level>, <style>

# Clears all conversation history
def begin_conversation(settings):
    with open(context_file, 'r') as f:
        context = f.read()
        for key in settings.keys():
            context.replace(key, settings[key])
    with open(database_file, 'w') as f:
        f.write(f"system:::{context}\n")

# Adds a slide to the conversation
def add_slide(slide_url):
    image_file = f"slide_{str(slide_url).zfill(3)}"
    with open(database_file, 'r+') as f:
        f.write(f"slide:::{image_file}\n")

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
        conversation.append(("user", user_text))

        chatbot = Chatbot()
        response = chatbot.response(conversation)

        with open(database_file, 'r+') as f:
            f.write(f"user:::{user_text}\n")
            f.write(f"assistant:::{response}\n")
        return response
