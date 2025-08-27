#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
OpenRouter CLI Chat with a Textual TUI
- Reads system prompt from system.xml
- Maintains conversation context in a scrollable window
- Provides a status bar with current model and info
- Commands:
  /reset                 -> clear history but keep system template
  /save <file>           -> save transcript to a text file
  /swmodel               -> switch model
  /exit                  -> quit
Usage:
  export OPENROUTER_API_KEY=sk-or-...
  python openrchat.py
"""

import argparse
import os
import sys
import json
import requests
import xml.etree.ElementTree as ET
from datetime import datetime
from functools import partial

from textual.app import App, ComposeResult
from textual.containers import Container
from textual.widgets import Header, Footer, RichLog, Input, Button, Static, Label
from textual.screen import ModalScreen
from textual.binding import Binding
from textual.worker import Worker

OPENROUTER_API = "https://openrouter.ai/api/v1/chat/completions"
MODELS_FILE = "models.xml"

# --- Data and API Functions ---

def parse_args():
    p = argparse.ArgumentParser(description="OpenRouter CLI with Textual TUI")
    p.add_argument("--xml", default="system.xml", help="Path to system prompt XML file")
    p.add_argument("--model", default="openai/gpt-4.1-mini", help="Initial model ID")
    p.add_argument("--temperature", type=float, default=0.7)
    p.add_argument("--title", default="CLI XML Chat")
    p.add_argument("--referer", default="https://localhost/cli")
    return p.parse_args()

def read_system_prompt(path):
    try:
        tree = ET.parse(path)
        root = tree.getroot()
        if root.tag == "system":
            return root.text.strip()
    except (FileNotFoundError, ET.ParseError):
        return None

def read_models(path):
    try:
        tree = ET.parse(path)
        root = tree.getroot()
        return [model.text for model in root.findall("model")]
    except (FileNotFoundError, ET.ParseError):
        return []

def write_models(path, models):
    root = ET.Element("models")
    for model_name in models:
        ET.SubElement(root, "model").text = model_name
    tree = ET.ElementTree(root)
    ET.indent(tree, space="    ")
    tree.write(path, encoding="utf-8", xml_declaration=True)

def build_headers(title, referer):
    api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
    if not api_key:
        return None
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": referer,
        "X-Title": title,
    }

def api_chat(model, messages, temperature, headers):
    payload = {"model": model, "messages": messages, "temperature": temperature}
    r = requests.post(OPENROUTER_API, headers=headers, data=json.dumps(payload), timeout=120)
    r.raise_for_status()
    data = r.json()
    return data["choices"][0]["message"]["content"]

# --- TUI Screens ---

class ModelSwitcherScreen(ModalScreen):
    def __init__(self, models):
        super().__init__()
        self.models = models

    def compose(self) -> ComposeResult:
        yield Container(
            Label("Select a model or add a new one"),
            *[Button(model, id=model) for model in self.models],
            Input(placeholder="Or type new model name..."),
            Button("Cancel", variant="error", id="cancel"),
            id="dialog"
        )

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "cancel":
            self.dismiss(None)
        else:
            self.dismiss(event.button.id)
    
    def on_input_submitted(self, event: Input.Submitted) -> None:
        if event.value:
            self.dismiss(event.value)

# --- Main App ---

class ChatApp(App):
    CSS_PATH = "openrchat.css"
    BINDINGS = [
        Binding("ctrl+c", "quit", "Quit"),
        Binding("ctrl+r", "reset_chat", "Reset Chat"),
    ]

    def __init__(self, args):
        super().__init__()
        self.args = args
        self.headers = build_headers(args.title, args.referer)
        self.system_prompt = read_system_prompt(args.xml)
        self.models = read_models(MODELS_FILE)
        if not self.models:
            self.models = [args.model]
        self.messages = []
        self.transcript = []

    def compose(self) -> ComposeResult:
        yield Header()
        yield RichLog(id="conversation", wrap=True, highlight=True)
        yield Input(placeholder="Type your message or command...")
        yield Footer()

    def on_mount(self) -> None:
        if not self.headers:
            self.exit(message="ERROR: OPENROUTER_API_KEY is not set.")
        if not self.system_prompt:
            self.exit(message=f"ERROR: Could not read system prompt from {self.args.xml}")
        self.reset_chat()
        self.query_one(Input).focus()
        self.update_footer()

    def update_footer(self):
        self.query_one(Footer).text = f"Model: {self.args.model} | Press Ctrl+R to reset, Ctrl+C to quit."

    def add_log(self, role: str, content: str):
        color = {"You": "green", "Assistant": "cyan", "SYSTEM": "yellow", "ERROR": "red"}.get(role, "white")
        self.query_one(RichLog).write(f"[b {color}]{role}:[/b {color}] {content}")

    def reset_chat(self):
        self.messages = [{"role": "system", "content": self.system_prompt}]
        self.transcript = [("system", self.system_prompt)]
        log = self.query_one(RichLog)
        log.clear()
        self.add_log("SYSTEM", "Chat context cleared.")
        self.add_log("SYSTEM", self.system_prompt)

    async def on_input_submitted(self, event: Input.Submitted) -> None:
        user_input = event.value
        self.query_one(Input).value = ""

        if user_input.lower().startswith("/"):
            await self.handle_command(user_input)
        else:
            self.add_log("You", user_input)
            self.messages.append({"role": "user", "content": user_input})
            self.transcript.append(("user", user_input))
            self.set_processing(True)
            self.run_worker(
                partial(api_chat, self.args.model, self.messages, self.args.temperature, self.headers),
                thread=True,
                name="api_chat_worker"
            )

    def on_worker_complete(self, event) -> None:
        if event.worker.name == "api_chat_worker":
            self.set_processing(False)
            if event.worker.is_success:
                reply = event.worker.result
                self.messages.append({"role": "assistant", "content": reply})
                self.transcript.append(("assistant", reply))
                self.add_log("Assistant", reply)
            else:
                error = event.worker.error
                self.add_log("ERROR", str(error))

    def set_processing(self, processing: bool):
        self.query_one(Input).disabled = processing
        self.query_one(Input).placeholder = "Processing..." if processing else "Type your message or command..."

    async def handle_command(self, cmd: str):
        cmd_parts = cmd.lower().split(maxsplit=1)
        command = cmd_parts[0]

        if command == "/exit":
            self.exit()
        elif command == "/reset":
            self.reset_chat()
        elif command == "/save":
            path = cmd_parts[1] if len(cmd_parts) > 1 else f"transcript_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            try:
                with open(path, "w", encoding="utf-8") as f:
                    for role, content in self.transcript:
                        f.write(f"{role.upper()}:\n{content}\n\n")
                self.add_log("SYSTEM", f"Saved transcript to {path}")
            except Exception as e:
                self.add_log("ERROR", f"Save failed: {e}")
        elif command == "/swmodel":
            def switch_model_callback(new_model: str):
                if new_model:
                    self.args.model = new_model
                    if new_model not in self.models:
                        self.models.append(new_model)
                        write_models(MODELS_FILE, self.models)
                    self.add_log("SYSTEM", f"Model switched to {self.args.model}")
                    self.update_footer()

            await self.push_screen(ModelSwitcherScreen(self.models), switch_model_callback)
        else:
            self.add_log("ERROR", f"Unknown command: {command}")


if __name__ == "__main__":
    # Create a default CSS file if it doesn't exist
    if not os.path.exists(ChatApp.CSS_PATH):
        with open(ChatApp.CSS_PATH, "w") as f:
            f.write("""
            #dialog {
                grid-size: 2;
                grid-gutter: 1;
                padding: 0 1;
                width: 80;
                height: auto;
                border: thick $primary;
                background: $surface;
            }
            """)
    args = parse_args()
    app = ChatApp(args)
    app.run()

