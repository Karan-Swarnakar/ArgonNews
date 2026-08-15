import re


def clean_text(text):

    text = re.sub(r"\s+", " ", text)

    text = re.sub(r"Subscribe.*", "", text, flags=re.IGNORECASE)

    return text.strip()